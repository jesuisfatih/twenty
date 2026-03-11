import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const AuthCompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    return request.companyId;
  },
);

export const AuthCompanyRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.companyRole;
  },
);

export const AuthIsRootAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest();

    return request.isRootAdmin === true;
  },
);
