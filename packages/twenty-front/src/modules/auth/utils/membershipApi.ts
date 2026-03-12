import { type CompanyMember, type CompanyRoleName } from '@/auth/types/companyMembership';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const BASE = `${REACT_APP_SERVER_BASE_URL}/api/company-membership`;

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('tokenPair')
    ? JSON.parse(localStorage.getItem('tokenPair')!).accessOrWorkspaceAgnosticToken?.token
    : null;

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Membership API error (${response.status}): ${errorBody}`,
    );
  }

  return response.json();
}

export const membershipApi = {
  listMembers: (companyId: string) =>
    apiRequest<{ members: CompanyMember[] }>(`/${companyId}/members`),

  inviteMember: (companyId: string, userId: string, role: CompanyRoleName) =>
    apiRequest<{ membership: CompanyMember }>(`/${companyId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),

  activateMember: (companyId: string, targetUserId: string) =>
    apiRequest<{ membership: CompanyMember }>(`/${companyId}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ targetUserId }),
    }),

  changeRole: (
    companyId: string,
    targetUserId: string,
    newRole: CompanyRoleName,
  ) =>
    apiRequest<{ success: boolean }>(`/${companyId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ targetUserId, newRole }),
    }),

  suspendMember: (companyId: string, targetUserId: string) =>
    apiRequest<{ success: boolean }>(`/${companyId}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ targetUserId }),
    }),
};
