import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import {
  CompanyRole,
  MembershipStatus,
} from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { UserCompanyMembershipEntity } from 'src/engine/core-modules/company-membership/user-company-membership.entity';

/** Ordered from highest privilege to lowest */
const ROLE_HIERARCHY: CompanyRole[] = [
  CompanyRole.COMPANY_OWNER,
  CompanyRole.COMPANY_ADMIN,
  CompanyRole.COMPANY_SALES,
  CompanyRole.COMPANY_SUPPORT,
  CompanyRole.COMPANY_READONLY,
];

@Injectable()
export class CompanyMembershipService {
  private readonly logger = new Logger(CompanyMembershipService.name);

  constructor(
    @InjectRepository(UserCompanyMembershipEntity)
    private readonly membershipRepository: Repository<UserCompanyMembershipEntity>,
  ) {}

  async findActiveMembership(
    userId: string,
    companyId: string,
    workspaceId: string,
  ): Promise<UserCompanyMembershipEntity | null> {
    return this.membershipRepository.findOne({
      where: {
        userId,
        companyId,
        workspaceId,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async findActiveMembershipOrThrow(
    userId: string,
    companyId: string,
    workspaceId: string,
  ): Promise<UserCompanyMembershipEntity> {
    const membership = await this.findActiveMembership(
      userId,
      companyId,
      workspaceId,
    );

    if (!membership) {
      throw new AuthException(
        'User does not have an active membership for this company',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    return membership;
  }

  async findAllByUser(
    userId: string,
    workspaceId: string,
  ): Promise<UserCompanyMembershipEntity[]> {
    return this.membershipRepository.find({
      where: {
        userId,
        workspaceId,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async findAllByCompany(
    companyId: string,
    workspaceId: string,
  ): Promise<UserCompanyMembershipEntity[]> {
    return this.membershipRepository.find({
      where: {
        companyId,
        workspaceId,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async createMembership(params: {
    userId: string;
    companyId: string;
    workspaceId: string;
    role: CompanyRole;
  }): Promise<UserCompanyMembershipEntity> {
    const existing = await this.membershipRepository.findOne({
      where: {
        userId: params.userId,
        companyId: params.companyId,
        workspaceId: params.workspaceId,
      },
    });

    if (existing) {
      if (existing.status === MembershipStatus.ACTIVE) {
        return existing;
      }

      existing.status = MembershipStatus.ACTIVE;
      existing.role = params.role;

      return this.membershipRepository.save(existing);
    }

    const membership = this.membershipRepository.create({
      userId: params.userId,
      companyId: params.companyId,
      workspaceId: params.workspaceId,
      role: params.role,
      status: MembershipStatus.ACTIVE,
    });

    return this.membershipRepository.save(membership);
  }

  async suspendMembership(
    userId: string,
    companyId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.membershipRepository.update(
      { userId, companyId, workspaceId },
      { status: MembershipStatus.SUSPENDED },
    );
  }

  async updateRole(
    userId: string,
    companyId: string,
    workspaceId: string,
    role: CompanyRole,
  ): Promise<void> {
    await this.membershipRepository.update(
      { userId, companyId, workspaceId },
      { role },
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Phase 7 — Membership management with business rules
  // ────────────────────────────────────────────────────────────────────

  /**
   * Lists all memberships for a company, including INVITED and SUSPENDED.
   * Used by the team management UI to show full member roster.
   */
  async findAllMembersByCompany(
    companyId: string,
    workspaceId: string,
  ): Promise<UserCompanyMembershipEntity[]> {
    return this.membershipRepository.find({
      where: { companyId, workspaceId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Invite a user to a company. Creates a membership with INVITED status.
   * If the user already has an active membership, returns it unchanged.
   * If the user has a suspended membership, reactivates with the new role.
   */
  async inviteMember(params: {
    userId: string;
    companyId: string;
    workspaceId: string;
    role: CompanyRole;
  }): Promise<UserCompanyMembershipEntity> {
    const existing = await this.membershipRepository.findOne({
      where: {
        userId: params.userId,
        companyId: params.companyId,
        workspaceId: params.workspaceId,
      },
    });

    if (existing) {
      if (existing.status === MembershipStatus.ACTIVE) {
        return existing;
      }

      // Reactivate suspended or re-invite
      existing.status = MembershipStatus.INVITED;
      existing.role = params.role;

      return this.membershipRepository.save(existing);
    }

    const membership = this.membershipRepository.create({
      userId: params.userId,
      companyId: params.companyId,
      workspaceId: params.workspaceId,
      role: params.role,
      status: MembershipStatus.INVITED,
    });

    this.logger.log(
      `Member invited: user=${params.userId} company=${params.companyId} role=${params.role}`,
    );

    return this.membershipRepository.save(membership);
  }

  /**
   * Activate an invited membership. Transitions INVITED → ACTIVE.
   */
  async activateMembership(
    userId: string,
    companyId: string,
    workspaceId: string,
  ): Promise<UserCompanyMembershipEntity> {
    const membership = await this.membershipRepository.findOne({
      where: { userId, companyId, workspaceId },
    });

    if (!membership) {
      throw new AuthException(
        'Membership not found',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    if (membership.status === MembershipStatus.ACTIVE) {
      return membership;
    }

    if (membership.status === MembershipStatus.SUSPENDED) {
      throw new AuthException(
        'Cannot activate a suspended membership. Re-invite the user first.',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    membership.status = MembershipStatus.ACTIVE;

    this.logger.log(
      `Membership activated: user=${userId} company=${companyId}`,
    );

    return this.membershipRepository.save(membership);
  }

  /**
   * Change a member's role with business rule enforcement.
   *
   * Rules:
   * - Root admin can change any role
   * - Actor must have a higher-privilege role than the target member's current role
   * - Actor must have a higher-privilege role than the new role being assigned
   * - Cannot demote the last remaining COMPANY_OWNER
   */
  async changeRoleWithRules(params: {
    actorUserId: string;
    targetUserId: string;
    companyId: string;
    workspaceId: string;
    newRole: CompanyRole;
    isRootAdmin: boolean;
  }): Promise<void> {
    // Root admin bypasses hierarchy checks
    if (!params.isRootAdmin) {
      const actorMembership = await this.findActiveMembershipOrThrow(
        params.actorUserId,
        params.companyId,
        params.workspaceId,
      );

      const actorRoleIndex = ROLE_HIERARCHY.indexOf(actorMembership.role);
      const newRoleIndex = ROLE_HIERARCHY.indexOf(params.newRole);

      // Actor must outrank the new role they're assigning
      if (actorRoleIndex >= newRoleIndex) {
        throw new AuthException(
          `Cannot assign role ${params.newRole}: your role ${actorMembership.role} is not high enough`,
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        );
      }

      // Actor must outrank the target's current role
      if (params.actorUserId !== params.targetUserId) {
        const targetMembership = await this.findActiveMembershipOrThrow(
          params.targetUserId,
          params.companyId,
          params.workspaceId,
        );

        const targetCurrentRoleIndex = ROLE_HIERARCHY.indexOf(
          targetMembership.role,
        );

        if (actorRoleIndex >= targetCurrentRoleIndex) {
          throw new AuthException(
            `Cannot change role of a member with equal or higher privilege`,
            AuthExceptionCode.FORBIDDEN_EXCEPTION,
          );
        }
      }
    }

    // Protect last owner
    if (params.newRole !== CompanyRole.COMPANY_OWNER) {
      await this.assertNotLastOwner(
        params.targetUserId,
        params.companyId,
        params.workspaceId,
      );
    }

    await this.updateRole(
      params.targetUserId,
      params.companyId,
      params.workspaceId,
      params.newRole,
    );

    this.logger.log(
      `Role changed: target=${params.targetUserId} company=${params.companyId} newRole=${params.newRole} actor=${params.actorUserId}`,
    );
  }

  /**
   * Suspend a member with business rule enforcement.
   *
   * Rules:
   * - Root admin can suspend anyone
   * - Actor must outrank the target
   * - Cannot suspend the last remaining COMPANY_OWNER
   * - Cannot self-suspend
   */
  async suspendWithRules(params: {
    actorUserId: string;
    targetUserId: string;
    companyId: string;
    workspaceId: string;
    isRootAdmin: boolean;
  }): Promise<void> {
    if (params.actorUserId === params.targetUserId) {
      throw new AuthException(
        'Cannot suspend your own membership',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    if (!params.isRootAdmin) {
      const actorMembership = await this.findActiveMembershipOrThrow(
        params.actorUserId,
        params.companyId,
        params.workspaceId,
      );

      const targetMembership = await this.findActiveMembershipOrThrow(
        params.targetUserId,
        params.companyId,
        params.workspaceId,
      );

      const actorRoleIndex = ROLE_HIERARCHY.indexOf(actorMembership.role);
      const targetRoleIndex = ROLE_HIERARCHY.indexOf(targetMembership.role);

      if (actorRoleIndex >= targetRoleIndex) {
        throw new AuthException(
          'Cannot suspend a member with equal or higher privilege',
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        );
      }
    }

    await this.assertNotLastOwner(
      params.targetUserId,
      params.companyId,
      params.workspaceId,
    );

    await this.suspendMembership(
      params.targetUserId,
      params.companyId,
      params.workspaceId,
    );

    this.logger.log(
      `Member suspended: target=${params.targetUserId} company=${params.companyId} actor=${params.actorUserId}`,
    );
  }

  /**
   * Throws if the given user is the last active COMPANY_OWNER for the company.
   */
  private async assertNotLastOwner(
    userId: string,
    companyId: string,
    workspaceId: string,
  ): Promise<void> {
    const targetMembership = await this.membershipRepository.findOne({
      where: { userId, companyId, workspaceId },
    });

    if (targetMembership?.role !== CompanyRole.COMPANY_OWNER) {
      return;
    }

    const ownerCount = await this.membershipRepository.count({
      where: {
        companyId,
        workspaceId,
        role: CompanyRole.COMPANY_OWNER,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (ownerCount <= 1) {
      throw new AuthException(
        'Cannot remove or demote the last company owner',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }
  }
}
