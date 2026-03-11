import {
  type CompanyContext,
  companyContextState,
} from '@/auth/states/companyContextState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

export const useCompanyContext = (): {
  companyContext: CompanyContext | null;
  setCompanyContext: (value: CompanyContext | null) => void;
  isEmbeddedSession: boolean;
} => {
  const companyContext = useAtomStateValue(companyContextState);
  const setCompanyContext = useSetAtomState(companyContextState);

  return {
    companyContext,
    setCompanyContext,
    isEmbeddedSession: companyContext !== null,
  };
};
