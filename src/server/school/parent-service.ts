import "server-only";
import { AuthorizationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { authorize } from "@/server/authorization/permissions";
import { logAuditEvent } from "@/server/security/audit-logger";
import {
  buildHouseholdClusters,
  computeParentAnalytics,
  filterAndSortGuardians,
} from "@/modules/parents/analytics";
import type {
  GuardianCommunicationRecord,
  GuardianDossierPayload,
  GuardianRecord,
  HouseholdCluster,
  ParentDashboardAnalytics,
  ParentFilterParams,
  ParentWorkspaceSnapshot,
} from "@/modules/parents/types";
import type {
  CreateGuardianInput,
  MergeGuardiansInput,
  PortalInviteInput,
  SendGuardianCommunicationInput,
  UpdateGuardianInput,
  WardLinkInput,
} from "@/modules/parents/schemas";
import { parentRepository } from "./parent-repository";

export interface ParentActorContext {
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

function isSelfPortalRole(role: string): boolean {
  return role === "PARENT" || role === "GUARDIAN";
}

function scopeGuardiansForActor(
  actor: ParentActorContext,
  guardians: GuardianRecord[],
): GuardianRecord[] {
  if (!isSelfPortalRole(actor.role)) {
    return guardians;
  }
  return guardians.filter((g) => g.userId === actor.userId);
}

export const parentService = {
  async getDashboardData(
    actor: ParentActorContext,
    filters?: ParentFilterParams,
  ): Promise<{
    snapshot: ParentWorkspaceSnapshot;
    analytics: ParentDashboardAnalytics;
    filteredGuardians: GuardianRecord[];
    households: HouseholdCluster[];
  }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:read",
    );
    const asPlatformAdmin = isPlatformRole(actor.role);
    const rawSnapshot = await parentRepository.getSnapshot(actor.schoolId, { asPlatformAdmin });
    const scopedGuardians = scopeGuardiansForActor(actor, rawSnapshot.guardians);
    const snapshot: ParentWorkspaceSnapshot = isSelfPortalRole(actor.role)
      ? {
          ...rawSnapshot,
          guardians: scopedGuardians,
          communications: rawSnapshot.communications.filter((c) =>
            scopedGuardians.some((g) => g.id === c.guardianId),
          ),
        }
      : rawSnapshot;

    const analytics = computeParentAnalytics(snapshot.guardians, snapshot.grades);
    const filteredGuardians = filterAndSortGuardians(snapshot.guardians, filters);
    const households = isSelfPortalRole(actor.role)
      ? []
      : buildHouseholdClusters(snapshot.guardians, snapshot.students);

    logger.info(
      {
        schoolId: actor.schoolId,
        actorId: actor.userId,
        totalGuardians: snapshot.guardians.length,
      },
      "Parents & Guardians workspace loaded",
    );

    return { snapshot, analytics, filteredGuardians, households };
  },

  async getGuardianDossier(
    actor: ParentActorContext,
    guardianId: string,
  ): Promise<GuardianDossierPayload> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:read",
    );
    const dossier = await parentRepository.getGuardianDossier(actor.schoolId, guardianId, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });

    if (isSelfPortalRole(actor.role) && dossier.guardian.userId !== actor.userId) {
      throw new AuthorizationError("You can only access your own guardian profile.");
    }

    return dossier;
  },

  async createGuardian(
    actor: ParentActorContext,
    input: CreateGuardianInput,
  ): Promise<GuardianRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:write",
    );
    const guardian = await parentRepository.createGuardian(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "GUARDIAN_CREATED",
      entityType: "guardians",
      entityId: guardian.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: {
        fullName: guardian.fullName,
        wardsCount: guardian.wards.length,
      },
    });

    return guardian;
  },

  async updateGuardian(
    actor: ParentActorContext,
    guardianId: string,
    input: UpdateGuardianInput,
  ): Promise<GuardianRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:write",
    );
    const guardian = await parentRepository.updateGuardian(
      actor.schoolId,
      guardianId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: input.status === "ARCHIVED" ? "GUARDIAN_ARCHIVED" : "GUARDIAN_UPDATED",
      entityType: "guardians",
      entityId: guardian.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: { status: guardian.status, portalStatus: guardian.portalStatus },
    });

    return guardian;
  },

  async linkOrUpdateWard(
    actor: ParentActorContext,
    guardianId: string,
    input: WardLinkInput,
  ): Promise<GuardianRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:link",
    );
    const guardian = await parentRepository.linkOrUpdateWard(
      actor.schoolId,
      guardianId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: input.restrictedContact ? "GUARDIAN_CUSTODY_UPDATED" : "GUARDIAN_WARD_LINKED",
      entityType: "student_guardian_links",
      entityId: `${guardianId}:${input.studentId}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: {
        relation: input.relation,
        isPrimary: input.isPrimary,
        canPickup: input.canPickup,
        restrictedContact: input.restrictedContact,
      },
    });

    return guardian;
  },

  async unlinkWard(
    actor: ParentActorContext,
    guardianId: string,
    studentId: string,
  ): Promise<GuardianRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:link",
    );
    const guardian = await parentRepository.unlinkWard(actor.schoolId, guardianId, studentId, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "GUARDIAN_WARD_UNLINKED",
      entityType: "student_guardian_links",
      entityId: `${guardianId}:${studentId}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return guardian;
  },

  async mergeGuardians(
    actor: ParentActorContext,
    input: MergeGuardiansInput,
  ): Promise<{ targetGuardian: GuardianRecord; mergedCount: number }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:link",
    );
    const result = await parentRepository.mergeGuardians(actor.schoolId, input, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "GUARDIAN_MERGED",
      entityType: "guardians",
      entityId: input.targetGuardianId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: {
        mergedCount: result.mergedCount,
        sourceGuardianIds: input.sourceGuardianIds,
      },
    });

    return result;
  },

  async autoLinkHouseholds(
    actor: ParentActorContext,
    mode: "PREVIEW" | "APPLY",
  ): Promise<{ clusters: HouseholdCluster[]; linkedCount: number; mergedCount: number }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:link",
    );
    const res = await parentRepository.autoLinkHouseholds(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      mode,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    if (mode === "APPLY" && (res.linkedCount > 0 || res.mergedCount > 0)) {
      await logAuditEvent({
        schoolId: actor.schoolId,
        actorId: actor.userId,
        action: "HOUSEHOLD_AUTO_LINKED",
        entityType: "student_guardian_links",
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
        details: { linkedCount: res.linkedCount, mergedCount: res.mergedCount },
      });
    }

    return res;
  },

  async updatePortalAccess(
    actor: ParentActorContext,
    guardianIds: string[],
    action: PortalInviteInput["action"],
  ): Promise<{ updatedCount: number }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:portal",
    );
    const res = await parentRepository.updatePortalAccess(actor.schoolId, guardianIds, action, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "GUARDIAN_PORTAL_UPDATED",
      entityType: "guardians",
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: { action, updatedCount: res.updatedCount },
    });

    return res;
  },

  async sendCommunication(
    actor: ParentActorContext,
    input: SendGuardianCommunicationInput,
  ): Promise<{ sentCount: number; records: GuardianCommunicationRecord[] }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:communicate",
    );
    const res = await parentRepository.sendCommunication(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );

    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "GUARDIAN_COMMUNICATION_SENT",
      entityType: "guardian_communications",
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: { channel: input.channel, sentCount: res.sentCount },
    });

    return res;
  },

  async assertExportAuthorized(actor: ParentActorContext, exportedCount: number): Promise<void> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "parents:export",
    );
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "GUARDIAN_EXPORTED",
      entityType: "guardians",
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      details: { exportedCount },
    });
  },
};
