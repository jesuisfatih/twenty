import { useCallback, useEffect, useState } from 'react';

import { useCompanyContext } from '@/auth/hooks/useCompanyContext';
import {
  type CompanyMember,
  type CompanyRoleName,
} from '@/auth/types/companyMembership';
import { membershipApi } from '@/auth/utils/membershipApi';

export type MembershipState = {
  members: CompanyMember[];
  loading: boolean;
  error: string | null;
};

export const useCompanyMembers = () => {
  const { companyContext } = useCompanyContext();
  const companyId = companyContext?.companyId ?? null;

  const [state, setState] = useState<MembershipState>({
    members: [],
    loading: false,
    error: null,
  });

  const loadMembers = useCallback(async () => {
    if (!companyId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await membershipApi.listMembers(companyId);

      setState({ members: result.members, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load members',
      }));
    }
  }, [companyId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const inviteMember = useCallback(
    async (userId: string, role: CompanyRoleName) => {
      if (!companyId) return;

      await membershipApi.inviteMember(companyId, userId, role);
      await loadMembers();
    },
    [companyId, loadMembers],
  );

  const changeRole = useCallback(
    async (targetUserId: string, newRole: CompanyRoleName) => {
      if (!companyId) return;

      await membershipApi.changeRole(companyId, targetUserId, newRole);
      await loadMembers();
    },
    [companyId, loadMembers],
  );

  const suspendMember = useCallback(
    async (targetUserId: string) => {
      if (!companyId) return;

      await membershipApi.suspendMember(companyId, targetUserId);
      await loadMembers();
    },
    [companyId, loadMembers],
  );

  const activateMember = useCallback(
    async (targetUserId: string) => {
      if (!companyId) return;

      await membershipApi.activateMember(companyId, targetUserId);
      await loadMembers();
    },
    [companyId, loadMembers],
  );

  return {
    ...state,
    companyId,
    loadMembers,
    inviteMember,
    changeRole,
    suspendMember,
    activateMember,
  };
};
