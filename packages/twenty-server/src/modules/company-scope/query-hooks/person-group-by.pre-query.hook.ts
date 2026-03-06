import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type ResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import {
  getScopedCompanyId,
  buildScopedFilter,
} from 'src/modules/company-scope/query-hooks/utils/inject-company-scope-filter.util';

@WorkspaceQueryHook(`person.groupBy`)
export class PersonGroupByPreQueryHook
  implements WorkspacePreQueryHookInstance
{
  async execute(
    authContext: AuthContext,
    _objectName: string,
    payload: ResolverArgs,
  ): Promise<ResolverArgs> {
    const scopedCompanyId = getScopedCompanyId(authContext);

    if (!scopedCompanyId) {
      return payload;
    }

    const args = payload as { filter?: Record<string, unknown> };

    return {
      ...args,
      filter: buildScopedFilter('companyId', scopedCompanyId, args.filter),
    } as ResolverArgs;
  }
}
