import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MembershipManagementController } from 'src/engine/core-modules/company-membership/controllers/membership-management.controller';
import { MigrationSupportController } from 'src/engine/core-modules/company-membership/controllers/migration-support.controller';
import { CompanyMembershipService } from 'src/engine/core-modules/company-membership/services/company-membership.service';
import { CompanyScopeResolver } from 'src/engine/core-modules/company-membership/services/company-scope-resolver.service';
import { MigrationSupportService } from 'src/engine/core-modules/company-membership/services/migration-support.service';
import { UserCompanyMembershipEntity } from 'src/engine/core-modules/company-membership/user-company-membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompanyMembershipEntity])],
  controllers: [MembershipManagementController, MigrationSupportController],
  providers: [CompanyMembershipService, CompanyScopeResolver, MigrationSupportService],
  exports: [CompanyMembershipService, CompanyScopeResolver, MigrationSupportService],
})
export class CompanyMembershipModule {}
