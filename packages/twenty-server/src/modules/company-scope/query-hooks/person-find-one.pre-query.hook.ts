import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type ResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { injectCompanyScopeIntoFindOne } from 'src/modules/company-scope/query-hooks/utils/inject-company-scope-filter.util';

@WorkspaceQueryHook(`person.findOne`)
export class PersonFindOnePreQueryHook
  implements WorkspacePreQueryHookInstance
{
  async execute(
    authContext: AuthContext,
    _objectName: string,
    payload: ResolverArgs,
  ): Promise<ResolverArgs> {
    return injectCompanyScopeIntoFindOne(
      authContext,
      payload as { filter?: Record<string, unknown> },
      'companyId', // person.companyId = scopedCompanyId
    ) as ResolverArgs;
  }
}
