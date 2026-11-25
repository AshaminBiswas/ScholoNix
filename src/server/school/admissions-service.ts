import "server-only";
import { authorize, hasPermission } from "@/server/authorization/permissions";
import { runWithTenantContext } from "@/server/tenant/tenant-context";
import { logAuditEvent } from "@/server/security/audit-logger";
import { tenantCache } from "@/server/integrations/redis";
import { logger } from "@/lib/logger";
import type {
  AdmissionApplicationRecord,
  AdmissionEnquiryRecord,
  AdmissionReminderRecord,
  AdmissionSettingRecord,
  AdmissionsOverviewData,
  AdmissionsOverviewFilters,
} from "@/modules/school/admissions/types";
import type {
  CreateApplicationInput,
  CreateEnquiryInput,
  CreateReminderInput,
  UpdateAdmissionsSettingsInput,
  UpdateApplicationInput,
  UpdateEnquiryInput,
} from "@/modules/school/admissions/schemas";
import {
  buildAdmissionsCsv,
  computeAdmissionsOverviewAnalytics,
} from "./admissions-analytics";
import { admissionsRepository } from "./admissions-repository";

export interface AdmissionsActorContext {
  userId: string;
  userName: string;
  role: string;
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  ipAddress?: string;
  userAgent?: string;
}

const DEFAULT_FILTERS: AdmissionsOverviewFilters = {
  academicYear: "all",
  grade: "all",
  status: "all",
  verificationStatus: "all",
  datePreset: "all",
  from: "",
  to: "",
  granularity: "month",
  search: "",
  page: 1,
  pageSize: 10,
};

async function invalidateTenantCaches(schoolId: string, actorId: string): Promise<void> {
  await Promise.all([
    tenantCache.del(schoolId, `dashboard:v1:${actorId}`),
    tenantCache.del(schoolId, `admissions:ver`),
  ]);
}

function runScoped<T>(
  ctx: AdmissionsActorContext,
  fn: () => Promise<T>,
): Promise<T> {
  return runWithTenantContext(
    { schoolId: ctx.schoolId, slug: ctx.schoolSlug, name: ctx.schoolName },
    fn,
  ) as Promise<T>;
}

export const admissionsService = {
  async getOverview(
    ctx: AdmissionsActorContext,
    partialFilters?: Partial<AdmissionsOverviewFilters>,
  ): Promise<AdmissionsOverviewData> {
    const startedAt = Date.now();
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:read");

    return runScoped(ctx, async () => {
      const snapshot = await admissionsRepository.getTenantSnapshot(ctx.schoolId);
      const filters: AdmissionsOverviewFilters = {
        ...DEFAULT_FILTERS,
        academicYear: partialFilters?.academicYear ?? snapshot.settings.currentAcademicYear,
        ...partialFilters,
      };

      const overview = computeAdmissionsOverviewAnalytics({
        schoolId: ctx.schoolId,
        filters,
        allApplications: snapshot.applications,
        allEnquiries: snapshot.enquiries,
        customReminders: snapshot.reminders,
        activities: snapshot.activities,
        settings: snapshot.settings,
        permissions: {
          canWrite: hasPermission(
            { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId },
            "admissions:write",
          ),
          canVerify: hasPermission(
            { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId },
            "admissions:verify",
          ),
          canExport: hasPermission(
            { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId },
            "admissions:export",
          ),
          canManageSettings: hasPermission(
            { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId },
            "admissions:settings",
          ),
        },
      });

      logger.info(
        {
          event: "ADMISSIONS_OVERVIEW_LOADED",
          schoolId: ctx.schoolId,
          actorId: ctx.userId,
          totalApplications: overview.kpis.totalApplications.value,
          durationMs: Date.now() - startedAt,
        },
        "[AdmissionsService] Loaded overview",
      );

      return overview;
    });
  },

  async createApplication(
    ctx: AdmissionsActorContext,
    input: CreateApplicationInput,
  ): Promise<AdmissionApplicationRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");

    return runScoped(ctx, async () => {
      const created = await admissionsRepository.createApplication(
        ctx.schoolId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_APPLICATION_CREATED",
        entityType: "AdmissionApplication",
        entityId: created.id,
        details: {
          applicationCode: created.applicationCode,
          gradeApplied: created.gradeApplied,
          academicYear: created.academicYear,
          enquiryId: created.enquiryId,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return created;
    });
  },

  async getApplication(
    ctx: AdmissionsActorContext,
    applicationId: string,
  ): Promise<AdmissionApplicationRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:read");
    return runScoped(ctx, () => admissionsRepository.getApplicationById(ctx.schoolId, applicationId));
  },

  async updateApplication(
    ctx: AdmissionsActorContext,
    applicationId: string,
    input: UpdateApplicationInput,
  ): Promise<AdmissionApplicationRecord> {
    const authUser = { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId };
    if (
      input.verificationStatus !== undefined ||
      input.documentsChecklist !== undefined ||
      input.verificationNotes !== undefined
    ) {
      authorize(authUser, "admissions:verify");
    } else {
      authorize(authUser, "admissions:write");
    }

    return runScoped(ctx, async () => {
      const { before, after } = await admissionsRepository.updateApplication(
        ctx.schoolId,
        applicationId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_APPLICATION_UPDATED",
        entityType: "AdmissionApplication",
        entityId: after.id,
        details: {
          applicationCode: after.applicationCode,
          admissionNumber: after.admissionNumber,
          previousStatus: before.status,
          nextStatus: after.status,
          previousVerification: before.verificationStatus,
          nextVerification: after.verificationStatus,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return after;
    });
  },

  async createEnquiry(
    ctx: AdmissionsActorContext,
    input: CreateEnquiryInput,
  ): Promise<AdmissionEnquiryRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");

    return runScoped(ctx, async () => {
      const created = await admissionsRepository.createEnquiry(
        ctx.schoolId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_ENQUIRY_CREATED",
        entityType: "AdmissionEnquiry",
        entityId: created.id,
        details: {
          enquiryCode: created.enquiryCode,
          gradeApplied: created.gradeApplied,
          academicYear: created.academicYear,
          source: created.source,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return created;
    });
  },

  async updateOrConvertEnquiry(
    ctx: AdmissionsActorContext,
    enquiryId: string,
    input: UpdateEnquiryInput,
  ): Promise<{ enquiry: AdmissionEnquiryRecord; createdApplication?: AdmissionApplicationRecord }> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");

    return runScoped(ctx, async () => {
      const result = await admissionsRepository.updateOrConvertEnquiry(
        ctx.schoolId,
        enquiryId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action:
          input.action === "convert"
            ? "ADMISSION_ENQUIRY_CONVERTED"
            : "ADMISSION_ENQUIRY_UPDATED",
        entityType: "AdmissionEnquiry",
        entityId: result.enquiry.id,
        details: {
          enquiryCode: result.enquiry.enquiryCode,
          status: result.enquiry.status,
          convertedApplicationId: result.createdApplication?.id ?? null,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return result;
    });
  },

  async updateSettings(
    ctx: AdmissionsActorContext,
    input: UpdateAdmissionsSettingsInput,
  ): Promise<AdmissionSettingRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:settings");

    return runScoped(ctx, async () => {
      const updated = await admissionsRepository.updateSettings(
        ctx.schoolId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_SETTINGS_UPDATED",
        entityType: "AdmissionSetting",
        entityId: ctx.schoolId,
        details: {
          currentAcademicYear: updated.currentAcademicYear,
          applicationDeadline: updated.applicationDeadline,
          applicationPrefix: updated.applicationPrefix,
          gradesCount: updated.enabledGrades.length,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return updated;
    });
  },

  async createReminder(
    ctx: AdmissionsActorContext,
    input: CreateReminderInput,
  ): Promise<AdmissionReminderRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");

    return runScoped(ctx, async () => {
      const reminder = await admissionsRepository.createReminder(
        ctx.schoolId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );
      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      return reminder;
    });
  },

  async toggleReminder(
    ctx: AdmissionsActorContext,
    reminderId: string,
    isCompleted: boolean,
  ): Promise<AdmissionReminderRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");
    return runScoped(ctx, () =>
      admissionsRepository.toggleReminder(ctx.schoolId, reminderId, isCompleted),
    );
  },

  async deleteReminder(ctx: AdmissionsActorContext, reminderId: string): Promise<void> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");
    return runScoped(ctx, () => admissionsRepository.deleteReminder(ctx.schoolId, reminderId));
  },

  async exportApplicationsCsv(
    ctx: AdmissionsActorContext,
    partialFilters?: Partial<AdmissionsOverviewFilters>,
  ): Promise<{ csv: string; filename: string; count: number }> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:export");

    return runScoped(ctx, async () => {
      const snapshot = await admissionsRepository.getTenantSnapshot(ctx.schoolId);
      const filters: AdmissionsOverviewFilters = {
        ...DEFAULT_FILTERS,
        academicYear: partialFilters?.academicYear ?? snapshot.settings.currentAcademicYear,
        ...partialFilters,
        page: 1,
        pageSize: 5000,
      };

      const overview = computeAdmissionsOverviewAnalytics({
        schoolId: ctx.schoolId,
        filters: { ...filters, pageSize: 5000 },
        allApplications: snapshot.applications,
        allEnquiries: snapshot.enquiries,
        customReminders: snapshot.reminders,
        activities: snapshot.activities,
        settings: snapshot.settings,
        permissions: {
          canWrite: false,
          canVerify: false,
          canExport: true,
          canManageSettings: false,
        },
      });

      const csv = buildAdmissionsCsv(overview.applications);
      const safeSlug = ctx.schoolSlug.replace(/[^a-z0-9-_]/gi, "-");
      const filename = `admissions-${safeSlug}-${new Date().toISOString().slice(0, 10)}.csv`;

      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSIONS_REPORT_EXPORTED",
        entityType: "AdmissionReport",
        entityId: filename,
        details: {
          exportedCount: overview.applications.length,
          academicYear: filters.academicYear,
          grade: filters.grade,
          status: filters.status,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { csv, filename, count: overview.applications.length };
    });
  },
};
