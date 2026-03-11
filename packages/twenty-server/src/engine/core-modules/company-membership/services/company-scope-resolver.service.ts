import { Injectable, Logger } from '@nestjs/common';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import {
  type RawAuthContext,
} from 'src/engine/core-modules/auth/types/auth-context.type';
import { CompanyRole } from 'src/engine/core-modules/company-membership/enums/company-role.enum';

export interface ResolvedCompanyScope {
  companyId: string;
  companyRole: CompanyRole;
  isRootAdmin: boolean;
}

@Injectable()
export class CompanyScopeResolver {
  private readonly logger = new Logger(CompanyScopeResolver.name);

  resolveFromAuthContext(
    authContext: RawAuthContext,
  ): ResolvedCompanyScope | null {
    if (authContext.isRootAdmin === true) {
      if (authContext.companyId) {
        return {
          companyId: authContext.companyId,
          companyRole: authContext.companyRole ?? CompanyRole.COMPANY_OWNER,
          isRootAdmin: true,
        };
      }

      return null;
    }

    if (!authContext.companyId || !authContext.companyRole) {
      return null;
    }

    return {
      companyId: authContext.companyId,
      companyRole: authContext.companyRole,
      isRootAdmin: false,
    };
  }

  resolveOrThrow(authContext: RawAuthContext): ResolvedCompanyScope {
    const scope = this.resolveFromAuthContext(authContext);

    if (!scope) {
      throw new AuthException(
        'Company scope is required but could not be resolved from auth context',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    return scope;
  }

  hasMinimumRole(
    resolvedScope: ResolvedCompanyScope,
    requiredRole: CompanyRole,
  ): boolean {
    if (resolvedScope.isRootAdmin) {
      return true;
    }

    const roleHierarchy: CompanyRole[] = [
      CompanyRole.COMPANY_OWNER,
      CompanyRole.COMPANY_ADMIN,
      CompanyRole.COMPANY_SALES,
      CompanyRole.COMPANY_SUPPORT,
      CompanyRole.COMPANY_READONLY,
    ];

    const userRoleIndex = roleHierarchy.indexOf(resolvedScope.companyRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    return userRoleIndex <= requiredRoleIndex;
  }

  assertMinimumRole(
    resolvedScope: ResolvedCompanyScope,
    requiredRole: CompanyRole,
  ): void {
    if (!this.hasMinimumRole(resolvedScope, requiredRole)) {
      this.logger.warn(
        `Insufficient company role: has=${resolvedScope.companyRole} required=${requiredRole} company=${resolvedScope.companyId}`,
      );

      throw new AuthException(
        `Insufficient company role: requires at least ${requiredRole}`,
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }
  }
}
