import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  CompanyRole,
  MembershipStatus,
} from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { UserCompanyMembershipEntity } from 'src/engine/core-modules/company-membership/user-company-membership.entity';

/**
 * MigrationSupportService — Twenty-side migration audit, validation, and rollback
 *
 * Provides:
 * - Audit reports on membership state (per-company counts, orphaned, duplicates)
 * - Validation that a company has expected membership structure
 * - Rollback: suspend all memberships for a company (reversible)
 * - Bulk operations for migration cleanup
 */
@Injectable()
export class MigrationSupportService {
  private readonly logger = new Logger(MigrationSupportService.name);

  constructor(
    @InjectRepository(UserCompanyMembershipEntity)
    private readonly membershipRepository: Repository<UserCompanyMembershipEntity>,
  ) {}

  // ── Audit ───────────────────────────────────────

  /**
   * Generate a full audit report of all memberships in the workspace.
   */
  async generateAuditReport(workspaceId: string): Promise<{
    generatedAt: string;
    workspaceId: string;
    totalMemberships: number;
    byStatus: Record<string, number>;
    byRole: Record<string, number>;
    companies: {
      companyId: string;
      totalMembers: number;
      activeMembers: number;
      suspendedMembers: number;
      invitedMembers: number;
      hasOwner: boolean;
    }[];
    duplicateMemberships: {
      userId: string;
      companyId: string;
      count: number;
    }[];
  }> {
    const allMemberships = await this.membershipRepository.find({
      where: { workspaceId },
    });

    // Count by status
    const byStatus: Record<string, number> = {};
    const byRole: Record<string, number> = {};

    for (const m of allMemberships) {
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
      byRole[m.role] = (byRole[m.role] || 0) + 1;
    }

    // Group by company
    const companyMap = new Map<
      string,
      { active: number; suspended: number; invited: number; hasOwner: boolean }
    >();

    for (const m of allMemberships) {
      const entry = companyMap.get(m.companyId) || {
        active: 0,
        suspended: 0,
        invited: 0,
        hasOwner: false,
      };

      if (m.status === MembershipStatus.ACTIVE) entry.active++;
      if (m.status === MembershipStatus.SUSPENDED) entry.suspended++;
      if (m.status === MembershipStatus.INVITED) entry.invited++;
      if (m.role === CompanyRole.COMPANY_OWNER && m.status === MembershipStatus.ACTIVE) {
        entry.hasOwner = true;
      }

      companyMap.set(m.companyId, entry);
    }

    const companies = [...companyMap.entries()].map(([companyId, data]) => ({
      companyId,
      totalMembers: data.active + data.suspended + data.invited,
      activeMembers: data.active,
      suspendedMembers: data.suspended,
      invitedMembers: data.invited,
      hasOwner: data.hasOwner,
    }));

    // Find duplicate memberships (same user+company appearing more than once)
    const membershipKeys = new Map<string, number>();

    for (const m of allMemberships) {
      const key = `${m.userId}:${m.companyId}`;

      membershipKeys.set(key, (membershipKeys.get(key) || 0) + 1);
    }

    const duplicateMemberships = [...membershipKeys.entries()]
      .filter(([, count]) => count > 1)
      .map(([key, count]) => {
        const [userId, companyId] = key.split(':');

        return { userId, companyId, count };
      });

    return {
      generatedAt: new Date().toISOString(),
      workspaceId,
      totalMemberships: allMemberships.length,
      byStatus,
      byRole,
      companies,
      duplicateMemberships,
    };
  }

  // ── Validation ──────────────────────────────────

  /**
   * Validate that a company's memberships are in a healthy state:
   * - At least one active COMPANY_OWNER
   * - No duplicate user-company pairs
   * - All active members have valid roles
   */
  async validateCompany(
    companyId: string,
    workspaceId: string,
  ): Promise<{
    companyId: string;
    valid: boolean;
    issues: string[];
    memberCount: number;
    activeCount: number;
    ownerCount: number;
  }> {
    const memberships = await this.membershipRepository.find({
      where: { companyId, workspaceId },
    });

    const issues: string[] = [];

    // Check for at least one active owner
    const activeOwners = memberships.filter(
      (m) =>
        m.role === CompanyRole.COMPANY_OWNER &&
        m.status === MembershipStatus.ACTIVE,
    );

    if (activeOwners.length === 0 && memberships.length > 0) {
      issues.push('No active COMPANY_OWNER found');
    }

    // Check for duplicate user-company pairs
    const userIds = memberships.map((m) => m.userId);
    const uniqueUserIds = new Set(userIds);

    if (userIds.length !== uniqueUserIds.size) {
      issues.push(
        `Duplicate memberships detected: ${userIds.length - uniqueUserIds.size} extra entries`,
      );
    }

    // Check for invalid roles
    const validRoles = new Set(Object.values(CompanyRole));

    for (const m of memberships) {
      if (!validRoles.has(m.role)) {
        issues.push(`Invalid role "${m.role}" for user ${m.userId}`);
      }
    }

    const activeCount = memberships.filter(
      (m) => m.status === MembershipStatus.ACTIVE,
    ).length;

    return {
      companyId,
      valid: issues.length === 0,
      issues,
      memberCount: memberships.length,
      activeCount,
      ownerCount: activeOwners.length,
    };
  }

  // ── Rollback ────────────────────────────────────

  /**
   * Rollback: suspend all memberships for a company.
   * This is a reversible operation — memberships are NOT deleted, just suspended.
   * Returns the count of affected memberships.
   */
  async rollbackCompany(
    companyId: string,
    workspaceId: string,
  ): Promise<{ companyId: string; affectedCount: number }> {
    const result = await this.membershipRepository.update(
      {
        companyId,
        workspaceId,
        status: MembershipStatus.ACTIVE,
      },
      { status: MembershipStatus.SUSPENDED },
    );

    const affectedCount = result.affected ?? 0;

    this.logger.warn(
      `ROLLBACK: Suspended ${affectedCount} memberships for company ${companyId} in workspace ${workspaceId}`,
    );

    return { companyId, affectedCount };
  }

  /**
   * Rollback: suspend all memberships created after a specific timestamp.
   * Useful for rolling back a migration batch.
   */
  async rollbackAfterTimestamp(
    workspaceId: string,
    after: Date,
  ): Promise<{ affectedCount: number; timestamp: string }> {
    const memberships = await this.membershipRepository
      .createQueryBuilder('m')
      .where('m.workspaceId = :workspaceId', { workspaceId })
      .andWhere('m.createdAt > :after', { after })
      .andWhere('m.status = :status', { status: MembershipStatus.ACTIVE })
      .getMany();

    if (memberships.length === 0) {
      return { affectedCount: 0, timestamp: after.toISOString() };
    }

    const ids = memberships.map((m) => m.id);

    await this.membershipRepository.update(ids, {
      status: MembershipStatus.SUSPENDED,
    });

    this.logger.warn(
      `ROLLBACK: Suspended ${memberships.length} memberships created after ${after.toISOString()} in workspace ${workspaceId}`,
    );

    return {
      affectedCount: memberships.length,
      timestamp: after.toISOString(),
    };
  }

  /**
   * Restore (re-activate) previously rolled-back memberships for a company.
   */
  async restoreCompany(
    companyId: string,
    workspaceId: string,
  ): Promise<{ companyId: string; restoredCount: number }> {
    const result = await this.membershipRepository.update(
      {
        companyId,
        workspaceId,
        status: MembershipStatus.SUSPENDED,
      },
      { status: MembershipStatus.ACTIVE },
    );

    const restoredCount = result.affected ?? 0;

    this.logger.log(
      `RESTORE: Re-activated ${restoredCount} memberships for company ${companyId} in workspace ${workspaceId}`,
    );

    return { companyId, restoredCount };
  }

  // ── Bulk Diagnostics ────────────────────────────

  /**
   * List all companies that have memberships but no active COMPANY_OWNER.
   * These are "headless" companies that need attention.
   */
  async findHeadlessCompanies(
    workspaceId: string,
  ): Promise<string[]> {
    const allMemberships = await this.membershipRepository.find({
      where: { workspaceId, status: MembershipStatus.ACTIVE },
    });

    const companyOwners = new Map<string, boolean>();

    for (const m of allMemberships) {
      if (!companyOwners.has(m.companyId)) {
        companyOwners.set(m.companyId, false);
      }

      if (m.role === CompanyRole.COMPANY_OWNER) {
        companyOwners.set(m.companyId, true);
      }
    }

    return [...companyOwners.entries()]
      .filter(([, hasOwner]) => !hasOwner)
      .map(([companyId]) => companyId);
  }

  /**
   * Count total memberships by workspace (for monitoring dashboard).
   */
  async getMembershipCounts(workspaceId: string): Promise<{
    total: number;
    active: number;
    suspended: number;
    invited: number;
    uniqueCompanies: number;
    uniqueUsers: number;
  }> {
    const memberships = await this.membershipRepository.find({
      where: { workspaceId },
      select: ['id', 'userId', 'companyId', 'status'],
    });

    const uniqueCompanies = new Set(memberships.map((m) => m.companyId));
    const uniqueUsers = new Set(memberships.map((m) => m.userId));

    return {
      total: memberships.length,
      active: memberships.filter((m) => m.status === MembershipStatus.ACTIVE).length,
      suspended: memberships.filter((m) => m.status === MembershipStatus.SUSPENDED).length,
      invited: memberships.filter((m) => m.status === MembershipStatus.INVITED).length,
      uniqueCompanies: uniqueCompanies.size,
      uniqueUsers: uniqueUsers.size,
    };
  }
}
