/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { randomBytes, randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { authRepository } from "@/server/auth/auth-repository";
import { admissionsRepository } from "@/server/school/admissions-repository";
import { systemCache, tenantCache } from "@/server/integrations/redis";
import { platformCache } from "@/server/platform/platform-cache";
import {
  ConflictError,
  NotFoundError,
  TenantNotFoundError,
  ValidationError,
} from "@/lib/errors";
import { DEFAULT_ADMISSION_GRADES } from "@/modules/school/admissions/types";
import { computeStudentAnalytics } from "@/modules/students/analytics";
import type {
  PlatformGlobalStudentsAnalytics,
  StudentActivityRecord,
  StudentEnrollmentRecord,
  StudentFilterParams,
  StudentGroupRecord,
  StudentLifecycleStatusValue,
  StudentRecord,
  StudentSettingRecord,
  StudentTransferRecord,
  StudentWorkspaceSnapshot,
} from "@/modules/students/types";
import type {
  BulkStudentsActionInput,
  CreateStudentGroupInput,
  CreateStudentInput,
  PromoteStudentsInput,
  TransferStudentInput,
  UpdateStudentInput,
  UpdateStudentSettingsInput,
} from "@/modules/students/schemas";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STUDENTS_CACHE_KEY = "students:snapshot:v1";
const TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };

interface ActorMeta {
  userId?: string;
  userName: string;
}

interface MemoryStudentState {
  students: Record<string, StudentRecord>;
  groups: Record<string, StudentGroupRecord>;
  activities: StudentActivityRecord[];
  settings?: StudentSettingRecord;
  syncedApplicationIds: Record<string, boolean>;
}

const globalForStudents = globalThis as unknown as {
  __scholonixStudentMemoryStore?: Record<string, MemoryStudentState>;
  __scholonixStudentCaps?: { hasTables: boolean; checkedAt: number };
};

function getMemoryStore(schoolId: string): MemoryStudentState {
  if (!globalForStudents.__scholonixStudentMemoryStore) {
    globalForStudents.__scholonixStudentMemoryStore = {};
  }
  if (!globalForStudents.__scholonixStudentMemoryStore[schoolId]) {
    globalForStudents.__scholonixStudentMemoryStore[schoolId] = {
      students: {},
      groups: {},
      activities: [],
      syncedApplicationIds: {},
    };
  }
  return globalForStudents.__scholonixStudentMemoryStore[schoolId]!;
}

export function resetInMemoryStudentStoreForTests(): void {
  globalForStudents.__scholonixStudentMemoryStore = {};
}

async function hasStudentTables(tx: Prisma.TransactionClient): Promise<boolean> {
  if (
    globalForStudents.__scholonixStudentCaps &&
    Date.now() - globalForStudents.__scholonixStudentCaps.checkedAt < 60_000
  ) {
    return globalForStudents.__scholonixStudentCaps.hasTables;
  }
  try {
    const rows = (await tx.$queryRaw`
      SELECT to_regclass('public.students') IS NOT NULL
         AND to_regclass('public.student_enrollments') IS NOT NULL
         AND to_regclass('public.student_settings') IS NOT NULL AS ready
    `) as Array<{ ready: boolean }>;
    const ready = Boolean(rows[0]?.ready);
    globalForStudents.__scholonixStudentCaps = { hasTables: ready, checkedAt: Date.now() };
    return ready;
  } catch {
    return false;
  }
}

async function runTenantStudentTx<T>(
  schoolId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { asPlatformAdmin?: boolean },
): Promise<T> {
  if (!UUID_REGEX.test(schoolId)) {
    throw new TenantNotFoundError("Invalid tenant school identifier.");
  }
  return db.$transaction(async (tx) => {
    if (options?.asPlatformAdmin) {
      await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
    }
    await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
    return fn(tx);
  }, TX_OPTIONS);
}

function defaultStudentSettings(schoolId: string): StudentSettingRecord {
  return {
    schoolId,
    defaultSections: ["A", "B", "C"],
    sectionsByGrade: {},
    rollNumberMode: "AUTO_ALPHA",
    requireTcOnTransfer: true,
    idCardConfig: {
      showBloodGroup: true,
      showGuardianPhone: true,
      showEmergencyContact: true,
      motto: "Excellence Through Knowledge",
    },
    promotionConfig: {
      finalGradeForAlumni: "Class XII",
      autoAssignRollNumbers: true,
    },
  };
}

function generateAdmissionNumber(): string {
  const yr = new Date().getUTCFullYear();
  return `ADM${yr}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function mapStudentRow(
  row: any,
  groupIds: string[],
  feeSummary?: { totalFeePaise: number; paidPaise: number; outstandingPaise: number } | null,
): StudentRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    applicationId: row.applicationId ?? null,
    admissionNumber: row.admissionNumber,
    studentIdNumber: row.studentIdNumber ?? null,
    studentName: row.studentName,
    gender: row.gender ?? null,
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth).toISOString().slice(0, 10) : null,
    bloodGroup: row.bloodGroup ?? null,
    nationality: row.nationality ?? null,
    photoKey: row.photoKey ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.addressJson && typeof row.addressJson === "object" ? row.addressJson : null,
    guardianName: row.guardianName,
    guardianRelation: row.guardianRelation || "Parent",
    guardianPhone: row.guardianPhone,
    guardianEmail: row.guardianEmail ?? null,
    guardianDetails:
      row.guardianDetails && typeof row.guardianDetails === "object" ? row.guardianDetails : null,
    previousSchool: row.previousSchool ?? null,
    academicDetails:
      row.academicDetails && typeof row.academicDetails === "object" ? row.academicDetails : null,
    medicalNotes: row.medicalNotes ?? null,
    admissionType: row.admissionType || "FRESH",
    admissionDate: new Date(row.admissionDate).toISOString(),
    status: (row.status as StudentLifecycleStatusValue) || "ACTIVE",
    currentAcademicYear: row.currentAcademicYear,
    currentGrade: row.currentGrade,
    currentSection: row.currentSection || "A",
    currentRollNumber: row.currentRollNumber ?? null,
    graduationYear: row.graduationYear ?? null,
    inactiveReason: row.inactiveReason ?? null,
    groupIds,
    enrollments: Array.isArray(row.enrollments)
      ? row.enrollments.map(
          (e: any): StudentEnrollmentRecord => ({
            id: e.id,
            schoolId: e.schoolId,
            studentId: e.studentId,
            academicYear: e.academicYear,
            grade: e.grade,
            section: e.section || "A",
            rollNumber: e.rollNumber ?? null,
            status: e.status,
            isCurrent: Boolean(e.isCurrent),
            promotedFromEnrollmentId: e.promotedFromEnrollmentId ?? null,
            remarks: e.remarks ?? null,
            effectiveFrom: new Date(e.effectiveFrom).toISOString(),
            effectiveTo: e.effectiveTo ? new Date(e.effectiveTo).toISOString() : null,
          }),
        )
      : [],
    transfers: Array.isArray(row.transfers)
      ? row.transfers.map(
          (t: any): StudentTransferRecord => ({
            id: t.id,
            schoolId: t.schoolId,
            studentId: t.studentId,
            transferType: t.transferType,
            transferDate: new Date(t.transferDate).toISOString(),
            tcNumber: t.tcNumber ?? null,
            counterpartySchool: t.counterpartySchool ?? null,
            reason: t.reason ?? null,
            clearanceStatus: t.clearanceStatus || "CLEARED",
            fromGrade: t.fromGrade ?? null,
            toGrade: t.toGrade ?? null,
            processedByName: t.processedByName ?? null,
          }),
        )
      : [],
    feeSummary: feeSummary ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

class StudentRepository extends BaseTenantRepository {
  private requireSchoolId(explicitSchoolId?: string): string {
    const sid = this.getSchoolId(explicitSchoolId);
    if (!sid || !sid.trim()) {
      throw new TenantNotFoundError("School tenant identifier is required.");
    }
    return sid.trim();
  }

  async invalidateCaches(schoolId: string): Promise<void> {
    await Promise.all([
      tenantCache.del(schoolId, STUDENTS_CACHE_KEY).catch(() => {}),
      tenantCache.del(schoolId, "parents:snapshot:v1").catch(() => {}),
      platformCache.invalidateSchool(schoolId),
      systemCache.del("platform:students:global:v1").catch(() => {}),
    ]);
  }

  private async syncMemoryFromAdmissions(
    schoolId: string,
    store: MemoryStudentState,
  ): Promise<{ schoolName: string; schoolSlug: string; grades: string[]; academicYear: string }> {
    const snap = await admissionsRepository.getTenantSnapshot(schoolId);
    const schoolRecord = await authRepository.findSchoolById(schoolId);

    const ledgerByApp = new Map(
      (snap.admittedFeeLedgers ?? []).map((l) => [
        l.applicationId,
        {
          totalFeePaise: l.totalFeePaise,
          paidPaise: l.paidPaise,
          outstandingPaise: l.outstandingPaise,
        },
      ]),
    );

    for (const app of snap.applications) {
      if (app.status !== "ADMITTED") continue;
      const existingByApp = Object.values(store.students).find((s) => s.applicationId === app.id);
      if (existingByApp) {
        existingByApp.feeSummary = ledgerByApp.get(app.id) ?? existingByApp.feeSummary ?? null;
        continue;
      }
      if (store.syncedApplicationIds[app.id]) continue;
      store.syncedApplicationIds[app.id] = true;

      const sid = randomUUID();
      const admDate = app.admittedAt || app.appliedAt || new Date().toISOString();
      const mappedStatus: StudentLifecycleStatusValue =
        app.enrollmentStatus === "TRANSFERRED"
          ? "TRANSFERRED"
          : app.enrollmentStatus === "WITHDRAWN"
            ? "INACTIVE"
            : "ACTIVE";

      const sd = (app.studentDetails || {}) as Record<string, any>;
      store.students[sid] = {
        id: sid,
        schoolId,
        applicationId: app.id,
        admissionNumber: app.admissionNumber || app.applicationCode,
        studentIdNumber: app.studentIdNumber ?? null,
        studentName: app.studentName,
        gender: app.gender ?? null,
        dateOfBirth: app.dateOfBirth ?? null,
        bloodGroup: app.bloodGroup ?? null,
        nationality: app.nationality ?? "Indian",
        photoKey: app.studentPhotoKey ?? null,
        email: typeof sd.email === "string" ? sd.email : null,
        phone: typeof sd.phone === "string" ? sd.phone : null,
        address: sd.address && typeof sd.address === "object" ? sd.address : null,
        guardianName: app.guardianName,
        guardianRelation: app.guardianRelation || "Parent",
        guardianPhone: app.guardianPhone,
        guardianEmail: app.guardianEmail ?? null,
        guardianDetails:
          app.guardianDetails && typeof app.guardianDetails === "object"
            ? (app.guardianDetails as unknown as Record<string, unknown>)
            : null,
        previousSchool: app.previousSchool ?? null,
        academicDetails:
          app.academicDetails && typeof app.academicDetails === "object"
            ? (app.academicDetails as unknown as Record<string, unknown>)
            : null,
        medicalNotes: null,
        admissionType: app.admissionType || "FRESH",
        admissionDate: admDate,
        status: mappedStatus,
        currentAcademicYear: app.academicYear,
        currentGrade: app.gradeApplied,
        currentSection: "A",
        currentRollNumber: null,
        graduationYear: null,
        inactiveReason: null,
        groupIds: [],
        enrollments: [
          {
            id: randomUUID(),
            schoolId,
            studentId: sid,
            academicYear: app.academicYear,
            grade: app.gradeApplied,
            section: "A",
            rollNumber: null,
            status: mappedStatus === "TRANSFERRED" ? "TRANSFERRED_OUT" : "ENROLLED",
            isCurrent: true,
            promotedFromEnrollmentId: null,
            remarks: "Admitted via Admissions Pipeline",
            effectiveFrom: admDate,
            effectiveTo: null,
          },
        ],
        transfers: [],
        feeSummary: ledgerByApp.get(app.id) ?? null,
        createdAt: app.createdAt || admDate,
        updatedAt: app.updatedAt || admDate,
      };
    }

    if (!store.settings) {
      store.settings = defaultStudentSettings(schoolId);
    }

    return {
      schoolName: schoolRecord?.name || "School Workspace",
      schoolSlug: schoolRecord?.slug || schoolId,
      grades: snap.settings?.enabledGrades?.length
        ? snap.settings.enabledGrades
        : [...DEFAULT_ADMISSION_GRADES],
      academicYear: snap.settings?.currentAcademicYear || `${new Date().getFullYear()} – ${new Date().getFullYear() + 1}`,
    };
  }

  async getSnapshot(
    explicitSchoolId: string,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentWorkspaceSnapshot> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const cached = await tenantCache.get<StudentWorkspaceSnapshot>(schoolId, STUDENTS_CACHE_KEY);
    if (cached && cached.schoolId === schoolId) {
      return cached;
    }

    if (await authRepository.canUsePrismaForPlatform()) {
      const prismaSnap = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          const tablesReady = await hasStudentTables(tx);
          if (!tablesReady) return null;

          const [schoolRow, admSetting, appRows, ledgers] = await Promise.all([
            tx.school.findUnique({
              where: { id: schoolId },
              select: { id: true, name: true, slug: true },
            }),
            tx.admissionSetting.findUnique({
              where: { schoolId },
              select: { currentAcademicYear: true, enabledGrades: true },
            }),
            tx.admissionApplication.findMany({
              where: { schoolId, status: "ADMITTED" },
              orderBy: { appliedAt: "desc" },
            }),
            (tx as any).admissionFeeLedger
              ? (tx as any).admissionFeeLedger.findMany({ where: { schoolId } })
              : Promise.resolve([]),
          ]);

          const existingStudents = await (tx as any).student.findMany({
            where: { schoolId },
            select: { applicationId: true, admissionNumber: true },
          });
          const linkedApps = new Set(
            existingStudents.map((s: any) => s.applicationId).filter(Boolean),
          );
          const existingAdmNos = new Set(
            existingStudents.map((s: any) => s.admissionNumber),
          );

          // Lazy backfill for newly admitted students
          for (const app of appRows as any[]) {
            if (linkedApps.has(app.id)) continue;
            const admNo = app.admissionNumber || app.applicationCode;
            if (existingAdmNos.has(admNo)) continue;
            existingAdmNos.add(admNo);
            const sd = (app.studentDetails || {}) as Record<string, any>;
            const lifeStatus: StudentLifecycleStatusValue =
              app.enrollmentStatus === "TRANSFERRED"
                ? "TRANSFERRED"
                : app.enrollmentStatus === "WITHDRAWN"
                  ? "INACTIVE"
                  : "ACTIVE";

            const createdStu = await (tx as any).student.create({
              data: {
                schoolId,
                applicationId: app.id,
                admissionNumber: admNo,
                studentIdNumber: app.studentIdNumber ?? null,
                studentName: app.studentName,
                gender: app.gender ?? null,
                dateOfBirth: app.dateOfBirth ?? null,
                bloodGroup: app.bloodGroup ?? null,
                nationality: app.nationality ?? "Indian",
                photoKey: app.studentPhotoKey ?? null,
                email: typeof sd.email === "string" ? sd.email : null,
                phone: typeof sd.phone === "string" ? sd.phone : null,
                addressJson: sd.address ?? null,
                guardianName: app.guardianName,
                guardianRelation: app.guardianRelation || "Parent",
                guardianPhone: app.guardianPhone,
                guardianEmail: app.guardianEmail ?? null,
                guardianDetails: app.guardianDetails ?? null,
                previousSchool: app.previousSchool ?? null,
                academicDetails: app.academicDetails ?? null,
                admissionType: app.admissionType || "FRESH",
                admissionDate: app.admittedAt || app.appliedAt,
                status: lifeStatus,
                currentAcademicYear: app.academicYear,
                currentGrade: app.gradeApplied,
                currentSection: "A",
              },
            });

            await (tx as any).studentEnrollment.create({
              data: {
                schoolId,
                studentId: createdStu.id,
                academicYear: app.academicYear,
                grade: app.gradeApplied,
                section: "A",
                status: lifeStatus === "TRANSFERRED" ? "TRANSFERRED_OUT" : "ENROLLED",
                isCurrent: true,
                effectiveFrom: app.admittedAt || app.appliedAt,
              },
            });
          }

          const [rows, groups, activities, settingRow, pendingAdmCount, paymentSums] =
            await Promise.all([
              (tx as any).student.findMany({
                where: { schoolId },
                orderBy: { admissionDate: "desc" },
                include: {
                  enrollments: { orderBy: { effectiveFrom: "desc" } },
                  transfers: { orderBy: { transferDate: "desc" } },
                  groupMembers: { select: { groupId: true } },
                },
              }),
              (tx as any).studentGroup.findMany({
                where: { schoolId },
                orderBy: { name: "asc" },
                include: { members: { select: { studentId: true } } },
              }),
              (tx as any).studentActivity.findMany({
                where: { schoolId },
                orderBy: { createdAt: "desc" },
                take: 40,
              }),
              (tx as any).studentSetting.findUnique({ where: { schoolId } }),
              tx.admissionApplication.count({
                where: { schoolId, status: { in: ["UNDER_REVIEW", "SHORTLISTED", "DOCUMENTS_PENDING"] } },
              }),
              (tx as any).admissionFeePayment
                ? (tx as any).admissionFeePayment.groupBy({
                    by: ["applicationId"],
                    where: { schoolId },
                    _sum: { amountPaise: true },
                  })
                : Promise.resolve([]),
            ]);

          const paidMap = new Map<string, number>();
          for (const p of paymentSums as any[]) {
            paidMap.set(p.applicationId, Number(p._sum?.amountPaise || 0));
          }
          const ledgerByApp = new Map<
            string,
            { totalFeePaise: number; paidPaise: number; outstandingPaise: number }
          >();
          for (const l of ledgers as any[]) {
            const paid = paidMap.get(l.applicationId) ?? 0;
            const net = Math.max(0, Number(l.totalFeePaise || 0) - Number(l.concessionPaise || 0));
            ledgerByApp.set(l.applicationId, {
              totalFeePaise: Number(l.totalFeePaise || 0),
              paidPaise: paid,
              outstandingPaise: Math.max(0, net - paid),
            });
          }

          const students: StudentRecord[] = (rows as any[]).map((r) =>
            mapStudentRow(
              r,
              (r.groupMembers || []).map((gm: any) => gm.groupId),
              r.applicationId ? ledgerByApp.get(r.applicationId) ?? null : null,
            ),
          );

          const mappedSettings: StudentSettingRecord = settingRow
            ? {
                schoolId,
                defaultSections: settingRow.defaultSections?.length
                  ? settingRow.defaultSections
                  : ["A", "B", "C"],
                sectionsByGrade:
                  settingRow.sectionsByGrade && typeof settingRow.sectionsByGrade === "object"
                    ? settingRow.sectionsByGrade
                    : {},
                rollNumberMode:
                  settingRow.rollNumberMode === "MANUAL" ? "MANUAL" : "AUTO_ALPHA",
                requireTcOnTransfer: Boolean(settingRow.requireTcOnTransfer),
                idCardConfig:
                  settingRow.idCardConfig && typeof settingRow.idCardConfig === "object"
                    ? settingRow.idCardConfig
                    : defaultStudentSettings(schoolId).idCardConfig,
                promotionConfig:
                  settingRow.promotionConfig && typeof settingRow.promotionConfig === "object"
                    ? settingRow.promotionConfig
                    : defaultStudentSettings(schoolId).promotionConfig,
              }
            : defaultStudentSettings(schoolId);

          const yearSet = new Set<string>();
          if (admSetting?.currentAcademicYear) yearSet.add(admSetting.currentAcademicYear);
          students.forEach((s) => yearSet.add(s.currentAcademicYear));
          if (yearSet.size === 0) {
            const y = new Date().getFullYear();
            yearSet.add(`${y} – ${y + 1}`);
          }

          const gradeSet = new Set<string>(
            admSetting?.enabledGrades?.length
              ? admSetting.enabledGrades
              : [...DEFAULT_ADMISSION_GRADES],
          );
          students.forEach((s) => gradeSet.add(s.currentGrade));

          const sectionSet = new Set<string>(mappedSettings.defaultSections);
          students.forEach((s) => sectionSet.add(s.currentSection));

          return {
            schoolId,
            schoolName: schoolRow?.name || "School Workspace",
            schoolSlug: schoolRow?.slug || schoolId,
            students,
            groups: (groups as any[]).map(
              (g): StudentGroupRecord => ({
                id: g.id,
                schoolId: g.schoolId,
                name: g.name,
                category: g.category,
                colorToken: g.colorToken,
                description: g.description ?? null,
                memberStudentIds: (g.members || []).map((m: any) => m.studentId),
              }),
            ),
            activities: (activities as any[]).map(
              (a): StudentActivityRecord => ({
                id: a.id,
                schoolId: a.schoolId,
                studentId: a.studentId ?? null,
                actorName: a.actorName,
                actionType: a.actionType,
                summary: a.summary,
                createdAt: new Date(a.createdAt).toISOString(),
              }),
            ),
            settings: mappedSettings,
            academicYears: Array.from(yearSet).sort().reverse(),
            grades: Array.from(gradeSet),
            sections: Array.from(sectionSet).sort(),
            pendingAdmittedCount: pendingAdmCount,
          };
        },
        options,
      );

      if (prismaSnap) {
        await tenantCache.set(schoolId, STUDENTS_CACHE_KEY, prismaSnap, 90);
        return prismaSnap;
      }
    }

    // Memory / Unmigrated Fallback
    const store = getMemoryStore(schoolId);
    const meta = await this.syncMemoryFromAdmissions(schoolId, store);
    const students = Object.values(store.students).sort(
      (a, b) => Date.parse(b.admissionDate) - Date.parse(a.admissionDate),
    );
    const yearSet = new Set<string>([meta.academicYear]);
    students.forEach((s) => yearSet.add(s.currentAcademicYear));
    const gradeSet = new Set<string>(meta.grades);
    students.forEach((s) => gradeSet.add(s.currentGrade));
    const settings = store.settings ?? defaultStudentSettings(schoolId);
    const sectionSet = new Set<string>(settings.defaultSections);
    students.forEach((s) => sectionSet.add(s.currentSection));

    const memSnap: StudentWorkspaceSnapshot = {
      schoolId,
      schoolName: meta.schoolName,
      schoolSlug: meta.schoolSlug,
      students,
      groups: Object.values(store.groups),
      activities: store.activities.slice(0, 40),
      settings,
      academicYears: Array.from(yearSet).sort().reverse(),
      grades: Array.from(gradeSet),
      sections: Array.from(sectionSet).sort(),
      pendingAdmittedCount: 0,
    };
    await tenantCache.set(schoolId, STUDENTS_CACHE_KEY, memSnap, 60);
    return memSnap;
  }

  async getStudentById(
    explicitSchoolId: string,
    studentId: string,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentRecord> {
    const snap = await this.getSnapshot(explicitSchoolId, options);
    const found = snap.students.find(
      (s) =>
        s.id === studentId ||
        s.applicationId === studentId ||
        s.admissionNumber.toLowerCase() === studentId.toLowerCase(),
    );
    if (!found) {
      throw new NotFoundError("Student");
    }
    return found;
  }

  async createStudent(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: CreateStudentInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const admNo = input.admissionNumber?.trim() || generateAdmissionNumber();
    const admDate = input.admissionDate ? new Date(input.admissionDate) : new Date();

    if (await authRepository.canUsePrismaForPlatform()) {
      const created = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;
          const dup = await (tx as any).student.findFirst({
            where: { schoolId, admissionNumber: admNo },
            select: { id: true },
          });
          if (dup) throw new ConflictError(`Admission number "${admNo}" already exists.`);

          const row = await (tx as any).student.create({
            data: {
              schoolId,
              admissionNumber: admNo,
              studentName: input.studentName,
              gender: input.gender ?? null,
              dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
              bloodGroup: input.bloodGroup ?? null,
              nationality: input.nationality ?? "Indian",
              email: input.email || null,
              phone: input.phone ?? null,
              addressJson: input.address ?? null,
              guardianName: input.guardianName,
              guardianRelation: input.guardianRelation || "Parent",
              guardianPhone: input.guardianPhone,
              guardianEmail: input.guardianEmail || null,
              previousSchool: input.previousSchool ?? null,
              medicalNotes: input.medicalNotes ?? null,
              admissionType: input.admissionType,
              admissionDate: admDate,
              status: input.status,
              currentAcademicYear: input.academicYear,
              currentGrade: input.grade,
              currentSection: input.section,
              currentRollNumber: input.rollNumber ?? null,
            },
          });

          const enrollment = await (tx as any).studentEnrollment.create({
            data: {
              schoolId,
              studentId: row.id,
              academicYear: input.academicYear,
              grade: input.grade,
              section: input.section,
              rollNumber: input.rollNumber ?? null,
              status: "ENROLLED",
              isCurrent: true,
              effectiveFrom: admDate,
            },
          });

          await (tx as any).studentActivity.create({
            data: {
              schoolId,
              studentId: row.id,
              actorId: actor.userId && UUID_REGEX.test(actor.userId) ? actor.userId : null,
              actorName: actor.userName,
              actionType: "STUDENT_CREATED",
              summary: `${input.studentName} added to ${input.grade} - ${input.section}.`,
            },
          });

          // Sync canonical Guardian + StudentGuardianLink if tables exist
          const cleanPhone = input.guardianPhone.trim().replace(/[^0-9+]/g, "");
          if (cleanPhone.length >= 6) {
            const gCheck = (await tx.$queryRaw`
              SELECT to_regclass('public.guardians') IS NOT NULL AS ready
            `) as Array<{ ready: boolean }>;
            if (gCheck[0]?.ready) {
              let guardianRow = await (tx as any).guardian.findFirst({
                where: { schoolId, normalizedPhone: cleanPhone },
              });
              if (!guardianRow) {
                guardianRow = await (tx as any).guardian.create({
                  data: {
                    schoolId,
                    fullName: input.guardianName,
                    phone: input.guardianPhone,
                    normalizedPhone: cleanPhone,
                    email: input.guardianEmail || null,
                    addressJson: input.address ?? null,
                    status: "ACTIVE",
                    portalStatus: "NOT_INVITED",
                  },
                });
              }
              await (tx as any).studentGuardianLink.upsert({
                where: {
                  schoolId_studentId_guardianId: {
                    schoolId,
                    studentId: row.id,
                    guardianId: guardianRow.id,
                  },
                },
                create: {
                  schoolId,
                  studentId: row.id,
                  guardianId: guardianRow.id,
                  relation: input.guardianRelation || "Parent",
                  isPrimary: true,
                  isEmergencyContact: true,
                  canPickup: true,
                  isFeePayer: true,
                  isActive: true,
                },
                update: {
                  isPrimary: true,
                  isActive: true,
                  unlinkedAt: null,
                },
              });
            }
          }

          return mapStudentRow({ ...row, enrollments: [enrollment], transfers: [] }, []);
        },
        options,
      );

      if (created) {
        await this.invalidateCaches(schoolId);
        return created;
      }
    }

    const store = getMemoryStore(schoolId);
    await this.syncMemoryFromAdmissions(schoolId, store);
    if (Object.values(store.students).some((s) => s.admissionNumber === admNo)) {
      throw new ConflictError(`Admission number "${admNo}" already exists.`);
    }
    const id = randomUUID();
    const nowIso = new Date().toISOString();
    const rec: StudentRecord = {
      id,
      schoolId,
      applicationId: null,
      admissionNumber: admNo,
      studentIdNumber: null,
      studentName: input.studentName,
      gender: input.gender ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      bloodGroup: input.bloodGroup ?? null,
      nationality: input.nationality ?? "Indian",
      photoKey: null,
      email: input.email || null,
      phone: input.phone ?? null,
      address: input.address
        ? {
            addressLine1: input.address.addressLine1 ?? undefined,
            addressLine2: input.address.addressLine2 ?? undefined,
            city: input.address.city ?? undefined,
            state: input.address.state ?? undefined,
            postalCode: input.address.postalCode ?? undefined,
          }
        : null,
      guardianName: input.guardianName,
      guardianRelation: input.guardianRelation || "Parent",
      guardianPhone: input.guardianPhone,
      guardianEmail: input.guardianEmail || null,
      guardianDetails: null,
      previousSchool: input.previousSchool ?? null,
      academicDetails: null,
      medicalNotes: input.medicalNotes ?? null,
      admissionType: input.admissionType,
      admissionDate: admDate.toISOString(),
      status: input.status,
      currentAcademicYear: input.academicYear,
      currentGrade: input.grade,
      currentSection: input.section,
      currentRollNumber: input.rollNumber ?? null,
      graduationYear: null,
      inactiveReason: null,
      groupIds: [],
      enrollments: [
        {
          id: randomUUID(),
          schoolId,
          studentId: id,
          academicYear: input.academicYear,
          grade: input.grade,
          section: input.section,
          rollNumber: input.rollNumber ?? null,
          status: "ENROLLED",
          isCurrent: true,
          promotedFromEnrollmentId: null,
          remarks: null,
          effectiveFrom: admDate.toISOString(),
          effectiveTo: null,
        },
      ],
      transfers: [],
      feeSummary: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.students[id] = rec;
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      studentId: id,
      actorName: actor.userName,
      actionType: "STUDENT_CREATED",
      summary: `${input.studentName} added to ${input.grade} - ${input.section}.`,
      createdAt: nowIso,
    });
    await this.invalidateCaches(schoolId);
    return rec;
  }

  async updateStudent(
    explicitSchoolId: string,
    studentId: string,
    actor: ActorMeta,
    input: UpdateStudentInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await authRepository.canUsePrismaForPlatform()) {
      const updated = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;
          const existing = await (tx as any).student.findFirst({
            where: { id: studentId, schoolId },
          });
          if (!existing) throw new NotFoundError("Student");

          const data: Record<string, unknown> = {};
          if (input.studentName !== undefined) data.studentName = input.studentName;
          if (input.gender !== undefined) data.gender = input.gender;
          if (input.dateOfBirth !== undefined) {
            data.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
          }
          if (input.bloodGroup !== undefined) data.bloodGroup = input.bloodGroup;
          if (input.nationality !== undefined) data.nationality = input.nationality;
          if (input.email !== undefined) data.email = input.email || null;
          if (input.phone !== undefined) data.phone = input.phone;
          if (input.guardianName !== undefined) data.guardianName = input.guardianName;
          if (input.guardianRelation !== undefined) {
            data.guardianRelation = input.guardianRelation || "Parent";
          }
          if (input.guardianPhone !== undefined) data.guardianPhone = input.guardianPhone;
          if (input.guardianEmail !== undefined) data.guardianEmail = input.guardianEmail || null;
          if (input.previousSchool !== undefined) data.previousSchool = input.previousSchool;
          if (input.medicalNotes !== undefined) data.medicalNotes = input.medicalNotes;
          if (input.academicYear !== undefined) data.currentAcademicYear = input.academicYear;
          if (input.grade !== undefined) data.currentGrade = input.grade;
          if (input.section !== undefined) data.currentSection = input.section;
          if (input.rollNumber !== undefined) data.currentRollNumber = input.rollNumber;
          if (input.status !== undefined) data.status = input.status;
          if (input.graduationYear !== undefined) data.graduationYear = input.graduationYear;
          if (input.inactiveReason !== undefined) data.inactiveReason = input.inactiveReason;

          const row = await (tx as any).student.update({
            where: { id: studentId },
            data,
            include: {
              enrollments: { orderBy: { effectiveFrom: "desc" } },
              transfers: { orderBy: { transferDate: "desc" } },
              groupMembers: { select: { groupId: true } },
            },
          });

          if (
            input.grade !== undefined ||
            input.section !== undefined ||
            input.rollNumber !== undefined
          ) {
            await (tx as any).studentEnrollment.updateMany({
              where: { schoolId, studentId, isCurrent: true },
              data: {
                ...(input.grade !== undefined ? { grade: input.grade } : {}),
                ...(input.section !== undefined ? { section: input.section } : {}),
                ...(input.rollNumber !== undefined ? { rollNumber: input.rollNumber } : {}),
              },
            });
          }

          await (tx as any).studentActivity.create({
            data: {
              schoolId,
              studentId,
              actorId: actor.userId && UUID_REGEX.test(actor.userId) ? actor.userId : null,
              actorName: actor.userName,
              actionType: "STUDENT_UPDATED",
              summary: input.status
                ? `${row.studentName} marked as ${input.status}.`
                : `${row.studentName}'s details updated.`,
            },
          });

          return mapStudentRow(
            row,
            (row.groupMembers || []).map((gm: any) => gm.groupId),
          );
        },
        options,
      );

      if (updated) {
        await this.invalidateCaches(schoolId);
        return updated;
      }
    }

    const store = getMemoryStore(schoolId);
    await this.syncMemoryFromAdmissions(schoolId, store);
    const s = store.students[studentId];
    if (!s) throw new NotFoundError("Student");

    if (input.studentName !== undefined) s.studentName = input.studentName;
    if (input.gender !== undefined) s.gender = input.gender ?? null;
    if (input.dateOfBirth !== undefined) s.dateOfBirth = input.dateOfBirth ?? null;
    if (input.bloodGroup !== undefined) s.bloodGroup = input.bloodGroup ?? null;
    if (input.nationality !== undefined) s.nationality = input.nationality ?? null;
    if (input.email !== undefined) s.email = input.email || null;
    if (input.phone !== undefined) s.phone = input.phone ?? null;
    if (input.guardianName !== undefined) s.guardianName = input.guardianName;
    if (input.guardianRelation !== undefined) {
      s.guardianRelation = input.guardianRelation || "Parent";
    }
    if (input.guardianPhone !== undefined) s.guardianPhone = input.guardianPhone;
    if (input.guardianEmail !== undefined) s.guardianEmail = input.guardianEmail || null;
    if (input.previousSchool !== undefined) s.previousSchool = input.previousSchool ?? null;
    if (input.medicalNotes !== undefined) s.medicalNotes = input.medicalNotes ?? null;
    if (input.academicYear !== undefined) s.currentAcademicYear = input.academicYear;
    if (input.grade !== undefined) s.currentGrade = input.grade;
    if (input.section !== undefined) s.currentSection = input.section;
    if (input.rollNumber !== undefined) s.currentRollNumber = input.rollNumber ?? null;
    if (input.status !== undefined) s.status = input.status;
    if (input.graduationYear !== undefined) s.graduationYear = input.graduationYear ?? null;
    if (input.inactiveReason !== undefined) s.inactiveReason = input.inactiveReason ?? null;
    s.updatedAt = new Date().toISOString();

    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      studentId: s.id,
      actorName: actor.userName,
      actionType: "STUDENT_UPDATED",
      summary: input.status
        ? `${s.studentName} marked as ${input.status}.`
        : `${s.studentName}'s details updated.`,
      createdAt: s.updatedAt,
    });
    await this.invalidateCaches(schoolId);
    return s;
  }

  async promoteStudents(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: PromoteStudentsInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{ promotedCount: number }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const now = new Date();

    if (await authRepository.canUsePrismaForPlatform()) {
      const res = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;

          // O(1) batch load instead of N+1 sequential loop
          const targetStudents = (await (tx as any).student.findMany({
            where: { id: { in: input.studentIds }, schoolId },
            select: {
              id: true,
              studentName: true,
              currentGrade: true,
              enrollments: {
                where: { isCurrent: true },
                select: { id: true },
                take: 1,
              },
            },
          })) as Array<{
            id: string;
            studentName: string;
            currentGrade: string;
            enrollments: Array<{ id: string }>;
          }>;

          if (targetStudents.length === 0) {
            return { promotedCount: 0 };
          }

          const validIds = targetStudents.map((s) => s.id);
          const actorUuid =
            actor.userId && UUID_REGEX.test(actor.userId) ? actor.userId : null;

          // 1. Bulk close previous current enrollments
          await (tx as any).studentEnrollment.updateMany({
            where: { schoolId, studentId: { in: validIds }, isCurrent: true },
            data: {
              isCurrent: false,
              status: input.markAsAlumni ? "GRADUATED" : "PROMOTED",
              effectiveTo: now,
              remarks: input.remarks ?? `Promoted to ${input.toGrade}`,
            },
          });

          // 2. Bulk update student records
          if (input.markAsAlumni) {
            await (tx as any).student.updateMany({
              where: { schoolId, id: { in: validIds } },
              data: {
                status: "ALUMNI",
                graduationYear: input.toAcademicYear,
              },
            });
          } else {
            await (tx as any).student.updateMany({
              where: { schoolId, id: { in: validIds } },
              data: {
                status: "ACTIVE",
                currentAcademicYear: input.toAcademicYear,
                currentGrade: input.toGrade,
                currentSection: input.toSection,
              },
            });

            // 3. Bulk idempotent replace for target academicYear enrollments
            await (tx as any).studentEnrollment.deleteMany({
              where: {
                schoolId,
                academicYear: input.toAcademicYear,
                studentId: { in: validIds },
              },
            });
            await (tx as any).studentEnrollment.createMany({
              data: targetStudents.map((stu) => ({
                schoolId,
                studentId: stu.id,
                academicYear: input.toAcademicYear,
                grade: input.toGrade,
                section: input.toSection,
                status: "ENROLLED",
                isCurrent: true,
                promotedFromEnrollmentId: stu.enrollments[0]?.id ?? null,
                effectiveFrom: now,
              })),
            });
          }

          // 4. Bulk activity audit trail
          await (tx as any).studentActivity.createMany({
            data: targetStudents.map((stu) => ({
              schoolId,
              studentId: stu.id,
              actorId: actorUuid,
              actorName: actor.userName,
              actionType: input.markAsAlumni ? "STUDENT_GRADUATED" : "STUDENT_PROMOTED",
              summary: input.markAsAlumni
                ? `${stu.studentName} graduated to Alumni (${input.toAcademicYear}).`
                : `${stu.studentName} promoted from ${stu.currentGrade} to ${input.toGrade} - ${input.toSection}.`,
            })),
          });

          return { promotedCount: targetStudents.length };
        },
        options,
      );

      if (res) {
        await this.invalidateCaches(schoolId);
        return res;
      }
    }

    const store = getMemoryStore(schoolId);
    await this.syncMemoryFromAdmissions(schoolId, store);
    let count = 0;
    const nowIso = now.toISOString();

    for (const studentId of input.studentIds) {
      const stu = store.students[studentId];
      if (!stu) continue;
      const fromGrade = stu.currentGrade;
      const prevEnr = stu.enrollments.find((e) => e.isCurrent);
      if (prevEnr) {
        prevEnr.isCurrent = false;
        prevEnr.status = input.markAsAlumni ? "GRADUATED" : "PROMOTED";
        prevEnr.effectiveTo = nowIso;
      }
      if (input.markAsAlumni) {
        stu.status = "ALUMNI";
        stu.graduationYear = input.toAcademicYear;
      } else {
        stu.status = "ACTIVE";
        stu.currentAcademicYear = input.toAcademicYear;
        stu.currentGrade = input.toGrade;
        stu.currentSection = input.toSection;
        stu.enrollments.unshift({
          id: randomUUID(),
          schoolId,
          studentId: stu.id,
          academicYear: input.toAcademicYear,
          grade: input.toGrade,
          section: input.toSection,
          rollNumber: stu.currentRollNumber,
          status: "ENROLLED",
          isCurrent: true,
          promotedFromEnrollmentId: prevEnr?.id ?? null,
          remarks: input.remarks ?? null,
          effectiveFrom: nowIso,
          effectiveTo: null,
        });
      }
      stu.updatedAt = nowIso;
      store.activities.unshift({
        id: randomUUID(),
        schoolId,
        studentId: stu.id,
        actorName: actor.userName,
        actionType: input.markAsAlumni ? "STUDENT_GRADUATED" : "STUDENT_PROMOTED",
        summary: input.markAsAlumni
          ? `${stu.studentName} graduated to Alumni (${input.toAcademicYear}).`
          : `${stu.studentName} promoted from ${fromGrade} to ${input.toGrade} - ${input.toSection}.`,
        createdAt: nowIso,
      });
      count += 1;
    }

    await this.invalidateCaches(schoolId);
    return { promotedCount: count };
  }

  async transferStudent(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: TransferStudentInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentTransferRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const tDate = input.transferDate ? new Date(input.transferDate) : new Date();
    const tcNo =
      input.tcNumber?.trim() ||
      `TC-${tDate.getUTCFullYear()}-${randomBytes(2).toString("hex").toUpperCase()}`;

    if (await authRepository.canUsePrismaForPlatform()) {
      const rec = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;
          const stu = await (tx as any).student.findFirst({
            where: { id: input.studentId, schoolId },
          });
          if (!stu) throw new NotFoundError("Student");

          const tr = await (tx as any).studentTransfer.create({
            data: {
              schoolId,
              studentId: stu.id,
              transferType: input.transferType,
              transferDate: tDate,
              tcNumber: tcNo,
              counterpartySchool: input.counterpartySchool ?? null,
              reason: input.reason ?? null,
              clearanceStatus: input.clearanceStatus,
              fromGrade: stu.currentGrade,
              toGrade: input.toGrade ?? stu.currentGrade,
              processedByUserId:
                actor.userId && UUID_REGEX.test(actor.userId) ? actor.userId : null,
              processedByName: actor.userName,
            },
          });

          if (input.transferType === "TRANSFER_OUT") {
            await (tx as any).student.update({
              where: { id: stu.id },
              data: { status: "TRANSFERRED", inactiveReason: input.reason || "Transferred out" },
            });
            await (tx as any).studentEnrollment.updateMany({
              where: { schoolId, studentId: stu.id, isCurrent: true },
              data: { isCurrent: false, status: "TRANSFERRED_OUT", effectiveTo: tDate },
            });
          } else {
            await (tx as any).student.update({
              where: { id: stu.id },
              data: {
                status: "ACTIVE",
                admissionType: "TRANSFER",
                ...(input.toGrade ? { currentGrade: input.toGrade } : {}),
                ...(input.toSection ? { currentSection: input.toSection } : {}),
                ...(input.toAcademicYear ? { currentAcademicYear: input.toAcademicYear } : {}),
              },
            });
          }

          await (tx as any).studentActivity.create({
            data: {
              schoolId,
              studentId: stu.id,
              actorId: actor.userId && UUID_REGEX.test(actor.userId) ? actor.userId : null,
              actorName: actor.userName,
              actionType: input.transferType,
              summary:
                input.transferType === "TRANSFER_OUT"
                  ? `${stu.studentName} transferred out (${tcNo}).`
                  : `${stu.studentName} transferred in (${tcNo}).`,
            },
          });

          return {
            id: tr.id,
            schoolId: tr.schoolId,
            studentId: tr.studentId,
            transferType: tr.transferType,
            transferDate: tr.transferDate.toISOString(),
            tcNumber: tr.tcNumber,
            counterpartySchool: tr.counterpartySchool,
            reason: tr.reason,
            clearanceStatus: tr.clearanceStatus,
            fromGrade: tr.fromGrade,
            toGrade: tr.toGrade,
            processedByName: tr.processedByName,
          } as StudentTransferRecord;
        },
        options,
      );

      if (rec) {
        await this.invalidateCaches(schoolId);
        return rec;
      }
    }

    const store = getMemoryStore(schoolId);
    await this.syncMemoryFromAdmissions(schoolId, store);
    const stu = store.students[input.studentId];
    if (!stu) throw new NotFoundError("Student");

    const nowIso = new Date().toISOString();
    const tr: StudentTransferRecord = {
      id: randomUUID(),
      schoolId,
      studentId: stu.id,
      transferType: input.transferType,
      transferDate: tDate.toISOString(),
      tcNumber: tcNo,
      counterpartySchool: input.counterpartySchool ?? null,
      reason: input.reason ?? null,
      clearanceStatus: input.clearanceStatus,
      fromGrade: stu.currentGrade,
      toGrade: input.toGrade ?? stu.currentGrade,
      processedByName: actor.userName,
    };
    stu.transfers.unshift(tr);
    if (input.transferType === "TRANSFER_OUT") {
      stu.status = "TRANSFERRED";
      stu.inactiveReason = input.reason ?? "Transferred out";
    } else {
      stu.status = "ACTIVE";
      if (input.toGrade) stu.currentGrade = input.toGrade;
      if (input.toSection) stu.currentSection = input.toSection;
      if (input.toAcademicYear) stu.currentAcademicYear = input.toAcademicYear;
    }
    stu.updatedAt = nowIso;
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      studentId: stu.id,
      actorName: actor.userName,
      actionType: input.transferType,
      summary:
        input.transferType === "TRANSFER_OUT"
          ? `${stu.studentName} transferred out (${tcNo}).`
          : `${stu.studentName} transferred in (${tcNo}).`,
      createdAt: nowIso,
    });
    await this.invalidateCaches(schoolId);
    return tr;
  }

  async bulkUpdateStudents(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: BulkStudentsActionInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{ updatedCount: number }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (input.action === "SET_STATUS" && !input.status) {
      throw new ValidationError("Target status is required.");
    }
    if (input.action === "ASSIGN_SECTION" && !input.section) {
      throw new ValidationError("Target section is required.");
    }
    if (
      (input.action === "ADD_TO_GROUP" || input.action === "REMOVE_FROM_GROUP") &&
      !input.groupId
    ) {
      throw new ValidationError("Target student group is required.");
    }

    if (await authRepository.canUsePrismaForPlatform()) {
      const res = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;
          let count = 0;

          if (input.action === "SET_STATUS" && input.status) {
            const out = await (tx as any).student.updateMany({
              where: { id: { in: input.studentIds }, schoolId },
              data: {
                status: input.status,
                ...(input.reason !== undefined ? { inactiveReason: input.reason } : {}),
              },
            });
            count = out.count;
          } else if (input.action === "ASSIGN_SECTION" && input.section) {
            const out = await (tx as any).student.updateMany({
              where: { id: { in: input.studentIds }, schoolId },
              data: { currentSection: input.section },
            });
            await (tx as any).studentEnrollment.updateMany({
              where: { studentId: { in: input.studentIds }, schoolId, isCurrent: true },
              data: { section: input.section },
            });
            count = out.count;
          } else if (input.action === "ADD_TO_GROUP" && input.groupId) {
            for (const sid of input.studentIds) {
              await (tx as any).studentGroupMember.upsert({
                where: { groupId_studentId: { groupId: input.groupId, studentId: sid } },
                update: {},
                create: { schoolId, groupId: input.groupId, studentId: sid },
              });
              count += 1;
            }
          } else if (input.action === "REMOVE_FROM_GROUP" && input.groupId) {
            const out = await (tx as any).studentGroupMember.deleteMany({
              where: { schoolId, groupId: input.groupId, studentId: { in: input.studentIds } },
            });
            count = out.count;
          }

          await (tx as any).studentActivity.create({
            data: {
              schoolId,
              actorId: actor.userId && UUID_REGEX.test(actor.userId) ? actor.userId : null,
              actorName: actor.userName,
              actionType: `BULK_${input.action}`,
              summary: `Bulk action ${input.action} applied to ${count} student(s).`,
            },
          });

          return { updatedCount: count };
        },
        options,
      );

      if (res) {
        await this.invalidateCaches(schoolId);
        return res;
      }
    }

    const store = getMemoryStore(schoolId);
    await this.syncMemoryFromAdmissions(schoolId, store);
    let count = 0;
    for (const sid of input.studentIds) {
      const stu = store.students[sid];
      if (!stu) continue;
      if (input.action === "SET_STATUS" && input.status) {
        stu.status = input.status;
        if (input.reason !== undefined) stu.inactiveReason = input.reason;
      } else if (input.action === "ASSIGN_SECTION" && input.section) {
        stu.currentSection = input.section;
      } else if (input.action === "ADD_TO_GROUP" && input.groupId) {
        if (!stu.groupIds.includes(input.groupId)) stu.groupIds.push(input.groupId);
        const grp = store.groups[input.groupId];
        if (grp && !grp.memberStudentIds.includes(sid)) grp.memberStudentIds.push(sid);
      } else if (input.action === "REMOVE_FROM_GROUP" && input.groupId) {
        stu.groupIds = stu.groupIds.filter((g) => g !== input.groupId);
        const grp = store.groups[input.groupId];
        if (grp) grp.memberStudentIds = grp.memberStudentIds.filter((m) => m !== sid);
      }
      count += 1;
    }
    store.activities.unshift({
      id: randomUUID(),
      schoolId,
      studentId: null,
      actorName: actor.userName,
      actionType: `BULK_${input.action}`,
      summary: `Bulk action ${input.action} applied to ${count} student(s).`,
      createdAt: new Date().toISOString(),
    });
    await this.invalidateCaches(schoolId);
    return { updatedCount: count };
  }

  async createGroup(
    explicitSchoolId: string,
    input: CreateStudentGroupInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentGroupRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await authRepository.canUsePrismaForPlatform()) {
      const grp = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;
          const row = await (tx as any).studentGroup.create({
            data: {
              schoolId,
              name: input.name,
              category: input.category,
              colorToken: input.colorToken,
              description: input.description ?? null,
            },
          });
          return {
            id: row.id,
            schoolId: row.schoolId,
            name: row.name,
            category: row.category,
            colorToken: row.colorToken,
            description: row.description ?? null,
            memberStudentIds: [],
          } as StudentGroupRecord;
        },
        options,
      );
      if (grp) {
        await this.invalidateCaches(schoolId);
        return grp;
      }
    }

    const store = getMemoryStore(schoolId);
    const id = randomUUID();
    const rec: StudentGroupRecord = {
      id,
      schoolId,
      name: input.name,
      category: input.category,
      colorToken: input.colorToken,
      description: input.description ?? null,
      memberStudentIds: [],
    };
    store.groups[id] = rec;
    await this.invalidateCaches(schoolId);
    return rec;
  }

  async updateSettings(
    explicitSchoolId: string,
    input: UpdateStudentSettingsInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentSettingRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await authRepository.canUsePrismaForPlatform()) {
      const updated = await runTenantStudentTx(
        schoolId,
        async (tx) => {
          if (!(await hasStudentTables(tx))) return null;
          const existing = await (tx as any).studentSetting.findUnique({ where: { schoolId } });
          const base = existing ?? defaultStudentSettings(schoolId);
          const row = await (tx as any).studentSetting.upsert({
            where: { schoolId },
            update: {
              ...(input.defaultSections ? { defaultSections: input.defaultSections } : {}),
              ...(input.sectionsByGrade ? { sectionsByGrade: input.sectionsByGrade } : {}),
              ...(input.rollNumberMode ? { rollNumberMode: input.rollNumberMode } : {}),
              ...(input.requireTcOnTransfer !== undefined
                ? { requireTcOnTransfer: input.requireTcOnTransfer }
                : {}),
              ...(input.idCardConfig ? { idCardConfig: input.idCardConfig } : {}),
              ...(input.promotionConfig ? { promotionConfig: input.promotionConfig } : {}),
            },
            create: {
              schoolId,
              defaultSections: input.defaultSections ?? base.defaultSections,
              sectionsByGrade: input.sectionsByGrade ?? base.sectionsByGrade,
              rollNumberMode: input.rollNumberMode ?? base.rollNumberMode,
              requireTcOnTransfer: input.requireTcOnTransfer ?? base.requireTcOnTransfer,
              idCardConfig: input.idCardConfig ?? base.idCardConfig,
              promotionConfig: input.promotionConfig ?? base.promotionConfig,
            },
          });
          return {
            schoolId,
            defaultSections: row.defaultSections,
            sectionsByGrade: row.sectionsByGrade ?? {},
            rollNumberMode: row.rollNumberMode === "MANUAL" ? "MANUAL" : "AUTO_ALPHA",
            requireTcOnTransfer: Boolean(row.requireTcOnTransfer),
            idCardConfig: row.idCardConfig ?? defaultStudentSettings(schoolId).idCardConfig,
            promotionConfig:
              row.promotionConfig ?? defaultStudentSettings(schoolId).promotionConfig,
          } as StudentSettingRecord;
        },
        options,
      );
      if (updated) {
        await this.invalidateCaches(schoolId);
        return updated;
      }
    }

    const store = getMemoryStore(schoolId);
    const cur = store.settings ?? defaultStudentSettings(schoolId);
    store.settings = {
      ...cur,
      ...(input.defaultSections ? { defaultSections: input.defaultSections } : {}),
      ...(input.sectionsByGrade ? { sectionsByGrade: input.sectionsByGrade } : {}),
      ...(input.rollNumberMode ? { rollNumberMode: input.rollNumberMode } : {}),
      ...(input.requireTcOnTransfer !== undefined
        ? { requireTcOnTransfer: input.requireTcOnTransfer }
        : {}),
      ...(input.idCardConfig ? { idCardConfig: input.idCardConfig } : {}),
      ...(input.promotionConfig ? { promotionConfig: input.promotionConfig } : {}),
    };
    await this.invalidateCaches(schoolId);
    return store.settings;
  }

  async getGlobalStudentsAnalytics(
    filters?: StudentFilterParams & { schoolId?: string },
  ): Promise<PlatformGlobalStudentsAnalytics> {
    const schools = await platformCache.getOrLoadAllSchools(async () => []);
    const fallbackSchools =
      schools.length > 0
        ? schools
        : (await import("@/server/platform/platform-repository")).platformRepository.listSchools();
    const resolvedSchools = await fallbackSchools;

    const targetSchools =
      filters?.schoolId && filters.schoolId !== "ALL"
        ? resolvedSchools.filter((e) => e.school.id === filters.schoolId)
        : resolvedSchools;

    const schoolSnaps = await Promise.all(
      targetSchools.map(async (entry) => ({
        entry,
        snap: await this.getSnapshot(entry.school.id, { asPlatformAdmin: true }),
      })),
    );

    const allStudents: Array<StudentRecord & { schoolName: string; schoolUniqueId: string | null }> =
      [];
    const aySet = new Set<string>();
    const gradeSet = new Set<string>();
    const secSet = new Set<string>();

    const schoolSummaries = schoolSnaps.map(({ entry, snap }) => {
      const schoolAnalytics = computeStudentAnalytics(snap.students, filters, snap.grades);
      snap.academicYears.forEach((y) => aySet.add(y));
      snap.grades.forEach((g) => gradeSet.add(g));
      snap.sections.forEach((s) => secSet.add(s));
      for (const st of snap.students) {
        allStudents.push({
          ...st,
          schoolName: entry.school.name,
          schoolUniqueId: entry.school.uniqueId ?? null,
        });
      }
      return {
        schoolId: entry.school.id,
        schoolName: entry.school.name,
        schoolUniqueId: entry.school.uniqueId ?? null,
        totalStudents: schoolAnalytics.kpis.totalStudents,
        activeStudents: schoolAnalytics.kpis.activeStudents,
        inactiveStudents: schoolAnalytics.kpis.inactiveStudents,
        transferredCount: schoolAnalytics.kpis.transferredCount,
        alumniCount: schoolAnalytics.kpis.alumniCount,
        newEnrolments: schoolAnalytics.kpis.newEnrolments,
      };
    });

    const analytics = computeStudentAnalytics(
      allStudents,
      filters,
      Array.from(gradeSet),
    );

    return {
      totalSchoolsWithStudents: schoolSummaries.filter((s) => s.totalStudents > 0).length,
      analytics,
      schoolSummaries,
      students: allStudents,
      academicYears: Array.from(aySet).sort().reverse(),
      grades: Array.from(gradeSet),
      sections: Array.from(secSet).sort(),
    };
  }
}

export const studentRepository = new StudentRepository();
