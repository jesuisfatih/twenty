import { Module } from '@nestjs/common';

import { CompanyFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/company-find-many.pre-query.hook';
import { CompanyFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/company-find-one.pre-query.hook';
import { CompanyGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/company-group-by.pre-query.hook';
import { NoteTargetFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/note-target-find-many.pre-query.hook';
import { NoteTargetFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/note-target-find-one.pre-query.hook';
import { NoteTargetGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/note-target-group-by.pre-query.hook';
import { OpportunityCreateOnePreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-create-one.pre-query.hook';
import { OpportunityDeleteManyPreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-delete-many.pre-query.hook';
import { OpportunityFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-find-many.pre-query.hook';
import { OpportunityFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-find-one.pre-query.hook';
import { OpportunityGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-group-by.pre-query.hook';
import { OpportunityUpdateManyPreQueryHook } from 'src/modules/company-scope/query-hooks/opportunity-update-many.pre-query.hook';
import { PersonCreateOnePreQueryHook } from 'src/modules/company-scope/query-hooks/person-create-one.pre-query.hook';
import { PersonDeleteManyPreQueryHook } from 'src/modules/company-scope/query-hooks/person-delete-many.pre-query.hook';
import { PersonFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/person-find-many.pre-query.hook';
import { PersonFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/person-find-one.pre-query.hook';
import { PersonGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/person-group-by.pre-query.hook';
import { PersonUpdateManyPreQueryHook } from 'src/modules/company-scope/query-hooks/person-update-many.pre-query.hook';
import { TaskTargetFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/task-target-find-many.pre-query.hook';
import { TaskTargetFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/task-target-find-one.pre-query.hook';
import { TaskTargetGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/task-target-group-by.pre-query.hook';
import { TimelineActivityFindManyPreQueryHook } from 'src/modules/company-scope/query-hooks/timeline-activity-find-many.pre-query.hook';
import { TimelineActivityFindOnePreQueryHook } from 'src/modules/company-scope/query-hooks/timeline-activity-find-one.pre-query.hook';
import { TimelineActivityGroupByPreQueryHook } from 'src/modules/company-scope/query-hooks/timeline-activity-group-by.pre-query.hook';

@Module({
  providers: [
    // ── Read hooks: Company ──
    CompanyFindManyPreQueryHook,
    CompanyFindOnePreQueryHook,
    CompanyGroupByPreQueryHook,

    // ── Read hooks: Person ──
    PersonFindManyPreQueryHook,
    PersonFindOnePreQueryHook,
    PersonGroupByPreQueryHook,

    // ── Read hooks: Opportunity ──
    OpportunityFindManyPreQueryHook,
    OpportunityFindOnePreQueryHook,
    OpportunityGroupByPreQueryHook,

    // ── Read hooks: TaskTarget ──
    TaskTargetFindManyPreQueryHook,
    TaskTargetFindOnePreQueryHook,
    TaskTargetGroupByPreQueryHook,

    // ── Read hooks: NoteTarget ──
    NoteTargetFindManyPreQueryHook,
    NoteTargetFindOnePreQueryHook,
    NoteTargetGroupByPreQueryHook,

    // ── Read hooks: TimelineActivity ──
    TimelineActivityFindManyPreQueryHook,
    TimelineActivityFindOnePreQueryHook,
    TimelineActivityGroupByPreQueryHook,

    // ── Mutation hooks: Create ──
    PersonCreateOnePreQueryHook,
    OpportunityCreateOnePreQueryHook,

    // ── Mutation hooks: Bulk update / delete ──
    PersonUpdateManyPreQueryHook,
    PersonDeleteManyPreQueryHook,
    OpportunityUpdateManyPreQueryHook,
    OpportunityDeleteManyPreQueryHook,
  ],
})
export class CompanyScopeQueryHookModule {}
