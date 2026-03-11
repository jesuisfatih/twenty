import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';

@Injectable()
export class CompanyAccessGuard implements CanActivate {
  private readonly logger = new Logger(CompanyAccessGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request.isRootAdmin === true) {
      return true;
    }

    if (!request.companyId) {
      this.logger.warn(
        `CompanyAccessGuard denied: no companyId in auth context for user=${request.user?.id}`,
      );

      throw new AuthException(
        'Company scope is required for this operation',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    return true;
  }
}
