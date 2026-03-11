import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { MigrationSupportService } from 'src/engine/core-modules/company-membership/services/migration-support.service';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';

/**
 * MigrationSupportController — Twenty-side admin endpoints for migration
 *
 * All endpoints require root admin access.
 *
 * Route prefix: /api/company-membership/migration
 *
 * Endpoints:
 *   GET  /api/company-membership/migration/audit          — Full audit report
 *   GET  /api/company-membership/migration/counts         — Membership counts
 *   GET  /api/company-membership/migration/headless       — Companies without owners
 *   GET  /api/company-membership/migration/validate/:id   — Validate a company
 *   POST /api/company-membership/migration/rollback/:id   — Rollback a company
 *   POST /api/company-membership/migration/rollback-after — Rollback after timestamp
 *   POST /api/company-membership/migration/restore/:id    — Restore a rolled-back company
 */
@Controller('api/company-membership/migration')
@UseGuards(JwtAuthGuard)
@UseFilters(AuthRestApiExceptionFilter)
export class MigrationSupportController {
  private readonly logger = new Logger(MigrationSupportController.name);

  constructor(
    private readonly migrationSupportService: MigrationSupportService,
  ) {}

  // ── Audit ───────────────────────────────────────

  /**
   * GET /api/company-membership/migration/audit
   * Full membership audit report. Root admin only.
   */
  @Get('audit')
  async getAuditReport(@Req() req: Request) {
    const { workspaceId } = this.extractRootAdminContext(req);

    const report =
      await this.migrationSupportService.generateAuditReport(workspaceId);

    return { success: true, data: report };
  }

  /**
   * GET /api/company-membership/migration/counts
   * Membership count summary. Root admin only.
   */
  @Get('counts')
  async getMembershipCounts(@Req() req: Request) {
    const { workspaceId } = this.extractRootAdminContext(req);

    const counts =
      await this.migrationSupportService.getMembershipCounts(workspaceId);

    return { success: true, data: counts };
  }

  /**
   * GET /api/company-membership/migration/headless
   * List companies with no active COMPANY_OWNER. Root admin only.
   */
  @Get('headless')
  async getHeadlessCompanies(@Req() req: Request) {
    const { workspaceId } = this.extractRootAdminContext(req);

    const companyIds =
      await this.migrationSupportService.findHeadlessCompanies(workspaceId);

    return {
      success: true,
      data: { count: companyIds.length, companyIds },
    };
  }

  // ── Validation ──────────────────────────────────

  /**
   * GET /api/company-membership/migration/validate/:companyId
   * Validate a company's membership health. Root admin only.
   */
  @Get('validate/:companyId')
  async validateCompany(
    @Param('companyId') companyId: string,
    @Req() req: Request,
  ) {
    const { workspaceId } = this.extractRootAdminContext(req);

    const result = await this.migrationSupportService.validateCompany(
      companyId,
      workspaceId,
    );

    return { success: true, data: result };
  }

  // ── Rollback ────────────────────────────────────

  /**
   * POST /api/company-membership/migration/rollback/:companyId
   * Suspend all active memberships for a company (reversible).
   * Root admin only.
   */
  @Post('rollback/:companyId')
  async rollbackCompany(
    @Param('companyId') companyId: string,
    @Req() req: Request,
  ) {
    const { workspaceId } = this.extractRootAdminContext(req);

    this.logger.warn(
      `Rollback requested for company ${companyId} by root admin`,
    );

    const result = await this.migrationSupportService.rollbackCompany(
      companyId,
      workspaceId,
    );

    return { success: true, data: result };
  }

  /**
   * POST /api/company-membership/migration/rollback-after
   * Suspend all memberships created after a timestamp (batch rollback).
   * Root admin only.
   * Body: { after: "2026-03-01T00:00:00.000Z" }
   */
  @Post('rollback-after')
  async rollbackAfterTimestamp(
    @Body() body: { after: string },
    @Req() req: Request,
  ) {
    const { workspaceId } = this.extractRootAdminContext(req);

    if (!body.after) {
      throw new AuthException(
        'Timestamp "after" is required',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    const afterDate = new Date(body.after);

    if (isNaN(afterDate.getTime())) {
      throw new AuthException(
        'Invalid timestamp format',
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    this.logger.warn(
      `Batch rollback requested: memberships after ${body.after} by root admin`,
    );

    const result =
      await this.migrationSupportService.rollbackAfterTimestamp(
        workspaceId,
        afterDate,
      );

    return { success: true, data: result };
  }

  /**
   * POST /api/company-membership/migration/restore/:companyId
   * Re-activate previously suspended memberships for a company.
   * Root admin only.
   */
  @Post('restore/:companyId')
  async restoreCompany(
    @Param('companyId') companyId: string,
    @Req() req: Request,
  ) {
    const { workspaceId } = this.extractRootAdminContext(req);

    this.logger.log(
      `Restore requested for company ${companyId} by root admin`,
    );

    const result = await this.migrationSupportService.restoreCompany(
      companyId,
      workspaceId,
    );

    return { success: true, data: result };
  }

  // ── Private helpers ──

  /**
   * Extract context and assert root admin access.
   * Migration endpoints are root admin only — no exceptions.
   */
  private extractRootAdminContext(req: Request): {
    userId: string;
    workspaceId: string;
  } {
    const anyReq = req as any;
    const userId = anyReq.user?.id;
    const workspaceId = anyReq.workspace?.id;
    const isRootAdmin = anyReq.isRootAdmin === true;

    if (!userId || !workspaceId) {
      throw new AuthException(
        'Authenticated user and workspace context required',
        AuthExceptionCode.UNAUTHENTICATED,
      );
    }

    if (!isRootAdmin) {
      throw new AuthException(
        'Migration endpoints require root admin access',
        AuthExceptionCode.FORBIDDEN_EXCEPTION,
      );
    }

    return { userId, workspaceId };
  }
}
