/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { authRepository } from "@/server/auth/auth-repository";
import { tenantCache } from "@/server/integrations/redis";
import { studentRepository } from "@/server/school/student-repository";
import { parentRepository } from "@/server/school/parent-repository";
import {
  ConflictError,
  NotFoundError,
  TenantNotFoundError,
  ValidationError,
} from "@/lib/errors";
import { DEFAULT_ADMISSION_GRADES } from "@/modules/school/admissions/types";
import type {
  AcademicClassNode,
  AcademicSectionNode,
  AcademicSessionRecord,
  AcademicSubjectRecord,
  AcademicTreeGuardianNode,
  AcademicTreeStudentNode,
  AcademicWorkspaceSnapshot,
  ClassSubjectMappingRecord,
} from "@/modules/academics/types";
import type { AcademicMutationInput } from "@/modules/academics/schemas";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACADEMICS_CACHE_KEY = "academics:snapshot:v1";
const TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };

interface MemoryAcademicState {
  sessions: AcademicSessionRecord[];
  subjects: AcademicSubjectRecord[];
  classes: Array<{
    id: string;
    academicYear: string;
    name: string;
    code: string | null;
    department: string;
    displayOrder: number;
    status: "ACTIVE" | "ARCHIVED";
  }>;
  sections: Array<{
    id: string;
    classId: string;
    academicYear: string;
    name: string;
    capacity: number;
    roomNumber: string | null;
    classTeacherName: string | null;
    status: "ACTIVE" | "ARCHIVED";
  }>;
  assignments: ClassSubjectMappingRecord[];
}

const globalForAcademics = globalThis as unknown as {
  __scholonixAcademicMemoryStore?: Record<string, MemoryAcademicState>;
  __scholonixAcademicCaps?: { hasTables: boolean; checkedAt: number };
  __scholonixAcademicFlights?: Map<string, Promise<AcademicWorkspaceSnapshot>>;
};

const DEFAULT_SUBJECTS: Array<{
  code: string;
  name: string;
  category: "CORE" | "ELECTIVE" | "LAB" | "CO_SCHOLASTIC";
  maxMarks: number;
  passMarks: number;
}> = [
  { code: "ENG", name: "English", category: "CORE", maxMarks: 100, passMarks: 33 },
  { code: "MATH", name: "Mathematics", category: "CORE", maxMarks: 100, passMarks: 33 },
  { code: "SCI", name: "Science", category: "CORE", maxMarks: 100, passMarks: 33 },
  { code: "SST", name: "Social Studies", category: "CORE", maxMarks: 100, passMarks: 33 },
  { code: "CS", name: "Computer Science", category: "LAB", maxMarks: 100, passMarks: 33 },
];

function getMemoryStore(schoolId: string): MemoryAcademicState {
  if (!globalForAcademics.__scholonixAcademicMemoryStore) {
    globalForAcademics.__scholonixAcademicMemoryStore = {};
  }
  if (!globalForAcademics.__scholonixAcademicMemoryStore[schoolId]) {
    globalForAcademics.__scholonixAcademicMemoryStore[schoolId] = {
      sessions: [],
      subjects: DEFAULT_SUBJECTS.map((s) => ({
        id: randomUUID(),
        schoolId,
        code: s.code,
        name: s.name,
        category: s.category,
        defaultMaxMarks: s.maxMarks,
        defaultPassMarks: s.passMarks,
        status: "ACTIVE",
      })),
      classes: [],
      sections: [],
      assignments: [],
    };
  }
  return globalForAcademics.__scholonixAcademicMemoryStore[schoolId]!;
}

export function resetInMemoryAcademicsStoreForTests(): void {
  globalForAcademics.__scholonixAcademicMemoryStore = {};
}

async function singleFlightAcademics(
  key: string,
  loader: () => Promise<AcademicWorkspaceSnapshot>,
): Promise<AcademicWorkspaceSnapshot> {
  if (!globalForAcademics.__scholonixAcademicFlights) {
    globalForAcademics.__scholonixAcademicFlights = new Map();
  }
  const existing = globalForAcademics.__scholonixAcademicFlights.get(key);
  if (existing) return existing;
  const p = loader().finally(() => {
    globalForAcademics.__scholonixAcademicFlights?.delete(key);
  });
  globalForAcademics.__scholonixAcademicFlights.set(key, p);
  return p;
}

async function hasAcademicTables(tx: Prisma.TransactionClient): Promise<boolean> {
  if (
    globalForAcademics.__scholonixAcademicCaps &&
    Date.now() - globalForAcademics.__scholonixAcademicCaps.checkedAt < 60_000
  ) {
    return globalForAcademics.__scholonixAcademicCaps.hasTables;
  }
  try {
    const rows = (await tx.$queryRaw`
      SELECT to_regclass('public.academic_sessions') IS NOT NULL
         AND to_regclass('public.academic_classes') IS NOT NULL
         AND to_regclass('public.academic_sections') IS NOT NULL
         AND to_regclass('public.academic_subjects') IS NOT NULL
         AND to_regclass('public.class_subject_assignments') IS NOT NULL AS ready
    `) as Array<{ ready: boolean }>;
    const ready = Boolean(rows[0]?.ready);
    globalForAcademics.__scholonixAcademicCaps = { hasTables: ready, checkedAt: Date.now() };
    return ready;
  } catch {
    return false;
  }
}

async function runTenantAcademicTx<T>(
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

function buildTreeFromSources({
  schoolId,
  schoolName,
  schoolSlug,
  requestedYear,
  sessions,
  subjects,
  rawClasses,
  rawSections,
  assignments,
  studentSnap,
  parentSnap,
}: {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  requestedYear?: string;
  sessions: AcademicSessionRecord[];
  subjects: AcademicSubjectRecord[];
  rawClasses: Array<{
    id: string;
    academicYear: string;
    name: string;
    code: string | null;
    department: string;
    displayOrder: number;
    status: "ACTIVE" | "ARCHIVED";
  }>;
  rawSections: Array<{
    id: string;
    classId: string;
    academicYear: string;
    name: string;
    capacity: number;
    roomNumber: string | null;
    classTeacherName: string | null;
    status: "ACTIVE" | "ARCHIVED";
  }>;
  assignments: ClassSubjectMappingRecord[];
  studentSnap: Awaited<ReturnType<typeof studentRepository.getSnapshot>>;
  parentSnap: Awaited<ReturnType<typeof parentRepository.getSnapshot>>;
}): AcademicWorkspaceSnapshot {
  // Determine active session cleanly
  const derivedYears = new Set<string>(sessions.map((s) => s.name));
  for (const c of rawClasses) {
    if (c.academicYear) derivedYears.add(c.academicYear);
  }
  for (const stu of studentSnap.students) {
    if (stu.currentAcademicYear) derivedYears.add(stu.currentAcademicYear);
  }
  for (const yr of studentSnap.academicYears) {
    if (yr) derivedYears.add(yr);
  }
  if (derivedYears.size === 0) derivedYears.add("2026-2027");

  const finalSessions: AcademicSessionRecord[] = [...sessions];
  for (const yr of derivedYears) {
    if (!finalSessions.some((s) => s.name === yr)) {
      finalSessions.push({
        id: randomUUID(),
        schoolId,
        name: yr,
        startDate: null,
        endDate: null,
        isCurrent: finalSessions.length === 0,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      });
    }
  }

  const activeAcademicYear =
    (requestedYear && derivedYears.has(requestedYear) ? requestedYear : null) ??
    finalSessions.find((s) => s.isCurrent)?.name ??
    finalSessions[0]!.name;

  // Build guardian lookup per student
  const guardiansByStudentId = new Map<string, AcademicTreeGuardianNode[]>();
  const uniqueGuardianIds = new Set<string>();
  for (const g of parentSnap.guardians) {
    const activeWards = g.wards.filter((w) => w.isActive);
    for (const w of activeWards) {
      uniqueGuardianIds.add(g.id);
      const siblingNames = activeWards
        .filter((other) => other.studentId !== w.studentId)
        .map((other) => `${other.studentName} (${other.currentGrade})`);
      const arr = guardiansByStudentId.get(w.studentId) ?? [];
      arr.push({
        id: g.id,
        fullName: g.fullName,
        relation: w.relation,
        phone: g.phone,
        email: g.email,
        isPrimary: w.isPrimary,
        canPickup: w.canPickup,
        isFeePayer: w.isFeePayer,
        restrictedContact: w.restrictedContact,
        portalStatus: g.portalStatus,
        siblingNames,
      });
      guardiansByStudentId.set(w.studentId, arr);
    }
  }

  const yearStudents = studentSnap.students.filter(
    (s) => !s.currentAcademicYear || s.currentAcademicYear === activeAcademicYear,
  );

  // Merge stored classes for activeAcademicYear with student grades + default admission grades
  const classList = rawClasses.filter((c) => c.academicYear === activeAcademicYear);
  const knownClassNames = new Set(classList.map((c) => c.name));

  const candidateGrades = new Set<string>([
    ...studentSnap.grades,
    ...yearStudents.map((s) => s.currentGrade),
    ...(classList.length === 0 ? DEFAULT_ADMISSION_GRADES.slice(0, 6) : []),
  ]);

  let nextOrder = classList.length + 1;
  for (const grade of candidateGrades) {
    if (!grade || knownClassNames.has(grade)) continue;
    knownClassNames.add(grade);
    classList.push({
      id: randomUUID(),
      academicYear: activeAcademicYear,
      name: grade,
      code: grade.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase(),
      department: "General",
      displayOrder: nextOrder++,
      status: "ACTIVE",
    });
  }

  classList.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));

  const classes: AcademicClassNode[] = classList.map((cls) => {
    const classStudents = yearStudents.filter((s) => s.currentGrade === cls.name);
    const storedSections = rawSections.filter(
      (sec) => sec.classId === cls.id && sec.academicYear === activeAcademicYear,
    );
    const sectionNames = new Set<string>(storedSections.map((sec) => sec.name));
    for (const s of classStudents) {
      sectionNames.add(s.currentSection || "A");
    }
    if (sectionNames.size === 0) {
      for (const defSec of studentSnap.settings.defaultSections.slice(0, 2)) {
        sectionNames.add(defSec);
      }
    }

    const sections: AcademicSectionNode[] = Array.from(sectionNames)
      .sort()
      .map((secName) => {
        const stored = storedSections.find((s) => s.name === secName);
        const studentsInSec: AcademicTreeStudentNode[] = classStudents
          .filter((stu) => (stu.currentSection || "A") === secName)
          .map((stu) => {
            const linked = guardiansByStudentId.get(stu.id) ?? [
              {
                id: stu.id,
                fullName: stu.guardianName,
                relation: stu.guardianRelation || "Parent",
                phone: stu.guardianPhone,
                email: stu.guardianEmail,
                isPrimary: true,
                canPickup: true,
                isFeePayer: true,
                restrictedContact: false,
                portalStatus: "NOT_INVITED",
                siblingNames: [],
              },
            ];
            return {
              id: stu.id,
              admissionNumber: stu.admissionNumber,
              studentName: stu.studentName,
              rollNumber: stu.currentRollNumber,
              gender: stu.gender,
              status: stu.status,
              grade: stu.currentGrade,
              section: stu.currentSection || "A",
              academicYear: stu.currentAcademicYear,
              guardians: linked,
            };
          });

        return {
          id: stored?.id ?? randomUUID(),
          schoolId,
          classId: cls.id,
          academicYear: activeAcademicYear,
          name: secName,
          capacity: stored?.capacity ?? 40,
          roomNumber: stored?.roomNumber ?? null,
          classTeacherName: stored?.classTeacherName ?? null,
          status: stored?.status ?? "ACTIVE",
          students: studentsInSec,
        };
      });

    const classSubjects = assignments.filter(
      (a) => a.classId === cls.id && a.academicYear === activeAcademicYear && a.isActive,
    );

    const guardianIdsInClass = new Set<string>();
    for (const sec of sections) {
      for (const stu of sec.students) {
        for (const g of stu.guardians) {
          guardianIdsInClass.add(g.id);
        }
      }
    }

    return {
      id: cls.id,
      schoolId,
      academicYear: activeAcademicYear,
      name: cls.name,
      code: cls.code,
      department: cls.department,
      displayOrder: cls.displayOrder,
      status: cls.status,
      subjects: classSubjects,
      sections,
      studentCount: classStudents.length,
      guardianCount: guardianIdsInClass.size,
    };
  });

  const totalSections = classes.reduce((acc, c) => acc + c.sections.length, 0);
  const totalStudents = yearStudents.length;

  return {
    schoolId,
    schoolName,
    schoolSlug,
    activeAcademicYear,
    sessions: finalSessions,
    subjects,
    classes,
    kpis: {
      totalClasses: classes.length,
      totalSections,
      totalSubjects: subjects.filter((s) => s.status === "ACTIVE").length,
      totalStudents,
      totalLinkedGuardians: uniqueGuardianIds.size,
    },
  };
}

class AcademicsRepository extends BaseTenantRepository {
  private requireSchoolId(explicitSchoolId?: string): string {
    const sid = this.getSchoolId(explicitSchoolId);
    if (!sid || !sid.trim()) {
      throw new TenantNotFoundError("School tenant identifier is required.");
    }
    return sid.trim();
  }

  async invalidateCaches(schoolId: string): Promise<void> {
    await Promise.all([
      tenantCache.del(schoolId, ACADEMICS_CACHE_KEY).catch(() => {}),
      tenantCache.del(schoolId, "students:snapshot:v1").catch(() => {}),
      tenantCache.del(schoolId, "parents:snapshot:v1").catch(() => {}),
    ]);
  }

  async getSnapshot(
    explicitSchoolId: string,
    options?: { academicYear?: string; asPlatformAdmin?: boolean; bypassCache?: boolean },
  ): Promise<AcademicWorkspaceSnapshot> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const cacheKey = options?.academicYear
      ? `${ACADEMICS_CACHE_KEY}:${options.academicYear}`
      : ACADEMICS_CACHE_KEY;

    if (!options?.bypassCache) {
      const cached = await tenantCache.get<AcademicWorkspaceSnapshot>(schoolId, cacheKey);
      if (cached) return cached;
    }

    return singleFlightAcademics(`${schoolId}:${cacheKey}`, async () => {
      const [studentSnap, parentSnap] = await Promise.all([
        studentRepository.getSnapshot(schoolId, options),
        parentRepository.getSnapshot(schoolId, options),
      ]);

      if (await authRepository.canUsePrismaForPlatform()) {
        const dbData = await runTenantAcademicTx(
          schoolId,
          async (tx) => {
            if (!(await hasAcademicTables(tx))) return null;
            const [sessions, classes, sections, subjects, assignments] = await Promise.all([
              (tx as any).academicSession.findMany({
                where: { schoolId },
                orderBy: [{ isCurrent: "desc" }, { name: "desc" }],
              }),
              (tx as any).academicClass.findMany({
                where: { schoolId },
                orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
              }),
              (tx as any).academicSection.findMany({
                where: { schoolId },
                orderBy: { name: "asc" },
              }),
              (tx as any).academicSubject.findMany({
                where: { schoolId },
                orderBy: { name: "asc" },
              }),
              (tx as any).classSubjectAssignment.findMany({
                where: { schoolId },
                include: { subject: true },
              }),
            ]);

            return {
              sessions: sessions.map((s: any): AcademicSessionRecord => ({
                id: s.id,
                schoolId: s.schoolId,
                name: s.name,
                startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : null,
                endDate: s.endDate ? new Date(s.endDate).toISOString().slice(0, 10) : null,
                isCurrent: Boolean(s.isCurrent),
                status: s.status,
                createdAt: new Date(s.createdAt).toISOString(),
              })),
              subjects: subjects.map((sub: any): AcademicSubjectRecord => ({
                id: sub.id,
                schoolId: sub.schoolId,
                code: sub.code,
                name: sub.name,
                category: sub.category,
                defaultMaxMarks: sub.defaultMaxMarks,
                defaultPassMarks: sub.defaultPassMarks,
                status: sub.status,
              })),
              classes: classes.map((c: any) => ({
                id: c.id,
                academicYear: c.academicYear,
                name: c.name,
                code: c.code ?? null,
                department: c.department || "General",
                displayOrder: c.displayOrder,
                status: c.status,
              })),
              sections: sections.map((sec: any) => ({
                id: sec.id,
                classId: sec.classId,
                academicYear: sec.academicYear,
                name: sec.name,
                capacity: sec.capacity,
                roomNumber: sec.roomNumber ?? null,
                classTeacherName: sec.classTeacherName ?? null,
                status: sec.status,
              })),
              assignments: assignments.map((a: any): ClassSubjectMappingRecord => ({
                id: a.id,
                schoolId: a.schoolId,
                classId: a.classId,
                subjectId: a.subjectId,
                subjectCode: a.subject?.code ?? "SUB",
                subjectName: a.subject?.name ?? "Subject",
                subjectCategory: a.subject?.category ?? "CORE",
                academicYear: a.academicYear,
                teacherName: a.teacherName ?? null,
                weeklyPeriods: a.weeklyPeriods,
                maxMarks: a.maxMarks,
                passMarks: a.passMarks,
                isCompulsory: Boolean(a.isCompulsory),
                isActive: Boolean(a.isActive),
              })),
            };
          },
          options,
        );

        if (dbData) {
          const snap = buildTreeFromSources({
            schoolId,
            schoolName: studentSnap.schoolName,
            schoolSlug: studentSnap.schoolSlug,
            requestedYear: options?.academicYear,
            sessions: dbData.sessions,
            subjects: dbData.subjects,
            rawClasses: dbData.classes,
            rawSections: dbData.sections,
            assignments: dbData.assignments,
            studentSnap,
            parentSnap,
          });
          await tenantCache.set(schoolId, cacheKey, snap, 120);
          return snap;
        }
      }

      const mem = getMemoryStore(schoolId);
      const snap = buildTreeFromSources({
        schoolId,
        schoolName: studentSnap.schoolName,
        schoolSlug: studentSnap.schoolSlug,
        requestedYear: options?.academicYear,
        sessions: mem.sessions,
        subjects: mem.subjects,
        rawClasses: mem.classes,
        rawSections: mem.sections,
        assignments: mem.assignments,
        studentSnap,
        parentSnap,
      });
      await tenantCache.set(schoolId, cacheKey, snap, 60);
      return snap;
    });
  }

  async mutate(
    explicitSchoolId: string,
    input: AcademicMutationInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<AcademicWorkspaceSnapshot> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await authRepository.canUsePrismaForPlatform()) {
      const done = await runTenantAcademicTx(
        schoolId,
        async (tx) => {
          if (!(await hasAcademicTables(tx))) return null;

          switch (input.action) {
            case "CREATE_SESSION": {
              const dup = await (tx as any).academicSession.findFirst({
                where: { schoolId, name: input.name },
              });
              if (dup) throw new ConflictError(`Academic session "${input.name}" already exists.`);
              if (input.isCurrent) {
                await (tx as any).academicSession.updateMany({
                  where: { schoolId, isCurrent: true },
                  data: { isCurrent: false },
                });
              }
              await (tx as any).academicSession.create({
                data: {
                  schoolId,
                  name: input.name,
                  startDate: input.startDate ? new Date(input.startDate) : null,
                  endDate: input.endDate ? new Date(input.endDate) : null,
                  isCurrent: input.isCurrent,
                  status: input.status,
                },
              });
              return true;
            }
            case "SET_CURRENT_SESSION": {
              const target = await (tx as any).academicSession.findFirst({
                where: { schoolId, id: input.sessionId },
              });
              if (!target) throw new NotFoundError("Academic session");
              await (tx as any).academicSession.updateMany({
                where: { schoolId, isCurrent: true },
                data: { isCurrent: false },
              });
              await (tx as any).academicSession.update({
                where: { id: input.sessionId },
                data: { isCurrent: true, status: "ACTIVE" },
              });
              return true;
            }
            case "CREATE_CLASS": {
              const dup = await (tx as any).academicClass.findFirst({
                where: { schoolId, academicYear: input.academicYear, name: input.name },
              });
              if (dup) {
                throw new ConflictError(
                  `Class "${input.name}" already exists for ${input.academicYear}.`,
                );
              }
              const cls = await (tx as any).academicClass.create({
                data: {
                  schoolId,
                  academicYear: input.academicYear,
                  name: input.name,
                  code: input.code || null,
                  department: input.department || "General",
                  displayOrder: input.displayOrder,
                  status: "ACTIVE",
                },
              });
              for (const secName of input.defaultSections ?? ["A", "B"]) {
                await (tx as any).academicSection.create({
                  data: {
                    schoolId,
                    classId: cls.id,
                    academicYear: input.academicYear,
                    name: secName,
                    capacity: 40,
                    status: "ACTIVE",
                  },
                });
              }
              return true;
            }
            case "CREATE_SECTION": {
              let cls = await (tx as any).academicClass.findFirst({
                where: { schoolId, id: input.classId },
              });
              if (!cls && input.className) {
                cls = await (tx as any).academicClass.upsert({
                  where: {
                    schoolId_academicYear_name: {
                      schoolId,
                      academicYear: input.academicYear,
                      name: input.className,
                    },
                  },
                  create: {
                    schoolId,
                    academicYear: input.academicYear,
                    name: input.className,
                    displayOrder: 1,
                    status: "ACTIVE",
                  },
                  update: {},
                });
              }
              if (!cls) throw new NotFoundError("Class");
              const dup = await (tx as any).academicSection.findFirst({
                where: { schoolId, classId: cls.id, name: input.name },
              });
              if (dup) {
                throw new ConflictError(`Section "${input.name}" already exists in ${cls.name}.`);
              }
              await (tx as any).academicSection.create({
                data: {
                  schoolId,
                  classId: cls.id,
                  academicYear: cls.academicYear,
                  name: input.name,
                  capacity: input.capacity,
                  roomNumber: input.roomNumber || null,
                  classTeacherName: input.classTeacherName || null,
                  status: "ACTIVE",
                },
              });
              return true;
            }
            case "UPDATE_SECTION": {
              const sec = await (tx as any).academicSection.findFirst({
                where: { schoolId, id: input.sectionId },
              });
              if (!sec) throw new NotFoundError("Section");
              await (tx as any).academicSection.update({
                where: { id: input.sectionId },
                data: {
                  ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
                  ...(input.roomNumber !== undefined ? { roomNumber: input.roomNumber || null } : {}),
                  ...(input.classTeacherName !== undefined
                    ? { classTeacherName: input.classTeacherName || null }
                    : {}),
                  ...(input.status !== undefined ? { status: input.status } : {}),
                },
              });
              return true;
            }
            case "CREATE_SUBJECT": {
              if (input.defaultPassMarks > input.defaultMaxMarks) {
                throw new ValidationError("Pass marks cannot exceed max marks.");
              }
              const dup = await (tx as any).academicSubject.findFirst({
                where: { schoolId, code: input.code.toUpperCase() },
              });
              if (dup) throw new ConflictError(`Subject code "${input.code}" already exists.`);
              await (tx as any).academicSubject.create({
                data: {
                  schoolId,
                  code: input.code.toUpperCase(),
                  name: input.name,
                  category: input.category,
                  defaultMaxMarks: input.defaultMaxMarks,
                  defaultPassMarks: input.defaultPassMarks,
                  status: "ACTIVE",
                },
              });
              return true;
            }
            case "ASSIGN_CLASS_SUBJECT": {
              if (input.passMarks > input.maxMarks) {
                throw new ValidationError("Pass marks cannot exceed max marks.");
              }
              let cls = await (tx as any).academicClass.findFirst({ where: { schoolId, id: input.classId } });
              if (!cls && input.className) {
                cls = await (tx as any).academicClass.upsert({
                  where: {
                    schoolId_academicYear_name: {
                      schoolId,
                      academicYear: input.academicYear,
                      name: input.className,
                    },
                  },
                  create: {
                    schoolId,
                    academicYear: input.academicYear,
                    name: input.className,
                    displayOrder: 1,
                    status: "ACTIVE",
                  },
                  update: {},
                });
              }
              const sub = await (tx as any).academicSubject.findFirst({ where: { schoolId, id: input.subjectId } });
              if (!cls) throw new NotFoundError("Class");
              if (!sub) throw new NotFoundError("Subject");
              await (tx as any).classSubjectAssignment.upsert({
                where: {
                  schoolId_classId_subjectId: {
                    schoolId,
                    classId: cls.id,
                    subjectId: input.subjectId,
                  },
                },
                create: {
                  schoolId,
                  classId: cls.id,
                  subjectId: input.subjectId,
                  academicYear: cls.academicYear,
                  teacherName: input.teacherName || null,
                  weeklyPeriods: input.weeklyPeriods,
                  maxMarks: input.maxMarks,
                  passMarks: input.passMarks,
                  isCompulsory: input.isCompulsory,
                  isActive: true,
                },
                update: {
                  teacherName: input.teacherName || null,
                  weeklyPeriods: input.weeklyPeriods,
                  maxMarks: input.maxMarks,
                  passMarks: input.passMarks,
                  isCompulsory: input.isCompulsory,
                  isActive: true,
                },
              });
              return true;
            }
            case "REMOVE_CLASS_SUBJECT": {
              const row = await (tx as any).classSubjectAssignment.findFirst({
                where: { schoolId, id: input.assignmentId },
              });
              if (!row) throw new NotFoundError("Class subject assignment");
              await (tx as any).classSubjectAssignment.update({
                where: { id: input.assignmentId },
                data: { isActive: false },
              });
              return true;
            }
          }
        },
        options,
      );

      if (done) {
        await this.invalidateCaches(schoolId);
        const returnYear =
          "academicYear" in input && typeof input.academicYear === "string"
            ? input.academicYear
            : input.action === "CREATE_SESSION"
              ? input.name
              : undefined;
        return this.getSnapshot(schoolId, {
          ...options,
          academicYear: returnYear,
          bypassCache: true,
        });
      }
    }

    // In-memory test / fallback path
    const mem = getMemoryStore(schoolId);
    const nowIso = new Date().toISOString();

    switch (input.action) {
      case "CREATE_SESSION": {
        if (mem.sessions.some((s) => s.name === input.name)) {
          throw new ConflictError(`Academic session "${input.name}" already exists.`);
        }
        if (input.isCurrent) {
          for (const s of mem.sessions) s.isCurrent = false;
        }
        mem.sessions.unshift({
          id: randomUUID(),
          schoolId,
          name: input.name,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          isCurrent: input.isCurrent,
          status: input.status,
          createdAt: nowIso,
        });
        break;
      }
      case "SET_CURRENT_SESSION": {
        const target = mem.sessions.find((s) => s.id === input.sessionId);
        if (!target) throw new NotFoundError("Academic session");
        for (const s of mem.sessions) s.isCurrent = s.id === target.id;
        target.status = "ACTIVE";
        break;
      }
      case "CREATE_CLASS": {
        if (
          mem.classes.some(
            (c) => c.academicYear === input.academicYear && c.name === input.name,
          )
        ) {
          throw new ConflictError(
            `Class "${input.name}" already exists for ${input.academicYear}.`,
          );
        }
        const clsId = randomUUID();
        mem.classes.push({
          id: clsId,
          academicYear: input.academicYear,
          name: input.name,
          code: input.code || null,
          department: input.department || "General",
          displayOrder: input.displayOrder,
          status: "ACTIVE",
        });
        for (const secName of input.defaultSections ?? ["A", "B"]) {
          mem.sections.push({
            id: randomUUID(),
            classId: clsId,
            academicYear: input.academicYear,
            name: secName,
            capacity: 40,
            roomNumber: null,
            classTeacherName: null,
            status: "ACTIVE",
          });
        }
        break;
      }
      case "CREATE_SECTION": {
        let cls =
          mem.classes.find((c) => c.id === input.classId) ??
          (input.className
            ? mem.classes.find(
                (c) => c.academicYear === input.academicYear && c.name === input.className,
              )
            : undefined);
        if (!cls) {
          cls = {
            id: UUID_REGEX.test(input.classId) ? input.classId : randomUUID(),
            academicYear: input.academicYear,
            name: input.className || input.classId,
            code: null,
            department: "General",
            displayOrder: mem.classes.length + 1,
            status: "ACTIVE",
          };
          mem.classes.push(cls);
        }
        if (mem.sections.some((s) => s.classId === cls!.id && s.name === input.name)) {
          throw new ConflictError(`Section "${input.name}" already exists in ${cls.name}.`);
        }
        mem.sections.push({
          id: randomUUID(),
          classId: cls.id,
          academicYear: cls.academicYear,
          name: input.name,
          capacity: input.capacity,
          roomNumber: input.roomNumber || null,
          classTeacherName: input.classTeacherName || null,
          status: "ACTIVE",
        });
        break;
      }
      case "UPDATE_SECTION": {
        const sec = mem.sections.find((s) => s.id === input.sectionId);
        if (!sec) throw new NotFoundError("Section");
        if (input.capacity !== undefined) sec.capacity = input.capacity;
        if (input.roomNumber !== undefined) sec.roomNumber = input.roomNumber || null;
        if (input.classTeacherName !== undefined) {
          sec.classTeacherName = input.classTeacherName || null;
        }
        if (input.status !== undefined) sec.status = input.status;
        break;
      }
      case "CREATE_SUBJECT": {
        if (input.defaultPassMarks > input.defaultMaxMarks) {
          throw new ValidationError("Pass marks cannot exceed max marks.");
        }
        const upperCode = input.code.toUpperCase();
        if (mem.subjects.some((s) => s.code === upperCode)) {
          throw new ConflictError(`Subject code "${upperCode}" already exists.`);
        }
        mem.subjects.push({
          id: randomUUID(),
          schoolId,
          code: upperCode,
          name: input.name,
          category: input.category,
          defaultMaxMarks: input.defaultMaxMarks,
          defaultPassMarks: input.defaultPassMarks,
          status: "ACTIVE",
        });
        break;
      }
      case "ASSIGN_CLASS_SUBJECT": {
        if (input.passMarks > input.maxMarks) {
          throw new ValidationError("Pass marks cannot exceed max marks.");
        }
        const sub = mem.subjects.find((s) => s.id === input.subjectId);
        if (!sub) throw new NotFoundError("Subject");
        const existing = mem.assignments.find(
          (a) => a.classId === input.classId && a.subjectId === input.subjectId,
        );
        if (existing) {
          existing.teacherName = input.teacherName || null;
          existing.weeklyPeriods = input.weeklyPeriods;
          existing.maxMarks = input.maxMarks;
          existing.passMarks = input.passMarks;
          existing.isCompulsory = input.isCompulsory;
          existing.isActive = true;
        } else {
          mem.assignments.push({
            id: randomUUID(),
            schoolId,
            classId: input.classId,
            subjectId: input.subjectId,
            subjectCode: sub.code,
            subjectName: sub.name,
            subjectCategory: sub.category,
            academicYear: input.academicYear,
            teacherName: input.teacherName || null,
            weeklyPeriods: input.weeklyPeriods,
            maxMarks: input.maxMarks,
            passMarks: input.passMarks,
            isCompulsory: input.isCompulsory,
            isActive: true,
          });
        }
        break;
      }
      case "REMOVE_CLASS_SUBJECT": {
        const target = mem.assignments.find((a) => a.id === input.assignmentId);
        if (!target) throw new NotFoundError("Class subject assignment");
        target.isActive = false;
        break;
      }
    }

    await this.invalidateCaches(schoolId);
    const returnYear =
      "academicYear" in input && typeof input.academicYear === "string"
        ? input.academicYear
        : input.action === "CREATE_SESSION"
          ? input.name
          : undefined;
    return this.getSnapshot(schoolId, {
      ...options,
      academicYear: returnYear,
      bypassCache: true,
    });
  }
}

export const academicsRepository = new AcademicsRepository();
