import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { addMilliseconds } from 'date-fns';
import ms from 'ms';
import { Repository } from 'typeorm';

import {
  AppTokenEntity,
  AppTokenType,
} from 'src/engine/core-modules/app-token/app-token.entity';
import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { type AuthToken } from 'src/engine/core-modules/auth/dto/auth-token.dto';
import {
  type BootstrapTokenJwtPayload,
  JwtTokenTypeEnum,
} from 'src/engine/core-modules/auth/types/auth-context.type';
import { CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';
import { CompanyMembershipService } from 'src/engine/core-modules/company-membership/services/company-membership.service';
import { JwtWrapperService } from 'src/engine/core-modules/jwt/services/jwt-wrapper.service';

const BOOTSTRAP_TOKEN_EXPIRES_IN = '60s';

@Injectable()
export class BootstrapTokenService {
  private readonly logger = new Logger(BootstrapTokenService.name);

  constructor(
    private readonly jwtWrapperService: JwtWrapperService,
    @Inject(forwardRef(() => CompanyMembershipService))
    private readonly companyMembershipService: CompanyMembershipService,
    @InjectRepository(AppTokenEntity)
    private readonly appTokenRepository: Repository<AppTokenEntity>,
  ) {}

  async generateBootstrapToken(params: {
    userId: string;
    workspaceId: string;
    companyId: string;
    source: string;
  }): Promise<AuthToken> {
    const membership =
      await this.companyMembershipService.findActiveMembershipOrThrow(
        params.userId,
        params.companyId,
        params.workspaceId,
      );

    const expiresIn = BOOTSTRAP_TOKEN_EXPIRES_IN;
    const expiresAt = addMilliseconds(new Date().getTime(), ms(expiresIn));

    const bootstrapRecord = this.appTokenRepository.create({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: AppTokenType.BootstrapToken,
      expiresAt,
      context: {
        companyId: params.companyId,
        companyRole: membership.role,
        source: params.source,
      } as any,
    });

    await this.appTokenRepository.save(bootstrapRecord);

    const jwtPayload: BootstrapTokenJwtPayload = {
      sub: params.userId,
      type: JwtTokenTypeEnum.BOOTSTRAP,
      workspaceId: params.workspaceId,
      companyId: params.companyId,
      userId: params.userId,
      companyRole: membership.role,
      isRootAdmin: membership.role === CompanyRole.COMPANY_OWNER,
      source: params.source,
      jti: bootstrapRecord.id,
    };

    const secret = this.jwtWrapperService.generateAppSecret(
      JwtTokenTypeEnum.BOOTSTRAP,
      params.workspaceId,
    );

    const token = this.jwtWrapperService.sign(jwtPayload, {
      secret,
      expiresIn,
      jwtid: bootstrapRecord.id,
    });

    this.logger.log(
      `Bootstrap token issued for user=${params.userId} company=${params.companyId} workspace=${params.workspaceId}`,
    );

    return { token, expiresAt };
  }

  async validateAndConsumeBootstrapToken(
    token: string,
  ): Promise<BootstrapTokenJwtPayload> {
    const secret = this.decodeAndGetSecret(token);

    this.jwtWrapperService.verify(token, { secret });

    const payload =
      this.jwtWrapperService.decode<BootstrapTokenJwtPayload>(token);

    if (payload.type !== JwtTokenTypeEnum.BOOTSTRAP) {
      throw new AuthException(
        'Expected a bootstrap token',
        AuthExceptionCode.INVALID_JWT_TOKEN_TYPE,
      );
    }

    if (!payload.jti) {
      throw new AuthException(
        'Bootstrap token missing jti',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    const appToken = await this.appTokenRepository.findOneBy({
      id: payload.jti,
    });

    if (!appToken) {
      throw new AuthException(
        'Bootstrap token not found',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    if (appToken.type !== AppTokenType.BootstrapToken) {
      throw new AuthException(
        'Invalid token type',
        AuthExceptionCode.INVALID_JWT_TOKEN_TYPE,
      );
    }

    if (appToken.revokedAt) {
      this.logger.warn(
        `Bootstrap token replay attempt: jti=${payload.jti} user=${payload.userId}`,
      );

      throw new AuthException(
        'Bootstrap token has already been consumed',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    if (appToken.expiresAt < new Date()) {
      throw new AuthException(
        'Bootstrap token has expired',
        AuthExceptionCode.UNAUTHENTICATED,
      );
    }

    await this.appTokenRepository.update(
      { id: payload.jti },
      { revokedAt: new Date() },
    );

    this.logger.log(
      `Bootstrap token consumed: jti=${payload.jti} user=${payload.userId} company=${payload.companyId}`,
    );

    return payload;
  }

  private decodeAndGetSecret(token: string): string {
    const decoded =
      this.jwtWrapperService.decode<BootstrapTokenJwtPayload>(token);

    return this.jwtWrapperService.generateAppSecret(
      JwtTokenTypeEnum.BOOTSTRAP,
      decoded.workspaceId,
    );
  }
}
