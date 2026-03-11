import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type CompanyContext = {
  companyId: string;
  companyRole: string;
  isRootAdmin: boolean;
};

export const companyContextState = createAtomState<CompanyContext | null>({
  key: 'companyContextState',
  defaultValue: null,
  useLocalStorage: true,
});
