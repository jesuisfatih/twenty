import { CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';

import { FactoryBootstrapController } from './factory-bootstrap.controller';

describe('FactoryBootstrapController', () => {
  const bootstrapTokenService = {
    validateAndConsumeBootstrapToken: jest.fn(),
    generateBootstrapToken: jest.fn(),
  };

  const accessTokenService = {
    generateAccessToken: jest.fn().mockResolvedValue({
      token: 'access-token',
      expiresAt: new Date('2026-03-11T12:00:00.000Z'),
    }),
  };

  const refreshTokenService = {
    generateRefreshToken: jest.fn().mockResolvedValue({
      token: 'refresh-token',
      expiresAt: new Date('2026-03-11T13:00:00.000Z'),
    }),
  };

  const companyMembershipService = {
    findActiveMembershipOrThrow: jest.fn(),
  };

  let controller: FactoryBootstrapController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FactoryBootstrapController(
      bootstrapTokenService as any,
      accessTokenService as any,
      refreshTokenService as any,
      companyMembershipService as any,
    );
  });

  it('revalidates current membership before minting access tokens', async () => {
    bootstrapTokenService.validateAndConsumeBootstrapToken.mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      companyId: 'company-1',
      companyRole: CompanyRole.COMPANY_SALES,
      isRootAdmin: false,
    });
    companyMembershipService.findActiveMembershipOrThrow.mockResolvedValue({
      role: CompanyRole.COMPANY_OWNER,
    });

    const result = await controller.exchangeBootstrapToken(
      { bootstrapToken: 'bootstrap-token' },
      {
        get: jest.fn().mockReturnValue('corr-1'),
      } as any,
    );

    expect(companyMembershipService.findActiveMembershipOrThrow).toHaveBeenCalledWith(
      'user-1',
      'company-1',
      'workspace-1',
    );
    expect(accessTokenService.generateAccessToken).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      authProvider: AuthProviderEnum.Password,
      companyId: 'company-1',
      companyRole: CompanyRole.COMPANY_OWNER,
      isRootAdmin: true,
    });
    expect(result.accessToken.token).toBe('access-token');
  });
});