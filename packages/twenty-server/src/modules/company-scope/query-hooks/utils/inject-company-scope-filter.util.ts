import { type AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import {
  type FindManyResolverArgs,
  type CreateOneResolverArgs,
  type GroupByResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';

/**
 * Returns the scopedCompanyId from the auth context's workspace member.
 * If null/undefined, the member is a root user and should bypass company scoping.
 */
export function getScopedCompanyId(
  authContext: AuthContext,
): string | null | undefined {
  const workspaceMember = authContext.workspaceMember as
    | WorkspaceMemberWorkspaceEntity
    | undefined;

  return workspaceMember?.scopedCompanyId;
}

/**
 * Injects a company-scope filter into findMany/findOne args.
 *
 * @param filterField  The field to filter on (e.g. 'id' for company, 'companyId' for person/opportunity)
 * @param scopedCompanyId  The company ID to scope to
 * @param existingFilter  The existing filter from the query args (if any)
 * @returns A merged filter with the company scope AND condition applied
 */
export function buildScopedFilter(
  filterField: string,
  scopedCompanyId: string,
  existingFilter?: Record<string, unknown>,
): Record<string, unknown> {
  const scopeCondition = { [filterField]: { eq: scopedCompanyId } };

  if (!existingFilter || Object.keys(existingFilter).length === 0) {
    return scopeCondition;
  }

  // Merge with existing filter using AND
  if (existingFilter['and'] && Array.isArray(existingFilter['and'])) {
    return {
      and: [...existingFilter['and'], scopeCondition],
    };
  }

  return {
    and: [existingFilter, scopeCondition],
  };
}

/**
 * Injects company-scope filter into FindMany resolver args.
 * Returns the original args unmodified if the user is a root user (scopedCompanyId is null).
 */
export function injectCompanyScopeIntoFindMany(
  authContext: AuthContext,
  args: FindManyResolverArgs,
  filterField: string,
): FindManyResolverArgs {
  const scopedCompanyId = getScopedCompanyId(authContext);

  // Root user — no scoping
  if (!scopedCompanyId) {
    return args;
  }

  return {
    ...args,
    filter: buildScopedFilter(
      filterField,
      scopedCompanyId,
      args.filter as Record<string, unknown> | undefined,
    ),
  };
}

/**
 * Injects company-scope filter into FindOne resolver args.
 * Returns the original args unmodified if the user is a root user (scopedCompanyId is null).
 */
export function injectCompanyScopeIntoFindOne(
  authContext: AuthContext,
  args: { filter?: Record<string, unknown> },
  filterField: string,
): { filter?: Record<string, unknown> } {
  const scopedCompanyId = getScopedCompanyId(authContext);

  // Root user — no scoping
  if (!scopedCompanyId) {
    return args;
  }

  return {
    ...args,
    filter: buildScopedFilter(
      filterField,
      scopedCompanyId,
      args.filter,
    ),
  };
}

/**
 * Injects company-scope filter into GroupBy resolver args.
 * Returns the original args unmodified if the user is a root user.
 */
export function injectCompanyScopeIntoGroupBy(
  authContext: AuthContext,
  args: GroupByResolverArgs,
  filterField: string,
): GroupByResolverArgs {
  const scopedCompanyId = getScopedCompanyId(authContext);

  if (!scopedCompanyId) {
    return args;
  }

  return {
    ...args,
    filter: buildScopedFilter(
      filterField,
      scopedCompanyId,
      args.filter as Record<string, unknown> | undefined,
    ),
  };
}

/**
 * Injects scopedCompanyId into CreateOne data payload.
 * Ensures new records are always associated with the operator's company.
 * Throws if a non-root user tries to create a record for a different company.
 */
export function injectCompanyScopeIntoCreateOne<
  T extends Record<string, unknown>,
>(
  authContext: AuthContext,
  args: CreateOneResolverArgs<T>,
  companyIdField: string,
): CreateOneResolverArgs<T> {
  const scopedCompanyId = getScopedCompanyId(authContext);

  if (!scopedCompanyId) {
    return args;
  }

  const existingValue = args.data[companyIdField];

  // If the record already has a companyId, validate it matches the scoped company
  if (existingValue && existingValue !== scopedCompanyId) {
    throw new AuthException(
      `Cannot create record for a different company. Expected companyId=${scopedCompanyId}, got=${existingValue}`,
      AuthExceptionCode.FORBIDDEN_EXCEPTION,
    );
  }

  return {
    ...args,
    data: {
      ...args.data,
      [companyIdField]: scopedCompanyId,
    },
  };
}

/**
 * Validates and enforces company scope on updateOne/deleteOne operations.
 * Injects an `and` compound filter that constrains the operation to the scoped company.
 * For updateOne { id, data }, converts to filter-based scoping.
 */
export function enforceCompanyScopeOnMutation(
  authContext: AuthContext,
  args: { id?: string; filter?: Record<string, unknown> },
  filterField: string,
): { id?: string; filter?: Record<string, unknown> } {
  const scopedCompanyId = getScopedCompanyId(authContext);

  if (!scopedCompanyId) {
    return args;
  }

  // For filter-based operations (deleteMany, updateMany)
  if (args.filter) {
    return {
      ...args,
      filter: buildScopedFilter(filterField, scopedCompanyId, args.filter),
    };
  }

  return args;
}
