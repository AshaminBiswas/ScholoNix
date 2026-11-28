import "server-only";
import { authorize, hasPermission, type Permission } from "@/server/authorization/permissions";
import { logAuditEvent } from "@/server/security/audit-logger";
import { logger } from "@/lib/logger";
import { studentDossierRepository } from "@/server/school/student-dossier-repository";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import type { StudentDossierActionInput } from "@/modules/students/dossier-schemas";

export interface StudentDossierActor {
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

function permissionForAction(action: StudentDossierActionInput["action"]): Permission {
  switch (action) {
    case "MARK_ATTENDANCE":
      return "attendance:write";
    case "UPSERT_ACADEMIC_MARK":
      return "exams:write";
    case "RECORD_FEE_PAYMENT":
      return "fees:write";
    default:
      return "students:write";
  }
}

export const studentDossierService = {
  async getDossier(
    actor: StudentDossierActor,
    studentId: string,
  ): Promise<StudentDossier360Data> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:read",
    );

    const canRevealSensitiveId =
      isPlatformRole(actor.role) ||
      actor.role === "PRINCIPAL" ||
      actor.role === "SCHOOL_ADMIN";

    const data = await studentDossierRepository.getDossier(actor.schoolId, studentId, {
      asPlatformAdmin: isPlatformRole(actor.role),
      canRevealSensitiveId,
    });

    logger.info(
      { schoolId: actor.schoolId, studentId, actorId: actor.userId },
      "Student profile 360 dossier fetched",
    );
    return data;
  },

  async executeAction(
    actor: StudentDossierActor,
    studentId: string,
    input: StudentDossierActionInput,
  ): Promise<StudentDossier360Data> {
    const requiredPermission = permissionForAction(input.action);
    const permCtx = { id: actor.userId, role: actor.role, schoolId: actor.schoolId };

    if (!isPlatformRole(actor.role) && !hasPermission(permCtx, requiredPermission)) {
      authorize(permCtx, requiredPermission);
    }

    await studentDossierRepository.applyAction(
      actor.schoolId,
      studentId,
      {
        userId: actor.userId,
        userName: actor.userName,
        asPlatformAdmin: isPlatformRole(actor.role),
      },
      input,
    );

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: `STUDENT_DOSSIER_${input.action}`,
      entityType: "Student",
      entityId: studentId,
      details: { action: input.action },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return this.getDossier(actor, studentId);
  },
};
