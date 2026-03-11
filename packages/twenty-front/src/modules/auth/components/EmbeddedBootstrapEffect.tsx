import { useEffect, useState } from 'react';

import {
  type CompanyContext,
  companyContextState,
} from '@/auth/states/companyContextState';
import { tokenPairState } from '@/auth/states/tokenPairState';
import { exchangeBootstrapToken } from '@/auth/utils/exchangeBootstrapToken';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { AppPath } from 'twenty-shared/types';
import { withBasePath } from '~/utils/basePath';

type BootstrapStatus = 'loading' | 'success' | 'error';

/**
 * EmbeddedBootstrapEffect handles the embedded auth flow for Factory Engine.
 *
 * URL format: /embedded/verify?token=<bootstrap_token>
 *
 * Flow:
 * 1. Read one-time bootstrap token from query param
 * 2. Exchange it for company-scoped access + refresh tokens via POST /auth/factory/exchange
 * 3. Store tokens in localStorage + Jotai atom
 * 4. Store company context (companyId, companyRole, isRootAdmin) from JWT payload
 * 5. Full page reload to /
 *
 * This route runs OUTSIDE AppRouterProviders (same pattern as IframeAuthEffect)
 * to avoid auth/metadata providers initializing in an unauthenticated state.
 */
export const EmbeddedBootstrapEffect = () => {
  const setTokenPair = useSetAtomState(tokenPairState);
  const setCompanyContext = useSetAtomState(companyContextState);
  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const performExchange = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const bootstrapToken = params.get('token');

        if (!bootstrapToken) {
          setStatus('error');
          setErrorMessage('Missing bootstrap token in URL');

          return;
        }

        const result = await exchangeBootstrapToken(bootstrapToken);

        if (
          !result.accessToken?.token ||
          !result.refreshToken?.token
        ) {
          setStatus('error');
          setErrorMessage('Invalid token response from server');

          return;
        }

        // Map exchange response to AuthTokenPair shape
        const tokenPair = {
          accessOrWorkspaceAgnosticToken: {
            token: result.accessToken.token,
            expiresAt: result.accessToken.expiresAt,
          },
          refreshToken: {
            token: result.refreshToken.token,
            expiresAt: result.refreshToken.expiresAt,
          },
        };

        // Decode JWT payload to extract company context without external dependency
        const payloadBase64 = result.accessToken.token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        const companyContext: CompanyContext = {
          companyId: payload.companyId ?? '',
          companyRole: payload.companyRole ?? '',
          isRootAdmin: payload.isRootAdmin === true,
        };

        // Store tokens in localStorage (works in third-party iframe context)
        localStorage.setItem('tokenPair', JSON.stringify(tokenPair));

        // Store company context in localStorage
        localStorage.setItem(
          'companyContextState',
          JSON.stringify(companyContext),
        );

        // Set Jotai atom states
        setTokenPair(tokenPair);
        setCompanyContext(companyContext);

        setStatus('success');

        // Force a fresh app bootstrap with the stored tokens.
        // This avoids auth/metadata providers initializing in an unauthenticated state.
        window.location.replace(withBasePath(AppPath.Index));
      } catch (e) {
        setStatus('error');
        setErrorMessage(
          e instanceof Error ? e.message : 'Unknown error during bootstrap',
        );
      }
    };

    performExchange();
  }, [setTokenPair, setCompanyContext]);

  if (status === 'error') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: '12px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ color: '#e74c3c', fontSize: '16px', fontWeight: 600 }}>
          Authentication Failed
        </div>
        <div style={{ color: '#999', fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>
          {errorMessage}
        </div>
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
        fontFamily: 'Inter, sans-serif',
      }}
    >
      Authenticating...
    </div>
  );
};
