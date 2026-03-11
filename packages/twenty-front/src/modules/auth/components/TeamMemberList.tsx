import { useState } from 'react';

import { useCompanyContext } from '@/auth/hooks/useCompanyContext';
import {
  ASSIGNABLE_ROLES,
  type CompanyMember,
  type CompanyRoleName,
  ROLE_LABELS,
  STATUS_LABELS,
} from '@/auth/types/companyMembership';
import { styled } from '@linaria/react';

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTh = styled.th`
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  text-align: left;
`;

const StyledTd = styled.td`
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  padding: 8px 12px;
  vertical-align: middle;
`;

const StyledStatusBadge = styled.span<{ status: string }>`
  border-radius: 4px;
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background-color: ${({ status }) =>
    status === 'ACTIVE'
      ? 'rgba(39, 174, 96, 0.1)'
      : status === 'INVITED'
        ? 'rgba(52, 152, 219, 0.1)'
        : 'rgba(231, 76, 60, 0.1)'};
  color: ${({ status }) =>
    status === 'ACTIVE'
      ? '#27ae60'
      : status === 'INVITED'
        ? '#3498db'
        : '#e74c3c'};
`;

const StyledSelect = styled.select`
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
`;

const StyledButton = styled.button<{ variant?: 'danger' | 'primary' }>`
  background-color: ${({ variant }) =>
    variant === 'danger' ? '#e74c3c' : '#3498db'};
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
  padding: 4px 10px;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledActions = styled.div`
  display: flex;
  gap: 4px;
`;

type TeamMemberListProps = {
  members: CompanyMember[];
  onChangeRole: (targetUserId: string, newRole: CompanyRoleName) => void;
  onSuspend: (targetUserId: string) => void;
  onActivate: (targetUserId: string) => void;
};

export const TeamMemberList = ({
  members,
  onChangeRole,
  onSuspend,
  onActivate,
}: TeamMemberListProps) => {
  const { companyContext } = useCompanyContext();
  const isRootAdmin = companyContext?.isRootAdmin ?? false;
  const currentRole = companyContext?.companyRole ?? '';
  const canManage =
    isRootAdmin ||
    currentRole === 'COMPANY_OWNER' ||
    currentRole === 'COMPANY_ADMIN';

  return (
    <StyledTable>
      <thead>
        <tr>
          <StyledTh>User ID</StyledTh>
          <StyledTh>Role</StyledTh>
          <StyledTh>Status</StyledTh>
          {canManage && <StyledTh>Actions</StyledTh>}
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <TeamMemberRow
            key={member.id}
            member={member}
            canManage={canManage}
            isRootAdmin={isRootAdmin}
            onChangeRole={onChangeRole}
            onSuspend={onSuspend}
            onActivate={onActivate}
          />
        ))}
      </tbody>
    </StyledTable>
  );
};

const TeamMemberRow = ({
  member,
  canManage,
  isRootAdmin,
  onChangeRole,
  onSuspend,
  onActivate,
}: {
  member: CompanyMember;
  canManage: boolean;
  isRootAdmin: boolean;
  onChangeRole: (targetUserId: string, newRole: CompanyRoleName) => void;
  onSuspend: (targetUserId: string) => void;
  onActivate: (targetUserId: string) => void;
}) => {
  const [selectedRole, setSelectedRole] = useState<CompanyRoleName>(
    member.role,
  );

  const isOwner = member.role === 'COMPANY_OWNER';
  const isSuspended = member.status === 'SUSPENDED';
  const isInvited = member.status === 'INVITED';

  const handleRoleChange = () => {
    if (selectedRole !== member.role) {
      onChangeRole(member.userId, selectedRole);
    }
  };

  return (
    <tr>
      <StyledTd>{member.userId}</StyledTd>
      <StyledTd>{ROLE_LABELS[member.role] ?? member.role}</StyledTd>
      <StyledTd>
        <StyledStatusBadge status={member.status}>
          {STATUS_LABELS[member.status] ?? member.status}
        </StyledStatusBadge>
      </StyledTd>
      {canManage && (
        <StyledTd>
          <StyledActions>
            {!isOwner && !isSuspended && (
              <>
                <StyledSelect
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as CompanyRoleName)
                  }
                >
                  {(isRootAdmin
                    ? (['COMPANY_OWNER', ...ASSIGNABLE_ROLES] as const)
                    : ASSIGNABLE_ROLES
                  ).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </StyledSelect>
                {selectedRole !== member.role && (
                  <StyledButton variant="primary" onClick={handleRoleChange}>
                    Save
                  </StyledButton>
                )}
                <StyledButton
                  variant="danger"
                  onClick={() => onSuspend(member.userId)}
                >
                  Suspend
                </StyledButton>
              </>
            )}
            {isSuspended && (
              <StyledButton
                variant="primary"
                onClick={() => onActivate(member.userId)}
              >
                Reactivate
              </StyledButton>
            )}
            {isInvited && (
              <StyledButton
                variant="primary"
                onClick={() => onActivate(member.userId)}
              >
                Activate
              </StyledButton>
            )}
          </StyledActions>
        </StyledTd>
      )}
    </tr>
  );
};
