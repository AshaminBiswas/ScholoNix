import "server-only";
import { authorize } from "@/server/authorization/permissions";
import { logAuditEvent } from "@/server/security/audit-logger";
import { logger } from "@/lib/logger";
import type { AcademicWorkspaceSnapshot } from "@/modules/academics/types";
import type { AcademicMutationInput } from "@/modules/academics/schemas";
import { academicsRepository } from "./academics-repository";

export interface AcademicActorContext {
  userId: string;
  userName: string;
  role: string;
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  ipAddress?: string;
  userAgent?: string;
}

function isPlatformRole(role: string): boolean {
  return (
    role === "PLATFORM_SUPER_ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "OPERATIONS" ||
    role === "BILLING_MANAGER" ||
    role === "SUPPORT_AGENT"
  );
}

export const academicsService = {
  async getWorkspace(
    actor: AcademicActorContext,
    academicYear?: string,
  ): Promise<AcademicWorkspaceSnapshot> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "academics:read",
    );
    const snap = await academicsRepository.getSnapshot(actor.schoolId, {
      academicYear,
      asPlatformAdmin: isPlatformRole(actor.role),
    });
    logger.info(
      {
        schoolId: actor.schoolId,
        actorId: actor.userId,
        classes: snap.classes.length,
        academicYear: snap.activeAcademicYear,
      },
      "Academic workspace snapshot loaded",
    );
    return snap;
  },

  async mutate(
    actor: AcademicActorContext,
    input: AcademicMutationInput,
  ): Promise<AcademicWorkspaceSnapshot> {
    const requiredPerm =
      input.action === "CREATE_SESSION" || input.action === "SET_CURRENT_SESSION"
        ? "academics:settings"
        : "academics:write";

    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      requiredPerm,
    );

    const snapshot = await academicsRepository.mutate(actor.schoolId, input, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: `ACADEMIC_${input.action}`,
      entityType: "academics",
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: { action: input.action },
    });

    return snapshot;
  },
};
