import { REACT_APP_SERVER_BASE_URL } from '~/config';

export type ExchangeBootstrapResult = {
  accessToken: {
    token: string;
    expiresAt: string;
  };
  refreshToken: {
    token: string;
    expiresAt: string;
  };
};

export const exchangeBootstrapToken = async (
  bootstrapToken: string,
): Promise<ExchangeBootstrapResult> => {
  const response = await fetch(
    `${REACT_APP_SERVER_BASE_URL}/auth/factory/exchange`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bootstrapToken }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Bootstrap exchange failed (${response.status}): ${errorBody}`,
    );
  }

  return response.json();
};
