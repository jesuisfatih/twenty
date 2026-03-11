import { useCompanyContext } from '@/auth/hooks/useCompanyContext';
import { styled } from '@linaria/react';

const StyledBanner = styled.div`
  align-items: center;
  background-color: rgba(231, 76, 60, 0.08);
  border-bottom: 1px solid rgba(231, 76, 60, 0.2);
  color: #c0392b;
  display: flex;
  font-size: 12px;
  font-weight: 500;
  gap: 8px;
  justify-content: center;
  padding: 6px 16px;
  width: 100%;
`;

const StyledLabel = styled.span`
  background-color: rgba(231, 76, 60, 0.15);
  border-radius: 4px;
  font-weight: 600;
  padding: 2px 6px;
`;

/**
 * RootAdminBanner renders a prominent warning banner at the top of the
 * viewport when the current user is operating in root-admin (elevated)
 * mode. This provides clear visual feedback that actions affect all
 * companies, not just one.
 *
 * Returns null for non-root-admin users or outside embedded sessions.
 */
export const RootAdminBanner = () => {
  const { companyContext, isEmbeddedSession } = useCompanyContext();

  if (!isEmbeddedSession || !companyContext?.isRootAdmin) {
    return null;
  }

  return (
    <StyledBanner data-testid="root-admin-banner">
      <StyledLabel>ROOT ADMIN</StyledLabel>
      <span>
        Elevated access mode — actions apply across all company scopes
      </span>
    </StyledBanner>
  );
};
