import "server-only";
import { createHash } from "crypto";
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
  BulkImportApplicationsInput,
  BulkUpdateApplicationsInput,
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
import { admissionsPdfService, type PdfSchoolProfile } from "./admissions-pdf-generator";
import { authRepository } from "@/server/auth/auth-repository";

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

const ADMISSIONS_VERSION_CACHE_KEY = "admissions:ver";
const ADMISSIONS_VERSION_TTL_SECONDS = 86_400;
const ADMISSIONS_OVERVIEW_CACHE_TTL_SECONDS = 60;

type CachedAdmissionsOverviewPayload = Omit<AdmissionsOverviewData, "permissions">;

function resolveAdmissionsPermissions(
  ctx: AdmissionsActorContext,
): AdmissionsOverviewData["permissions"] {
  const authUser = { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId };
  return {
    canWrite: hasPermission(authUser, "admissions:write"),
    canVerify: hasPermission(authUser, "admissions:verify"),
    canExport: hasPermission(authUser, "admissions:export"),
    canManageSettings: hasPermission(authUser, "admissions:settings"),
  };
}

function buildOverviewQueryCacheKey(
  version: string,
  partialFilters?: Partial<AdmissionsOverviewFilters>,
): string {
  const canonicalFilters = {
    ...DEFAULT_FILTERS,
    ...partialFilters,
    academicYear: partialFilters?.academicYear ?? "__default__",
  };
  const hash = createHash("sha256")
    .update(JSON.stringify(canonicalFilters))
    .digest("hex")
    .slice(0, 24);
  return `admissions:overview:v1:${version}:${hash}`;
}

function isValidCachedOverview(
  cached: unknown,
  expectedSchoolId: string,
): cached is CachedAdmissionsOverviewPayload {
  if (!cached || typeof cached !== "object") return false;
  const o = cached as Partial<CachedAdmissionsOverviewPayload>;
  return Boolean(
    o.schoolId === expectedSchoolId &&
      o.filters &&
      o.kpis &&
      o.funnel &&
      o.settings &&
      Array.isArray(o.applications) &&
      Array.isArray(o.enquiries) &&
      Array.isArray(o.admittedStudents) &&
      Array.isArray(o.reminders) &&
      Array.isArray(o.activities),
  );
}

async function getTenantCacheVersion(schoolId: string): Promise<string> {
  const version = await tenantCache.get<string>(schoolId, ADMISSIONS_VERSION_CACHE_KEY);
  return typeof version === "string" && version.trim().length > 0 ? version : "v1";
}

async function rotateTenantCacheVersion(schoolId: string): Promise<void> {
  const nextVersion = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tenantCache.set(
    schoolId,
    ADMISSIONS_VERSION_CACHE_KEY,
    nextVersion,
    ADMISSIONS_VERSION_TTL_SECONDS,
  );
}

async function invalidateTenantCaches(schoolId: string, actorId: string): Promise<void> {
  await Promise.all([
    tenantCache.del(schoolId, `dashboard:v1:${actorId}`),
    admissionsRepository.invalidateTenantSnapshotCache(schoolId),
    rotateTenantCacheVersion(schoolId),
  ]);
}

function buildPdfDownloadUrl(applicationId: string, schoolSlug: string): string {
  return `/api/school/admissions/applications/${encodeURIComponent(applicationId)}/pdf?schoolSlug=${encodeURIComponent(schoolSlug)}`;
}

async function resolvePdfSchoolProfile(ctx: AdmissionsActorContext): Promise<PdfSchoolProfile> {
  const school = await authRepository.findSchoolById(ctx.schoolId).catch(() => null);
  return {
    id: ctx.schoolId,
    name: school?.name || ctx.schoolName,
    slug: school?.slug || ctx.schoolSlug,
    uniqueId: school?.uniqueId ?? null,
    affiliationBoard: school?.affiliationBoard ?? null,
    city: school?.city ?? null,
    state: school?.state ?? null,
    contactEmail: school?.contactEmail ?? null,
    contactPhone: school?.contactPhone ?? null,
  };
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
    const permissions = resolveAdmissionsPermissions(ctx);

    return runScoped(ctx, async () => {
      // 1. Check query cache first (avoids touching DB when query result is already cached)
      const version = await getTenantCacheVersion(ctx.schoolId);
      const queryCacheKey = buildOverviewQueryCacheKey(version, partialFilters);
      const cachedQuery = await tenantCache.get<CachedAdmissionsOverviewPayload>(
        ctx.schoolId,
        queryCacheKey,
      );
      if (isValidCachedOverview(cachedQuery, ctx.schoolId)) {
        return {
          ...cachedQuery,
          permissions,
        };
      }

      // 2. Load tenant snapshot via cache-aside (Redis snapshot cache -> DB fallback -> store in cache)
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
        permissions,
      });

      // 3. Store computed query data in tenant cache before serving
      const { permissions: _omittedPerms, ...cacheablePayload } = overview;
      void _omittedPerms;
      await tenantCache.set(
        ctx.schoolId,
        queryCacheKey,
        cacheablePayload,
        ADMISSIONS_OVERVIEW_CACHE_TTL_SECONDS,
      );

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
      let generatedPdfUrl: string | null = null;
      if (!created.isDraft) {
        try {
          const schoolProfile = await resolvePdfSchoolProfile(ctx);
          await admissionsPdfService.generateAndStoreApplicationPdf({
            school: schoolProfile,
            application: created,
          });
          generatedPdfUrl = buildPdfDownloadUrl(created.id, ctx.schoolSlug);
        } catch (pdfErr) {
          logger.warn(
            {
              event: "ADMISSION_AUTO_PDF_FAILED",
              schoolId: ctx.schoolId,
              applicationId: created.id,
              error: pdfErr instanceof Error ? pdfErr.message : String(pdfErr),
            },
            "[AdmissionsService] Auto-PDF generation failed on create; on-demand PDF remains available",
          );
        }
      }

      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: created.isDraft ? "ADMISSION_DRAFT_SAVED" : "ADMISSION_APPLICATION_CREATED",
        entityType: "AdmissionApplication",
        entityId: created.id,
        details: {
          applicationCode: created.applicationCode,
          studentIdNumber: created.studentIdNumber ?? null,
          gradeApplied: created.gradeApplied,
          academicYear: created.academicYear,
          admissionType: created.admissionType ?? "FRESH",
          isDraft: Boolean(created.isDraft),
          enquiryId: created.enquiryId,
          generatedPdfReady: Boolean(generatedPdfUrl),
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return generatedPdfUrl ? { ...created, generatedPdfUrl } : created;
    });
  },

  async getApplication(
    ctx: AdmissionsActorContext,
    applicationId: string,
  ): Promise<AdmissionApplicationRecord> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:read");
    return runScoped(ctx, () => admissionsRepository.getApplicationById(ctx.schoolId, applicationId));
  },

  async getApplicationPdf(
    ctx: AdmissionsActorContext,
    applicationId: string,
  ): Promise<{ buffer: Buffer; pageCount: number; filename: string }> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:read");

    return runScoped(ctx, async () => {
      const application = await admissionsRepository.getApplicationById(ctx.schoolId, applicationId);
      const schoolProfile = await resolvePdfSchoolProfile(ctx);
      const result = await admissionsPdfService.getOrGenerateApplicationPdf({
        school: schoolProfile,
        application,
      });

      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_APPLICATION_PDF_GENERATED",
        entityType: "AdmissionApplication",
        entityId: application.id,
        details: {
          applicationCode: application.applicationCode,
          studentIdNumber: application.studentIdNumber ?? null,
          pageCount: result.pageCount,
          sizeBytes: result.buffer.length,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return result;
    });
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
      let generatedPdfUrl: string | null = null;
      if (!after.isDraft) {
        try {
          const schoolProfile = await resolvePdfSchoolProfile(ctx);
          await admissionsPdfService.generateAndStoreApplicationPdf({
            school: schoolProfile,
            application: after,
          });
          generatedPdfUrl = buildPdfDownloadUrl(after.id, ctx.schoolSlug);
        } catch (pdfErr) {
          logger.warn(
            {
              event: "ADMISSION_AUTO_PDF_FAILED",
              schoolId: ctx.schoolId,
              applicationId: after.id,
              error: pdfErr instanceof Error ? pdfErr.message : String(pdfErr),
            },
            "[AdmissionsService] Auto-PDF generation failed on update; on-demand PDF remains available",
          );
        }
      }

      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: after.isDraft ? "ADMISSION_DRAFT_SAVED" : "ADMISSION_APPLICATION_UPDATED",
        entityType: "AdmissionApplication",
        entityId: after.id,
        details: {
          applicationCode: after.applicationCode,
          studentIdNumber: after.studentIdNumber ?? null,
          admissionNumber: after.admissionNumber,
          isDraft: Boolean(after.isDraft),
          previousStatus: before.status,
          nextStatus: after.status,
          previousVerification: before.verificationStatus,
          nextVerification: after.verificationStatus,
          generatedPdfReady: Boolean(generatedPdfUrl),
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return generatedPdfUrl ? { ...after, generatedPdfUrl } : after;
    });
  },

  async importApplications(
    ctx: AdmissionsActorContext,
    input: BulkImportApplicationsInput,
  ): Promise<AdmissionApplicationRecord[]> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");

    return runScoped(ctx, async () => {
      const created = await admissionsRepository.importApplications(
        ctx.schoolId,
        { id: ctx.userId, name: ctx.userName },
        input.applications,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_APPLICATIONS_IMPORTED",
        entityType: "AdmissionApplication",
        entityId: created[0]?.id ?? ctx.schoolId,
        details: {
          importedCount: created.length,
          applicationCodes: created.slice(0, 10).map((a) => a.applicationCode),
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return created;
    });
  },

  async bulkUpdateApplications(
    ctx: AdmissionsActorContext,
    input: BulkUpdateApplicationsInput,
  ): Promise<AdmissionApplicationRecord[]> {
    const authUser = { id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId };
    if (input.verificationStatus !== undefined || input.verificationNotes !== undefined) {
      authorize(authUser, "admissions:verify");
    } else {
      authorize(authUser, "admissions:write");
    }

    return runScoped(ctx, async () => {
      const updated = await admissionsRepository.bulkUpdateApplications(
        ctx.schoolId,
        { id: ctx.userId, name: ctx.userName },
        input,
      );

      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      await logAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.userId,
        action: "ADMISSION_APPLICATIONS_BULK_UPDATED",
        entityType: "AdmissionApplication",
        entityId: updated[0]?.id ?? ctx.schoolId,
        details: {
          updatedCount: updated.length,
          status: input.status ?? null,
          verificationStatus: input.verificationStatus ?? null,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return updated;
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
    return runScoped(ctx, async () => {
      const updated = await admissionsRepository.toggleReminder(
        ctx.schoolId,
        reminderId,
        isCompleted,
      );
      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
      return updated;
    });
  },

  async deleteReminder(ctx: AdmissionsActorContext, reminderId: string): Promise<void> {
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");
    return runScoped(ctx, async () => {
      await admissionsRepository.deleteReminder(ctx.schoolId, reminderId);
      await invalidateTenantCaches(ctx.schoolId, ctx.userId);
    });
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
