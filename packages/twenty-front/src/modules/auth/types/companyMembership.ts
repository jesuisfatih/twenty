export type CompanyRoleName =
  | 'COMPANY_OWNER'
  | 'COMPANY_ADMIN'
  | 'COMPANY_SALES'
  | 'COMPANY_SUPPORT'
  | 'COMPANY_READONLY';

export type MembershipStatusName = 'ACTIVE' | 'SUSPENDED' | 'INVITED';

export type CompanyMember = {
  id: string;
  userId: string;
  companyId: string;
  role: CompanyRoleName;
  status: MembershipStatusName;
  createdAt: string;
  updatedAt: string;
};

export const ROLE_LABELS: Record<CompanyRoleName, string> = {
  COMPANY_OWNER: 'Owner',
  COMPANY_ADMIN: 'Admin',
  COMPANY_SALES: 'Sales',
  COMPANY_SUPPORT: 'Support',
  COMPANY_READONLY: 'Read Only',
};

export const STATUS_LABELS: Record<MembershipStatusName, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  INVITED: 'Invited',
};

export const ASSIGNABLE_ROLES: CompanyRoleName[] = [
  'COMPANY_ADMIN',
  'COMPANY_SALES',
  'COMPANY_SUPPORT',
  'COMPANY_READONLY',
];
