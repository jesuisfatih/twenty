import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type AuthTokenPair } from '~/generated-metadata/graphql';

export const tokenPairState = createAtomState<AuthTokenPair | null>({
  key: 'tokenPair',
  defaultValue: null,
  useLocalStorage: true,
});
