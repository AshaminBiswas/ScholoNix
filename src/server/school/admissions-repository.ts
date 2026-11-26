/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { tenantCache } from "@/server/integrations/redis";
import { ConflictError, NotFoundError, ServiceUnavailableError, TenantNotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  DEFAULT_ADMISSION_GRADES,
  DEFAULT_DOCUMENT_CHECKLIST,
  type AdmissionAcademicDetailsPayload,
  type AdmissionActivityRecord,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type AdmissionDocumentChecklistItem,
  type AdmissionEnquiryRecord,
  type AdmissionGuardianDetailsPayload,
  type AdmissionReminderRecord,
  type AdmissionSettingRecord,
  type AdmissionStudentDetailsPayload,
  type AdmissionTypeValue,
  type AdmissionUploadedDocument,
} from "@/modules/school/admissions/types";
import { assertTenantDocumentStorageKey } from "./admissions-document-storage";
import type {
  BulkUpdateApplicationsInput,
  CreateApplicationInput,
  CreateEnquiryInput,
  CreateReminderInput,
  UpdateAdmissionsSettingsInput,
  UpdateApplicationInput,
  UpdateEnquiryInput,
} from "@/modules/school/admissions/schemas";
import { getCurrentAcademicYearLabel } from "./admissions-analytics";

interface StoredSetting extends AdmissionSettingRecord {
  nextApplicationSeq: number;
  nextEnquirySeq: number;
  nextAdmissionSeq: number;
}

interface AdmissionsStoreState {
  settings: Record<string, StoredSetting>;
  applications: Record<string, AdmissionApplicationRecord>;
  enquiries: Record<string, AdmissionEnquiryRecord>;
  reminders: Record<string, AdmissionReminderRecord>;
  activities: AdmissionActivityRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "admissions-store.json");

let storeMemory: AdmissionsStoreState = {
  settings: {},
  applications: {},
  enquiries: {},
  reminders: {},
  activities: [],
};

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
}

function loadStore(): AdmissionsStoreState {
  if (process.env.NODE_ENV === "test") {
    return storeMemory;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<AdmissionsStoreState>;
      return {
        settings: parsed.settings || {},
        applications: parsed.applications || {},
        enquiries: parsed.enquiries || {},
        reminders: parsed.reminders || {},
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      };
    }
  } catch (err) {
    logger.warn(
      { error: err instanceof Error ? err.message : String(err) },
      "[AdmissionsRepository] Failed to read local admissions store; starting clean",
    );
  }

  return {
    settings: {},
    applications: {},
    enquiries: {},
    reminders: {},
    activities: [],
  };
}

function saveStore(state: AdmissionsStoreState): void {
  storeMemory = state;
  if (process.env.NODE_ENV === "test") {
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${STORE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), "utf8");
    try {
      fs.renameSync(tempPath, STORE_PATH);
    } catch {
      fs.copyFileSync(tempPath, STORE_PATH);
    } finally {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  } catch (err) {
    logger.error(
      { error: err instanceof Error ? err.message : String(err) },
      "[AdmissionsRepository] Failed to save local admissions store",
    );
  }
}

storeMemory = isServerlessRuntime() ? storeMemory : loadStore();

const globalForAdmissionsRepo = globalThis as unknown as {
  admissionsRepoPrismaUnavailableUntil?: number;
};
const PRISMA_RETRY_COOLDOWN_MS = 30_000;
const PRISMA_DEV_OP_TIMEOUT_MS = 10_000;

async function canUsePrisma(): Promise<boolean> {
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return false;
  }
  // In serverless production, always fail fast cleanly via handlePrismaError rather than
  // silently degrading to ephemeral read-only local disk storage.
  if (isServerlessRuntime()) {
    return true;
  }
  const unavailableUntil = globalForAdmissionsRepo.admissionsRepoPrismaUnavailableUntil || 0;
  return unavailableUntil <= Date.now();
}

async function runPrismaOp<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  if (isServerlessRuntime()) {
    const res = await fn();
    globalForAdmissionsRepo.admissionsRepoPrismaUnavailableUntil = 0;
    return res;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const res = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Database ${operation} timed out after ${PRISMA_DEV_OP_TIMEOUT_MS}ms`)),
          PRISMA_DEV_OP_TIMEOUT_MS,
        );
      }),
    ]);
    globalForAdmissionsRepo.admissionsRepoPrismaUnavailableUntil = 0;
    return res;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isMissingTablePrismaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  const message = err instanceof Error ? err.message : String(err);
  return (
    code === "P2021" ||
    code === "P2022" ||
    message.includes("does not exist in the current database") ||
    message.includes("relation \"admission_")
  );
}

function handlePrismaError(operation: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  globalForAdmissionsRepo.admissionsRepoPrismaUnavailableUntil =
    Date.now() + PRISMA_RETRY_COOLDOWN_MS;
  logger.error(
    { operation, error: message, serverless: isServerlessRuntime() },
    `[AdmissionsRepository] Prisma ${operation} failed`,
  );
  if (isServerlessRuntime()) {
    if (isMissingTablePrismaError(err)) {
      throw new ServiceUnavailableError(
        "Admissions database tables are not provisioned yet. Execute prisma/migrations/20261125160000_admissions_management/migration.sql in Supabase SQL Editor.",
      );
    }
    throw new ServiceUnavailableError(
      "Admissions database is temporarily unavailable. Please try again shortly.",
    );
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function setTransactionTenantContext(tx: any, schoolId: string): Promise<void> {
  if (!UUID_REGEX.test(schoolId)) {
    return;
  }
  await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
}

function cloneDefaultChecklist(): AdmissionDocumentChecklistItem[] {
  return DEFAULT_DOCUMENT_CHECKLIST.map((item) => ({ ...item }));
}

function normalizeWizardAcademicDetails(
  academicDetails?: AdmissionAcademicDetailsPayload | null,
): AdmissionAcademicDetailsPayload | null {
  if (!academicDetails) return null;
  const totalMarks =
    typeof academicDetails.totalMarks === "number" && academicDetails.totalMarks > 0
      ? academicDetails.totalMarks
      : null;
  const marksObtained =
    typeof academicDetails.marksObtained === "number" && academicDetails.marksObtained >= 0
      ? academicDetails.marksObtained
      : null;
  const percentage =
    totalMarks && marksObtained !== null
      ? Math.round((marksObtained / totalMarks) * 1000) / 10
      : null;

  const previousAcademics = Array.isArray(academicDetails.previousAcademics)
    ? academicDetails.previousAcademics.map((row) => ({
        ...row,
        percentage:
          row.totalMarks > 0
            ? Math.round((row.marksObtained / row.totalMarks) * 1000) / 10
            : 0,
      }))
    : undefined;

  return {
    ...academicDetails,
    totalMarks,
    marksObtained,
    percentage,
    previousAcademics,
  };
}

function validateWizardDocumentKeys(
  schoolId: string,
  studentPhotoKey?: string | null,
  uploadedDocuments?: AdmissionUploadedDocument[],
): void {
  if (studentPhotoKey) {
    assertTenantDocumentStorageKey(schoolId, studentPhotoKey);
  }
  if (Array.isArray(uploadedDocuments)) {
    for (const doc of uploadedDocuments) {
      assertTenantDocumentStorageKey(schoolId, doc.storageKey);
    }
  }
}

function buildChecklistFromUploads(
  uploadedDocuments?: AdmissionUploadedDocument[],
): AdmissionDocumentChecklistItem[] {
  const base = cloneDefaultChecklist();
  if (!Array.isArray(uploadedDocuments) || uploadedDocuments.length === 0) {
    return base;
  }
  const uploadedTypes = new Set(uploadedDocuments.map((d) => d.docType));
  return base.map((item) => {
    if (item.key === "birth_certificate" && uploadedTypes.has("birth_certificate")) {
      return { ...item, submitted: true };
    }
    if (item.key === "previous_report_card" && uploadedTypes.has("last_marksheet")) {
      return { ...item, submitted: true };
    }
    if (
      item.key === "address_proof" &&
      (uploadedTypes.has("student_aadhaar") ||
        uploadedTypes.has("father_aadhaar") ||
        uploadedTypes.has("mother_aadhaar"))
    ) {
      return { ...item, submitted: true };
    }
    if (item.key === "student_photo" && uploadedTypes.has("student_photo")) {
      return { ...item, submitted: true };
    }
    return item;
  });
}

function extractYearTag(academicYear: string): string {
  const match = academicYear.match(/(\d{4})/);
  return match ? match[1]! : String(new Date().getFullYear());
}

function generateUniqueStudentId(
  academicYear: string,
  existingIds: Array<string | null | undefined>,
  seedSeq: number = 1,
): string {
  const yearTag = extractYearTag(academicYear);
  const prefix = `STU${yearTag}-`;
  const used = new Set<string>();
  let maxSeq = 0;

  for (const raw of existingIds) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    used.add(trimmed.toUpperCase());
    if (trimmed.toUpperCase().startsWith(prefix)) {
      const num = Number.parseInt(trimmed.slice(prefix.length), 10);
      if (Number.isFinite(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let candidateSeq = Math.max(1, seedSeq, maxSeq + 1);
  let candidate = `${prefix}${String(candidateSeq).padStart(4, "0")}`;
  while (used.has(candidate.toUpperCase())) {
    candidateSeq += 1;
    candidate = `${prefix}${String(candidateSeq).padStart(4, "0")}`;
  }
  return candidate;
}

function mapPrismaSetting(row: any): StoredSetting {
  return {
    schoolId: row.schoolId,
    currentAcademicYear: row.currentAcademicYear,
    applicationDeadline: row.applicationDeadline
      ? new Date(row.applicationDeadline).toISOString()
      : null,
    applicationPrefix: row.applicationPrefix,
    enabledGrades: Array.isArray(row.enabledGrades) ? row.enabledGrades : [...DEFAULT_ADMISSION_GRADES],
    nextApplicationSeq: row.nextApplicationSeq,
    nextEnquirySeq: row.nextEnquirySeq,
    nextAdmissionSeq: row.nextAdmissionSeq,
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapPrismaApplication(row: any): AdmissionApplicationRecord {
  const checklistRaw = Array.isArray(row.documentsChecklist) ? row.documentsChecklist : cloneDefaultChecklist();
  const uploadedDocsRaw = Array.isArray(row.uploadedDocuments)
    ? (row.uploadedDocuments as AdmissionUploadedDocument[])
    : [];
  return {
    id: row.id,
    schoolId: row.schoolId,
    applicationCode: row.applicationCode,
    admissionNumber: row.admissionNumber ?? null,
    enquiryId: row.enquiryId ?? null,
    studentName: row.studentName,
    gender: row.gender ?? null,
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth).toISOString().slice(0, 10) : null,
    gradeApplied: row.gradeApplied,
    academicYear: row.academicYear,
    guardianName: row.guardianName,
    guardianRelation: row.guardianRelation,
    guardianPhone: row.guardianPhone,
    guardianEmail: row.guardianEmail ?? null,
    previousSchool: row.previousSchool ?? null,
    status: row.status,
    verificationStatus: row.verificationStatus,
    verificationNotes: row.verificationNotes ?? null,
    documentsChecklist: checklistRaw,
    admissionType: (row.admissionType as AdmissionTypeValue) ?? "FRESH",
    isDraft: Boolean(row.isDraft),
    currentStep: typeof row.currentStep === "number" ? row.currentStep : 1,
    studentPhotoKey: row.studentPhotoKey ?? null,
    nationality: row.nationality ?? null,
    bloodGroup: row.bloodGroup ?? null,
    studentIdNumber: row.studentIdNumber ?? null,
    studentDetails: (row.studentDetails as AdmissionStudentDetailsPayload) ?? null,
    guardianDetails: (row.guardianDetails as AdmissionGuardianDetailsPayload) ?? null,
    academicDetails: (row.academicDetails as AdmissionAcademicDetailsPayload) ?? null,
    uploadedDocuments: uploadedDocsRaw,
    declarationAccepted: Boolean(row.declarationAccepted),
    appliedAt: new Date(row.appliedAt).toISOString(),
    shortlistedAt: row.shortlistedAt ? new Date(row.shortlistedAt).toISOString() : null,
    admittedAt: row.admittedAt ? new Date(row.admittedAt).toISOString() : null,
    rejectedAt: row.rejectedAt ? new Date(row.rejectedAt).toISOString() : null,
    verifiedAt: row.verifiedAt ? new Date(row.verifiedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapPrismaEnquiry(row: any): AdmissionEnquiryRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    enquiryCode: row.enquiryCode,
    studentName: row.studentName,
    guardianName: row.guardianName,
    guardianPhone: row.guardianPhone,
    guardianEmail: row.guardianEmail ?? null,
    gradeApplied: row.gradeApplied,
    academicYear: row.academicYear,
    source: row.source,
    status: row.status,
    notes: row.notes ?? null,
    convertedApplicationId: row.convertedApplicationId ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapPrismaReminder(row: any): AdmissionReminderRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    title: row.title,
    academicYear: row.academicYear ?? null,
    dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : null,
    priority: row.priority,
    isCompleted: Boolean(row.isCompleted),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function mapPrismaActivity(row: any): AdmissionActivityRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    applicationId: row.applicationId ?? null,
    enquiryId: row.enquiryId ?? null,
    actorId: row.actorId ?? null,
    actorName: row.actorName,
    action: row.action,
    summary: row.summary,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export interface ActorMeta {
  id: string;
  name: string;
}

export const ADMISSIONS_SNAPSHOT_CACHE_KEY = "admissions:snapshot:v1";
const ADMISSIONS_SNAPSHOT_TTL_SECONDS = 60;

export interface TenantAdmissionsSnapshot {
  settings: AdmissionSettingRecord;
  applications: AdmissionApplicationRecord[];
  enquiries: AdmissionEnquiryRecord[];
  reminders: AdmissionReminderRecord[];
  activities: AdmissionActivityRecord[];
}

function isValidCachedSnapshot(
  cached: unknown,
  expectedSchoolId: string,
): cached is TenantAdmissionsSnapshot {
  if (!cached || typeof cached !== "object") return false;
  const s = cached as Partial<TenantAdmissionsSnapshot>;
  return Boolean(
    s.settings &&
      s.settings.schoolId === expectedSchoolId &&
      Array.isArray(s.applications) &&
      Array.isArray(s.enquiries) &&
      Array.isArray(s.reminders) &&
      Array.isArray(s.activities),
  );
}

class AdmissionsTenantRepository extends BaseTenantRepository {
  private requireSchoolId(explicitSchoolId?: string): string {
    const sid = this.getSchoolId(explicitSchoolId);
    if (!sid || !sid.trim()) {
      throw new TenantNotFoundError("School tenant identifier is required.");
    }
    return sid.trim();
  }

  async invalidateTenantSnapshotCache(explicitSchoolId?: string): Promise<void> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    await tenantCache.del(schoolId, ADMISSIONS_SNAPSHOT_CACHE_KEY);
  }

  private getOrCreateFallbackSetting(store: AdmissionsStoreState, schoolId: string): StoredSetting {
    if (!store.settings[schoolId]) {
      store.settings[schoolId] = {
        schoolId,
        currentAcademicYear: getCurrentAcademicYearLabel(),
        applicationDeadline: null,
        applicationPrefix: "APP",
        enabledGrades: [...DEFAULT_ADMISSION_GRADES],
        nextApplicationSeq: 1,
        nextEnquirySeq: 1,
        nextAdmissionSeq: 1,
        updatedAt: new Date().toISOString(),
      };
    }
    return store.settings[schoolId]!;
  }

  async getTenantSnapshot(explicitSchoolId: string): Promise<TenantAdmissionsSnapshot> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    const cached = await tenantCache.get<TenantAdmissionsSnapshot>(
      schoolId,
      ADMISSIONS_SNAPSHOT_CACHE_KEY,
    );
    if (isValidCachedSnapshot(cached, schoolId)) {
      return cached;
    }

    if (await canUsePrisma()) {
      try {
        const fresh = await runPrismaOp("getTenantSnapshot", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const [settingRow, appRows, enqRows, reminderRows, activityRows] = await Promise.all([
              tx.admissionSetting.findUnique({ where: { schoolId } }),
              tx.admissionApplication.findMany({
                where: { schoolId },
                orderBy: { appliedAt: "desc" },
              }),
              tx.admissionEnquiry.findMany({
                where: { schoolId },
                orderBy: { createdAt: "desc" },
              }),
              tx.admissionReminder.findMany({
                where: { schoolId },
                orderBy: { createdAt: "desc" },
              }),
              tx.admissionActivity.findMany({
                where: { schoolId },
                orderBy: { createdAt: "desc" },
                take: 30,
              }),
            ]);

            const settings: AdmissionSettingRecord = settingRow
              ? mapPrismaSetting(settingRow)
              : {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationDeadline: null,
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                  updatedAt: new Date().toISOString(),
                };

            return {
              settings,
              applications: appRows.map(mapPrismaApplication),
              enquiries: enqRows.map(mapPrismaEnquiry),
              reminders: reminderRows.map(mapPrismaReminder),
              activities: activityRows.map(mapPrismaActivity),
            };
          });
        });

        await tenantCache.set(
          schoolId,
          ADMISSIONS_SNAPSHOT_CACHE_KEY,
          fresh,
          ADMISSIONS_SNAPSHOT_TTL_SECONDS,
        );
        return fresh;
      } catch (err) {
        handlePrismaError("getTenantSnapshot", err);
      }
    }

    const store = loadStore();
    const setting = this.getOrCreateFallbackSetting(store, schoolId);
    const {
      nextApplicationSeq: _a,
      nextEnquirySeq: _e,
      nextAdmissionSeq: _adm,
      ...publicSettings
    } = setting;
    void _a;
    void _e;
    void _adm;

    const fallbackSnapshot: TenantAdmissionsSnapshot = {
      settings: publicSettings,
      applications: Object.values(store.applications).filter((r) => r.schoolId === schoolId),
      enquiries: Object.values(store.enquiries).filter((r) => r.schoolId === schoolId),
      reminders: Object.values(store.reminders).filter((r) => r.schoolId === schoolId),
      activities: store.activities.filter((a) => a.schoolId === schoolId).slice(0, 30),
    };
    await tenantCache.set(
      schoolId,
      ADMISSIONS_SNAPSHOT_CACHE_KEY,
      fallbackSnapshot,
      ADMISSIONS_SNAPSHOT_TTL_SECONDS,
    );
    return fallbackSnapshot;
  }

  async createApplication(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: CreateApplicationInput,
  ): Promise<AdmissionApplicationRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const now = new Date();
    const nowIso = now.toISOString();
    validateWizardDocumentKeys(schoolId, input.studentPhotoKey, input.uploadedDocuments);
    const normalizedAcademicDetails = normalizeWizardAcademicDetails(input.academicDetails);
    const resolvedPreviousSchool =
      input.previousSchool?.trim() ||
      normalizedAcademicDetails?.previousSchoolName?.trim() ||
      null;
    const checklist = buildChecklistFromUploads(input.uploadedDocuments);
    const isDraft = Boolean(input.isDraft);
    const admissionType: AdmissionTypeValue = input.admissionType ?? "FRESH";

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createApplication", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            let setting = await tx.admissionSetting.findUnique({ where: { schoolId } });
            if (!setting) {
              setting = await tx.admissionSetting.create({
                data: {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                },
              });
            }

            if (input.enquiryId) {
              const enquiry = await tx.admissionEnquiry.findFirst({
                where: { id: input.enquiryId, schoolId },
              });
              if (!enquiry) {
                throw new NotFoundError("Admission enquiry");
              }
              if (enquiry.status === "CONVERTED" || enquiry.convertedApplicationId) {
                throw new ConflictError("This enquiry has already been converted to an application.");
              }
            }

            const updatedSetting = await tx.admissionSetting.update({
              where: { schoolId },
              data: { nextApplicationSeq: { increment: 1 } },
            });
            const seq = updatedSetting.nextApplicationSeq - 1;
            const applicationCode = `${setting.applicationPrefix}${extractYearTag(input.academicYear)}-${String(seq).padStart(4, "0")}`;

            let resolvedStudentId: string | null = input.studentIdNumber?.trim() || null;
            if (!isDraft && !resolvedStudentId) {
              const existingStudentRows = (await (tx.admissionApplication as any).findMany({
                where: { schoolId, studentIdNumber: { not: null } },
                select: { studentIdNumber: true },
              })) as Array<{ studentIdNumber?: string | null }>;
              resolvedStudentId = generateUniqueStudentId(
                input.academicYear,
                existingStudentRows.map((r) => r.studentIdNumber),
                seq,
              );
            }

            const created = await tx.admissionApplication.create({
              data: {
                schoolId,
                applicationCode,
                enquiryId: input.enquiryId ?? null,
                studentName: input.studentName,
                gender: input.gender || null,
                dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null,
                gradeApplied: input.gradeApplied,
                academicYear: input.academicYear,
                guardianName: input.guardianName,
                guardianRelation: input.guardianRelation ?? "Parent",
                guardianPhone: input.guardianPhone,
                guardianEmail: input.guardianEmail || null,
                previousSchool: resolvedPreviousSchool,
                status: input.status ?? "UNDER_REVIEW",
                verificationStatus: "PENDING",
                verificationNotes: input.notes || null,
                documentsChecklist: checklist as any,
                admissionType,
                isDraft,
                currentStep: input.currentStep ?? 1,
                studentPhotoKey: input.studentPhotoKey || null,
                nationality: input.nationality || null,
                bloodGroup: input.bloodGroup || null,
                studentIdNumber: resolvedStudentId,
                studentDetails: (input.studentDetails ?? null) as any,
                guardianDetails: (input.guardianDetails ?? null) as any,
                academicDetails: (normalizedAcademicDetails ?? null) as any,
                uploadedDocuments: (input.uploadedDocuments ?? []) as any,
                declarationAccepted: Boolean(input.declarationAccepted),
                appliedAt: now,
                shortlistedAt: !isDraft && input.status === "SHORTLISTED" ? now : null,
                reviewedByUserId: actor.id,
              } as any,
            });

            if (input.enquiryId && !isDraft) {
              await tx.admissionEnquiry.update({
                where: { id: input.enquiryId },
                data: {
                  status: "CONVERTED",
                  convertedApplicationId: created.id,
                },
              });
            }

            if (!isDraft) {
              await tx.admissionActivity.create({
                data: {
                  schoolId,
                  applicationId: created.id,
                  enquiryId: input.enquiryId ?? null,
                  actorId: actor.id,
                  actorName: actor.name,
                  action: "APPLICATION_CREATED",
                  summary: `New application ${applicationCode}${resolvedStudentId ? ` (${resolvedStudentId})` : ""} received for ${input.studentName} (${input.gradeApplied}).`,
                },
              });
            }

            return mapPrismaApplication(created);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof ConflictError) {
          throw err;
        }
        handlePrismaError("createApplication", err);
      }
    }

    const store = loadStore();
    const setting = this.getOrCreateFallbackSetting(store, schoolId);

    if (input.enquiryId) {
      const enq = store.enquiries[input.enquiryId];
      if (!enq || enq.schoolId !== schoolId) {
        throw new NotFoundError("Admission enquiry");
      }
      if (enq.status === "CONVERTED" || enq.convertedApplicationId) {
        throw new ConflictError("This enquiry has already been converted to an application.");
      }
    }

    const seq = setting.nextApplicationSeq;
    setting.nextApplicationSeq += 1;
    const applicationCode = `${setting.applicationPrefix}${extractYearTag(input.academicYear)}-${String(seq).padStart(4, "0")}`;

    let resolvedStudentId: string | null = input.studentIdNumber?.trim() || null;
    if (!isDraft && !resolvedStudentId) {
      const existingSchoolIds = Object.values(store.applications)
        .filter((a) => a.schoolId === schoolId)
        .map((a) => a.studentIdNumber);
      resolvedStudentId = generateUniqueStudentId(input.academicYear, existingSchoolIds, seq);
    }

    const record: AdmissionApplicationRecord = {
      id: randomUUID(),
      schoolId,
      applicationCode,
      admissionNumber: null,
      enquiryId: input.enquiryId ?? null,
      studentName: input.studentName,
      gender: input.gender || null,
      dateOfBirth: input.dateOfBirth || null,
      gradeApplied: input.gradeApplied,
      academicYear: input.academicYear,
      guardianName: input.guardianName,
      guardianRelation: input.guardianRelation ?? "Parent",
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || null,
      previousSchool: resolvedPreviousSchool,
      status: input.status ?? "UNDER_REVIEW",
      verificationStatus: "PENDING",
      verificationNotes: input.notes || null,
      documentsChecklist: checklist,
      admissionType,
      isDraft,
      currentStep: input.currentStep ?? 1,
      studentPhotoKey: input.studentPhotoKey || null,
      nationality: input.nationality || null,
      bloodGroup: input.bloodGroup || null,
      studentIdNumber: resolvedStudentId,
      studentDetails: input.studentDetails
        ? {
            email: input.studentDetails.email ?? "",
            phone: input.studentDetails.phone ?? "",
            address: {
              addressLine1: input.studentDetails.address?.addressLine1 ?? "",
              addressLine2: input.studentDetails.address?.addressLine2 ?? "",
              city: input.studentDetails.address?.city ?? "",
              state: input.studentDetails.address?.state ?? "",
              postalCode: input.studentDetails.address?.postalCode ?? "",
            },
          }
        : null,
      guardianDetails: input.guardianDetails
        ? {
            primary: {
              fullName: input.guardianDetails.primary.fullName ?? "",
              relationship: input.guardianDetails.primary.relationship ?? "Father",
              occupation: input.guardianDetails.primary.occupation ?? "",
              annualIncome: input.guardianDetails.primary.annualIncome ?? "",
              email: input.guardianDetails.primary.email ?? "",
              phone: input.guardianDetails.primary.phone ?? "",
            },
            secondary: input.guardianDetails.secondary
              ? {
                  fullName: input.guardianDetails.secondary.fullName ?? "",
                  relationship: input.guardianDetails.secondary.relationship ?? "Mother",
                  occupation: input.guardianDetails.secondary.occupation ?? "",
                  annualIncome: input.guardianDetails.secondary.annualIncome ?? "",
                  email: input.guardianDetails.secondary.email ?? "",
                  phone: input.guardianDetails.secondary.phone ?? "",
                }
              : null,
            sameAsStudentAddress: Boolean(input.guardianDetails.sameAsStudentAddress),
            address: input.guardianDetails.address
              ? {
                  addressLine1: input.guardianDetails.address.addressLine1 ?? "",
                  addressLine2: input.guardianDetails.address.addressLine2 ?? "",
                  city: input.guardianDetails.address.city ?? "",
                  state: input.guardianDetails.address.state ?? "",
                  postalCode: input.guardianDetails.address.postalCode ?? "",
                }
              : null,
            emergencyContactNumber: input.guardianDetails.emergencyContactNumber ?? "",
            preferredCommunicationMode:
              input.guardianDetails.preferredCommunicationMode ?? "Phone",
          }
        : null,
      academicDetails: normalizedAcademicDetails,
      uploadedDocuments: input.uploadedDocuments ?? [],
      declarationAccepted: Boolean(input.declarationAccepted),
      appliedAt: nowIso,
      shortlistedAt: !isDraft && input.status === "SHORTLISTED" ? nowIso : null,
      admittedAt: null,
      rejectedAt: null,
      verifiedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.applications[record.id] = record;

    if (input.enquiryId && !isDraft && store.enquiries[input.enquiryId]) {
      store.enquiries[input.enquiryId] = {
        ...store.enquiries[input.enquiryId]!,
        status: "CONVERTED",
        convertedApplicationId: record.id,
        updatedAt: nowIso,
      };
    }

    if (!isDraft) {
      store.activities.unshift({
        id: randomUUID(),
        schoolId,
        applicationId: record.id,
        enquiryId: input.enquiryId ?? null,
        actorId: actor.id,
        actorName: actor.name,
        action: "APPLICATION_CREATED",
        summary: `New application ${applicationCode} received for ${input.studentName} (${input.gradeApplied}).`,
        createdAt: nowIso,
      });
    }

    saveStore(store);
    return record;
  }

  async getApplicationById(
    explicitSchoolId: string,
    applicationId: string,
  ): Promise<AdmissionApplicationRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("getApplicationById", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const found = await tx.admissionApplication.findFirst({
              where: { id: applicationId, schoolId },
            });
            if (!found) {
              throw new NotFoundError("Admission application");
            }
            return mapPrismaApplication(found);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("getApplicationById", err);
      }
    }

    const store = loadStore();
    const record = store.applications[applicationId];
    if (!record || record.schoolId !== schoolId) {
      throw new NotFoundError("Admission application");
    }
    return record;
  }

  async updateApplication(
    explicitSchoolId: string,
    applicationId: string,
    actor: ActorMeta,
    input: UpdateApplicationInput,
  ): Promise<{ before: AdmissionApplicationRecord; after: AdmissionApplicationRecord }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const now = new Date();
    const nowIso = now.toISOString();
    validateWizardDocumentKeys(schoolId, input.studentPhotoKey, input.uploadedDocuments);
    const normalizedAcademicDetails =
      input.academicDetails !== undefined
        ? normalizeWizardAcademicDetails(input.academicDetails)
        : undefined;

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateApplication", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const existingRow = await tx.admissionApplication.findFirst({
              where: { id: applicationId, schoolId },
            });
            if (!existingRow) {
              throw new NotFoundError("Admission application");
            }

            const before = mapPrismaApplication(existingRow);
            const nextStatus: AdmissionApplicationStatusType = input.status ?? existingRow.status;

            let admissionNumber = existingRow.admissionNumber;
            if (nextStatus === "ADMITTED" && !admissionNumber) {
              const updatedSetting = await tx.admissionSetting.upsert({
                where: { schoolId },
                update: { nextAdmissionSeq: { increment: 1 } },
                create: {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                  nextAdmissionSeq: 2,
                },
              });
              const seq = updatedSetting.nextAdmissionSeq - 1;
              admissionNumber = `ADM${extractYearTag(existingRow.academicYear)}-${String(seq).padStart(4, "0")}`;
            }

            const nextVerification = input.verificationStatus ?? existingRow.verificationStatus;
            const existingWizardRow = existingRow as typeof existingRow & {
              admissionType?: AdmissionTypeValue;
              isDraft?: boolean;
              currentStep?: number;
              studentPhotoKey?: string | null;
              nationality?: string | null;
              bloodGroup?: string | null;
              studentIdNumber?: string | null;
              studentDetails?: unknown;
              guardianDetails?: unknown;
              academicDetails?: unknown;
              uploadedDocuments?: unknown;
              declarationAccepted?: boolean;
            };
            const nextIsDraft =
              input.isDraft !== undefined ? input.isDraft : Boolean(existingWizardRow.isDraft);
            const transitioningFromDraft = Boolean(existingWizardRow.isDraft) && !nextIsDraft;
            const nextAcademicYear = input.academicYear ?? existingRow.academicYear;
            let resolvedStudentId: string | null | undefined =
              input.studentIdNumber !== undefined
                ? input.studentIdNumber?.trim() || null
                : existingWizardRow.studentIdNumber;
            if (!nextIsDraft && !resolvedStudentId) {
              const existingStudentRows = (await (tx.admissionApplication as any).findMany({
                where: { schoolId, studentIdNumber: { not: null } },
                select: { studentIdNumber: true },
              })) as Array<{ studentIdNumber?: string | null }>;
              resolvedStudentId = generateUniqueStudentId(
                nextAcademicYear,
                existingStudentRows.map((r) => r.studentIdNumber),
                1,
              );
            }
            const nextChecklist =
              input.documentsChecklist !== undefined
                ? (input.documentsChecklist as any)
                : input.uploadedDocuments !== undefined
                  ? (buildChecklistFromUploads(input.uploadedDocuments) as any)
                  : existingRow.documentsChecklist;

            const updatedRow = await tx.admissionApplication.update({
              where: { id: existingRow.id },
              data: {
                status: nextStatus,
                admissionNumber,
                verificationStatus: nextVerification,
                verificationNotes:
                  input.verificationNotes !== undefined
                    ? input.verificationNotes
                    : existingRow.verificationNotes,
                documentsChecklist: nextChecklist,
                studentName: input.studentName ?? existingRow.studentName,
                gender: input.gender !== undefined ? input.gender || null : existingRow.gender,
                dateOfBirth:
                  input.dateOfBirth !== undefined
                    ? input.dateOfBirth
                      ? new Date(`${input.dateOfBirth}T00:00:00.000Z`)
                      : null
                    : existingRow.dateOfBirth,
                gradeApplied: input.gradeApplied ?? existingRow.gradeApplied,
                academicYear: input.academicYear ?? existingRow.academicYear,
                guardianName: input.guardianName ?? existingRow.guardianName,
                guardianRelation: input.guardianRelation ?? existingRow.guardianRelation,
                guardianPhone: input.guardianPhone ?? existingRow.guardianPhone,
                guardianEmail:
                  input.guardianEmail !== undefined
                    ? input.guardianEmail || null
                    : existingRow.guardianEmail,
                previousSchool:
                  input.previousSchool !== undefined
                    ? input.previousSchool
                    : normalizedAcademicDetails?.previousSchoolName || existingRow.previousSchool,
                admissionType: input.admissionType ?? existingWizardRow.admissionType,
                isDraft: nextIsDraft,
                currentStep: input.currentStep ?? existingWizardRow.currentStep,
                studentPhotoKey:
                  input.studentPhotoKey !== undefined
                    ? input.studentPhotoKey
                    : existingWizardRow.studentPhotoKey,
                nationality:
                  input.nationality !== undefined ? input.nationality : existingWizardRow.nationality,
                bloodGroup:
                  input.bloodGroup !== undefined ? input.bloodGroup : existingWizardRow.bloodGroup,
                studentIdNumber: resolvedStudentId,
                studentDetails:
                  input.studentDetails !== undefined
                    ? (input.studentDetails as any)
                    : existingWizardRow.studentDetails,
                guardianDetails:
                  input.guardianDetails !== undefined
                    ? (input.guardianDetails as any)
                    : existingWizardRow.guardianDetails,
                academicDetails:
                  normalizedAcademicDetails !== undefined
                    ? (normalizedAcademicDetails as any)
                    : existingWizardRow.academicDetails,
                uploadedDocuments:
                  input.uploadedDocuments !== undefined
                    ? (input.uploadedDocuments as any)
                    : existingWizardRow.uploadedDocuments,
                declarationAccepted:
                  input.declarationAccepted !== undefined
                    ? input.declarationAccepted
                    : existingWizardRow.declarationAccepted,
                appliedAt: transitioningFromDraft ? now : existingRow.appliedAt,
                shortlistedAt:
                  nextStatus === "SHORTLISTED" && !existingRow.shortlistedAt
                    ? now
                    : existingRow.shortlistedAt,
                admittedAt:
                  nextStatus === "ADMITTED" && !existingRow.admittedAt
                    ? now
                    : existingRow.admittedAt,
                rejectedAt:
                  nextStatus === "REJECTED" && !existingRow.rejectedAt
                    ? now
                    : existingRow.rejectedAt,
                verifiedAt:
                  nextVerification === "VERIFIED" && !existingRow.verifiedAt
                    ? now
                    : existingRow.verifiedAt,
                reviewedByUserId: actor.id,
              } as any,
            });

            const after = mapPrismaApplication(updatedRow);
            const summaryParts: string[] = [];
            if (transitioningFromDraft) {
              summaryParts.push(
                `New application ${after.applicationCode} submitted for ${after.studentName} (${after.gradeApplied}).`,
              );
            } else {
              if (before.status !== after.status) {
                summaryParts.push(
                  after.status === "ADMITTED"
                    ? `${after.studentName} has been Admitted (${after.admissionNumber}).`
                    : `${after.studentName}'s application moved to ${after.status.replace(/_/g, " ")}.`,
                );
              }
              if (before.verificationStatus !== after.verificationStatus) {
                summaryParts.push(
                  `Document verification for ${after.studentName} marked ${after.verificationStatus}.`,
                );
              }
              if (summaryParts.length === 0) {
                summaryParts.push(`Updated application details for ${after.studentName} (${after.applicationCode}).`);
              }
            }

            if (!nextIsDraft) {
              await tx.admissionActivity.create({
                data: {
                  schoolId,
                  applicationId: after.id,
                  actorId: actor.id,
                  actorName: actor.name,
                  action: transitioningFromDraft ? "APPLICATION_CREATED" : "APPLICATION_UPDATED",
                  summary: summaryParts.join(" "),
                },
              });
            }

            return { before, after };
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("updateApplication", err);
      }
    }

    const store = loadStore();
    const existing = store.applications[applicationId];
    if (!existing || existing.schoolId !== schoolId) {
      throw new NotFoundError("Admission application");
    }

    const before = { ...existing };
    const nextStatus = input.status ?? existing.status;
    let admissionNumber = existing.admissionNumber;
    if (nextStatus === "ADMITTED" && !admissionNumber) {
      const setting = this.getOrCreateFallbackSetting(store, schoolId);
      const seq = setting.nextAdmissionSeq;
      setting.nextAdmissionSeq += 1;
      admissionNumber = `ADM${extractYearTag(existing.academicYear)}-${String(seq).padStart(4, "0")}`;
    }

    const nextVerification = input.verificationStatus ?? existing.verificationStatus;
    const nextIsDraft = input.isDraft !== undefined ? input.isDraft : Boolean(existing.isDraft);
    const transitioningFromDraft = Boolean(existing.isDraft) && !nextIsDraft;
    const nextAcademicYear = input.academicYear ?? existing.academicYear;
    let resolvedStudentId: string | null | undefined =
      input.studentIdNumber !== undefined
        ? input.studentIdNumber?.trim() || null
        : existing.studentIdNumber;
    if (!nextIsDraft && !resolvedStudentId) {
      const existingSchoolIds = Object.values(store.applications)
        .filter((a) => a.schoolId === schoolId)
        .map((a) => a.studentIdNumber);
      resolvedStudentId = generateUniqueStudentId(nextAcademicYear, existingSchoolIds, 1);
    }
    const after: AdmissionApplicationRecord = {
      ...existing,
      status: nextStatus,
      admissionNumber,
      verificationStatus: nextVerification,
      verificationNotes:
        input.verificationNotes !== undefined ? input.verificationNotes : existing.verificationNotes,
      documentsChecklist:
        input.documentsChecklist !== undefined
          ? input.documentsChecklist
          : input.uploadedDocuments !== undefined
            ? buildChecklistFromUploads(input.uploadedDocuments)
            : existing.documentsChecklist,
      studentName: input.studentName ?? existing.studentName,
      gender: input.gender !== undefined ? input.gender || null : existing.gender,
      dateOfBirth:
        input.dateOfBirth !== undefined ? input.dateOfBirth || null : existing.dateOfBirth,
      gradeApplied: input.gradeApplied ?? existing.gradeApplied,
      academicYear: input.academicYear ?? existing.academicYear,
      guardianName: input.guardianName ?? existing.guardianName,
      guardianRelation: input.guardianRelation ?? existing.guardianRelation,
      guardianPhone: input.guardianPhone ?? existing.guardianPhone,
      guardianEmail:
        input.guardianEmail !== undefined ? input.guardianEmail || null : existing.guardianEmail,
      previousSchool:
        input.previousSchool !== undefined
          ? input.previousSchool
          : normalizedAcademicDetails?.previousSchoolName || existing.previousSchool,
      admissionType: input.admissionType ?? existing.admissionType ?? "FRESH",
      isDraft: nextIsDraft,
      currentStep: input.currentStep ?? existing.currentStep ?? 1,
      studentPhotoKey:
        input.studentPhotoKey !== undefined ? input.studentPhotoKey : existing.studentPhotoKey,
      nationality: input.nationality !== undefined ? input.nationality : existing.nationality,
      bloodGroup: input.bloodGroup !== undefined ? input.bloodGroup : existing.bloodGroup,
      studentIdNumber: resolvedStudentId,
      studentDetails:
        input.studentDetails !== undefined ? input.studentDetails : existing.studentDetails,
      guardianDetails:
        input.guardianDetails !== undefined ? input.guardianDetails : existing.guardianDetails,
      academicDetails:
        normalizedAcademicDetails !== undefined
          ? normalizedAcademicDetails
          : existing.academicDetails,
      uploadedDocuments:
        input.uploadedDocuments !== undefined ? input.uploadedDocuments : existing.uploadedDocuments,
      declarationAccepted:
        input.declarationAccepted !== undefined
          ? input.declarationAccepted
          : existing.declarationAccepted,
      appliedAt: transitioningFromDraft ? nowIso : existing.appliedAt,
      shortlistedAt:
        nextStatus === "SHORTLISTED" && !existing.shortlistedAt ? nowIso : existing.shortlistedAt,
      admittedAt:
        nextStatus === "ADMITTED" && !existing.admittedAt ? nowIso : existing.admittedAt,
      rejectedAt:
        nextStatus === "REJECTED" && !existing.rejectedAt ? nowIso : existing.rejectedAt,
      verifiedAt:
        nextVerification === "VERIFIED" && !existing.verifiedAt ? nowIso : existing.verifiedAt,
      updatedAt: nowIso,
    };

    store.applications[applicationId] = after;

    const summaryParts: string[] = [];
    if (transitioningFromDraft) {
      summaryParts.push(
        `New application ${after.applicationCode} submitted for ${after.studentName} (${after.gradeApplied}).`,
      );
    } else {
      if (before.status !== after.status) {
        summaryParts.push(
          after.status === "ADMITTED"
            ? `${after.studentName} has been Admitted (${after.admissionNumber}).`
            : `${after.studentName}'s application moved to ${after.status.replace(/_/g, " ")}.`,
        );
      }
      if (before.verificationStatus !== after.verificationStatus) {
        summaryParts.push(
          `Document verification for ${after.studentName} marked ${after.verificationStatus}.`,
        );
      }
      if (summaryParts.length === 0) {
        summaryParts.push(`Updated application details for ${after.studentName} (${after.applicationCode}).`);
      }
    }

    if (!nextIsDraft) {
      store.activities.unshift({
        id: randomUUID(),
        schoolId,
        applicationId: after.id,
        enquiryId: null,
        actorId: actor.id,
        actorName: actor.name,
        action: transitioningFromDraft ? "APPLICATION_CREATED" : "APPLICATION_UPDATED",
        summary: summaryParts.join(" "),
        createdAt: nowIso,
      });
    }

    saveStore(store);
    return { before, after };
  }

  async createEnquiry(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: CreateEnquiryInput,
  ): Promise<AdmissionEnquiryRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createEnquiry", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const updatedSetting = await tx.admissionSetting.upsert({
              where: { schoolId },
              update: { nextEnquirySeq: { increment: 1 } },
              create: {
                schoolId,
                currentAcademicYear: getCurrentAcademicYearLabel(),
                applicationPrefix: "APP",
                enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                nextEnquirySeq: 2,
              },
            });
            const seq = updatedSetting.nextEnquirySeq - 1;
            const enquiryCode = `ENQ${extractYearTag(input.academicYear)}-${String(seq).padStart(4, "0")}`;

            const created = await tx.admissionEnquiry.create({
              data: {
                schoolId,
                enquiryCode,
                studentName: input.studentName,
                guardianName: input.guardianName,
                guardianPhone: input.guardianPhone,
                guardianEmail: input.guardianEmail || null,
                gradeApplied: input.gradeApplied,
                academicYear: input.academicYear,
                source: input.source,
                status: "NEW",
                notes: input.notes || null,
                createdByUserId: actor.id,
              },
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                enquiryId: created.id,
                actorId: actor.id,
                actorName: actor.name,
                action: "ENQUIRY_CREATED",
                summary: `Enquiry ${enquiryCode} logged for ${input.studentName} (${input.gradeApplied}).`,
              },
            });

            return mapPrismaEnquiry(created);
          });
        });
      } catch (err) {
        handlePrismaError("createEnquiry", err);
      }
    }

    const store = loadStore();
    const setting = this.getOrCreateFallbackSetting(store, schoolId);
    const seq = setting.nextEnquirySeq;
    setting.nextEnquirySeq += 1;
    const enquiryCode = `ENQ${extractYearTag(input.academicYear)}-${String(seq).padStart(4, "0")}`;

    const record: AdmissionEnquiryRecord = {
      id: randomUUID(),
      schoolId,
      enquiryCode,
      studentName: input.studentName,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || null,
      gradeApplied: input.gradeApplied,
      academicYear: input.academicYear,
      source: input.source,
      status: "NEW",
      notes: input.notes || null,
      convertedApplicationId: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.enquiries[record.id] = record;
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId: record.id,
      actorId: actor.id,
      actorName: actor.name,
      action: "ENQUIRY_CREATED",
      summary: `Enquiry ${enquiryCode} logged for ${input.studentName} (${input.gradeApplied}).`,
      createdAt: nowIso,
    });
    saveStore(store);
    return record;
  }

  async updateOrConvertEnquiry(
    explicitSchoolId: string,
    enquiryId: string,
    actor: ActorMeta,
    input: UpdateEnquiryInput,
  ): Promise<{ enquiry: AdmissionEnquiryRecord; createdApplication?: AdmissionApplicationRecord }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (input.action === "convert") {
      const existing = await this.getEnquiryById(schoolId, enquiryId);
      const createdApplication = await this.createApplication(schoolId, actor, {
        studentName: existing.studentName,
        gender: "",
        dateOfBirth: "",
        gradeApplied: existing.gradeApplied,
        academicYear: existing.academicYear,
        guardianName: existing.guardianName,
        guardianRelation: "Parent",
        guardianPhone: existing.guardianPhone,
        guardianEmail: existing.guardianEmail || "",
        previousSchool: "",
        status: "UNDER_REVIEW",
        enquiryId: existing.id,
        notes: existing.notes || "",
      });
      const updatedEnquiry = await this.getEnquiryById(schoolId, enquiryId);
      return { enquiry: updatedEnquiry, createdApplication };
    }

    const nowIso = new Date().toISOString();
    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateEnquiry", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const existing = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!existing) {
              throw new NotFoundError("Admission enquiry");
            }
            const updated = await tx.admissionEnquiry.update({
              where: { id: existing.id },
              data: {
                status: input.status ?? existing.status,
                notes: input.notes !== undefined ? input.notes : existing.notes,
              },
            });
            return { enquiry: mapPrismaEnquiry(updated) };
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("updateEnquiry", err);
      }
    }

    const store = loadStore();
    const existing = store.enquiries[enquiryId];
    if (!existing || existing.schoolId !== schoolId) {
      throw new NotFoundError("Admission enquiry");
    }
    const updated: AdmissionEnquiryRecord = {
      ...existing,
      status: input.status ?? existing.status,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: nowIso,
    };
    store.enquiries[enquiryId] = updated;
    saveStore(store);
    return { enquiry: updated };
  }

  async getEnquiryById(
    explicitSchoolId: string,
    enquiryId: string,
  ): Promise<AdmissionEnquiryRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("getEnquiryById", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const row = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!row) throw new NotFoundError("Admission enquiry");
            return mapPrismaEnquiry(row);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("getEnquiryById", err);
      }
    }

    const store = loadStore();
    const record = store.enquiries[enquiryId];
    if (!record || record.schoolId !== schoolId) {
      throw new NotFoundError("Admission enquiry");
    }
    return record;
  }

  async updateSettings(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: UpdateAdmissionsSettingsInput,
  ): Promise<AdmissionSettingRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const deadlineDate =
      input.applicationDeadline && input.applicationDeadline.trim() !== ""
        ? new Date(`${input.applicationDeadline}T18:29:59.000Z`)
        : null;
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateSettings", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const updated = await tx.admissionSetting.upsert({
              where: { schoolId },
              update: {
                currentAcademicYear: input.currentAcademicYear,
                applicationDeadline: deadlineDate,
                applicationPrefix: input.applicationPrefix,
                enabledGrades: input.enabledGrades,
              },
              create: {
                schoolId,
                currentAcademicYear: input.currentAcademicYear,
                applicationDeadline: deadlineDate,
                applicationPrefix: input.applicationPrefix,
                enabledGrades: input.enabledGrades,
              },
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                actorId: actor.id,
                actorName: actor.name,
                action: "SETTINGS_UPDATED",
                summary: `Updated admission settings for ${input.currentAcademicYear}.`,
              },
            });

            return mapPrismaSetting(updated);
          });
        });
      } catch (err) {
        handlePrismaError("updateSettings", err);
      }
    }

    const store = loadStore();
    const setting = this.getOrCreateFallbackSetting(store, schoolId);
    setting.currentAcademicYear = input.currentAcademicYear;
    setting.applicationDeadline = deadlineDate ? deadlineDate.toISOString() : null;
    setting.applicationPrefix = input.applicationPrefix;
    setting.enabledGrades = input.enabledGrades;
    setting.updatedAt = nowIso;

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "SETTINGS_UPDATED",
      summary: `Updated admission settings for ${input.currentAcademicYear}.`,
      createdAt: nowIso,
    });

    saveStore(store);
    return setting;
  }

  async createReminder(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: CreateReminderInput,
  ): Promise<AdmissionReminderRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const dueDate =
      input.dueDate && input.dueDate.trim() !== "" ? new Date(`${input.dueDate}T00:00:00.000Z`) : null;
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createReminder", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const created = await tx.admissionReminder.create({
              data: {
                schoolId,
                title: input.title,
                academicYear: input.academicYear || null,
                dueDate,
                priority: input.priority,
                createdByUserId: actor.id,
              },
            });
            return mapPrismaReminder(created);
          });
        });
      } catch (err) {
        handlePrismaError("createReminder", err);
      }
    }

    const store = loadStore();
    const record: AdmissionReminderRecord = {
      id: randomUUID(),
      schoolId,
      title: input.title,
      academicYear: input.academicYear || null,
      dueDate: dueDate ? dueDate.toISOString() : null,
      priority: input.priority,
      isCompleted: false,
      createdAt: nowIso,
    };
    store.reminders[record.id] = record;
    saveStore(store);
    return record;
  }

  async toggleReminder(
    explicitSchoolId: string,
    reminderId: string,
    isCompleted: boolean,
  ): Promise<AdmissionReminderRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("toggleReminder", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const existing = await tx.admissionReminder.findFirst({
              where: { id: reminderId, schoolId },
            });
            if (!existing) throw new NotFoundError("Admission reminder");
            const updated = await tx.admissionReminder.update({
              where: { id: existing.id },
              data: { isCompleted },
            });
            return mapPrismaReminder(updated);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("toggleReminder", err);
      }
    }

    const store = loadStore();
    const existing = store.reminders[reminderId];
    if (!existing || existing.schoolId !== schoolId) {
      throw new NotFoundError("Admission reminder");
    }
    const updated = { ...existing, isCompleted };
    store.reminders[reminderId] = updated;
    saveStore(store);
    return updated;
  }

  async deleteReminder(explicitSchoolId: string, reminderId: string): Promise<void> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        await runPrismaOp("deleteReminder", async () => {
          await db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const existing = await tx.admissionReminder.findFirst({
              where: { id: reminderId, schoolId },
            });
            if (!existing) throw new NotFoundError("Admission reminder");
            await tx.admissionReminder.delete({ where: { id: existing.id } });
          });
        });
        return;
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("deleteReminder", err);
      }
    }

    const store = loadStore();
    const existing = store.reminders[reminderId];
    if (!existing || existing.schoolId !== schoolId) {
      throw new NotFoundError("Admission reminder");
    }
    delete store.reminders[reminderId];
    saveStore(store);
  }

  async importApplications(
    explicitSchoolId: string,
    actor: ActorMeta,
    items: CreateApplicationInput[],
  ): Promise<AdmissionApplicationRecord[]> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const now = new Date();
    const nowIso = now.toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("importApplications", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            let setting = await tx.admissionSetting.findUnique({ where: { schoolId } });
            if (!setting) {
              setting = await tx.admissionSetting.create({
                data: {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                },
              });
            }

            const updatedSetting = await tx.admissionSetting.update({
              where: { schoolId },
              data: { nextApplicationSeq: { increment: items.length } },
            });
            const firstSeq = updatedSetting.nextApplicationSeq - items.length;
            const createdRecords: AdmissionApplicationRecord[] = [];

            for (let idx = 0; idx < items.length; idx += 1) {
              const item = items[idx]!;
              const seq = firstSeq + idx;
              const applicationCode = `${setting.applicationPrefix}${extractYearTag(item.academicYear)}-${String(seq).padStart(4, "0")}`;

              const created = await tx.admissionApplication.create({
                data: {
                  schoolId,
                  applicationCode,
                  enquiryId: item.enquiryId ?? null,
                  studentName: item.studentName,
                  gender: item.gender || null,
                  dateOfBirth: item.dateOfBirth ? new Date(`${item.dateOfBirth}T00:00:00.000Z`) : null,
                  gradeApplied: item.gradeApplied,
                  academicYear: item.academicYear,
                  guardianName: item.guardianName,
                  guardianRelation: item.guardianRelation ?? "Parent",
                  guardianPhone: item.guardianPhone,
                  guardianEmail: item.guardianEmail || null,
                  previousSchool: item.previousSchool || null,
                  status: item.status ?? "UNDER_REVIEW",
                  verificationStatus: "PENDING",
                  verificationNotes: item.notes || null,
                  documentsChecklist: cloneDefaultChecklist() as any,
                  appliedAt: now,
                  shortlistedAt: item.status === "SHORTLISTED" ? now : null,
                  reviewedByUserId: actor.id,
                },
              });
              createdRecords.push(mapPrismaApplication(created));
            }

            await tx.admissionActivity.create({
              data: {
                schoolId,
                actorId: actor.id,
                actorName: actor.name,
                action: "APPLICATION_CREATED",
                summary: `Imported ${createdRecords.length} admission application${createdRecords.length === 1 ? "" : "s"}.`,
              },
            });

            return createdRecords;
          });
        });
      } catch (err) {
        handlePrismaError("importApplications", err);
      }
    }

    const store = loadStore();
    const setting = this.getOrCreateFallbackSetting(store, schoolId);
    const createdRecords: AdmissionApplicationRecord[] = [];

    for (const item of items) {
      const seq = setting.nextApplicationSeq;
      setting.nextApplicationSeq += 1;
      const applicationCode = `${setting.applicationPrefix}${extractYearTag(item.academicYear)}-${String(seq).padStart(4, "0")}`;
      const record: AdmissionApplicationRecord = {
        id: randomUUID(),
        schoolId,
        applicationCode,
        admissionNumber: null,
        enquiryId: item.enquiryId ?? null,
        studentName: item.studentName,
        gender: item.gender || null,
        dateOfBirth: item.dateOfBirth || null,
        gradeApplied: item.gradeApplied,
        academicYear: item.academicYear,
        guardianName: item.guardianName,
        guardianRelation: item.guardianRelation ?? "Parent",
        guardianPhone: item.guardianPhone,
        guardianEmail: item.guardianEmail || null,
        previousSchool: item.previousSchool || null,
        admissionType: item.admissionType ?? "FRESH",
        isDraft: false,
        currentStep: 1,
        status: item.status ?? "UNDER_REVIEW",
        verificationStatus: "PENDING",
        verificationNotes: item.notes || null,
        documentsChecklist: cloneDefaultChecklist(),
        appliedAt: nowIso,
        shortlistedAt: item.status === "SHORTLISTED" ? nowIso : null,
        admittedAt: null,
        rejectedAt: null,
        verifiedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.applications[record.id] = record;
      createdRecords.push(record);
    }

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "APPLICATION_CREATED",
      summary: `Imported ${createdRecords.length} admission application${createdRecords.length === 1 ? "" : "s"}.`,
      createdAt: nowIso,
    });

    saveStore(store);
    return createdRecords;
  }

  async bulkUpdateApplications(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: BulkUpdateApplicationsInput,
  ): Promise<AdmissionApplicationRecord[]> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const uniqueIds = Array.from(new Set(input.applicationIds));
    const now = new Date();
    const nowIso = now.toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("bulkUpdateApplications", async () => {
          return db.$transaction(async (tx) => {
            await setTransactionTenantContext(tx, schoolId);
            const rows = await tx.admissionApplication.findMany({
              where: { id: { in: uniqueIds }, schoolId },
            });
            if (rows.length !== uniqueIds.length) {
              throw new NotFoundError("Admission application");
            }

            const updatedRecords: AdmissionApplicationRecord[] = [];
            for (const existingRow of rows) {
              const nextStatus: AdmissionApplicationStatusType = input.status ?? existingRow.status;
              let admissionNumber = existingRow.admissionNumber;
              if (nextStatus === "ADMITTED" && !admissionNumber) {
                const updatedSetting = await tx.admissionSetting.upsert({
                  where: { schoolId },
                  update: { nextAdmissionSeq: { increment: 1 } },
                  create: {
                    schoolId,
                    currentAcademicYear: getCurrentAcademicYearLabel(),
                    applicationPrefix: "APP",
                    enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                    nextAdmissionSeq: 2,
                  },
                });
                const seq = updatedSetting.nextAdmissionSeq - 1;
                admissionNumber = `ADM${extractYearTag(existingRow.academicYear)}-${String(seq).padStart(4, "0")}`;
              }
              const nextVerification = input.verificationStatus ?? existingRow.verificationStatus;

              const updatedRow = await tx.admissionApplication.update({
                where: { id: existingRow.id },
                data: {
                  status: nextStatus,
                  admissionNumber,
                  verificationStatus: nextVerification,
                  verificationNotes:
                    input.verificationNotes !== undefined
                      ? input.verificationNotes
                      : existingRow.verificationNotes,
                  shortlistedAt:
                    nextStatus === "SHORTLISTED" && !existingRow.shortlistedAt
                      ? now
                      : existingRow.shortlistedAt,
                  admittedAt:
                    nextStatus === "ADMITTED" && !existingRow.admittedAt
                      ? now
                      : existingRow.admittedAt,
                  rejectedAt:
                    nextStatus === "REJECTED" && !existingRow.rejectedAt
                      ? now
                      : existingRow.rejectedAt,
                  verifiedAt:
                    nextVerification === "VERIFIED" && !existingRow.verifiedAt
                      ? now
                      : existingRow.verifiedAt,
                  reviewedByUserId: actor.id,
                },
              });
              updatedRecords.push(mapPrismaApplication(updatedRow));
            }

            const targetSummary = input.status
              ? `stage ${input.status.replace(/_/g, " ")}`
              : `verification ${input.verificationStatus ?? "updated"}`;
            await tx.admissionActivity.create({
              data: {
                schoolId,
                actorId: actor.id,
                actorName: actor.name,
                action: "APPLICATION_UPDATED",
                summary: `Bulk updated ${updatedRecords.length} application${updatedRecords.length === 1 ? "" : "s"} (${targetSummary}).`,
              },
            });

            return updatedRecords;
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("bulkUpdateApplications", err);
      }
    }

    const store = loadStore();
    const targets: AdmissionApplicationRecord[] = [];
    for (const id of uniqueIds) {
      const existing = store.applications[id];
      if (!existing || existing.schoolId !== schoolId) {
        throw new NotFoundError("Admission application");
      }
      targets.push(existing);
    }

    const updatedRecords: AdmissionApplicationRecord[] = [];
    for (const existing of targets) {
      const nextStatus: AdmissionApplicationStatusType = input.status ?? existing.status;
      let admissionNumber = existing.admissionNumber;
      if (nextStatus === "ADMITTED" && !admissionNumber) {
        const setting = this.getOrCreateFallbackSetting(store, schoolId);
        const seq = setting.nextAdmissionSeq;
        setting.nextAdmissionSeq += 1;
        admissionNumber = `ADM${extractYearTag(existing.academicYear)}-${String(seq).padStart(4, "0")}`;
      }
      const nextVerification = input.verificationStatus ?? existing.verificationStatus;
      const after: AdmissionApplicationRecord = {
        ...existing,
        status: nextStatus,
        admissionNumber,
        verificationStatus: nextVerification,
        verificationNotes:
          input.verificationNotes !== undefined ? input.verificationNotes : existing.verificationNotes,
        shortlistedAt:
          nextStatus === "SHORTLISTED" && !existing.shortlistedAt ? nowIso : existing.shortlistedAt,
        admittedAt:
          nextStatus === "ADMITTED" && !existing.admittedAt ? nowIso : existing.admittedAt,
        rejectedAt:
          nextStatus === "REJECTED" && !existing.rejectedAt ? nowIso : existing.rejectedAt,
        verifiedAt:
          nextVerification === "VERIFIED" && !existing.verifiedAt ? nowIso : existing.verifiedAt,
        updatedAt: nowIso,
      };
      store.applications[after.id] = after;
      updatedRecords.push(after);
    }

    const targetSummary = input.status
      ? `stage ${input.status.replace(/_/g, " ")}`
      : `verification ${input.verificationStatus ?? "updated"}`;
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "APPLICATION_UPDATED",
      summary: `Bulk updated ${updatedRecords.length} application${updatedRecords.length === 1 ? "" : "s"} (${targetSummary}).`,
      createdAt: nowIso,
    });

    saveStore(store);
    return updatedRecords;
  }
}

export const admissionsRepository = new AdmissionsTenantRepository();
