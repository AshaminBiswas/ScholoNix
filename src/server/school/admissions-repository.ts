/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { tenantCache } from "@/server/integrations/redis";
import { ConflictError, NotFoundError, ServiceUnavailableError, TenantNotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  DEFAULT_ADMISSION_GRADES,
  DEFAULT_DOCUMENT_CHECKLIST,
  DEFAULT_ENQUIRY_SOURCES,
  mergeExtendedSettings,
  resolveClassFeePaiseForGrade,
  type AdmissionAcademicDetailsPayload,
  type AdmissionActivityRecord,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type AdmissionDocumentChecklistItem,
  type AdmissionEnquiryCommunicationRecord,
  type AdmissionEnquiryFollowUpRecord,
  type AdmissionEnquiryNoteRecord,
  type AdmissionEnquiryRecord,
  type AdmissionEnquirySourceRecord,
  type AdmissionFeeLedgerRecord,
  type AdmissionFeePaymentRecord,
  type AdmissionGuardianDetailsPayload,
  type AdmissionReminderRecord,
  type AdmissionSettingRecord,
  type AdmissionStudentDetailsPayload,
  type AdmissionTypeValue,
  type AdmissionUploadedDocument,
  type AdmittedEnrollmentStatusValue,
  type AdmittedFeeHeadValue,
  type AdmittedFeePaymentStatusValue,
  type AdmittedPaymentModeValue,
  type EnquiryCommunicationAttachment,
  type EnquiryCommunicationChannelValue,
  type EnquiryDossierData,
  type EnquiryFollowUpStatusValue,
  type EnquiryFollowUpTypeValue,
  type EnquiryNoteCategoryValue,
  type SchoolStaffOption,
} from "@/modules/school/admissions/types";
import { assertTenantDocumentStorageKey } from "./admissions-document-storage";
import type {
  BulkUpdateApplicationsInput,
  CreateApplicationInput,
  CreateEnquiryCommunicationInput,
  CreateEnquiryFollowUpInput,
  CreateEnquiryInput,
  CreateEnquiryNoteInput,
  CreateEnquirySourceInput,
  CreateReminderInput,
  DirectAdmitStudentInput,
  RecordAdmittedFeePaymentInput,
  UpdateAdmissionsSettingsInput,
  UpdateAdmittedEnrollmentInput,
  UpdateApplicationInput,
  UpdateEnquiryFollowUpInput,
  UpdateEnquiryInput,
  UpdateEnquiryNoteInput,
  UpdateEnquirySourceInput,
  UpsertAdmittedFeeLedgerInput,
} from "@/modules/school/admissions/schemas";
import { getCurrentAcademicYearLabel } from "./admissions-analytics";

interface StoredSetting extends AdmissionSettingRecord {
  nextApplicationSeq: number;
  nextEnquirySeq: number;
  nextAdmissionSeq: number;
  nextReceiptSeq: number;
}

interface StoredRawFeeLedger {
  id: string;
  schoolId: string;
  applicationId: string;
  academicYear: string;
  totalFeePaise: number;
  concessionPaise: number;
  concessionReason: string | null;
  currency: string;
  updatedAt: string;
}

interface AdmissionsStoreState {
  settings: Record<string, StoredSetting>;
  applications: Record<string, AdmissionApplicationRecord>;
  enquiries: Record<string, AdmissionEnquiryRecord>;
  enquirySources: Record<string, AdmissionEnquirySourceRecord>;
  enquiryFollowUps: Record<string, AdmissionEnquiryFollowUpRecord>;
  enquiryCommunications: Record<string, AdmissionEnquiryCommunicationRecord>;
  enquiryNotes: Record<string, AdmissionEnquiryNoteRecord>;
  feeLedgers: Record<string, StoredRawFeeLedger>;
  feePayments: Record<string, AdmissionFeePaymentRecord>;
  reminders: Record<string, AdmissionReminderRecord>;
  activities: AdmissionActivityRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "admissions-store.json");

let storeMemory: AdmissionsStoreState = {
  settings: {},
  applications: {},
  enquiries: {},
  enquirySources: {},
  enquiryFollowUps: {},
  enquiryCommunications: {},
  enquiryNotes: {},
  feeLedgers: {},
  feePayments: {},
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
        enquirySources: parsed.enquirySources || {},
        enquiryFollowUps: parsed.enquiryFollowUps || {},
        enquiryCommunications: parsed.enquiryCommunications || {},
        enquiryNotes: parsed.enquiryNotes || {},
        feeLedgers: parsed.feeLedgers || {},
        feePayments: parsed.feePayments || {},
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
    enquirySources: {},
    enquiryFollowUps: {},
    enquiryCommunications: {},
    enquiryNotes: {},
    feeLedgers: {},
    feePayments: {},
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
const PRISMA_DEV_OP_TIMEOUT_MS = 25_000;
const PRISMA_TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 } as const;

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
    message.includes("does not exist") ||
    message.includes("relation \"admission_")
  );
}

interface AdmissionsSchemaCaps {
  hasReceiptSeq: boolean;
  hasEnrollmentStatus: boolean;
  hasFeeLedgers: boolean;
  hasFeePayments: boolean;
  checkedAt: number;
}

const globalForAdmissionsCaps = globalThis as unknown as {
  admissionsSchemaCaps?: AdmissionsSchemaCaps;
};

async function getAdmissionsSchemaCaps(tx: any): Promise<AdmissionsSchemaCaps> {
  const cached = globalForAdmissionsCaps.admissionsSchemaCaps;
  const now = Date.now();
  if (cached) {
    const allReady =
      cached.hasReceiptSeq &&
      cached.hasEnrollmentStatus &&
      cached.hasFeeLedgers &&
      cached.hasFeePayments;
    const ttl = allReady ? 300_000 : 15_000;
    if (now - cached.checkedAt < ttl) {
      return cached;
    }
  }

  try {
    const rows = (await tx.$queryRawUnsafe(`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'admission_settings'
            AND column_name = 'next_receipt_seq'
        ) AS has_receipt_seq,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'admission_applications'
            AND column_name = 'enrollment_status'
        ) AS has_enrollment_status,
        to_regclass('public.admission_fee_ledgers') IS NOT NULL AS has_fee_ledgers,
        to_regclass('public.admission_fee_payments') IS NOT NULL AS has_fee_payments
    `)) as Array<{
      has_receipt_seq?: boolean;
      has_enrollment_status?: boolean;
      has_fee_ledgers?: boolean;
      has_fee_payments?: boolean;
    }>;
    const row = rows?.[0];
    const caps: AdmissionsSchemaCaps = {
      hasReceiptSeq: Boolean(row?.has_receipt_seq),
      hasEnrollmentStatus: Boolean(row?.has_enrollment_status),
      hasFeeLedgers: Boolean(row?.has_fee_ledgers),
      hasFeePayments: Boolean(row?.has_fee_payments),
      checkedAt: now,
    };
    globalForAdmissionsCaps.admissionsSchemaCaps = caps;
    return caps;
  } catch {
    return {
      hasReceiptSeq: false,
      hasEnrollmentStatus: false,
      hasFeeLedgers: false,
      hasFeePayments: false,
      checkedAt: now,
    };
  }
}

function getSettingSelect(caps: AdmissionsSchemaCaps) {
  return {
    id: true,
    schoolId: true,
    currentAcademicYear: true,
    applicationDeadline: true,
    applicationPrefix: true,
    nextApplicationSeq: true,
    nextEnquirySeq: true,
    nextAdmissionSeq: true,
    enabledGrades: true,
    extendedConfig: true,
    createdAt: true,
    updatedAt: true,
    ...(caps.hasReceiptSeq ? { nextReceiptSeq: true } : {}),
  } as const;
}

function getApplicationSelect(caps: AdmissionsSchemaCaps) {
  return {
    id: true,
    schoolId: true,
    applicationCode: true,
    admissionNumber: true,
    enquiryId: true,
    studentName: true,
    gender: true,
    dateOfBirth: true,
    gradeApplied: true,
    academicYear: true,
    guardianName: true,
    guardianRelation: true,
    guardianPhone: true,
    guardianEmail: true,
    previousSchool: true,
    status: true,
    verificationStatus: true,
    verificationNotes: true,
    documentsChecklist: true,
    admissionType: true,
    isDraft: true,
    currentStep: true,
    studentPhotoKey: true,
    nationality: true,
    bloodGroup: true,
    studentIdNumber: true,
    studentDetails: true,
    guardianDetails: true,
    academicDetails: true,
    uploadedDocuments: true,
    declarationAccepted: true,
    appliedAt: true,
    shortlistedAt: true,
    admittedAt: true,
    rejectedAt: true,
    verifiedAt: true,
    reviewedByUserId: true,
    createdAt: true,
    updatedAt: true,
    ...(caps.hasEnrollmentStatus ? { enrollmentStatus: true } : {}),
  } as const;
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

async function setTransactionTenantContext(
  tx: Prisma.TransactionClient,
  schoolId: string,
): Promise<void> {
  if (!UUID_REGEX.test(schoolId)) {
    return;
  }
  await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
}

async function runTenantTx<T>(
  schoolId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      await setTransactionTenantContext(tx, schoolId);
      return fn(tx);
    },
    PRISMA_TX_OPTIONS,
  );
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
    extendedConfig: mergeExtendedSettings(row.extendedConfig),
    nextApplicationSeq: row.nextApplicationSeq,
    nextEnquirySeq: row.nextEnquirySeq,
    nextAdmissionSeq: row.nextAdmissionSeq,
    nextReceiptSeq: typeof row.nextReceiptSeq === "number" ? row.nextReceiptSeq : 1,
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
    enrollmentStatus: (row.enrollmentStatus as AdmittedEnrollmentStatusValue) ?? "ACTIVE",
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
    enquiryDate: row.enquiryDate
      ? new Date(row.enquiryDate).toISOString()
      : new Date(row.createdAt).toISOString(),
    studentName: row.studentName,
    studentDob: row.studentDob ?? null,
    studentGender: row.studentGender ?? null,
    guardianName: row.guardianName,
    guardianRelation: row.guardianRelation ?? "Parent",
    guardianPhone: row.guardianPhone,
    guardianEmail: row.guardianEmail ?? null,
    addressLine1: row.addressLine1 ?? null,
    addressLine2: row.addressLine2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    pinCode: row.pinCode ?? null,
    gradeApplied: row.gradeApplied,
    academicYear: row.academicYear,
    source: row.source,
    enquiryType: row.enquiryType ?? "General",
    status: row.status,
    assignedToUserId: row.assignedToUserId ?? null,
    assignedToName: row.assignedToName ?? null,
    nextFollowUpAt: row.nextFollowUpAt ? new Date(row.nextFollowUpAt).toISOString() : null,
    hasSiblingsInSchool: Boolean(row.hasSiblingsInSchool),
    interestedInTransport: Boolean(row.interestedInTransport),
    interestedInHostel: Boolean(row.interestedInHostel),
    requiresSpecialSupport: Boolean(row.requiresSpecialSupport),
    isDraft: Boolean(row.isDraft),
    notes: row.notes ?? null,
    convertedApplicationId: row.convertedApplicationId ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function getIstDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function computeEffectiveFollowUpStatus(
  rawStatus: string,
  scheduledAtIso: string,
): EnquiryFollowUpStatusValue {
  if (rawStatus === "COMPLETED" || rawStatus === "CANCELLED") {
    return rawStatus;
  }
  const scheduledMs = Date.parse(scheduledAtIso);
  if (Number.isNaN(scheduledMs)) {
    return (rawStatus as EnquiryFollowUpStatusValue) || "UPCOMING";
  }
  const scheduledDay = getIstDateKey(new Date(scheduledMs));
  const todayDay = getIstDateKey(new Date());
  if (scheduledDay < todayDay) return "OVERDUE";
  if (scheduledDay === todayDay) return "DUE_TODAY";
  return "UPCOMING";
}

function mapPrismaEnquirySource(row: any): AdmissionEnquirySourceRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    name: row.name,
    description: row.description ?? null,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    colorToken: row.colorToken || "violet",
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapPrismaEnquiryFollowUp(
  row: any,
  enquiry?: {
    enquiryCode?: string;
    studentName?: string;
    guardianName?: string;
    academicYear?: string;
  },
): AdmissionEnquiryFollowUpRecord {
  const scheduledAt = new Date(row.scheduledAt).toISOString();
  return {
    id: row.id,
    schoolId: row.schoolId,
    enquiryId: row.enquiryId,
    enquiryCode: enquiry?.enquiryCode ?? row.enquiry?.enquiryCode,
    studentName: enquiry?.studentName ?? row.enquiry?.studentName,
    guardianName: enquiry?.guardianName ?? row.enquiry?.guardianName,
    academicYear: enquiry?.academicYear ?? row.enquiry?.academicYear,
    followUpType: row.followUpType as EnquiryFollowUpTypeValue,
    scheduledAt,
    completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
    status: computeEffectiveFollowUpStatus(row.status || "UPCOMING", scheduledAt),
    assignedToUserId: row.assignedToUserId ?? null,
    assignedToName: row.assignedToName ?? null,
    notes: row.notes,
    outcome: row.outcome ?? null,
    createdByUserId: row.createdByUserId ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapPrismaEnquiryCommunication(row: any): AdmissionEnquiryCommunicationRecord {
  const attachments = Array.isArray(row.attachments)
    ? (row.attachments as EnquiryCommunicationAttachment[])
    : [];
  return {
    id: row.id,
    schoolId: row.schoolId,
    enquiryId: row.enquiryId,
    channel: row.channel as EnquiryCommunicationChannelValue,
    recipient: row.recipient,
    cc: row.cc ?? null,
    bcc: row.bcc ?? null,
    subject: row.subject,
    message: row.message,
    attachments,
    status: (row.status as "SENT" | "COMPLETED" | "FAILED") || "SENT",
    sentByUserId: row.sentByUserId ?? null,
    sentByName: row.sentByName,
    sentAt: new Date(row.sentAt).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function mapPrismaEnquiryNote(row: any): AdmissionEnquiryNoteRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    enquiryId: row.enquiryId,
    category: (row.category as EnquiryNoteCategoryValue) || "Admission Related",
    title: row.title,
    content: row.content,
    createdByUserId: row.createdByUserId ?? null,
    createdByName: row.createdByName,
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

function rupeesToPaise(rupees: number): number {
  return Math.max(0, Math.round(rupees * 100));
}

function buildEnrichedFeeLedger(
  raw: StoredRawFeeLedger,
  payments: AdmissionFeePaymentRecord[],
): AdmissionFeeLedgerRecord {
  const paidPaise = payments.reduce((sum, p) => sum + p.amountPaise, 0);
  const netPayablePaise = Math.max(0, raw.totalFeePaise - raw.concessionPaise);
  const outstandingPaise = Math.max(0, netPayablePaise - paidPaise);
  let paymentStatus: AdmittedFeePaymentStatusValue = "PENDING";
  if (raw.totalFeePaise > 0 && outstandingPaise === 0) {
    paymentStatus = "PAID";
  } else if (paidPaise > 0 && outstandingPaise === 0) {
    paymentStatus = "PAID";
  } else if (paidPaise > 0) {
    paymentStatus = "PARTIAL";
  }
  const latestPayment = [...payments].sort(
    (a, b) => Date.parse(b.paymentDate) - Date.parse(a.paymentDate),
  )[0];
  return {
    ...raw,
    paidPaise,
    outstandingPaise,
    paymentStatus,
    lastPaymentDate: latestPayment?.paymentDate ?? null,
  };
}

function mapPrismaFeeLedger(row: any): StoredRawFeeLedger {
  return {
    id: row.id,
    schoolId: row.schoolId,
    applicationId: row.applicationId,
    academicYear: row.academicYear,
    totalFeePaise: Number(row.totalFeePaise || 0),
    concessionPaise: Number(row.concessionPaise || 0),
    concessionReason: row.concessionReason ?? null,
    currency: row.currency || "INR",
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapPrismaFeePayment(row: any): AdmissionFeePaymentRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    applicationId: row.applicationId,
    studentName: row.application?.studentName,
    admissionNumber: row.application?.admissionNumber ?? null,
    receiptNumber: row.receiptNumber,
    idempotencyKey: row.idempotencyKey,
    feeHead: row.feeHead as AdmittedFeeHeadValue,
    amountPaise: Number(row.amountPaise || 0),
    paymentDate: new Date(row.paymentDate).toISOString(),
    paymentMode: row.paymentMode as AdmittedPaymentModeValue,
    referenceNo: row.referenceNo ?? null,
    remarks: row.remarks ?? null,
    recordedByUserId: row.recordedByUserId ?? null,
    recordedByName: row.recordedByName,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export const ADMISSIONS_SNAPSHOT_CACHE_KEY = "admissions:snapshot:v3";
const ADMISSIONS_SNAPSHOT_TTL_SECONDS = 60;

export interface TenantAdmissionsSnapshot {
  settings: AdmissionSettingRecord;
  applications: AdmissionApplicationRecord[];
  enquiries: AdmissionEnquiryRecord[];
  enquirySources: AdmissionEnquirySourceRecord[];
  enquiryFollowUps: AdmissionEnquiryFollowUpRecord[];
  admittedFeeLedgers: AdmissionFeeLedgerRecord[];
  admittedFeePayments: AdmissionFeePaymentRecord[];
  staffOptions: SchoolStaffOption[];
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
      Array.isArray(s.enquirySources) &&
      Array.isArray(s.enquiryFollowUps) &&
      Array.isArray(s.admittedFeeLedgers) &&
      Array.isArray(s.admittedFeePayments) &&
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
        extendedConfig: mergeExtendedSettings(null),
        nextApplicationSeq: 1,
        nextEnquirySeq: 1,
        nextAdmissionSeq: 1,
        nextReceiptSeq: 1,
        updatedAt: new Date().toISOString(),
      };
    } else if (!store.settings[schoolId]!.extendedConfig) {
      store.settings[schoolId]!.extendedConfig = mergeExtendedSettings(null);
    }
    if (typeof store.settings[schoolId]!.nextReceiptSeq !== "number") {
      store.settings[schoolId]!.nextReceiptSeq = 1;
    }
    return store.settings[schoolId]!;
  }

  private ensureFallbackSources(
    store: AdmissionsStoreState,
    schoolId: string,
  ): AdmissionEnquirySourceRecord[] {
    const existing = Object.values(store.enquirySources).filter((s) => s.schoolId === schoolId);
    if (existing.length > 0) {
      return existing.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    }
    const nowIso = new Date().toISOString();
    const created: AdmissionEnquirySourceRecord[] = DEFAULT_ENQUIRY_SOURCES.map((def) => {
      const rec: AdmissionEnquirySourceRecord = {
        id: randomUUID(),
        schoolId,
        name: def.name,
        description: def.description,
        isActive: true,
        colorToken: def.colorToken,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.enquirySources[rec.id] = rec;
      return rec;
    });
    saveStore(store);
    return created;
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
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const [
              settingRow,
              appRows,
              enqRows,
              reminderRows,
              activityRows,
              sourceRowsRaw,
              followUpRowsRaw,
              staffRowsRaw,
              feeLedgerRowsRaw,
              feePaymentRowsRaw,
            ] = await Promise.all([
              (tx.admissionSetting as any).findUnique({
                where: { schoolId },
                select: getSettingSelect(caps),
              }),
              (tx.admissionApplication as any).findMany({
                where: { schoolId },
                select: getApplicationSelect(caps),
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
                take: 40,
              }),
              (tx as any).admissionEnquirySource
                ? (tx as any).admissionEnquirySource.findMany({
                    where: { schoolId },
                    orderBy: { createdAt: "asc" },
                  })
                : Promise.resolve([]),
              (tx as any).admissionEnquiryFollowUp
                ? (tx as any).admissionEnquiryFollowUp.findMany({
                    where: { schoolId },
                    orderBy: { scheduledAt: "asc" },
                    include: {
                      enquiry: {
                        select: {
                          enquiryCode: true,
                          studentName: true,
                          guardianName: true,
                          academicYear: true,
                        },
                      },
                    },
                  })
                : Promise.resolve([]),
              tx.user.findMany({
                where: {
                  schoolId,
                  status: "ACTIVE",
                  role: { in: ["SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "STAFF", "ACCOUNTANT"] },
                },
                select: { id: true, name: true, role: true },
                orderBy: { name: "asc" },
              }),
              caps.hasFeeLedgers && (tx as any).admissionFeeLedger
                ? (tx as any).admissionFeeLedger.findMany({ where: { schoolId } })
                : Promise.resolve([]),
              caps.hasFeePayments && (tx as any).admissionFeePayment
                ? (tx as any).admissionFeePayment.findMany({
                    where: { schoolId },
                    orderBy: { paymentDate: "desc" },
                    include: {
                      application: {
                        select: { studentName: true, admissionNumber: true },
                      },
                    },
                  })
                : Promise.resolve([]),
            ]);

            let sourceRows = sourceRowsRaw as any[];
            if (sourceRows.length === 0 && (tx as any).admissionEnquirySource) {
              if (typeof (tx as any).admissionEnquirySource.createMany === "function") {
                await (tx as any).admissionEnquirySource.createMany({
                  data: DEFAULT_ENQUIRY_SOURCES.map((def) => ({
                    schoolId,
                    name: def.name,
                    description: def.description,
                    isActive: true,
                    colorToken: def.colorToken,
                  })),
                  skipDuplicates: true,
                });
                sourceRows = await (tx as any).admissionEnquirySource.findMany({
                  where: { schoolId },
                  orderBy: { createdAt: "asc" },
                });
              }
            }

            const mappedPayments = (feePaymentRowsRaw as any[]).map(mapPrismaFeePayment);
            const paymentsByApp = new Map<string, AdmissionFeePaymentRecord[]>();
            for (const p of mappedPayments) {
              const list = paymentsByApp.get(p.applicationId) ?? [];
              list.push(p);
              paymentsByApp.set(p.applicationId, list);
            }
            const enrichedLedgers = (feeLedgerRowsRaw as any[]).map((l) => {
              const raw = mapPrismaFeeLedger(l);
              return buildEnrichedFeeLedger(raw, paymentsByApp.get(raw.applicationId) ?? []);
            });

            const settings: AdmissionSettingRecord = settingRow
              ? mapPrismaSetting(settingRow)
              : {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationDeadline: null,
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                  extendedConfig: mergeExtendedSettings(null),
                  updatedAt: new Date().toISOString(),
                };

            return {
              settings,
              applications: appRows.map(mapPrismaApplication),
              enquiries: enqRows.map(mapPrismaEnquiry),
              enquirySources: sourceRows.map(mapPrismaEnquirySource),
              enquiryFollowUps: (followUpRowsRaw as any[]).map((r) => mapPrismaEnquiryFollowUp(r)),
              admittedFeeLedgers: enrichedLedgers,
              admittedFeePayments: mappedPayments,
              staffOptions: staffRowsRaw.map((u) => ({
                id: u.id,
                name: u.name,
                role: u.role,
              })),
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
      nextReceiptSeq: _rcp,
      ...publicSettings
    } = setting;
    void _a;
    void _e;
    void _adm;
    void _rcp;

    const fallbackSources = this.ensureFallbackSources(store, schoolId);
    const enquiries = Object.values(store.enquiries).filter((r) => r.schoolId === schoolId);
    const applications = Object.values(store.applications).filter((r) => r.schoolId === schoolId);
    const appById = new Map(applications.map((a) => [a.id, a]));
    const enquiryById = new Map(enquiries.map((e) => [e.id, e]));
    const enquiryFollowUps = Object.values(store.enquiryFollowUps)
      .filter((f) => f.schoolId === schoolId)
      .map((f) => {
        const parent = enquiryById.get(f.enquiryId);
        return {
          ...f,
          status: computeEffectiveFollowUpStatus(f.status, f.scheduledAt),
          enquiryCode: parent?.enquiryCode ?? f.enquiryCode,
          studentName: parent?.studentName ?? f.studentName,
          guardianName: parent?.guardianName ?? f.guardianName,
          academicYear: parent?.academicYear ?? f.academicYear,
        };
      })
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

    const payments = Object.values(store.feePayments)
      .filter((p) => p.schoolId === schoolId)
      .map((p) => {
        const app = appById.get(p.applicationId);
        return {
          ...p,
          studentName: app?.studentName ?? p.studentName,
          admissionNumber: app?.admissionNumber ?? p.admissionNumber,
        };
      })
      .sort((a, b) => Date.parse(b.paymentDate) - Date.parse(a.paymentDate));

    const paymentsByApp = new Map<string, AdmissionFeePaymentRecord[]>();
    for (const p of payments) {
      const list = paymentsByApp.get(p.applicationId) ?? [];
      list.push(p);
      paymentsByApp.set(p.applicationId, list);
    }

    const enrichedLedgers = Object.values(store.feeLedgers)
      .filter((l) => l.schoolId === schoolId)
      .map((raw) => buildEnrichedFeeLedger(raw, paymentsByApp.get(raw.applicationId) ?? []));

    const fallbackSnapshot: TenantAdmissionsSnapshot = {
      settings: publicSettings,
      applications,
      enquiries,
      enquirySources: fallbackSources,
      enquiryFollowUps,
      admittedFeeLedgers: enrichedLedgers,
      admittedFeePayments: payments,
      staffOptions: [],
      reminders: Object.values(store.reminders).filter((r) => r.schoolId === schoolId),
      activities: store.activities.filter((a) => a.schoolId === schoolId).slice(0, 40),
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
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            let setting = await (tx.admissionSetting as any).findUnique({
              where: { schoolId },
              select: getSettingSelect(caps),
            });
            if (!setting) {
              setting = await (tx.admissionSetting as any).create({
                data: {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                },
                select: getSettingSelect(caps),
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

            const updatedSetting = await (tx.admissionSetting as any).update({
              where: { schoolId },
              data: { nextApplicationSeq: { increment: 1 } },
              select: getSettingSelect(caps),
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

            const created = await (tx.admissionApplication as any).create({
              select: getApplicationSelect(caps),
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
                admissionType: admissionType as any,
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
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const found = await (tx.admissionApplication as any).findFirst({
              where: { id: applicationId, schoolId },
              select: getApplicationSelect(caps),
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
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const existingRow = await (tx.admissionApplication as any).findFirst({
              where: { id: applicationId, schoolId },
              select: getApplicationSelect(caps),
            });
            if (!existingRow) {
              throw new NotFoundError("Admission application");
            }

            const before = mapPrismaApplication(existingRow);
            const nextStatus: AdmissionApplicationStatusType = input.status ?? existingRow.status;

            let admissionNumber = existingRow.admissionNumber;
            if (nextStatus === "ADMITTED" && !admissionNumber) {
              const updatedSetting = await (tx.admissionSetting as any).upsert({
                where: { schoolId },
                update: { nextAdmissionSeq: { increment: 1 } },
                create: {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                  nextAdmissionSeq: 2,
                },
                select: getSettingSelect(caps),
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

            const updatedRow = await (tx.admissionApplication as any).update({
              where: { id: existingRow.id },
              select: getApplicationSelect(caps),
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
            if (
              before.status !== "ADMITTED" &&
              after.status === "ADMITTED" &&
              caps.hasFeeLedgers &&
              (tx as any).admissionFeeLedger
            ) {
              const settingRow = await (tx.admissionSetting as any).findUnique({
                where: { schoolId },
                select: getSettingSelect(caps),
              });
              const extCfg = mergeExtendedSettings(settingRow?.extendedConfig);
              if (extCfg.autoApplyClassFeeOnAdmit) {
                const classFeePaise = resolveClassFeePaiseForGrade(extCfg, after.gradeApplied);
                if (classFeePaise > 0) {
                  const existingLedger = await (tx as any).admissionFeeLedger.findUnique({
                    where: { applicationId: after.id },
                    select: { id: true },
                  });
                  if (!existingLedger) {
                    await (tx as any).admissionFeeLedger.create({
                      data: {
                        schoolId,
                        applicationId: after.id,
                        academicYear: after.academicYear,
                        totalFeePaise: classFeePaise,
                        concessionPaise: 0,
                        updatedByUserId: actor.id,
                      },
                    });
                  }
                }
              }
            }
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

    if (before.status !== "ADMITTED" && after.status === "ADMITTED") {
      const setting = this.getOrCreateFallbackSetting(store, schoolId);
      const extCfg = mergeExtendedSettings(setting.extendedConfig);
      if (extCfg.autoApplyClassFeeOnAdmit) {
        const classFeePaise = resolveClassFeePaiseForGrade(extCfg, after.gradeApplied);
        const alreadyHasLedger = Object.values(store.feeLedgers).some(
          (l) => l.schoolId === schoolId && l.applicationId === after.id,
        );
        if (classFeePaise > 0 && !alreadyHasLedger) {
          const ledgerId = randomUUID();
          store.feeLedgers[ledgerId] = {
            id: ledgerId,
            schoolId,
            applicationId: after.id,
            academicYear: after.academicYear,
            totalFeePaise: classFeePaise,
            concessionPaise: 0,
            concessionReason: null,
            currency: "INR",
            updatedAt: nowIso,
          };
        }
      }
    }

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
    const now = new Date();
    const nowIso = now.toISOString();
    const enquiryDateObj =
      input.enquiryDate && input.enquiryDate.trim() !== ""
        ? new Date(`${input.enquiryDate.slice(0, 10)}T00:00:00.000Z`)
        : now;
    const enquiryDateIso = enquiryDateObj.toISOString();
    const initialFollowUpDate =
      input.initialFollowUp?.scheduledAt && !Number.isNaN(Date.parse(input.initialFollowUp.scheduledAt))
        ? new Date(input.initialFollowUp.scheduledAt)
        : null;
    const isDraft = Boolean(input.isDraft);
    const resolvedStatus =
      initialFollowUpDate && (!input.status || input.status === "NEW")
        ? "FOLLOW_UP"
        : (input.status ?? "NEW");

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createEnquiry", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const updatedSetting = await (tx.admissionSetting as any).upsert({
              where: { schoolId },
              update: { nextEnquirySeq: { increment: 1 } },
              create: {
                schoolId,
                currentAcademicYear: getCurrentAcademicYearLabel(),
                applicationPrefix: "APP",
                enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                nextEnquirySeq: 2,
              },
              select: getSettingSelect(caps),
            });
            const seq = updatedSetting.nextEnquirySeq - 1;
            const enquiryCode = `ENQ${extractYearTag(input.academicYear)}-${String(seq).padStart(4, "0")}`;

            const created = await tx.admissionEnquiry.create({
              data: {
                schoolId,
                enquiryCode,
                enquiryDate: enquiryDateObj,
                studentName: input.studentName,
                studentDob: input.studentDob || null,
                studentGender: input.studentGender || null,
                guardianName: input.guardianName,
                guardianRelation: input.guardianRelation || "Parent",
                guardianPhone: input.guardianPhone,
                guardianEmail: input.guardianEmail || null,
                addressLine1: input.addressLine1 || null,
                addressLine2: input.addressLine2 || null,
                city: input.city || null,
                state: input.state || null,
                pinCode: input.pinCode || null,
                gradeApplied: input.gradeApplied,
                academicYear: input.academicYear,
                source: input.source || "Walk-In",
                enquiryType: input.enquiryType || "General",
                status: resolvedStatus,
                assignedToUserId: input.assignedToUserId || null,
                assignedToName: input.assignedToName || null,
                nextFollowUpAt: initialFollowUpDate,
                hasSiblingsInSchool: Boolean(input.hasSiblingsInSchool),
                interestedInTransport: Boolean(input.interestedInTransport),
                interestedInHostel: Boolean(input.interestedInHostel),
                requiresSpecialSupport: Boolean(input.requiresSpecialSupport),
                isDraft,
                notes: input.notes || null,
                createdByUserId: actor.id,
              } as any,
            });

            if (initialFollowUpDate && input.initialFollowUp && (tx as any).admissionEnquiryFollowUp) {
              await (tx as any).admissionEnquiryFollowUp.create({
                data: {
                  schoolId,
                  enquiryId: created.id,
                  followUpType: input.initialFollowUp.followUpType || "Phone Call",
                  scheduledAt: initialFollowUpDate,
                  status: computeEffectiveFollowUpStatus("UPCOMING", initialFollowUpDate.toISOString()),
                  assignedToUserId:
                    input.initialFollowUp.assignedToUserId || input.assignedToUserId || null,
                  assignedToName:
                    input.initialFollowUp.assignedToName || input.assignedToName || actor.name,
                  notes: input.initialFollowUp.notes || "Initial follow-up scheduled during enquiry creation.",
                  createdByUserId: actor.id,
                },
              });
            }

            if (!isDraft) {
              await tx.admissionActivity.create({
                data: {
                  schoolId,
                  enquiryId: created.id,
                  actorId: actor.id,
                  actorName: actor.name,
                  action: "ENQUIRY_CREATED",
                  summary: `Enquiry ${enquiryCode} logged with source "${input.source || "Walk-In"}" for student ${input.studentName} (${input.gradeApplied}).`,
                },
              });
            }

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
      enquiryDate: enquiryDateIso,
      studentName: input.studentName,
      studentDob: input.studentDob || null,
      studentGender: input.studentGender || null,
      guardianName: input.guardianName,
      guardianRelation: input.guardianRelation || "Parent",
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || null,
      addressLine1: input.addressLine1 || null,
      addressLine2: input.addressLine2 || null,
      city: input.city || null,
      state: input.state || null,
      pinCode: input.pinCode || null,
      gradeApplied: input.gradeApplied,
      academicYear: input.academicYear,
      source: input.source || "Walk-In",
      enquiryType: input.enquiryType || "General",
      status: resolvedStatus,
      assignedToUserId: input.assignedToUserId || null,
      assignedToName: input.assignedToName || null,
      nextFollowUpAt: initialFollowUpDate ? initialFollowUpDate.toISOString() : null,
      hasSiblingsInSchool: Boolean(input.hasSiblingsInSchool),
      interestedInTransport: Boolean(input.interestedInTransport),
      interestedInHostel: Boolean(input.interestedInHostel),
      requiresSpecialSupport: Boolean(input.requiresSpecialSupport),
      isDraft,
      notes: input.notes || null,
      convertedApplicationId: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.enquiries[record.id] = record;

    if (initialFollowUpDate && input.initialFollowUp) {
      const fuId = randomUUID();
      const fuScheduledIso = initialFollowUpDate.toISOString();
      store.enquiryFollowUps[fuId] = {
        id: fuId,
        schoolId,
        enquiryId: record.id,
        enquiryCode: record.enquiryCode,
        studentName: record.studentName,
        guardianName: record.guardianName,
        academicYear: record.academicYear,
        followUpType: input.initialFollowUp.followUpType || "Phone Call",
        scheduledAt: fuScheduledIso,
        completedAt: null,
        status: computeEffectiveFollowUpStatus("UPCOMING", fuScheduledIso),
        assignedToUserId: input.initialFollowUp.assignedToUserId || input.assignedToUserId || null,
        assignedToName: input.initialFollowUp.assignedToName || input.assignedToName || actor.name,
        notes: input.initialFollowUp.notes || "Initial follow-up scheduled during enquiry creation.",
        outcome: null,
        createdByUserId: actor.id,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }

    if (!isDraft) {
      store.activities.unshift({
        id: randomUUID(),
        schoolId,
        applicationId: null,
        enquiryId: record.id,
        actorId: actor.id,
        actorName: actor.name,
        action: "ENQUIRY_CREATED",
        summary: `Enquiry ${enquiryCode} logged with source "${record.source}" for student ${input.studentName} (${input.gradeApplied}).`,
        createdAt: nowIso,
      });
    }
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
      const hasAddress = Boolean(
        existing.addressLine1 || existing.city || existing.state || existing.pinCode,
      );
      const createdApplication = await this.createApplication(schoolId, actor, {
        studentName: existing.studentName,
        gender: (existing.studentGender as "Male" | "Female" | "Other" | "") || "",
        dateOfBirth: existing.studentDob || "",
        gradeApplied: existing.gradeApplied,
        academicYear: existing.academicYear,
        guardianName: existing.guardianName,
        guardianRelation: existing.guardianRelation || "Parent",
        guardianPhone: existing.guardianPhone,
        guardianEmail: existing.guardianEmail || "",
        previousSchool: "",
        status: "UNDER_REVIEW",
        enquiryId: existing.id,
        notes: existing.notes || "",
        studentDetails: hasAddress
          ? {
              email: "",
              phone: "",
              address: {
                addressLine1: existing.addressLine1 || "",
                addressLine2: existing.addressLine2 || "",
                city: existing.city || "",
                state: existing.state || "",
                postalCode: existing.pinCode || "",
              },
            }
          : undefined,
        guardianDetails: {
          primary: {
            fullName: existing.guardianName,
            relationship: existing.guardianRelation || "Parent",
            occupation: "",
            annualIncome: "",
            email: existing.guardianEmail || "",
            phone: existing.guardianPhone,
          },
          sameAsStudentAddress: true,
        },
      });
      const updatedEnquiry = await this.getEnquiryById(schoolId, enquiryId);
      return { enquiry: updatedEnquiry, createdApplication };
    }

    const nowIso = new Date().toISOString();
    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateEnquiry", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const existing = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!existing) {
              throw new NotFoundError("Admission enquiry");
            }
            const dataPatch: Record<string, any> = {};
            if (input.studentName !== undefined) dataPatch.studentName = input.studentName;
            if (input.studentDob !== undefined) dataPatch.studentDob = input.studentDob || null;
            if (input.studentGender !== undefined) dataPatch.studentGender = input.studentGender || null;
            if (input.guardianName !== undefined) dataPatch.guardianName = input.guardianName;
            if (input.guardianRelation !== undefined) dataPatch.guardianRelation = input.guardianRelation || null;
            if (input.guardianPhone !== undefined) dataPatch.guardianPhone = input.guardianPhone;
            if (input.guardianEmail !== undefined) dataPatch.guardianEmail = input.guardianEmail || null;
            if (input.addressLine1 !== undefined) dataPatch.addressLine1 = input.addressLine1 || null;
            if (input.addressLine2 !== undefined) dataPatch.addressLine2 = input.addressLine2 || null;
            if (input.city !== undefined) dataPatch.city = input.city || null;
            if (input.state !== undefined) dataPatch.state = input.state || null;
            if (input.pinCode !== undefined) dataPatch.pinCode = input.pinCode || null;
            if (input.gradeApplied !== undefined) dataPatch.gradeApplied = input.gradeApplied;
            if (input.academicYear !== undefined) dataPatch.academicYear = input.academicYear;
            if (input.enquiryDate && input.enquiryDate.trim() !== "") {
              dataPatch.enquiryDate = new Date(`${input.enquiryDate.slice(0, 10)}T00:00:00.000Z`);
            }
            if (input.source !== undefined) dataPatch.source = input.source;
            if (input.enquiryType !== undefined) dataPatch.enquiryType = input.enquiryType;
            if (input.status !== undefined) dataPatch.status = input.status;
            if (input.assignedToUserId !== undefined) dataPatch.assignedToUserId = input.assignedToUserId || null;
            if (input.assignedToName !== undefined) dataPatch.assignedToName = input.assignedToName || null;
            if (input.hasSiblingsInSchool !== undefined) dataPatch.hasSiblingsInSchool = input.hasSiblingsInSchool;
            if (input.interestedInTransport !== undefined) dataPatch.interestedInTransport = input.interestedInTransport;
            if (input.interestedInHostel !== undefined) dataPatch.interestedInHostel = input.interestedInHostel;
            if (input.requiresSpecialSupport !== undefined) dataPatch.requiresSpecialSupport = input.requiresSpecialSupport;
            if (input.isDraft !== undefined) dataPatch.isDraft = input.isDraft;
            if (input.notes !== undefined) dataPatch.notes = input.notes;

            const updated = await tx.admissionEnquiry.update({
              where: { id: existing.id },
              data: dataPatch as any,
            });

            const changes: string[] = [];
            if (input.status !== undefined && input.status !== existing.status) {
              changes.push(`Status changed from "${existing.status}" to "${input.status}".`);
            }
            if (
              input.assignedToName !== undefined &&
              (input.assignedToName || "Unassigned") !== ((existing as any).assignedToName || "Unassigned")
            ) {
              changes.push(
                `Assigned to ${input.assignedToName || "Unassigned"} (previously ${(existing as any).assignedToName || "Unassigned"}).`,
              );
            }
            await tx.admissionActivity.create({
              data: {
                schoolId,
                enquiryId: existing.id,
                actorId: actor.id,
                actorName: actor.name,
                action:
                  changes.length > 0 && input.status !== existing.status
                    ? "ENQUIRY_STATUS_UPDATED"
                    : "ENQUIRY_UPDATED",
                summary:
                  changes[0] ||
                  `Updated enquiry ${existing.enquiryCode} for ${updated.studentName}.`,
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
      studentName: input.studentName ?? existing.studentName,
      studentDob: input.studentDob !== undefined ? input.studentDob || null : existing.studentDob,
      studentGender:
        input.studentGender !== undefined ? input.studentGender || null : existing.studentGender,
      guardianName: input.guardianName ?? existing.guardianName,
      guardianRelation:
        input.guardianRelation !== undefined
          ? input.guardianRelation || null
          : existing.guardianRelation,
      guardianPhone: input.guardianPhone ?? existing.guardianPhone,
      guardianEmail:
        input.guardianEmail !== undefined ? input.guardianEmail || null : existing.guardianEmail,
      addressLine1:
        input.addressLine1 !== undefined ? input.addressLine1 || null : existing.addressLine1,
      addressLine2:
        input.addressLine2 !== undefined ? input.addressLine2 || null : existing.addressLine2,
      city: input.city !== undefined ? input.city || null : existing.city,
      state: input.state !== undefined ? input.state || null : existing.state,
      pinCode: input.pinCode !== undefined ? input.pinCode || null : existing.pinCode,
      gradeApplied: input.gradeApplied ?? existing.gradeApplied,
      academicYear: input.academicYear ?? existing.academicYear,
      enquiryDate:
        input.enquiryDate && input.enquiryDate.trim() !== ""
          ? new Date(`${input.enquiryDate.slice(0, 10)}T00:00:00.000Z`).toISOString()
          : existing.enquiryDate,
      source: input.source ?? existing.source,
      enquiryType: input.enquiryType ?? existing.enquiryType,
      status: input.status ?? existing.status,
      assignedToUserId:
        input.assignedToUserId !== undefined
          ? input.assignedToUserId || null
          : existing.assignedToUserId,
      assignedToName:
        input.assignedToName !== undefined
          ? input.assignedToName || null
          : existing.assignedToName,
      hasSiblingsInSchool:
        input.hasSiblingsInSchool !== undefined
          ? input.hasSiblingsInSchool
          : existing.hasSiblingsInSchool,
      interestedInTransport:
        input.interestedInTransport !== undefined
          ? input.interestedInTransport
          : existing.interestedInTransport,
      interestedInHostel:
        input.interestedInHostel !== undefined
          ? input.interestedInHostel
          : existing.interestedInHostel,
      requiresSpecialSupport:
        input.requiresSpecialSupport !== undefined
          ? input.requiresSpecialSupport
          : existing.requiresSpecialSupport,
      isDraft: input.isDraft !== undefined ? input.isDraft : existing.isDraft,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: nowIso,
    };
    store.enquiries[enquiryId] = updated;
    const changes: string[] = [];
    if (input.status !== undefined && input.status !== existing.status) {
      changes.push(`Status changed from "${existing.status}" to "${input.status}".`);
    }
    if (
      input.assignedToName !== undefined &&
      (input.assignedToName || "Unassigned") !== (existing.assignedToName || "Unassigned")
    ) {
      changes.push(
        `Assigned to ${input.assignedToName || "Unassigned"} (previously ${existing.assignedToName || "Unassigned"}).`,
      );
    }
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId: existing.id,
      actorId: actor.id,
      actorName: actor.name,
      action:
        changes.length > 0 && input.status !== existing.status
          ? "ENQUIRY_STATUS_UPDATED"
          : "ENQUIRY_UPDATED",
      summary: changes[0] || `Updated enquiry ${existing.enquiryCode} for ${updated.studentName}.`,
      createdAt: nowIso,
    });
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
          return runTenantTx(schoolId, async (tx) => {
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

    const nextExtendedConfig =
      input.extendedConfig !== undefined
        ? mergeExtendedSettings(input.extendedConfig)
        : undefined;

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateSettings", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const updated = await (tx.admissionSetting as any).upsert({
              where: { schoolId },
              select: getSettingSelect(caps),
              update: {
                currentAcademicYear: input.currentAcademicYear,
                applicationDeadline: deadlineDate,
                applicationPrefix: input.applicationPrefix,
                enabledGrades: input.enabledGrades,
                ...(nextExtendedConfig !== undefined
                  ? { extendedConfig: nextExtendedConfig }
                  : {}),
              },
              create: {
                schoolId,
                currentAcademicYear: input.currentAcademicYear,
                applicationDeadline: deadlineDate,
                applicationPrefix: input.applicationPrefix,
                enabledGrades: input.enabledGrades,
                extendedConfig: nextExtendedConfig ?? mergeExtendedSettings(null),
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
    if (nextExtendedConfig !== undefined) {
      setting.extendedConfig = nextExtendedConfig;
    } else if (!setting.extendedConfig) {
      setting.extendedConfig = mergeExtendedSettings(null);
    }
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
          return runTenantTx(schoolId, async (tx) => {
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
          return runTenantTx(schoolId, async (tx) => {
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
          await runTenantTx(schoolId, async (tx) => {
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
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            let setting = await (tx.admissionSetting as any).findUnique({
              where: { schoolId },
              select: getSettingSelect(caps),
            });
            if (!setting) {
              setting = await (tx.admissionSetting as any).create({
                data: {
                  schoolId,
                  currentAcademicYear: getCurrentAcademicYearLabel(),
                  applicationPrefix: "APP",
                  enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                },
                select: getSettingSelect(caps),
              });
            }

            const updatedSetting = await (tx.admissionSetting as any).update({
              where: { schoolId },
              data: { nextApplicationSeq: { increment: items.length } },
              select: getSettingSelect(caps),
            });
            const firstSeq = updatedSetting.nextApplicationSeq - items.length;
            const createdRecords: AdmissionApplicationRecord[] = [];

            for (let idx = 0; idx < items.length; idx += 1) {
              const item = items[idx]!;
              const seq = firstSeq + idx;
              const applicationCode = `${setting.applicationPrefix}${extractYearTag(item.academicYear)}-${String(seq).padStart(4, "0")}`;

              const created = await (tx.admissionApplication as any).create({
                select: getApplicationSelect(caps),
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
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const rows = await (tx.admissionApplication as any).findMany({
              where: { id: { in: uniqueIds }, schoolId },
              select: getApplicationSelect(caps),
            });
            if (rows.length !== uniqueIds.length) {
              throw new NotFoundError("Admission application");
            }

            const updatedRecords: AdmissionApplicationRecord[] = [];
            for (const existingRow of rows) {
              const nextStatus: AdmissionApplicationStatusType = input.status ?? existingRow.status;
              let admissionNumber = existingRow.admissionNumber;
              if (nextStatus === "ADMITTED" && !admissionNumber) {
                const updatedSetting = await (tx.admissionSetting as any).upsert({
                  where: { schoolId },
                  update: { nextAdmissionSeq: { increment: 1 } },
                  create: {
                    schoolId,
                    currentAcademicYear: getCurrentAcademicYearLabel(),
                    applicationPrefix: "APP",
                    enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                    nextAdmissionSeq: 2,
                  },
                  select: getSettingSelect(caps),
                });
                const seq = updatedSetting.nextAdmissionSeq - 1;
                admissionNumber = `ADM${extractYearTag(existingRow.academicYear)}-${String(seq).padStart(4, "0")}`;
              }
              const nextVerification = input.verificationStatus ?? existingRow.verificationStatus;

              const updatedRow = await (tx.admissionApplication as any).update({
                where: { id: existingRow.id },
                select: getApplicationSelect(caps),
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

  async getEnquiryDossier(
    explicitSchoolId: string,
    enquiryId: string,
  ): Promise<EnquiryDossierData> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("getEnquiryDossier", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const row = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!row) throw new NotFoundError("Admission enquiry");

            const [followUpsRaw, commsRaw, notesRaw, activityRows, staffRows] = await Promise.all([
              (tx as any).admissionEnquiryFollowUp
                ? (tx as any).admissionEnquiryFollowUp.findMany({
                    where: { schoolId, enquiryId },
                    orderBy: { scheduledAt: "desc" },
                  })
                : Promise.resolve([]),
              (tx as any).admissionEnquiryCommunication
                ? (tx as any).admissionEnquiryCommunication.findMany({
                    where: { schoolId, enquiryId },
                    orderBy: { sentAt: "desc" },
                  })
                : Promise.resolve([]),
              (tx as any).admissionEnquiryNote
                ? (tx as any).admissionEnquiryNote.findMany({
                    where: { schoolId, enquiryId },
                    orderBy: { createdAt: "desc" },
                  })
                : Promise.resolve([]),
              tx.admissionActivity.findMany({
                where: { schoolId, enquiryId },
                orderBy: { createdAt: "desc" },
                take: 100,
              }),
              tx.user.findMany({
                where: {
                  schoolId,
                  status: "ACTIVE",
                  role: { in: ["SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "STAFF", "ACCOUNTANT"] },
                },
                select: { id: true, name: true, role: true },
                orderBy: { name: "asc" },
              }),
            ]);

            const enquiry = mapPrismaEnquiry(row);
            return {
              enquiry,
              followUps: (followUpsRaw as any[]).map((f) =>
                mapPrismaEnquiryFollowUp(f, {
                  enquiryCode: enquiry.enquiryCode,
                  studentName: enquiry.studentName,
                  guardianName: enquiry.guardianName,
                  academicYear: enquiry.academicYear,
                }),
              ),
              communications: (commsRaw as any[]).map(mapPrismaEnquiryCommunication),
              notes: (notesRaw as any[]).map(mapPrismaEnquiryNote),
              activities: activityRows.map(mapPrismaActivity),
              staffOptions: staffRows.map((u) => ({
                id: u.id,
                name: u.name,
                role: u.role,
              })),
            };
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("getEnquiryDossier", err);
      }
    }

    const store = loadStore();
    const enquiry = store.enquiries[enquiryId];
    if (!enquiry || enquiry.schoolId !== schoolId) {
      throw new NotFoundError("Admission enquiry");
    }

    const followUps = Object.values(store.enquiryFollowUps)
      .filter((f) => f.schoolId === schoolId && f.enquiryId === enquiryId)
      .map((f) => ({
        ...f,
        status: computeEffectiveFollowUpStatus(f.status, f.scheduledAt),
        enquiryCode: enquiry.enquiryCode,
        studentName: enquiry.studentName,
        guardianName: enquiry.guardianName,
        academicYear: enquiry.academicYear,
      }))
      .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt));

    const communications = Object.values(store.enquiryCommunications)
      .filter((c) => c.schoolId === schoolId && c.enquiryId === enquiryId)
      .sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));

    const notes = Object.values(store.enquiryNotes)
      .filter((n) => n.schoolId === schoolId && n.enquiryId === enquiryId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const activities = store.activities
      .filter((a) => a.schoolId === schoolId && a.enquiryId === enquiryId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return {
      enquiry,
      followUps,
      communications,
      notes,
      activities,
      staffOptions: [],
    };
  }

  async listEnquirySources(explicitSchoolId: string): Promise<AdmissionEnquirySourceRecord[]> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("listEnquirySources", async () => {
          return runTenantTx(schoolId, async (tx) => {
            let rows = await (tx as any).admissionEnquirySource.findMany({
              where: { schoolId },
              orderBy: { createdAt: "asc" },
            });
            if (rows.length === 0) {
              rows = await Promise.all(
                DEFAULT_ENQUIRY_SOURCES.map((def) =>
                  (tx as any).admissionEnquirySource.create({
                    data: {
                      schoolId,
                      name: def.name,
                      description: def.description,
                      isActive: true,
                      colorToken: def.colorToken,
                    },
                  }),
                ),
              );
            }
            return (rows as any[]).map(mapPrismaEnquirySource);
          });
        });
      } catch (err) {
        handlePrismaError("listEnquirySources", err);
      }
    }

    const store = loadStore();
    return this.ensureFallbackSources(store, schoolId);
  }

  async createEnquirySource(
    explicitSchoolId: string,
    input: CreateEnquirySourceInput,
  ): Promise<AdmissionEnquirySourceRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createEnquirySource", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const dup = await (tx as any).admissionEnquirySource.findFirst({
              where: { schoolId, name: { equals: input.name.trim(), mode: "insensitive" } },
            });
            if (dup) {
              throw new ConflictError(`Enquiry source "${input.name}" already exists.`);
            }
            const created = await (tx as any).admissionEnquirySource.create({
              data: {
                schoolId,
                name: input.name.trim(),
                description: input.description?.trim() || null,
                isActive: input.isActive ?? true,
                colorToken: input.colorToken || "violet",
              },
            });
            return mapPrismaEnquirySource(created);
          });
        });
      } catch (err) {
        if (err instanceof ConflictError) throw err;
        handlePrismaError("createEnquirySource", err);
      }
    }

    const store = loadStore();
    const existing = this.ensureFallbackSources(store, schoolId);
    if (existing.some((s) => s.name.toLowerCase() === input.name.trim().toLowerCase())) {
      throw new ConflictError(`Enquiry source "${input.name}" already exists.`);
    }
    const created: AdmissionEnquirySourceRecord = {
      id: randomUUID(),
      schoolId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
      colorToken: input.colorToken || "violet",
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.enquirySources[created.id] = created;
    saveStore(store);
    return created;
  }

  async updateEnquirySource(
    explicitSchoolId: string,
    input: UpdateEnquirySourceInput,
  ): Promise<AdmissionEnquirySourceRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateEnquirySource", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const existing = await (tx as any).admissionEnquirySource.findFirst({
              where: { id: input.id, schoolId },
            });
            if (!existing) throw new NotFoundError("Enquiry source");
            const updated = await (tx as any).admissionEnquirySource.update({
              where: { id: existing.id },
              data: {
                name: input.name !== undefined ? input.name.trim() : existing.name,
                description:
                  input.description !== undefined
                    ? input.description?.trim() || null
                    : existing.description,
                isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
                colorToken: input.colorToken ?? existing.colorToken,
              },
            });
            return mapPrismaEnquirySource(updated);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("updateEnquirySource", err);
      }
    }

    const store = loadStore();
    const existing = store.enquirySources[input.id];
    if (!existing || existing.schoolId !== schoolId) {
      throw new NotFoundError("Enquiry source");
    }
    const updated: AdmissionEnquirySourceRecord = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existing.description,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      colorToken: input.colorToken ?? existing.colorToken,
      updatedAt: nowIso,
    };
    store.enquirySources[input.id] = updated;
    saveStore(store);
    return updated;
  }

  async deleteEnquirySource(explicitSchoolId: string, sourceId: string): Promise<void> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        await runPrismaOp("deleteEnquirySource", async () => {
          await runTenantTx(schoolId, async (tx) => {
            const existing = await (tx as any).admissionEnquirySource.findFirst({
              where: { id: sourceId, schoolId },
            });
            if (!existing) throw new NotFoundError("Enquiry source");
            await (tx as any).admissionEnquirySource.delete({ where: { id: existing.id } });
          });
        });
        return;
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("deleteEnquirySource", err);
      }
    }

    const store = loadStore();
    const existing = store.enquirySources[sourceId];
    if (!existing || existing.schoolId !== schoolId) {
      throw new NotFoundError("Enquiry source");
    }
    delete store.enquirySources[sourceId];
    saveStore(store);
  }

  async listEnquiryFollowUps(
    explicitSchoolId: string,
  ): Promise<AdmissionEnquiryFollowUpRecord[]> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("listEnquiryFollowUps", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const rows = await (tx as any).admissionEnquiryFollowUp.findMany({
              where: { schoolId },
              orderBy: { scheduledAt: "asc" },
              include: {
                enquiry: {
                  select: {
                    enquiryCode: true,
                    studentName: true,
                    guardianName: true,
                    academicYear: true,
                  },
                },
              },
            });
            return (rows as any[]).map((r) => mapPrismaEnquiryFollowUp(r));
          });
        });
      } catch (err) {
        handlePrismaError("listEnquiryFollowUps", err);
      }
    }

    const store = loadStore();
    const enquiryById = new Map(
      Object.values(store.enquiries)
        .filter((e) => e.schoolId === schoolId)
        .map((e) => [e.id, e]),
    );
    return Object.values(store.enquiryFollowUps)
      .filter((f) => f.schoolId === schoolId)
      .map((f) => {
        const parent = enquiryById.get(f.enquiryId);
        return {
          ...f,
          status: computeEffectiveFollowUpStatus(f.status, f.scheduledAt),
          enquiryCode: parent?.enquiryCode ?? f.enquiryCode,
          studentName: parent?.studentName ?? f.studentName,
          guardianName: parent?.guardianName ?? f.guardianName,
          academicYear: parent?.academicYear ?? f.academicYear,
        };
      })
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  }

  async createEnquiryFollowUp(
    explicitSchoolId: string,
    enquiryId: string,
    actor: ActorMeta,
    input: CreateEnquiryFollowUpInput,
  ): Promise<AdmissionEnquiryFollowUpRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();
    const scheduledDate = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new NotFoundError("Valid follow-up schedule timestamp");
    }
    const scheduledIso = scheduledDate.toISOString();
    const initialStatus = computeEffectiveFollowUpStatus("UPCOMING", scheduledIso);

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createEnquiryFollowUp", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const enq = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!enq) throw new NotFoundError("Admission enquiry");

            const created = await (tx as any).admissionEnquiryFollowUp.create({
              data: {
                schoolId,
                enquiryId,
                followUpType: input.followUpType,
                scheduledAt: scheduledDate,
                status: initialStatus,
                assignedToUserId: input.assignedToUserId || null,
                assignedToName: input.assignedToName || actor.name,
                notes: input.notes,
                createdByUserId: actor.id,
              },
            });

            const pendingFollowUps = await (tx as any).admissionEnquiryFollowUp.findMany({
              where: { schoolId, enquiryId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
              orderBy: { scheduledAt: "asc" },
              take: 1,
            });
            await tx.admissionEnquiry.update({
              where: { id: enquiryId },
              data: {
                status: enq.status === "NEW" || enq.status === "CONTACTED" ? "FOLLOW_UP" : enq.status,
                nextFollowUpAt: pendingFollowUps[0]?.scheduledAt ?? scheduledDate,
              } as any,
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                enquiryId,
                actorId: actor.id,
                actorName: actor.name,
                action: "FOLLOW_UP_SCHEDULED",
                summary: `Scheduled a follow-up: ${input.followUpType} on ${scheduledIso.slice(0, 10)} (${input.assignedToName || actor.name}).`,
              },
            });

            return mapPrismaEnquiryFollowUp(created, {
              enquiryCode: enq.enquiryCode,
              studentName: enq.studentName,
              guardianName: enq.guardianName,
              academicYear: enq.academicYear,
            });
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("createEnquiryFollowUp", err);
      }
    }

    const store = loadStore();
    const enq = store.enquiries[enquiryId];
    if (!enq || enq.schoolId !== schoolId) {
      throw new NotFoundError("Admission enquiry");
    }

    const created: AdmissionEnquiryFollowUpRecord = {
      id: randomUUID(),
      schoolId,
      enquiryId,
      enquiryCode: enq.enquiryCode,
      studentName: enq.studentName,
      guardianName: enq.guardianName,
      academicYear: enq.academicYear,
      followUpType: input.followUpType || "Phone Call",
      scheduledAt: scheduledIso,
      completedAt: null,
      status: initialStatus,
      assignedToUserId: input.assignedToUserId || null,
      assignedToName: input.assignedToName || actor.name,
      notes: input.notes,
      outcome: null,
      createdByUserId: actor.id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.enquiryFollowUps[created.id] = created;

    const earliest = Object.values(store.enquiryFollowUps)
      .filter(
        (f) =>
          f.schoolId === schoolId &&
          f.enquiryId === enquiryId &&
          f.status !== "COMPLETED" &&
          f.status !== "CANCELLED",
      )
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))[0];

    store.enquiries[enquiryId] = {
      ...enq,
      status: enq.status === "NEW" || enq.status === "CONTACTED" ? "FOLLOW_UP" : enq.status,
      nextFollowUpAt: earliest?.scheduledAt ?? scheduledIso,
      updatedAt: nowIso,
    };
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId,
      actorId: actor.id,
      actorName: actor.name,
      action: "FOLLOW_UP_SCHEDULED",
      summary: `Scheduled a follow-up: ${created.followUpType} on ${scheduledIso.slice(0, 10)} (${created.assignedToName || actor.name}).`,
      createdAt: nowIso,
    });
    saveStore(store);
    return created;
  }

  async updateEnquiryFollowUp(
    explicitSchoolId: string,
    enquiryId: string,
    actor: ActorMeta,
    input: UpdateEnquiryFollowUpInput,
  ): Promise<AdmissionEnquiryFollowUpRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const now = new Date();
    const nowIso = now.toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateEnquiryFollowUp", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const existing = await (tx as any).admissionEnquiryFollowUp.findFirst({
              where: { id: input.followUpId, schoolId, enquiryId },
              include: {
                enquiry: {
                  select: {
                    enquiryCode: true,
                    studentName: true,
                    guardianName: true,
                    academicYear: true,
                  },
                },
              },
            });
            if (!existing) throw new NotFoundError("Enquiry follow-up");

            const nextScheduled = input.scheduledAt ? new Date(input.scheduledAt) : existing.scheduledAt;
            const nextStatus =
              input.status ??
              computeEffectiveFollowUpStatus(
                existing.status,
                new Date(nextScheduled).toISOString(),
              );
            const updated = await (tx as any).admissionEnquiryFollowUp.update({
              where: { id: existing.id },
              data: {
                followUpType: input.followUpType ?? existing.followUpType,
                scheduledAt: nextScheduled,
                status: nextStatus,
                completedAt:
                  nextStatus === "COMPLETED" && !existing.completedAt ? now : existing.completedAt,
                assignedToUserId:
                  input.assignedToUserId !== undefined
                    ? input.assignedToUserId || null
                    : existing.assignedToUserId,
                assignedToName:
                  input.assignedToName !== undefined
                    ? input.assignedToName || null
                    : existing.assignedToName,
                notes: input.notes ?? existing.notes,
                outcome: input.outcome !== undefined ? input.outcome : existing.outcome,
              },
              include: {
                enquiry: {
                  select: {
                    enquiryCode: true,
                    studentName: true,
                    guardianName: true,
                    academicYear: true,
                  },
                },
              },
            });

            const pending = await (tx as any).admissionEnquiryFollowUp.findMany({
              where: { schoolId, enquiryId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
              orderBy: { scheduledAt: "asc" },
              take: 1,
            });
            await tx.admissionEnquiry.update({
              where: { id: enquiryId },
              data: { nextFollowUpAt: pending[0]?.scheduledAt ?? null } as any,
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                enquiryId,
                actorId: actor.id,
                actorName: actor.name,
                action: nextStatus === "COMPLETED" ? "FOLLOW_UP_COMPLETED" : "FOLLOW_UP_UPDATED",
                summary:
                  nextStatus === "COMPLETED"
                    ? `Completed ${updated.followUpType} follow-up.${input.outcome ? ` Outcome: ${input.outcome}` : ""}`
                    : `Updated ${updated.followUpType} follow-up status to ${nextStatus}.`,
              },
            });

            return mapPrismaEnquiryFollowUp(updated);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("updateEnquiryFollowUp", err);
      }
    }

    const store = loadStore();
    const existing = store.enquiryFollowUps[input.followUpId];
    if (!existing || existing.schoolId !== schoolId || existing.enquiryId !== enquiryId) {
      throw new NotFoundError("Enquiry follow-up");
    }

    const nextScheduledIso = input.scheduledAt
      ? new Date(input.scheduledAt).toISOString()
      : existing.scheduledAt;
    const nextStatus =
      input.status ?? computeEffectiveFollowUpStatus(existing.status, nextScheduledIso);

    const updated: AdmissionEnquiryFollowUpRecord = {
      ...existing,
      followUpType: input.followUpType ?? existing.followUpType,
      scheduledAt: nextScheduledIso,
      status: nextStatus,
      completedAt:
        nextStatus === "COMPLETED" && !existing.completedAt ? nowIso : existing.completedAt,
      assignedToUserId:
        input.assignedToUserId !== undefined
          ? input.assignedToUserId || null
          : existing.assignedToUserId,
      assignedToName:
        input.assignedToName !== undefined
          ? input.assignedToName || null
          : existing.assignedToName,
      notes: input.notes ?? existing.notes,
      outcome: input.outcome !== undefined ? input.outcome : existing.outcome,
      updatedAt: nowIso,
    };
    store.enquiryFollowUps[existing.id] = updated;

    const earliest = Object.values(store.enquiryFollowUps)
      .filter(
        (f) =>
          f.schoolId === schoolId &&
          f.enquiryId === enquiryId &&
          f.status !== "COMPLETED" &&
          f.status !== "CANCELLED",
      )
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))[0];

    const parent = store.enquiries[enquiryId];
    if (parent && parent.schoolId === schoolId) {
      store.enquiries[enquiryId] = {
        ...parent,
        nextFollowUpAt: earliest?.scheduledAt ?? null,
        updatedAt: nowIso,
      };
    }

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId,
      actorId: actor.id,
      actorName: actor.name,
      action: nextStatus === "COMPLETED" ? "FOLLOW_UP_COMPLETED" : "FOLLOW_UP_UPDATED",
      summary:
        nextStatus === "COMPLETED"
          ? `Completed ${updated.followUpType} follow-up.${input.outcome ? ` Outcome: ${input.outcome}` : ""}`
          : `Updated ${updated.followUpType} follow-up status to ${nextStatus}.`,
      createdAt: nowIso,
    });

    saveStore(store);
    return updated;
  }

  async createEnquiryCommunication(
    explicitSchoolId: string,
    enquiryId: string,
    actor: ActorMeta,
    input: CreateEnquiryCommunicationInput & {
      attachments?: EnquiryCommunicationAttachment[];
      resolvedStatus?: "SENT" | "COMPLETED" | "FAILED";
    },
  ): Promise<AdmissionEnquiryCommunicationRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();
    const attachments = input.attachments ?? [];
    for (const att of attachments) {
      assertTenantDocumentStorageKey(schoolId, att.storageKey);
    }
    const status =
      input.resolvedStatus ?? (input.channel === "Phone Call" ? "COMPLETED" : "SENT");

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createEnquiryCommunication", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const enq = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!enq) throw new NotFoundError("Admission enquiry");

            const created = await (tx as any).admissionEnquiryCommunication.create({
              data: {
                schoolId,
                enquiryId,
                channel: input.channel,
                recipient: input.recipient,
                cc: input.cc || null,
                bcc: input.bcc || null,
                subject: input.subject,
                message: input.message,
                attachments: attachments as any,
                status,
                sentByUserId: actor.id,
                sentByName: actor.name,
              },
            });

            if (enq.status === "NEW") {
              await tx.admissionEnquiry.update({
                where: { id: enquiryId },
                data: { status: "CONTACTED" },
              });
            }

            await tx.admissionActivity.create({
              data: {
                schoolId,
                enquiryId,
                actorId: actor.id,
                actorName: actor.name,
                action: "COMMUNICATION_SENT",
                summary: `Sent ${input.channel.toLowerCase()}: "${input.subject}" to ${input.recipient}.`,
              },
            });

            return mapPrismaEnquiryCommunication(created);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("createEnquiryCommunication", err);
      }
    }

    const store = loadStore();
    const enq = store.enquiries[enquiryId];
    if (!enq || enq.schoolId !== schoolId) {
      throw new NotFoundError("Admission enquiry");
    }

    const created: AdmissionEnquiryCommunicationRecord = {
      id: randomUUID(),
      schoolId,
      enquiryId,
      channel: input.channel,
      recipient: input.recipient,
      cc: input.cc || null,
      bcc: input.bcc || null,
      subject: input.subject,
      message: input.message,
      attachments,
      status,
      sentByUserId: actor.id,
      sentByName: actor.name,
      sentAt: nowIso,
      createdAt: nowIso,
    };
    store.enquiryCommunications[created.id] = created;
    if (enq.status === "NEW") {
      store.enquiries[enquiryId] = { ...enq, status: "CONTACTED", updatedAt: nowIso };
    }
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId,
      actorId: actor.id,
      actorName: actor.name,
      action: "COMMUNICATION_SENT",
      summary: `Sent ${input.channel.toLowerCase()}: "${input.subject}" to ${input.recipient}.`,
      createdAt: nowIso,
    });
    saveStore(store);
    return created;
  }

  async createEnquiryNote(
    explicitSchoolId: string,
    enquiryId: string,
    actor: ActorMeta,
    input: CreateEnquiryNoteInput,
  ): Promise<AdmissionEnquiryNoteRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("createEnquiryNote", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const enq = await tx.admissionEnquiry.findFirst({
              where: { id: enquiryId, schoolId },
            });
            if (!enq) throw new NotFoundError("Admission enquiry");

            const created = await (tx as any).admissionEnquiryNote.create({
              data: {
                schoolId,
                enquiryId,
                category: input.category || "Admission Related",
                title: input.title,
                content: input.content,
                createdByUserId: actor.id,
                createdByName: actor.name,
              },
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                enquiryId,
                actorId: actor.id,
                actorName: actor.name,
                action: "NOTE_ADDED",
                summary: `Added a note: "${input.title}".`,
              },
            });

            return mapPrismaEnquiryNote(created);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("createEnquiryNote", err);
      }
    }

    const store = loadStore();
    const enq = store.enquiries[enquiryId];
    if (!enq || enq.schoolId !== schoolId) {
      throw new NotFoundError("Admission enquiry");
    }

    const created: AdmissionEnquiryNoteRecord = {
      id: randomUUID(),
      schoolId,
      enquiryId,
      category: (input.category as EnquiryNoteCategoryValue) || "Admission Related",
      title: input.title,
      content: input.content,
      createdByUserId: actor.id,
      createdByName: actor.name,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.enquiryNotes[created.id] = created;
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: null,
      enquiryId,
      actorId: actor.id,
      actorName: actor.name,
      action: "NOTE_ADDED",
      summary: `Added a note: "${input.title}".`,
      createdAt: nowIso,
    });
    saveStore(store);
    return created;
  }

  async updateEnquiryNote(
    explicitSchoolId: string,
    enquiryId: string,
    input: UpdateEnquiryNoteInput,
  ): Promise<AdmissionEnquiryNoteRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateEnquiryNote", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const existing = await (tx as any).admissionEnquiryNote.findFirst({
              where: { id: input.noteId, schoolId, enquiryId },
            });
            if (!existing) throw new NotFoundError("Enquiry note");
            const updated = await (tx as any).admissionEnquiryNote.update({
              where: { id: existing.id },
              data: {
                category: input.category ?? existing.category,
                title: input.title ?? existing.title,
                content: input.content ?? existing.content,
              },
            });
            return mapPrismaEnquiryNote(updated);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("updateEnquiryNote", err);
      }
    }

    const store = loadStore();
    const existing = store.enquiryNotes[input.noteId];
    if (!existing || existing.schoolId !== schoolId || existing.enquiryId !== enquiryId) {
      throw new NotFoundError("Enquiry note");
    }
    const updated: AdmissionEnquiryNoteRecord = {
      ...existing,
      category: (input.category as EnquiryNoteCategoryValue) ?? existing.category,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      updatedAt: nowIso,
    };
    store.enquiryNotes[existing.id] = updated;
    saveStore(store);
    return updated;
  }

  async deleteEnquiryNote(
    explicitSchoolId: string,
    enquiryId: string,
    noteId: string,
  ): Promise<void> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await canUsePrisma()) {
      try {
        await runPrismaOp("deleteEnquiryNote", async () => {
          await runTenantTx(schoolId, async (tx) => {
            const existing = await (tx as any).admissionEnquiryNote.findFirst({
              where: { id: noteId, schoolId, enquiryId },
            });
            if (!existing) throw new NotFoundError("Enquiry note");
            await (tx as any).admissionEnquiryNote.delete({ where: { id: existing.id } });
          });
        });
        return;
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("deleteEnquiryNote", err);
      }
    }

    const store = loadStore();
    const existing = store.enquiryNotes[noteId];
    if (!existing || existing.schoolId !== schoolId || existing.enquiryId !== enquiryId) {
      throw new NotFoundError("Enquiry note");
    }
    delete store.enquiryNotes[noteId];
    saveStore(store);
  }

  async directAdmitStudent(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: DirectAdmitStudentInput,
  ): Promise<AdmissionApplicationRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const now = new Date();
    const nowIso = now.toISOString();
    const admittedDateObj =
      input.admittedAt && input.admittedAt.trim() !== ""
        ? new Date(`${input.admittedAt.slice(0, 10)}T00:00:00.000Z`)
        : now;
    const admittedDateIso = admittedDateObj.toISOString();
    const admissionType: AdmissionTypeValue = input.admissionType ?? "FRESH";
    const enrollmentStatus: AdmittedEnrollmentStatusValue = input.enrollmentStatus ?? "ACTIVE";
    const checklist = cloneDefaultChecklist();
    const initialFeePaise =
      typeof input.totalFeeRupees === "number" && input.totalFeeRupees > 0
        ? rupeesToPaise(input.totalFeeRupees)
        : 0;

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("directAdmitStudent", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const setting = await (tx.admissionSetting as any).upsert({
              where: { schoolId },
              update: {
                nextApplicationSeq: { increment: 1 },
                nextAdmissionSeq: { increment: 1 },
              },
              create: {
                schoolId,
                currentAcademicYear: getCurrentAcademicYearLabel(),
                applicationPrefix: "APP",
                enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                nextApplicationSeq: 2,
                nextAdmissionSeq: 2,
              },
              select: getSettingSelect(caps),
            });
            const appSeq = setting.nextApplicationSeq - 1;
            const admSeq = setting.nextAdmissionSeq - 1;
            const yearTag = extractYearTag(input.academicYear);
            const applicationCode = `${setting.applicationPrefix}${yearTag}-${String(appSeq).padStart(4, "0")}`;
            const admissionNumber = `ADM${yearTag}-${String(admSeq).padStart(4, "0")}`;

            const existingStudentRows = (await (tx.admissionApplication as any).findMany({
              where: { schoolId, studentIdNumber: { not: null } },
              select: { studentIdNumber: true },
            })) as Array<{ studentIdNumber?: string | null }>;
            const studentIdNumber = generateUniqueStudentId(
              input.academicYear,
              existingStudentRows.map((r) => r.studentIdNumber),
              appSeq,
            );

            const created = await (tx.admissionApplication as any).create({
              select: getApplicationSelect(caps),
              data: {
                schoolId,
                applicationCode,
                admissionNumber,
                studentName: input.studentName,
                gender: input.gender || null,
                dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null,
                gradeApplied: input.gradeApplied,
                academicYear: input.academicYear,
                guardianName: input.guardianName,
                guardianRelation: input.guardianRelation ?? "Parent",
                guardianPhone: input.guardianPhone,
                guardianEmail: input.guardianEmail || null,
                previousSchool: input.previousSchool || null,
                status: "ADMITTED",
                verificationStatus: "PENDING",
                verificationNotes: input.notes || null,
                documentsChecklist: checklist as any,
                admissionType:
                  caps.hasEnrollmentStatus
                    ? (admissionType as any)
                    : admissionType === "TRANSFER"
                      ? "TRANSFER"
                      : "FRESH",
                ...(caps.hasEnrollmentStatus ? { enrollmentStatus } : {}),
                isDraft: false,
                currentStep: 4,
                bloodGroup: input.bloodGroup || null,
                nationality: input.nationality || null,
                studentIdNumber,
                appliedAt: admittedDateObj,
                admittedAt: admittedDateObj,
                reviewedByUserId: actor.id,
              } as any,
            });

            const settingExtCfg = mergeExtendedSettings(setting.extendedConfig);
            const resolvedInitialFeePaise =
              initialFeePaise > 0
                ? initialFeePaise
                : input.totalFeeRupees === undefined && settingExtCfg.autoApplyClassFeeOnAdmit
                  ? resolveClassFeePaiseForGrade(settingExtCfg, input.gradeApplied)
                  : 0;

            if (resolvedInitialFeePaise > 0 && caps.hasFeeLedgers && (tx as any).admissionFeeLedger) {
              await (tx as any).admissionFeeLedger.create({
                data: {
                  schoolId,
                  applicationId: created.id,
                  academicYear: input.academicYear,
                  totalFeePaise: resolvedInitialFeePaise,
                  concessionPaise: 0,
                  updatedByUserId: actor.id,
                },
              });
            }

            await tx.admissionActivity.create({
              data: {
                schoolId,
                applicationId: created.id,
                actorId: actor.id,
                actorName: actor.name,
                action: "STUDENT_ADMITTED",
                summary: `${input.studentName} directly admitted into ${input.gradeApplied} (${admissionNumber}).`,
              },
            });

            return mapPrismaApplication(created);
          });
        });
      } catch (err) {
        handlePrismaError("directAdmitStudent", err);
      }
    }

    const store = loadStore();
    const setting = this.getOrCreateFallbackSetting(store, schoolId);
    const appSeq = setting.nextApplicationSeq;
    const admSeq = setting.nextAdmissionSeq;
    setting.nextApplicationSeq += 1;
    setting.nextAdmissionSeq += 1;
    const yearTag = extractYearTag(input.academicYear);
    const applicationCode = `${setting.applicationPrefix}${yearTag}-${String(appSeq).padStart(4, "0")}`;
    const admissionNumber = `ADM${yearTag}-${String(admSeq).padStart(4, "0")}`;
    const existingIds = Object.values(store.applications)
      .filter((a) => a.schoolId === schoolId)
      .map((a) => a.studentIdNumber);
    const studentIdNumber = generateUniqueStudentId(input.academicYear, existingIds, appSeq);

    const record: AdmissionApplicationRecord = {
      id: randomUUID(),
      schoolId,
      applicationCode,
      admissionNumber,
      enquiryId: null,
      studentName: input.studentName,
      gender: input.gender || null,
      dateOfBirth: input.dateOfBirth || null,
      gradeApplied: input.gradeApplied,
      academicYear: input.academicYear,
      guardianName: input.guardianName,
      guardianRelation: input.guardianRelation ?? "Parent",
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || null,
      previousSchool: input.previousSchool || null,
      status: "ADMITTED",
      verificationStatus: "PENDING",
      verificationNotes: input.notes || null,
      documentsChecklist: checklist,
      admissionType,
      enrollmentStatus,
      isDraft: false,
      currentStep: 4,
      studentPhotoKey: null,
      nationality: input.nationality || null,
      bloodGroup: input.bloodGroup || null,
      studentIdNumber,
      studentDetails: null,
      guardianDetails: null,
      academicDetails: null,
      uploadedDocuments: [],
      declarationAccepted: true,
      appliedAt: admittedDateIso,
      shortlistedAt: null,
      admittedAt: admittedDateIso,
      rejectedAt: null,
      verifiedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.applications[record.id] = record;

    const fallbackExtCfg = mergeExtendedSettings(setting.extendedConfig);
    const resolvedFallbackFeePaise =
      initialFeePaise > 0
        ? initialFeePaise
        : input.totalFeeRupees === undefined && fallbackExtCfg.autoApplyClassFeeOnAdmit
          ? resolveClassFeePaiseForGrade(fallbackExtCfg, input.gradeApplied)
          : 0;

    if (resolvedFallbackFeePaise > 0) {
      const ledgerId = randomUUID();
      store.feeLedgers[ledgerId] = {
        id: ledgerId,
        schoolId,
        applicationId: record.id,
        academicYear: input.academicYear,
        totalFeePaise: resolvedFallbackFeePaise,
        concessionPaise: 0,
        concessionReason: null,
        currency: "INR",
        updatedAt: nowIso,
      };
    }

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: record.id,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "STUDENT_ADMITTED",
      summary: `${input.studentName} directly admitted into ${input.gradeApplied} (${admissionNumber}).`,
      createdAt: nowIso,
    });
    saveStore(store);
    return record;
  }

  async importAdmittedStudents(
    explicitSchoolId: string,
    actor: ActorMeta,
    students: DirectAdmitStudentInput[],
  ): Promise<AdmissionApplicationRecord[]> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const createdRecords: AdmissionApplicationRecord[] = [];
    for (const row of students) {
      const rec = await this.directAdmitStudent(schoolId, actor, row);
      createdRecords.push(rec);
    }
    return createdRecords;
  }

  async updateAdmittedEnrollment(
    explicitSchoolId: string,
    applicationId: string,
    actor: ActorMeta,
    input: UpdateAdmittedEnrollmentInput,
  ): Promise<AdmissionApplicationRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("updateAdmittedEnrollment", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            const existing = await (tx.admissionApplication as any).findFirst({
              where: { id: applicationId, schoolId, status: "ADMITTED" },
              select: getApplicationSelect(caps),
            });
            if (!existing) throw new NotFoundError("Admitted student record");

            if (input.enrollmentStatus !== undefined && !caps.hasEnrollmentStatus) {
              throw new ServiceUnavailableError(
                "Execute prisma/migrations/20261127000000_admitted_students_workbench/migration.sql in Supabase SQL Editor to enable Enrollment Status updates.",
              );
            }

            const updated = await (tx.admissionApplication as any).update({
              where: { id: existing.id },
              select: getApplicationSelect(caps),
              data: {
                ...(input.enrollmentStatus !== undefined && caps.hasEnrollmentStatus
                  ? { enrollmentStatus: input.enrollmentStatus }
                  : {}),
                ...(input.admissionType !== undefined
                  ? { admissionType: input.admissionType as any }
                  : {}),
                ...(input.notes !== undefined ? { verificationNotes: input.notes } : {}),
              } as any,
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                applicationId: existing.id,
                actorId: actor.id,
                actorName: actor.name,
                action: "ENROLLMENT_UPDATED",
                summary: `Updated admitted enrollment profile for ${existing.studentName} (${existing.admissionNumber || existing.applicationCode}).`,
              },
            });

            return mapPrismaApplication(updated);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        handlePrismaError("updateAdmittedEnrollment", err);
      }
    }

    const store = loadStore();
    const existing = store.applications[applicationId];
    if (!existing || existing.schoolId !== schoolId || existing.status !== "ADMITTED") {
      throw new NotFoundError("Admitted student record");
    }
    const updated: AdmissionApplicationRecord = {
      ...existing,
      enrollmentStatus: input.enrollmentStatus ?? existing.enrollmentStatus ?? "ACTIVE",
      admissionType: input.admissionType ?? existing.admissionType ?? "FRESH",
      verificationNotes:
        input.notes !== undefined ? input.notes : existing.verificationNotes,
      updatedAt: nowIso,
    };
    store.applications[applicationId] = updated;
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "ENROLLMENT_UPDATED",
      summary: `Updated admitted enrollment profile for ${existing.studentName} (${existing.admissionNumber || existing.applicationCode}).`,
      createdAt: nowIso,
    });
    saveStore(store);
    return updated;
  }

  async upsertAdmittedFeeLedger(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: UpsertAdmittedFeeLedgerInput,
  ): Promise<AdmissionFeeLedgerRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nowIso = new Date().toISOString();
    const totalFeePaise = rupeesToPaise(input.totalFeeRupees);
    const concessionPaise = rupeesToPaise(input.concessionRupees ?? 0);
    if (concessionPaise > totalFeePaise) {
      throw new ValidationError("Concession cannot exceed total fee amount.");
    }

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("upsertAdmittedFeeLedger", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            if (!caps.hasFeeLedgers || !caps.hasFeePayments) {
              throw new ServiceUnavailableError(
                "Execute prisma/migrations/20261127000000_admitted_students_workbench/migration.sql in Supabase SQL Editor to enable Fee Ledger tracking.",
              );
            }
            const app = await (tx.admissionApplication as any).findFirst({
              where: { id: input.applicationId, schoolId, status: "ADMITTED" },
              select: getApplicationSelect(caps),
            });
            if (!app) throw new NotFoundError("Admitted student");

            const paymentsRaw = await (tx as any).admissionFeePayment.findMany({
              where: { schoolId, applicationId: app.id },
            });
            const payments = (paymentsRaw as any[]).map(mapPrismaFeePayment);
            const paidPaise = payments.reduce((sum, p) => sum + p.amountPaise, 0);
            if (totalFeePaise - concessionPaise < paidPaise) {
              throw new ValidationError(
                "Net payable fee cannot be reduced below amount already collected.",
              );
            }

            const upserted = await (tx as any).admissionFeeLedger.upsert({
              where: { applicationId: app.id },
              update: {
                totalFeePaise,
                concessionPaise,
                concessionReason: input.concessionReason?.trim() || null,
                updatedByUserId: actor.id,
              },
              create: {
                schoolId,
                applicationId: app.id,
                academicYear: app.academicYear,
                totalFeePaise,
                concessionPaise,
                concessionReason: input.concessionReason?.trim() || null,
                currency: "INR",
                updatedByUserId: actor.id,
              },
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                applicationId: app.id,
                actorId: actor.id,
                actorName: actor.name,
                action: "FEE_LEDGER_UPDATED",
                summary: `Updated fee assessment for ${app.studentName}: Total ₹${(totalFeePaise / 100).toLocaleString("en-IN")}, Concession ₹${(concessionPaise / 100).toLocaleString("en-IN")}.`,
              },
            });

            return buildEnrichedFeeLedger(mapPrismaFeeLedger(upserted), payments);
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof ValidationError) throw err;
        handlePrismaError("upsertAdmittedFeeLedger", err);
      }
    }

    const store = loadStore();
    const app = store.applications[input.applicationId];
    if (!app || app.schoolId !== schoolId || app.status !== "ADMITTED") {
      throw new NotFoundError("Admitted student");
    }

    const payments = Object.values(store.feePayments).filter(
      (p) => p.schoolId === schoolId && p.applicationId === app.id,
    );
    const paidPaise = payments.reduce((sum, p) => sum + p.amountPaise, 0);
    if (totalFeePaise - concessionPaise < paidPaise) {
      throw new ValidationError(
        "Net payable fee cannot be reduced below amount already collected.",
      );
    }

    const existing = Object.values(store.feeLedgers).find(
      (l) => l.schoolId === schoolId && l.applicationId === app.id,
    );
    const ledgerId = existing?.id ?? randomUUID();
    const raw: StoredRawFeeLedger = {
      id: ledgerId,
      schoolId,
      applicationId: app.id,
      academicYear: app.academicYear,
      totalFeePaise,
      concessionPaise,
      concessionReason: input.concessionReason?.trim() || null,
      currency: "INR",
      updatedAt: nowIso,
    };
    store.feeLedgers[ledgerId] = raw;

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: app.id,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "FEE_LEDGER_UPDATED",
      summary: `Updated fee assessment for ${app.studentName}: Total ₹${(totalFeePaise / 100).toLocaleString("en-IN")}, Concession ₹${(concessionPaise / 100).toLocaleString("en-IN")}.`,
      createdAt: nowIso,
    });
    saveStore(store);
    return buildEnrichedFeeLedger(raw, payments);
  }

  async recordAdmittedFeePayment(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: RecordAdmittedFeePaymentInput,
  ): Promise<{ payment: AdmissionFeePaymentRecord; ledger: AdmissionFeeLedgerRecord }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const amountPaise = rupeesToPaise(input.amountRupees);
    if (amountPaise <= 0) {
      throw new ValidationError("Payment amount must be greater than zero.");
    }
    const now = new Date();
    const nowIso = now.toISOString();
    const paymentDateObj =
      input.paymentDate && input.paymentDate.trim() !== ""
        ? new Date(`${input.paymentDate.slice(0, 10)}T00:00:00.000Z`)
        : now;
    const paymentDateIso = paymentDateObj.toISOString();

    if (await canUsePrisma()) {
      try {
        return await runPrismaOp("recordAdmittedFeePayment", async () => {
          return runTenantTx(schoolId, async (tx) => {
            const caps = await getAdmissionsSchemaCaps(tx);
            if (!caps.hasFeeLedgers || !caps.hasFeePayments) {
              throw new ServiceUnavailableError(
                "Execute prisma/migrations/20261127000000_admitted_students_workbench/migration.sql in Supabase SQL Editor to enable Fee Ledger tracking.",
              );
            }
            const app = await (tx.admissionApplication as any).findFirst({
              where: { id: input.applicationId, schoolId, status: "ADMITTED" },
              select: getApplicationSelect(caps),
            });
            if (!app) throw new NotFoundError("Admitted student");

            const duplicate = await (tx as any).admissionFeePayment.findFirst({
              where: { schoolId, idempotencyKey: input.idempotencyKey },
            });
            if (duplicate) {
              const allPaymentsRaw = await (tx as any).admissionFeePayment.findMany({
                where: { schoolId, applicationId: app.id },
              });
              const ledgerRow = await (tx as any).admissionFeeLedger.findUnique({
                where: { applicationId: app.id },
              });
              const allPayments = (allPaymentsRaw as any[]).map(mapPrismaFeePayment);
              const rawLedger = ledgerRow
                ? mapPrismaFeeLedger(ledgerRow)
                : {
                    id: randomUUID(),
                    schoolId,
                    applicationId: app.id,
                    academicYear: app.academicYear,
                    totalFeePaise: amountPaise,
                    concessionPaise: 0,
                    concessionReason: null,
                    currency: "INR",
                    updatedAt: nowIso,
                  };
              return {
                payment: mapPrismaFeePayment({
                  ...duplicate,
                  application: {
                    studentName: app.studentName,
                    admissionNumber: app.admissionNumber,
                  },
                }),
                ledger: buildEnrichedFeeLedger(rawLedger, allPayments),
              };
            }

            const existingPaymentsRaw = await (tx as any).admissionFeePayment.findMany({
              where: { schoolId, applicationId: app.id },
            });
            const existingPayments = (existingPaymentsRaw as any[]).map(mapPrismaFeePayment);
            const paidSoFar = existingPayments.reduce((sum, p) => sum + p.amountPaise, 0);

            let ledgerRow = await (tx as any).admissionFeeLedger.findUnique({
              where: { applicationId: app.id },
            });
            if (!ledgerRow) {
              ledgerRow = await (tx as any).admissionFeeLedger.create({
                data: {
                  schoolId,
                  applicationId: app.id,
                  academicYear: app.academicYear,
                  totalFeePaise: paidSoFar + amountPaise,
                  concessionPaise: 0,
                  currency: "INR",
                  updatedByUserId: actor.id,
                },
              });
            } else {
              const netFee = Math.max(
                0,
                Number(ledgerRow.totalFeePaise) - Number(ledgerRow.concessionPaise || 0),
              );
              const outstanding = Math.max(0, netFee - paidSoFar);
              if (netFee > 0 && amountPaise > outstanding) {
                throw new ValidationError(
                  `Payment of ₹${(amountPaise / 100).toFixed(2)} exceeds remaining balance of ₹${(outstanding / 100).toFixed(2)}.`,
                );
              }
            }

            const setting = await (tx.admissionSetting as any).upsert({
              where: { schoolId },
              update: { nextReceiptSeq: { increment: 1 } },
              create: {
                schoolId,
                currentAcademicYear: getCurrentAcademicYearLabel(),
                applicationPrefix: "APP",
                enabledGrades: [...DEFAULT_ADMISSION_GRADES],
                nextReceiptSeq: 2,
              },
            });
            const rcpSeq = (setting as any).nextReceiptSeq ? (setting as any).nextReceiptSeq - 1 : 1;
            const receiptNumber = `RCP${extractYearTag(app.academicYear)}-${String(rcpSeq).padStart(4, "0")}`;

            const createdPayment = await (tx as any).admissionFeePayment.create({
              data: {
                schoolId,
                applicationId: app.id,
                receiptNumber,
                idempotencyKey: input.idempotencyKey,
                feeHead: input.feeHead || "Admission Fee",
                amountPaise,
                paymentDate: paymentDateObj,
                paymentMode: input.paymentMode,
                referenceNo: input.referenceNo?.trim() || null,
                remarks: input.remarks?.trim() || null,
                recordedByUserId: actor.id,
                recordedByName: actor.name,
              },
            });

            await tx.admissionActivity.create({
              data: {
                schoolId,
                applicationId: app.id,
                actorId: actor.id,
                actorName: actor.name,
                action: "FEE_PAYMENT_RECORDED",
                summary: `Recorded ₹${(amountPaise / 100).toLocaleString("en-IN")} (${input.paymentMode}) for ${app.studentName} · Receipt ${receiptNumber}.`,
              },
            });

            const mappedPayment = mapPrismaFeePayment({
              ...createdPayment,
              application: {
                studentName: app.studentName,
                admissionNumber: app.admissionNumber,
              },
            });
            return {
              payment: mappedPayment,
              ledger: buildEnrichedFeeLedger(mapPrismaFeeLedger(ledgerRow), [
                ...existingPayments,
                mappedPayment,
              ]),
            };
          });
        });
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof ValidationError) throw err;
        handlePrismaError("recordAdmittedFeePayment", err);
      }
    }

    const store = loadStore();
    const app = store.applications[input.applicationId];
    if (!app || app.schoolId !== schoolId || app.status !== "ADMITTED") {
      throw new NotFoundError("Admitted student");
    }

    const duplicate = Object.values(store.feePayments).find(
      (p) => p.schoolId === schoolId && p.idempotencyKey === input.idempotencyKey,
    );
    const existingPayments = Object.values(store.feePayments).filter(
      (p) => p.schoolId === schoolId && p.applicationId === app.id,
    );
    let existingLedger = Object.values(store.feeLedgers).find(
      (l) => l.schoolId === schoolId && l.applicationId === app.id,
    );

    if (duplicate) {
      const ledgerFallback: StoredRawFeeLedger = existingLedger ?? {
        id: randomUUID(),
        schoolId,
        applicationId: app.id,
        academicYear: app.academicYear,
        totalFeePaise: amountPaise,
        concessionPaise: 0,
        concessionReason: null,
        currency: "INR",
        updatedAt: nowIso,
      };
      return {
        payment: duplicate,
        ledger: buildEnrichedFeeLedger(ledgerFallback, existingPayments),
      };
    }

    const paidSoFar = existingPayments.reduce((sum, p) => sum + p.amountPaise, 0);
    if (!existingLedger) {
      const ledgerId = randomUUID();
      existingLedger = {
        id: ledgerId,
        schoolId,
        applicationId: app.id,
        academicYear: app.academicYear,
        totalFeePaise: paidSoFar + amountPaise,
        concessionPaise: 0,
        concessionReason: null,
        currency: "INR",
        updatedAt: nowIso,
      };
      store.feeLedgers[ledgerId] = existingLedger;
    } else {
      const netFee = Math.max(
        0,
        existingLedger.totalFeePaise - existingLedger.concessionPaise,
      );
      const outstanding = Math.max(0, netFee - paidSoFar);
      if (netFee > 0 && amountPaise > outstanding) {
        throw new ValidationError(
          `Payment of ₹${(amountPaise / 100).toFixed(2)} exceeds remaining balance of ₹${(outstanding / 100).toFixed(2)}.`,
        );
      }
    }

    const setting = this.getOrCreateFallbackSetting(store, schoolId);
    const seq = setting.nextReceiptSeq;
    setting.nextReceiptSeq += 1;
    const receiptNumber = `RCP${extractYearTag(app.academicYear)}-${String(seq).padStart(4, "0")}`;

    const payment: AdmissionFeePaymentRecord = {
      id: randomUUID(),
      schoolId,
      applicationId: app.id,
      studentName: app.studentName,
      admissionNumber: app.admissionNumber,
      receiptNumber,
      idempotencyKey: input.idempotencyKey,
      feeHead: (input.feeHead as AdmittedFeeHeadValue) || "Admission Fee",
      amountPaise,
      paymentDate: paymentDateIso,
      paymentMode: input.paymentMode as AdmittedPaymentModeValue,
      referenceNo: input.referenceNo?.trim() || null,
      remarks: input.remarks?.trim() || null,
      recordedByUserId: actor.id,
      recordedByName: actor.name,
      createdAt: nowIso,
    };
    store.feePayments[payment.id] = payment;

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      applicationId: app.id,
      enquiryId: null,
      actorId: actor.id,
      actorName: actor.name,
      action: "FEE_PAYMENT_RECORDED",
      summary: `Recorded ₹${(amountPaise / 100).toLocaleString("en-IN")} (${input.paymentMode}) for ${app.studentName} · Receipt ${receiptNumber}.`,
      createdAt: nowIso,
    });
    saveStore(store);

    return {
      payment,
      ledger: buildEnrichedFeeLedger(existingLedger, [...existingPayments, payment]),
    };
  }
}

export const admissionsRepository = new AdmissionsTenantRepository();
