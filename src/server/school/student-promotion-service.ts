import "server-only";
import { authorize, hasPermission } from "@/server/authorization/permissions";
import { logAuditEvent } from "@/server/security/audit-logger";
import { studentPromotionRepository } from "@/server/school/student-promotion-repository";
import type {
  PlatformGlobalPromotionsData,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import type {
  ExecutePromotionBatchInput,
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

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "PROMOTION_RULES_UPDATED",
      entityType: "StudentPromotionRule",
      entityId: input.academicYear,
      details: { rulesCount: input.rules?.length ?? 0 },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return res;
  },

  async getPlatformGlobalOverview(): Promise<PlatformGlobalPromotionsData> {
    return studentPromotionRepository.getPlatformGlobalOverview();
  },
};
