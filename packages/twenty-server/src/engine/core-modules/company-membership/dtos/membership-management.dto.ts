import {
  CompanyRole,
  MembershipStatus,
} from 'src/engine/core-modules/company-membership/enums/company-role.enum';

// ── Request DTOs ──

export interface InviteMemberDto {
  userId: string;
  role: CompanyRole;
}

export interface ChangeRoleDto {
  targetUserId: string;
  newRole: CompanyRole;
}

export interface SuspendMemberDto {
  targetUserId: string;
}

export interface ActivateMemberDto {
  targetUserId: string;
}

// ── Response DTOs ──

export interface MembershipResponseDto {
  id: string;
  userId: string;
  companyId: string;
  role: CompanyRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
}
