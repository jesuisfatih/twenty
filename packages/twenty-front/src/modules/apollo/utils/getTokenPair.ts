import { isDefined } from 'twenty-shared/utils';
import { type AuthTokenPair } from '~/generated-metadata/graphql';
import { isValidAuthTokenPair } from './isValidAuthTokenPair';

export const getTokenPair = (): AuthTokenPair | undefined => {
  const stringTokenPair = localStorage.getItem('tokenPair');

  if (!isDefined(stringTokenPair)) {
    // oxlint-disable-next-line no-console
    console.log('tokenPair is undefined');

    return undefined;
  }

  try {
    const parsedTokenPair = JSON.parse(stringTokenPair);

    if (!isValidAuthTokenPair(parsedTokenPair)) {
      localStorage.removeItem('tokenPair');
      return undefined;
    }

    return parsedTokenPair;
  } catch {
    localStorage.removeItem('tokenPair');
    return undefined;
  }
};
