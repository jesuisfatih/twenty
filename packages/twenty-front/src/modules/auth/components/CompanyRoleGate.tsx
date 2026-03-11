import { type ReactNode } from 'react';

import { useCompanyContext } from '@/auth/hooks/useCompanyContext';

/**
 * Ordered from highest privilege to lowest.
 * Matches backend CompanyRole enum hierarchy.
 */
const ROLE_HIERARCHY = [
  'COMPANY_OWNER',
  'COMPANY_ADMIN',
  'COMPANY_SALES',
  'COMPANY_SUPPORT',
  'COMPANY_READONLY',
] as const;

export type CompanyRoleName = (typeof ROLE_HIERARCHY)[number];

/**
 * CompanyRoleGate conditionally renders its children only when the current
 * user meets the minimum required company role level.
 *
 * - Root admins always pass the gate.
 * - Returns `fallback` (default: null) when the gate blocks.
 * - Returns `children` as-is when there is no embedded company session
 *   (standard Twenty usage — no restrictions).
 */
export const CompanyRoleGate = ({
  minimumRole,
  children,
  fallback = null,
}: {
  minimumRole: CompanyRoleName;
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const { companyContext, isEmbeddedSession } = useCompanyContext();

  // No embedded session → standard Twenty mode, no role gating
  if (!isEmbeddedSession || !companyContext) {
    return <>{children}</>;
  }

  // Root admin bypasses all role checks
  if (companyContext.isRootAdmin) {
    return <>{children}</>;
  }

  const userRoleIndex = ROLE_HIERARCHY.indexOf(
    companyContext.companyRole as CompanyRoleName,
  );
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole);

  // Lower index = higher privilege. Unknown role → block.
  if (userRoleIndex === -1 || userRoleIndex > requiredRoleIndex) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
