import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class AddUserCompanyMembership1700000000000 implements MigrationInterface {
  name = 'AddUserCompanyMembership1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'userCompanyMembership',
        schema: 'core',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'companyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'workspaceId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'text',
            default: "'COMPANY_READONLY'",
          },
          {
            name: 'status',
            type: 'text',
            default: "'ACTIVE'",
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'core.user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['workspaceId'],
            referencedTableName: 'core.workspace',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'core.userCompanyMembership',
      new TableUnique({
        name: 'UQ_user_company',
        columnNames: ['userId', 'companyId', 'workspaceId'],
      }),
    );

    await queryRunner.createIndex(
      'core.userCompanyMembership',
      new TableIndex({
        name: 'IDX_membership_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'core.userCompanyMembership',
      new TableIndex({
        name: 'IDX_membership_companyId',
        columnNames: ['companyId'],
      }),
    );

    await queryRunner.createIndex(
      'core.userCompanyMembership',
      new TableIndex({
        name: 'IDX_membership_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'core.userCompanyMembership',
      'IDX_membership_status',
    );
    await queryRunner.dropIndex(
      'core.userCompanyMembership',
      'IDX_membership_companyId',
    );
    await queryRunner.dropIndex(
      'core.userCompanyMembership',
      'IDX_membership_userId',
    );
    await queryRunner.dropTable('core.userCompanyMembership', true);
  }
}
