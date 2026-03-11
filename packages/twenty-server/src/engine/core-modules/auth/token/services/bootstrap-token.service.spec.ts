import { AuthException } from 'src/engine/core-modules/auth/auth.exception';
import { AppTokenType } from 'src/engine/core-modules/app-token/app-token.entity';
import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/auth-context.type';
import { CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';

import { BootstrapTokenService } from './bootstrap-token.service';

describe('BootstrapTokenService', () => {
  const jwtWrapperService = {
    verify: jest.fn(),
    decode: jest.fn(),
    generateAppSecret: jest.fn().mockReturnValue('bootstrap-secret'),
    sign: jest.fn(),
  };

  const companyMembershipService = {
    findActiveMembershipOrThrow: jest.fn(),
  };

  const appTokenRepository = {
    findOneBy: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  let service: BootstrapTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BootstrapTokenService(
      jwtWrapperService as any,
      companyMembershipService as any,
      appTokenRepository as any,
    );
  });

  it('consumes a bootstrap token once and rejects replay attempts', async () => {
    const payload = {
      sub: 'user-1',
      type: JwtTokenTypeEnum.BOOTSTRAP,
      workspaceId: 'workspace-1',
      companyId: 'company-1',
      userId: 'user-1',
      companyRole: CompanyRole.COMPANY_ADMIN,
      isRootAdmin: false,
      source: 'factory-engine',
      jti: 'token-1',
    };

    jwtWrapperService.decode.mockReturnValue(payload);
    appTokenRepository.findOneBy
      .mockResolvedValueOnce({
        id: 'token-1',
        type: AppTokenType.BootstrapToken,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      })
      .mockResolvedValueOnce({
        id: 'token-1',
        type: AppTokenType.BootstrapToken,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

    const firstUse = await service.validateAndConsumeBootstrapToken('bootstrap-token');

    expect(firstUse).toBe(payload);
    expect(appTokenRepository.update).toHaveBeenCalledWith(
      { id: 'token-1' },
      { revokedAt: expect.any(Date) },
    );

    await expect(
      service.validateAndConsumeBootstrapToken('bootstrap-token'),
    ).rejects.toBeInstanceOf(AuthException);
  });
});
