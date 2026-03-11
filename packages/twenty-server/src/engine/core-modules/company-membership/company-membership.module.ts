import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { MembershipManagementController } from 'src/engine/core-modules/company-membership/controllers/membership-management.controller';
import { MigrationSupportController } from 'src/engine/core-modules/company-membership/controllers/migration-support.controller';
import { CompanyMembershipService } from 'src/engine/core-modules/company-membership/services/company-membership.service';
import { CompanyScopeResolver } from 'src/engine/core-modules/company-membership/services/company-scope-resolver.service';
import { MigrationSupportService } from 'src/engine/core-modules/company-membership/services/migration-support.service';
import { UserCompanyMembershipEntity } from 'src/engine/core-modules/company-membership/user-company-membership.entity';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCompanyMembershipEntity]),
    TokenModule,
    WorkspaceCacheStorageModule,
  ],
  controllers: [MembershipManagementController, MigrationSupportController],
  providers: [CompanyMembershipService, CompanyScopeResolver, MigrationSupportService],
  exports: [CompanyMembershipService, CompanyScopeResolver, MigrationSupportService],
})
export class CompanyMembershipModule {}
