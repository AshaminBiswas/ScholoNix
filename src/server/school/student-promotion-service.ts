import "server-only";
import { authorize, hasPermission } from "@/server/authorization/permissions";
import { logAuditEvent } from "@/server/security/audit-logger";
import { studentPromotionRepository } from "@/server/school/student-promotion-repository";
import type {
  PlatformGlobalPromotionsData,
  PromotionAuditLogsResponse,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import type {
  ExecutePromotionBatchInput,
  RunPromotionAutomationInput,
  UpsertPromotionRulesInput,
} from "@/modules/students/promotion-schemas";

export interface PromotionActor {
  userId: string;
  userName: string;
  role: string;
  schoolId: string;
  ipAddress?: string;
  userAgent?: string;
}

function isPlatformRole(role: string): boolean {
  return role === "PLATFORM_SUPER_ADMIN" || role === "SUPER_ADMIN";
}

export const studentPromotionService = {
  async getOverview(
    actor: PromotionActor,
    filters?: {
      academicYear?: string;
      fromGrade?: string;
      toGrade?: string;
      section?: string;
      status?: string;
      search?: string;
    },
  ): Promise<StudentPromotionOverviewData> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:read",
    );
    return studentPromotionRepository.getOverview(actor.schoolId, filters, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });
  },

  async executeBatch(
    actor: PromotionActor,
    input: ExecutePromotionBatchInput,
  ) {
    if (!isPlatformRole(actor.role)) {
      authorize(
        { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
        "students:promote",
      );
    }

    const res = await studentPromotionRepository.executeBatch(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    if (!input.dryRun) {
      const summary = `Processed ${res.processedCount} students (${res.promotedCount} promoted, ${res.retainedCount} retained, ${res.alumniCount} alumni) for ${input.toGrade}.`;
      studentPromotionRepository.appendMemoryAuditLog(actor.schoolId, {
        actorId: actor.userId,
        actorName: actor.userName,
        module: "Promotion",
        action: input.decision,
        description: summary,
        ipAddress: actor.ipAddress || "127.0.0.1",
        status: "Success",
        entityType: "StudentPromotionBatch",
        entityId: res.batchId || input.toAcademicYear,
      });
      await logAuditEvent({
        schoolId: actor.schoolId,
        actorId: actor.userId,
        action: `PROMOTION_BATCH_${input.decision}`,
        entityType: "StudentPromotionBatch",
        entityId: res.batchId || input.toAcademicYear,
        details: {
          processedCount: res.processedCount,
          toAcademicYear: input.toAcademicYear,
          toGrade: input.toGrade,
          summary,
        },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return res;
  },

  async saveRulesAndSettings(
    actor: PromotionActor,
    input: UpsertPromotionRulesInput,
  ) {
    const ctx = { id: actor.userId, role: actor.role, schoolId: actor.schoolId };
    if (!isPlatformRole(actor.role) && !hasPermission(ctx, "students:settings")) {
      authorize(ctx, "students:promote");
    }

    const res = await studentPromotionRepository.saveRulesAndSettings(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    const isSettingsOnly = !input.rules || input.rules.length === 0;
    const action = isSettingsOnly ? "PROMOTION_SETTINGS_UPDATED" : "PROMOTION_RULES_UPDATED";
    const summary = isSettingsOnly
      ? `Updated promotion configuration (${Object.keys(input.settingsSuite || {}).join(", ") || "settings"}) for ${input.academicYear}.`
      : `Updated ${input.rules!.length} promotion rule(s) for ${input.academicYear}.`;

    studentPromotionRepository.appendMemoryAuditLog(actor.schoolId, {
      actorId: actor.userId,
      actorName: actor.userName,
      module: isSettingsOnly ? "Settings" : "Promotion Rules",
      action: isSettingsOnly ? "Update" : "Edit",
      description: summary,
      ipAddress: actor.ipAddress || "127.0.0.1",
      status: "Success",
      entityType: isSettingsOnly ? "StudentPromotionSettings" : "StudentPromotionRule",
      entityId: input.academicYear,
    });

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action,
      entityType: isSettingsOnly ? "StudentPromotionSettings" : "StudentPromotionRule",
      entityId: input.academicYear,
      details: { rulesCount: input.rules?.length ?? 0, summary },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return res;
  },

  async getAuditLogs(
    actor: PromotionActor,
    filters?: {
      module?: string;
      action?: string;
      user?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<PromotionAuditLogsResponse> {
    if (!isPlatformRole(actor.role)) {
      authorize(
        { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
        "students:read",
      );
    }
    return studentPromotionRepository.getAuditLogs(actor.schoolId, filters, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });
  },

  async sendTestNotification(
    actor: PromotionActor,
    payload: { templateName: string; channel: string; recipient?: string },
  ): Promise<{ sent: boolean; message: string }> {
    const ctx = { id: actor.userId, role: actor.role, schoolId: actor.schoolId };
    if (!isPlatformRole(actor.role) && !hasPermission(ctx, "students:settings")) {
      authorize(ctx, "students:promote");
    }

    const summary = `Dispatched test promotion notification (${payload.templateName}) via ${payload.channel}.`;
    studentPromotionRepository.appendMemoryAuditLog(actor.schoolId, {
      actorId: actor.userId,
      actorName: actor.userName,
      module: "Notifications",
      action: "Test",
      description: summary,
      ipAddress: actor.ipAddress || "127.0.0.1",
      status: "Success",
      entityType: "StudentPromotionSettings",
      entityId: payload.channel,
    });

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "PROMOTION_NOTIFICATION_TEST",
      entityType: "StudentPromotionSettings",
      entityId: payload.channel,
      details: { templateName: payload.templateName, summary },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return { sent: true, message: summary };
  },

  async runAutomation(
    actor: PromotionActor,
    input: RunPromotionAutomationInput,
  ) {
    if (!isPlatformRole(actor.role)) {
      authorize(
        { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
        "students:promote",
      );
    }

    const result = await studentPromotionRepository.runAutomation(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    if (!input.dryRun) {
      const summary = `Automation workflow executed for AY ${input.academicYear} → ${input.toAcademicYear}: ${result.promotedCount} promoted, ${result.alumniCount} alumni, ${result.retainedCount} retained (${result.evaluatedCount} evaluated).`;
      studentPromotionRepository.appendMemoryAuditLog(actor.schoolId, {
        actorId: actor.userId,
        actorName: actor.userName,
        module: "Automation",
        action: "Run",
        description: summary,
        ipAddress: actor.ipAddress || "127.0.0.1",
        status: "Success",
        entityType: "StudentPromotionBatch",
        entityId: input.toAcademicYear,
      });

      await logAuditEvent({
        schoolId: actor.schoolId,
        actorId: actor.userId,
        action: "PROMOTION_AUTOMATION_RUN",
        entityType: "StudentPromotionBatch",
        entityId: input.toAcademicYear,
        details: {
          evaluatedCount: result.evaluatedCount,
          promotedCount: result.promotedCount,
          retainedCount: result.retainedCount,
          alumniCount: result.alumniCount,
          summary,
        },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return result;
  },

  async getPlatformGlobalOverview(): Promise<PlatformGlobalPromotionsData> {
    return studentPromotionRepository.getPlatformGlobalOverview();
  },
};
