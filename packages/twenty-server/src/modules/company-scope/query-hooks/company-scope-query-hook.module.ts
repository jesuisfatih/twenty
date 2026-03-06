import { Module } from '@nestjs/common';

import { CompanyFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/company-find-many.pre-query.hook';
import { CompanyFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/company-find-one.pre-query.hook';
import { CompanyGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/company-group-by.pre-query.hook';
import { OpportunityFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-find-many.pre-query.hook';
import { OpportunityFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-find-one.pre-query.hook';
import { OpportunityGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-group-by.pre-query.hook';
import { PersonFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/person-find-many.pre-query.hook';
import { PersonFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/person-find-one.pre-query.hook';
import { PersonGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/person-group-by.pre-query.hook';

@Module({
  providers: [
    // Company scoping hooks — filter data by scopedCompanyId on WorkspaceMember
    CompanyFindManyPreQueryHook,
    CompanyFindOnePreQueryHook,
    CompanyGroupByPreQueryHook,
    PersonFindManyPreQueryHook,
    PersonFindOnePreQueryHook,
    PersonGroupByPreQueryHook,
    OpportunityFindManyPreQueryHook,
    OpportunityFindOnePreQueryHook,
    OpportunityGroupByPreQueryHook,
  ],
})
export class CompanyScopeQueryHookModule {}
