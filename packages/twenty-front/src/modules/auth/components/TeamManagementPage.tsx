import { useState } from 'react';

import { CompanyContextChip } from '@/auth/components/CompanyContextChip';
import { CompanyRoleGate } from '@/auth/components/CompanyRoleGate';
import { InviteMemberModal } from '@/auth/components/InviteMemberModal';
import { RootAdminBanner } from '@/auth/components/RootAdminBanner';
import { TeamMemberList } from '@/auth/components/TeamMemberList';
import { useCompanyContext } from '@/auth/hooks/useCompanyContext';
import { useCompanyMembers } from '@/auth/hooks/useCompanyMembers';
import { styled } from '@linaria/react';

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StyledContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const StyledTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const StyledHeaderRight = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
`;

const StyledInviteButton = styled.button`
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  padding: 8px 16px;

  &:hover {
    opacity: 0.85;
  }
`;

const StyledEmptyState = styled.div`
  color: #888;
  font-size: 14px;
  padding: 40px 0;
  text-align: center;
`;

const StyledError = styled.div`
  background-color: rgba(231, 76, 60, 0.08);
  border-radius: 4px;
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 12px 16px;
`;

const StyledNoAccess = styled.div`
  color: #888;
  font-size: 14px;
  padding: 60px 0;
  text-align: center;
`;

export const TeamManagementPage = () => {
  const { isEmbeddedSession } = useCompanyContext();
  const {
    members,
    loading,
    error,
    inviteMember,
    changeRole,
    suspendMember,
    activateMember,
  } = useCompanyMembers();

  const [showInviteModal, setShowInviteModal] = useState(false);

  if (!isEmbeddedSession) {
    return (
      <StyledPage>
        <StyledContent>
          <StyledNoAccess>
            Team management is only available in company-scoped sessions.
          </StyledNoAccess>
        </StyledContent>
      </StyledPage>
    );
  }

  return (
    <StyledPage>
      <RootAdminBanner />
      <StyledContent>
        <StyledHeader>
          <StyledTitle>Team Members</StyledTitle>
          <StyledHeaderRight>
            <CompanyContextChip />
            <CompanyRoleGate minimumRole="COMPANY_ADMIN">
              <StyledInviteButton onClick={() => setShowInviteModal(true)}>
                Invite Member
              </StyledInviteButton>
            </CompanyRoleGate>
          </StyledHeaderRight>
        </StyledHeader>

        {error && <StyledError>{error}</StyledError>}

        {loading && !members.length ? (
          <StyledEmptyState>Loading team members…</StyledEmptyState>
        ) : members.length === 0 ? (
          <StyledEmptyState>No team members found.</StyledEmptyState>
        ) : (
          <TeamMemberList
            members={members}
            onChangeRole={changeRole}
            onSuspend={suspendMember}
            onActivate={activateMember}
          />
        )}
      </StyledContent>

      {showInviteModal && (
        <InviteMemberModal
          onInvite={inviteMember}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </StyledPage>
  );
};
