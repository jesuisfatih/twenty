import {
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { type Request } from 'express';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { BootstrapTokenService } from 'src/engine/core-modules/auth/token/services/bootstrap-token.service';
import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { RefreshTokenService } from 'src/engine/core-modules/auth/token/services/refresh-token.service';
import { JwtTokenTypeEnum } from 'src/engine/core-modules/auth/types/auth-context.type';
import { CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { CompanyMembershipService } from 'src/engine/core-modules/company-membership/services/company-membership.service';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';

interface BootstrapRequestBody {
  userId: string;
  companyId: string;
}

interface ExchangeRequestBody {
  bootstrapToken: string;
}

@Controller('auth/factory')
@UseFilters(AuthRestApiExceptionFilter)
export class FactoryBootstrapController {
  private readonly logger = new Logger(FactoryBootstrapController.name);

  constructor(
    private readonly bootstrapTokenService: BootstrapTokenService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly companyMembershipService: CompanyMembershipService,
  ) {}

  /**
   * POST /auth/factory/bootstrap
   *
   * Server-to-server endpoint. Authenticated via API key or admin access token.
   * Factory Engine calls this to request a one-time bootstrap token
   * for a specific user+company combination.
   *
   * Request body: { userId: string, companyId: string }
   * Response: { bootstrapToken: string, expiresAt: string }
   */
  @Post('bootstrap')
  @UseGuards(JwtAuthGuard)
  async createBootstrapToken(
    @Body() body: BootstrapRequestBody,
    @Req() req: Request,
  ) {
    const workspace = (req as any).workspace;
    const correlationId = this.getCorrelationId(req);

    if (!workspace) {
      throw new AuthException(
        'Workspace context required',
        AuthExceptionCode.WORKSPACE_NOT_FOUND,
      );
    }

    if (!body.userId || !body.companyId) {
      throw new AuthException(
        'userId and companyId are required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    this.logger.log(
      `Bootstrap requested: user=${body.userId} company=${body.companyId} workspace=${workspace.id} correlationId=${correlationId} userAgent=${req.get('user-agent') ?? 'unknown'}`,
    );

    const result = await this.bootstrapTokenService.generateBootstrapToken({
      userId: body.userId,
      workspaceId: workspace.id,
      companyId: body.companyId,
      source: 'factory-engine',
    });

    return {
      bootstrapToken: result.token,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  /**
   * POST /auth/factory/exchange
   *
   * Public endpoint (no guard). Frontend exchanges a one-time bootstrap token
   * for a company-scoped access + refresh token pair.
   *
   * Request body: { bootstrapToken: string }
   * Response: { accessToken: { token, expiresAt }, refreshToken: { token, expiresAt } }
   */
  @Post('exchange')
  async exchangeBootstrapToken(
    @Body() body: ExchangeRequestBody,
    @Req() req: Request,
  ) {
    const correlationId = this.getCorrelationId(req);

    if (!body.bootstrapToken) {
      throw new AuthException(
        'bootstrapToken is required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    const payload =
      await this.bootstrapTokenService.validateAndConsumeBootstrapToken(
        body.bootstrapToken,
      );

    const currentMembership =
      await this.companyMembershipService.findActiveMembershipOrThrow(
        payload.userId,
        payload.companyId,
        payload.workspaceId,
      );

    this.logger.log(
      `Bootstrap exchange: user=${payload.userId} company=${payload.companyId} workspace=${payload.workspaceId} correlationId=${correlationId} currentRole=${currentMembership.role}`,
    );

    const accessToken = await this.accessTokenService.generateAccessToken({
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      authProvider: AuthProviderEnum.Password,
      companyId: payload.companyId,
      companyRole: currentMembership.role,
      isRootAdmin: currentMembership.role === CompanyRole.COMPANY_OWNER,
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken({
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      authProvider: AuthProviderEnum.Password,
      targetedTokenType: JwtTokenTypeEnum.ACCESS,
    });

    return {
      accessToken: {
        token: accessToken.token,
        expiresAt: accessToken.expiresAt.toISOString(),
      },
      refreshToken: {
        token: refreshToken.token,
        expiresAt: refreshToken.expiresAt.toISOString(),
      },
    };
  }

  private getCorrelationId(req: Request): string {
    const headerValue = req.get('x-correlation-id');

    if (headerValue && headerValue.trim().length > 0) {
      return headerValue;
    }

    return randomUUID();
  }
}
