import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import {
  type ActivateMemberDto,
  type ChangeRoleDto,
  type InviteMemberDto,
  type MembershipResponseDto,
  type SuspendMemberDto,
} from 'src/engine/core-modules/company-membership/dtos/membership-management.dto';
import { CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { CompanyMembershipService } from 'src/engine/core-modules/company-membership/services/company-membership.service';
import { UserCompanyMembershipEntity } from 'src/engine/core-modules/company-membership/user-company-membership.entity';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';

const VALID_ROLES = new Set(Object.values(CompanyRole));

function toMembershipResponse(
  entity: UserCompanyMembershipEntity,
): MembershipResponseDto {
  return {
    id: entity.id,
    userId: entity.userId,
    companyId: entity.companyId,
    role: entity.role,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/**
 * REST controller for company membership management.
 *
 * All endpoints require an authenticated session (JwtAuthGuard).
 * Company context is derived from the request (set by WorkspaceAuthContextMiddleware).
 *
 * Route prefix: /api/company-membership
 */
@Controller('api/company-membership')
@UseGuards(JwtAuthGuard)
@UseFilters(AuthRestApiExceptionFilter)
export class MembershipManagementController {
  private readonly logger = new Logger(MembershipManagementController.name);

  constructor(
    private readonly membershipService: CompanyMembershipService,
  ) {}

  /**
   * GET /api/company-membership/:companyId/members
   *
   * List all members of a company (all statuses).
   * - Company owner/admin can list their own company
   * - Root admin can list any company
   */
  @Get(':companyId/members')
  async listMembers(
    @Param('companyId') companyId: string,
    @Req() req: Request,
  ): Promise<{ members: MembershipResponseDto[] }> {
    const { userId, workspaceId, isRootAdmin } = this.extractContext(req);

    if (!isRootAdmin) {
      // Non-root users can only list their own company
      this.assertCompanyAccess(req, companyId);
    }

    const members = await this.membershipService.findAllMembersByCompany(
      companyId,
      workspaceId,
    );

    return { members: members.map(toMembershipResponse) };
  }

  /**
   * POST /api/company-membership/:companyId/invite
   *
   * Invite a user to a company.
   * - Company owner/admin can invite (role must be below their own)
   * - Root admin can invite anyone to any company
   */
  @Post(':companyId/invite')
  async inviteMember(
    @Param('companyId') companyId: string,
    @Body() body: InviteMemberDto,
    @Req() req: Request,
  ): Promise<{ membership: MembershipResponseDto }> {
    const { userId, workspaceId, isRootAdmin } = this.extractContext(req);

    this.validateRole(body.role);

    if (!body.userId) {
      throw new AuthException(
        'userId is required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    if (!isRootAdmin) {
      this.assertCompanyAccess(req, companyId);
      await this.assertMinimumRole(userId, companyId, workspaceId, CompanyRole.COMPANY_ADMIN);
    }

    const membership = await this.membershipService.inviteMember({
      userId: body.userId,
      companyId,
      workspaceId,
      role: body.role,
    });

    this.logger.log(
      `Member invited: target=${body.userId} company=${companyId} role=${body.role} actor=${userId}`,
    );

    return { membership: toMembershipResponse(membership) };
  }

  /**
   * PUT /api/company-membership/:companyId/activate
   *
   * Activate an invited membership (INVITED → ACTIVE).
   * - The invited user themselves can activate
   * - Root admin can activate any invitation
   */
  @Put(':companyId/activate')
  async activateMember(
    @Param('companyId') companyId: string,
    @Body() body: ActivateMemberDto,
    @Req() req: Request,
  ): Promise<{ membership: MembershipResponseDto }> {
    const { userId, workspaceId, isRootAdmin } = this.extractContext(req);

    if (!body.targetUserId) {
      throw new AuthException(
        'targetUserId is required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    // Only the invited user or root admin can activate
    if (!isRootAdmin && body.targetUserId !== userId) {
      throw new AuthException(
        'Only the invited user can activate their own invitation',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    const membership = await this.membershipService.activateMembership(
      body.targetUserId,
      companyId,
      workspaceId,
    );

    this.logger.log(
      `Member activated: target=${body.targetUserId} company=${companyId} actor=${userId}`,
    );

    return { membership: toMembershipResponse(membership) };
  }

  /**
   * PUT /api/company-membership/:companyId/role
   *
   * Change a member's role.
   * - Uses business rule enforcement (hierarchy, last-owner protection)
   * - Root admin can change any role
   */
  @Put(':companyId/role')
  async changeRole(
    @Param('companyId') companyId: string,
    @Body() body: ChangeRoleDto,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    const { userId, workspaceId, isRootAdmin } = this.extractContext(req);

    this.validateRole(body.newRole);

    if (!body.targetUserId) {
      throw new AuthException(
        'targetUserId is required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    if (!isRootAdmin) {
      this.assertCompanyAccess(req, companyId);
    }

    await this.membershipService.changeRoleWithRules({
      actorUserId: userId,
      targetUserId: body.targetUserId,
      companyId,
      workspaceId,
      newRole: body.newRole,
      isRootAdmin,
    });

    return { success: true };
  }

  /**
   * PUT /api/company-membership/:companyId/suspend
   *
   * Suspend a member.
   * - Uses business rule enforcement (hierarchy, last-owner protection, no self-suspend)
   * - Root admin can suspend anyone
   */
  @Put(':companyId/suspend')
  async suspendMember(
    @Param('companyId') companyId: string,
    @Body() body: SuspendMemberDto,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    const { userId, workspaceId, isRootAdmin } = this.extractContext(req);

    if (!body.targetUserId) {
      throw new AuthException(
        'targetUserId is required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    if (!isRootAdmin) {
      this.assertCompanyAccess(req, companyId);
    }

    await this.membershipService.suspendWithRules({
      actorUserId: userId,
      targetUserId: body.targetUserId,
      companyId,
      workspaceId,
      isRootAdmin,
    });

    return { success: true };
  }

  // ── Private helpers ──

  private extractContext(req: Request): {
    userId: string;
    workspaceId: string;
    isRootAdmin: boolean;
  } {
    const anyReq = req as any;
    const userId = anyReq.user?.id;
    const workspaceId = anyReq.workspace?.id;

    if (!userId || !workspaceId) {
      throw new AuthException(
        'Authenticated user and workspace context required',
        AuthExceptionCode.UNAUTHENTICATED,
      );
    }

    return {
      userId,
      workspaceId,
      isRootAdmin: anyReq.isRootAdmin === true,
    };
  }

  private assertCompanyAccess(req: Request, companyId: string): void {
    const reqCompanyId = (req as any).companyId;

    if (!reqCompanyId || reqCompanyId !== companyId) {
      throw new AuthException(
        'You do not have access to this company',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }
  }

  private async assertMinimumRole(
    userId: string,
    companyId: string,
    workspaceId: string,
    requiredRole: CompanyRole,
  ): Promise<void> {
    const membership =
      await this.membershipService.findActiveMembershipOrThrow(
        userId,
        companyId,
        workspaceId,
      );

    const ROLE_HIERARCHY_LOCAL: CompanyRole[] = [
      CompanyRole.COMPANY_OWNER,
      CompanyRole.COMPANY_ADMIN,
      CompanyRole.COMPANY_SALES,
      CompanyRole.COMPANY_SUPPORT,
      CompanyRole.COMPANY_READONLY,
    ];

    const userIdx = ROLE_HIERARCHY_LOCAL.indexOf(membership.role);
    const requiredIdx = ROLE_HIERARCHY_LOCAL.indexOf(requiredRole);

    if (userIdx === -1 || userIdx > requiredIdx) {
      throw new AuthException(
        `Requires at least ${requiredRole} role`,
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }
  }

  private validateRole(role: CompanyRole): void {
    if (!VALID_ROLES.has(role)) {
      throw new AuthException(
        `Invalid role: ${role}. Valid roles: ${[...VALID_ROLES].join(', ')}`,
        AuthExceptionCode.INVALID_INPUT,
      );
    }
  }
}
