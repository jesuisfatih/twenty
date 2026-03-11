import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateOneResolverArgs,
  type ResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { injectCompanyScopeIntoCreateOne } from 'src/modules/company-scope/query-hooks/utils/inject-company-scope-filter.util';

/**
 * Ensures every new Person record is automatically associated
 * with the operator's scoped company. Prevents cross-company
 * person creation by non-root users.
 */
@WorkspaceQueryHook(`person.createOne`)
export class PersonCreateOnePreQueryHook
  implements WorkspacePreQueryHookInstance
{
  async execute(
    authContext: AuthContext,
    _objectName: string,
    payload: ResolverArgs,
  ): Promise<ResolverArgs> {
    return injectCompanyScopeIntoCreateOne(
      authContext,
      payload as CreateOneResolverArgs<Record<string, unknown>>,
      'companyId',
    ) as unknown as ResolverArgs;
  }
}
