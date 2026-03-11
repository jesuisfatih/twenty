import { useCompanyContext } from '@/auth/hooks/useCompanyContext';

/**
 * CompanyContextChip renders a small visual indicator showing the current
 * company context when operating in an embedded (company-scoped) session.
 *
 * - For merchant users: shows their company role
 * - For root admins: indicates root-admin mode
 * - Returns null when there is no company context (standard Twenty session)
 */
export const CompanyContextChip = () => {
  const { companyContext, isEmbeddedSession } = useCompanyContext();

  if (!isEmbeddedSession || !companyContext) {
    return null;
  }

  const roleLabel = companyContext.companyRole
    .replace('COMPANY_', '')
    .replace(/_/g, ' ');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '4px',
        backgroundColor: companyContext.isRootAdmin
          ? 'rgba(231, 76, 60, 0.1)'
          : 'rgba(52, 152, 219, 0.1)',
        color: companyContext.isRootAdmin ? '#e74c3c' : '#3498db',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <span>{companyContext.isRootAdmin ? '⚙ Root Admin' : roleLabel}</span>
    </div>
  );
};
