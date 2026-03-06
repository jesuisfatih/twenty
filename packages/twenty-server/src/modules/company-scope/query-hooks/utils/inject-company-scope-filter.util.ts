import { type AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { type FindManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

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
