import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { AppPath } from 'twenty-shared/types';

/**
 * IframeAuthEffect reads auth tokens from the URL hash fragment
 * and stores them in localStorage for cross-origin iframe embedding.
 *
 * URL format: /iframe-auth#t=<base64_encoded_token_pair_json>
 *
 * This enables auto-login when Twenty is embedded in an iframe
 * without relying on cookies (which are blocked in third-party contexts).
 */
export const IframeAuthEffect = () => {
  const setTokenPair = useSetAtomState(tokenPairState);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = window.location.hash;

      if (!hash || !hash.includes('t=')) {
        setError('No token data in URL');
        return;
      }

      const tokenBase64 = hash.split('t=')[1];

      if (!tokenBase64) {
        setError('Empty token data');
        return;
      }

      const tokenJson = atob(tokenBase64);
      const tokens = JSON.parse(tokenJson);

      if (
        !tokens.accessOrWorkspaceAgnosticToken?.token ||
        !tokens.refreshToken?.token
      ) {
        setError('Invalid token structure');
        return;
      }

      // Store tokens in localStorage (works in third-party iframe context)
      localStorage.setItem('tokenPair', JSON.stringify(tokens));

      // Also set the Jotai atom state
      setTokenPair(tokens);

      // Force a fresh app bootstrap with the stored tokens.
      // This avoids auth/metadata providers initializing in an unauthenticated state.
      window.location.replace(AppPath.Index);
    } catch (e) {
      setError(
        `Failed to process auth tokens: ${e instanceof Error ? e.message : 'Unknown error'}`,
      );
    }
  }, [navigate, setTokenPair]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#999',
          fontSize: '14px',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#999',
        fontSize: '14px',
      }}
    >
      Authenticating...
    </div>
  );
};
