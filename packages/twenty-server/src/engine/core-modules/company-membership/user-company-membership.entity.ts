import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  CompanyRole,
  MembershipStatus,
} from 'src/engine/core-modules/company-membership/enums/company-role.enum';

@Entity({ name: 'userCompanyMembership', schema: 'core' })
@Unique('UQ_user_company', ['userId', 'companyId', 'workspaceId'])
@Index('IDX_membership_userId', ['userId'])
@Index('IDX_membership_companyId', ['companyId'])
@Index('IDX_membership_status', ['status'])
export class UserCompanyMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Relation<WorkspaceEntity>;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({
    type: 'text',
    default: CompanyRole.COMPANY_READONLY,
  })
  role: CompanyRole;

  @Column({
    type: 'text',
    default: MembershipStatus.ACTIVE,
  })
  status: MembershipStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
