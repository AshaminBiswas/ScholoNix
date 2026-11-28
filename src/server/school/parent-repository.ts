/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { randomBytes, randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { authRepository } from "@/server/auth/auth-repository";
import { systemCache, tenantCache } from "@/server/integrations/redis";
import { platformCache } from "@/server/platform/platform-cache";
import { studentRepository } from "@/server/school/student-repository";
import {
  ConflictError,
  NotFoundError,
  TenantNotFoundError,
  ValidationError,
} from "@/lib/errors";
import { DEFAULT_ADMISSION_GRADES } from "@/modules/school/admissions/types";
import {
  buildHouseholdClusters,
  normalizeGuardianPhone,
} from "@/modules/parents/analytics";
import type {
  GuardianAddress,
  GuardianCommunicationPrefs,
  GuardianCommunicationRecord,
  GuardianDossierPayload,
  GuardianLifecycleStatus,
  GuardianPortalStatus,
  GuardianRecord,
  GuardianStudentCandidate,
  HouseholdCluster,
  LinkedWardSummary,
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PARENTS_CACHE_KEY = "parents:snapshot:v1";
const STUDENTS_CACHE_KEY = "students:snapshot:v1";
const TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };

const DEFAULT_PREFS: GuardianCommunicationPrefs = {
  sms: true,
  email: true,
  whatsapp: true,
  inApp: true,
  feeReminders: true,
  attendanceAlerts: true,
  academicUpdates: true,
  mediaConsent: true,
};

interface ActorMeta {
  userId?: string;
  userName: string;
}

interface MemoryGuardianLink {
  id: string;
  studentId: string;
  guardianId: string;
  relation: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  canPickup: boolean;
  isFeePayer: boolean;
  receivesAcademicAlerts: boolean;
  receivesFeeAlerts: boolean;
  custodyNote: string | null;
  restrictedContact: boolean;
  isActive: boolean;
  linkedAt: string;
  unlinkedAt: string | null;
}

interface MemoryParentState {
  guardians: Record<string, Omit<GuardianRecord, "wards" | "recentCommunicationsCount">>;
  links: MemoryGuardianLink[];
  communications: GuardianCommunicationRecord[];
}

const globalForParents = globalThis as unknown as {
  __scholonixParentMemoryStore?: Record<string, MemoryParentState>;
  __scholonixParentCaps?: { hasTables: boolean; checkedAt: number };
  __scholonixParentFlights?: Map<string, Promise<ParentWorkspaceSnapshot>>;
};

function getMemoryStore(schoolId: string): MemoryParentState {
  if (!globalForParents.__scholonixParentMemoryStore) {
    globalForParents.__scholonixParentMemoryStore = {};
  }
  if (!globalForParents.__scholonixParentMemoryStore[schoolId]) {
    globalForParents.__scholonixParentMemoryStore[schoolId] = {
      guardians: {},
      links: [],
      communications: [],
    };
  }
  return globalForParents.__scholonixParentMemoryStore[schoolId]!;
}

export function resetInMemoryParentStoreForTests(): void {
  globalForParents.__scholonixParentMemoryStore = {};
}

async function singleFlightSnapshot(
  key: string,
  loader: () => Promise<ParentWorkspaceSnapshot>,
): Promise<ParentWorkspaceSnapshot> {
  if (!globalForParents.__scholonixParentFlights) {
    globalForParents.__scholonixParentFlights = new Map();
  }
  const existing = globalForParents.__scholonixParentFlights.get(key);
  if (existing) return existing;
  const p = loader().finally(() => {
    globalForParents.__scholonixParentFlights?.delete(key);
  });
  globalForParents.__scholonixParentFlights.set(key, p);
  return p;
}

async function hasParentTables(tx: Prisma.TransactionClient): Promise<boolean> {
  if (
    globalForParents.__scholonixParentCaps &&
    Date.now() - globalForParents.__scholonixParentCaps.checkedAt < 60_000
  ) {
    return globalForParents.__scholonixParentCaps.hasTables;
  }
  try {
    const rows = (await tx.$queryRaw`
      SELECT to_regclass('public.guardians') IS NOT NULL
         AND to_regclass('public.student_guardian_links') IS NOT NULL
         AND to_regclass('public.guardian_communications') IS NOT NULL AS ready
    `) as Array<{ ready: boolean }>;
    const ready = Boolean(rows[0]?.ready);
    globalForParents.__scholonixParentCaps = { hasTables: ready, checkedAt: Date.now() };
    return ready;
  } catch {
    return false;
  }
}

async function runTenantParentTx<T>(
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

function mergePrefs(raw: unknown): GuardianCommunicationPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const obj = raw as Record<string, unknown>;
  return {
    sms: typeof obj.sms === "boolean" ? obj.sms : DEFAULT_PREFS.sms,
    email: typeof obj.email === "boolean" ? obj.email : DEFAULT_PREFS.email,
    whatsapp: typeof obj.whatsapp === "boolean" ? obj.whatsapp : DEFAULT_PREFS.whatsapp,
    inApp: typeof obj.inApp === "boolean" ? obj.inApp : DEFAULT_PREFS.inApp,
    feeReminders:
      typeof obj.feeReminders === "boolean" ? obj.feeReminders : DEFAULT_PREFS.feeReminders,
    attendanceAlerts:
      typeof obj.attendanceAlerts === "boolean"
        ? obj.attendanceAlerts
        : DEFAULT_PREFS.attendanceAlerts,
    academicUpdates:
      typeof obj.academicUpdates === "boolean"
        ? obj.academicUpdates
        : DEFAULT_PREFS.academicUpdates,
    mediaConsent:
      typeof obj.mediaConsent === "boolean" ? obj.mediaConsent : DEFAULT_PREFS.mediaConsent,
  };
}

function mapGuardianRow(
  row: any,
  wards: LinkedWardSummary[],
  recentCommunicationsCount = 0,
): GuardianRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    userId: row.userId ?? null,
    fullName: row.fullName,
    phone: row.phone,
    normalizedPhone: row.normalizedPhone ?? normalizeGuardianPhone(row.phone),
    alternatePhone: row.alternatePhone ?? null,
    email: row.email ?? null,
    occupation: row.occupation ?? null,
    employer: row.employer ?? null,
    education: row.education ?? null,
    preferredLanguage: row.preferredLanguage || "English",
    address:
      row.addressJson && typeof row.addressJson === "object"
        ? (row.addressJson as GuardianAddress)
        : null,
    idProofType: row.idProofType ?? null,
    idProofMasked: row.idProofMasked ?? null,
    photoKey: row.photoKey ?? null,
    phoneVerified: Boolean(row.phoneVerified),
    emailVerified: Boolean(row.emailVerified),
    portalStatus: (row.portalStatus as GuardianPortalStatus) || "NOT_INVITED",
    portalInvitedAt: row.portalInvitedAt ? new Date(row.portalInvitedAt).toISOString() : null,
    status: (row.status as GuardianLifecycleStatus) || "ACTIVE",
    communicationPrefs: mergePrefs(row.communicationPrefs),
    notes: row.notes ?? null,
    wards,
    recentCommunicationsCount,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapCommRow(row: any, studentMap?: Map<string, string>): GuardianCommunicationRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    guardianId: row.guardianId,
    studentId: row.studentId ?? null,
    studentName: row.studentId ? (studentMap?.get(row.studentId) ?? null) : null,
    channel: (row.channel as GuardianCommunicationRecord["channel"]) || "APP",
    direction: (row.direction as GuardianCommunicationRecord["direction"]) || "OUTBOUND",
    senderName: row.senderName,
    recipientName: row.recipientName,
    subject: row.subject ?? null,
    body: row.body,
    status: (row.status as GuardianCommunicationRecord["status"]) || "SENT",
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function syncMemoryFromStudentSnapshot(
  schoolId: string,
  students: GuardianStudentCandidate[],
): MemoryParentState {
  const store = getMemoryStore(schoolId);
  const nowIso = new Date().toISOString();

  for (const stu of students) {
    const existingActiveLink = store.links.find(
      (l) => l.studentId === stu.id && l.isActive,
    );
    if (existingActiveLink) continue;

    const normPhone = normalizeGuardianPhone(stu.guardianPhone);
    let guardian = normPhone
      ? Object.values(store.guardians).find((g) => g.normalizedPhone === normPhone)
      : undefined;

    if (!guardian && stu.guardianEmail) {
      const cleanEmail = stu.guardianEmail.trim().toLowerCase();
      guardian = Object.values(store.guardians).find(
        (g) => g.email?.trim().toLowerCase() === cleanEmail,
      );
    }

    if (!guardian) {
      const gId = randomUUID();
      guardian = {
        id: gId,
        schoolId,
        userId: null,
        fullName: stu.guardianName || "Parent / Guardian",
        phone: stu.guardianPhone || "0000000000",
        normalizedPhone: normPhone,
        alternatePhone: null,
        email: stu.guardianEmail ?? null,
        occupation: null,
        employer: null,
        education: null,
        preferredLanguage: "English",
        address: null,
        idProofType: null,
        idProofMasked: null,
        photoKey: null,
        phoneVerified: false,
        emailVerified: false,
        portalStatus: "NOT_INVITED",
        portalInvitedAt: null,
        status: "ACTIVE",
        communicationPrefs: { ...DEFAULT_PREFS },
        notes: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.guardians[gId] = guardian;
    }

    store.links.push({
      id: randomUUID(),
      studentId: stu.id,
      guardianId: guardian.id,
      relation: stu.guardianRelation || "Parent",
      isPrimary: true,
      isEmergencyContact: true,
      canPickup: true,
      isFeePayer: true,
      receivesAcademicAlerts: true,
      receivesFeeAlerts: true,
      custodyNote: null,
      restrictedContact: false,
      isActive: true,
      linkedAt: nowIso,
      unlinkedAt: null,
    });
  }

  return store;
}

class ParentRepository extends BaseTenantRepository {
  private requireSchoolId(explicitSchoolId?: string): string {
    const sid = this.getSchoolId(explicitSchoolId);
    if (!sid || !sid.trim()) {
      throw new TenantNotFoundError("School tenant identifier is required.");
    }
    return sid.trim();
  }

  async invalidateCaches(schoolId: string): Promise<void> {
    await Promise.all([
      tenantCache.del(schoolId, PARENTS_CACHE_KEY).catch(() => {}),
      tenantCache.del(schoolId, STUDENTS_CACHE_KEY).catch(() => {}),
      platformCache.invalidateSchool(schoolId),
      systemCache.del("platform:students:global:v1").catch(() => {}),
    ]);
  }

  private buildMemorySnapshot(
    schoolId: string,
    studentSnap: Awaited<ReturnType<typeof studentRepository.getSnapshot>>,
  ): ParentWorkspaceSnapshot {
    const candidates: GuardianStudentCandidate[] = studentSnap.students.map((s) => ({
      id: s.id,
      admissionNumber: s.admissionNumber,
      studentName: s.studentName,
      currentGrade: s.currentGrade,
      currentSection: s.currentSection,
      currentAcademicYear: s.currentAcademicYear,
      status: s.status,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      guardianEmail: s.guardianEmail,
      guardianRelation: s.guardianRelation,
    }));
    const store = syncMemoryFromStudentSnapshot(schoolId, candidates);
    const studentById = new Map(studentSnap.students.map((s) => [s.id, s]));

    const commCountMap = new Map<string, number>();
    for (const c of store.communications) {
      commCountMap.set(c.guardianId, (commCountMap.get(c.guardianId) ?? 0) + 1);
    }

    const guardians: GuardianRecord[] = Object.values(store.guardians).map((g) => {
      const wards: LinkedWardSummary[] = store.links
        .filter((l) => l.guardianId === g.id)
        .map((l): LinkedWardSummary | null => {
          const s = studentById.get(l.studentId);
          if (!s) return null;
          return {
            linkId: l.id,
            studentId: s.id,
            admissionNumber: s.admissionNumber,
            studentName: s.studentName,
            currentAcademicYear: s.currentAcademicYear,
            currentGrade: s.currentGrade,
            currentSection: s.currentSection,
            studentStatus: s.status,
            relation: l.relation,
            isPrimary: l.isPrimary,
            isEmergencyContact: l.isEmergencyContact,
            canPickup: l.canPickup,
            isFeePayer: l.isFeePayer,
            receivesAcademicAlerts: l.receivesAcademicAlerts,
            receivesFeeAlerts: l.receivesFeeAlerts,
            custodyNote: l.custodyNote,
            restrictedContact: l.restrictedContact,
            isActive: l.isActive,
            linkedAt: l.linkedAt,
            outstandingFeePaise: s.feeSummary?.outstandingPaise ?? 0,
          };
        })
        .filter((item): item is LinkedWardSummary => item !== null);

      return {
        ...g,
        wards,
        recentCommunicationsCount: commCountMap.get(g.id) ?? 0,
      };
    });

    return {
      schoolId,
      schoolName: studentSnap.schoolName,
      schoolSlug: studentSnap.schoolSlug,
      guardians,
      students: candidates,
      communications: [...store.communications].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
      grades: studentSnap.grades.length > 0 ? studentSnap.grades : [...DEFAULT_ADMISSION_GRADES],
      sections: studentSnap.sections,
    };
  }

  async getSnapshot(
    explicitSchoolId: string,
    options?: { asPlatformAdmin?: boolean; bypassCache?: boolean },
  ): Promise<ParentWorkspaceSnapshot> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (!options?.bypassCache) {
      const cached = await tenantCache.get<ParentWorkspaceSnapshot>(schoolId, PARENTS_CACHE_KEY);
      if (cached) return cached;
    }

    return singleFlightSnapshot(`${schoolId}:parents`, async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        const dbSnapshot = await runTenantParentTx(
          schoolId,
          async (tx) => {
            if (!(await hasParentTables(tx))) return null;

            const [schoolRow, studentRows, guardianRows, linkRows, commRows, settingRow] =
              await Promise.all([
                (tx as any).school.findFirst({
                  where: { id: schoolId },
                  select: { id: true, name: true, slug: true },
                }),
                (tx as any).student.findMany({
                  where: { schoolId },
                  select: {
                    id: true,
                    admissionNumber: true,
                    studentName: true,
                    currentGrade: true,
                    currentSection: true,
                    currentAcademicYear: true,
                    status: true,
                    guardianName: true,
                    guardianPhone: true,
                    guardianEmail: true,
                    guardianRelation: true,
                  },
                  orderBy: { studentName: "asc" },
                }),
                (tx as any).guardian.findMany({
                  where: { schoolId },
                  orderBy: { fullName: "asc" },
                }),
                (tx as any).studentGuardianLink.findMany({
                  where: { schoolId },
                  orderBy: [{ isPrimary: "desc" }, { linkedAt: "asc" }],
                }),
                (tx as any).guardianCommunication.findMany({
                  where: { schoolId },
                  orderBy: { createdAt: "desc" },
                  take: 150,
                }),
                (tx as any).studentSetting.findFirst({
                  where: { schoolId },
                  select: { defaultSections: true, sectionsByGrade: true },
                }),
              ]);

            if (!schoolRow) {
              throw new TenantNotFoundError("School not found.");
            }

            const studentMap = new Map<string, GuardianStudentCandidate>(
              studentRows.map((s: any) => [s.id, s]),
            );
            const studentNameMap = new Map<string, string>(
              studentRows.map((s: any) => [s.id, s.studentName]),
            );

            const commCountMap = new Map<string, number>();
            for (const c of commRows) {
              commCountMap.set(c.guardianId, (commCountMap.get(c.guardianId) ?? 0) + 1);
            }

            const linksByGuardian = new Map<string, LinkedWardSummary[]>();
            for (const l of linkRows) {
              const stu = studentMap.get(l.studentId);
              if (!stu) continue;
              const arr = linksByGuardian.get(l.guardianId) ?? [];
              arr.push({
                linkId: l.id,
                studentId: stu.id,
                admissionNumber: stu.admissionNumber,
                studentName: stu.studentName,
                currentAcademicYear: stu.currentAcademicYear,
                currentGrade: stu.currentGrade,
                currentSection: stu.currentSection,
                studentStatus: stu.status,
                relation: l.relation,
                isPrimary: Boolean(l.isPrimary),
                isEmergencyContact: Boolean(l.isEmergencyContact),
                canPickup: Boolean(l.canPickup),
                isFeePayer: Boolean(l.isFeePayer),
                receivesAcademicAlerts: Boolean(l.receivesAcademicAlerts),
                receivesFeeAlerts: Boolean(l.receivesFeeAlerts),
                custodyNote: l.custodyNote ?? null,
                restrictedContact: Boolean(l.restrictedContact),
                isActive: Boolean(l.isActive),
                linkedAt: new Date(l.linkedAt).toISOString(),
              });
              linksByGuardian.set(l.guardianId, arr);
            }

            const guardians = guardianRows.map((g: any) =>
              mapGuardianRow(g, linksByGuardian.get(g.id) ?? [], commCountMap.get(g.id) ?? 0),
            );

            const gradeSet = new Set<string>(DEFAULT_ADMISSION_GRADES);
            for (const s of studentRows) {
              if (s.currentGrade) gradeSet.add(s.currentGrade);
            }

            const sectionSet = new Set<string>(
              Array.isArray(settingRow?.defaultSections)
                ? settingRow.defaultSections
                : ["A", "B", "C"],
            );
            for (const s of studentRows) {
              if (s.currentSection) sectionSet.add(s.currentSection);
            }

            return {
              schoolId,
              schoolName: schoolRow.name,
              schoolSlug: schoolRow.slug,
              guardians,
              students: studentRows,
              communications: commRows.map((c: any) => mapCommRow(c, studentNameMap)),
              grades: Array.from(gradeSet),
              sections: Array.from(sectionSet),
            };
          },
          options,
        );

        if (dbSnapshot) {
          await tenantCache.set(schoolId, PARENTS_CACHE_KEY, dbSnapshot, 120);
          return dbSnapshot;
        }
      }

      const studentSnap = await studentRepository.getSnapshot(schoolId, options);
      const memSnapshot = this.buildMemorySnapshot(schoolId, studentSnap);
      await tenantCache.set(schoolId, PARENTS_CACHE_KEY, memSnapshot, 60);
      return memSnapshot;
    });
  }

  async getGuardianDossier(
    explicitSchoolId: string,
    guardianId: string,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<GuardianDossierPayload> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const snap = await this.getSnapshot(schoolId, options);
    const guardian = snap.guardians.find((g) => g.id === guardianId);
    if (!guardian) {
      throw new NotFoundError("Guardian");
    }
    const communications = snap.communications.filter((c) => c.guardianId === guardianId);
    return {
      guardian,
      communications,
      availableStudents: snap.students,
    };
  }

  async createGuardian(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: CreateGuardianInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<GuardianRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const normPhone = normalizeGuardianPhone(input.phone);

    if (await authRepository.canUsePrismaForPlatform()) {
      const createdId = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;

          if (normPhone && !input.allowSharedPhone) {
            const dup = await (tx as any).guardian.findFirst({
              where: { schoolId, normalizedPhone: normPhone },
              select: { id: true, fullName: true },
            });
            if (dup) {
              throw new ConflictError(
                `A guardian (${dup.fullName}) already uses phone ${input.phone}. Link the existing guardian or enable shared-phone mode.`,
              );
            }
          }

          const effectiveNorm = input.allowSharedPhone
            ? `${normPhone || "NOPHONE"}#${randomBytes(2).toString("hex")}`
            : normPhone;

          const g = await (tx as any).guardian.create({
            data: {
              schoolId,
              fullName: input.fullName,
              phone: input.phone,
              normalizedPhone: effectiveNorm,
              alternatePhone: input.alternatePhone || null,
              email: input.email ? input.email.trim() : null,
              occupation: input.occupation || null,
              employer: input.employer || null,
              education: input.education || null,
              preferredLanguage: input.preferredLanguage || "English",
              addressJson: input.address ?? null,
              idProofType: input.idProofType || null,
              idProofMasked: input.idProofMasked || null,
              notes: input.notes || null,
              communicationPrefs: input.communicationPrefs ?? DEFAULT_PREFS,
              status: "ACTIVE",
              portalStatus: "NOT_INVITED",
            },
          });

          if (input.wards && input.wards.length > 0) {
            for (const ward of input.wards) {
              const stu = await (tx as any).student.findFirst({
                where: { id: ward.studentId, schoolId },
                select: { id: true },
              });
              if (!stu) {
                throw new NotFoundError(`Student (${ward.studentId})`);
              }
              if (ward.isPrimary) {
                await (tx as any).studentGuardianLink.updateMany({
                  where: { schoolId, studentId: ward.studentId, isPrimary: true },
                  data: { isPrimary: false },
                });
                await (tx as any).student.update({
                  where: { id: ward.studentId },
                  data: {
                    guardianName: input.fullName,
                    guardianPhone: input.phone,
                    guardianEmail: input.email ? input.email.trim() : null,
                    guardianRelation: ward.relation || "Parent",
                  },
                });
              }
              await (tx as any).studentGuardianLink.create({
                data: {
                  schoolId,
                  studentId: ward.studentId,
                  guardianId: g.id,
                  relation: ward.relation || "Parent",
                  isPrimary: ward.isPrimary,
                  isEmergencyContact: ward.isEmergencyContact,
                  canPickup: ward.canPickup,
                  isFeePayer: ward.isFeePayer,
                  receivesAcademicAlerts: ward.receivesAcademicAlerts,
                  receivesFeeAlerts: ward.receivesFeeAlerts,
                  custodyNote: ward.custodyNote || null,
                  restrictedContact: ward.restrictedContact,
                  isActive: true,
                },
              });
            }
          }

          return g.id as string;
        },
        options,
      );

      if (createdId) {
        await this.invalidateCaches(schoolId);
        const dossier = await this.getGuardianDossier(schoolId, createdId, options);
        return dossier.guardian;
      }
    }

    const studentSnap = await studentRepository.getSnapshot(schoolId, options);
    const store = syncMemoryFromStudentSnapshot(
      schoolId,
      studentSnap.students.map((s) => ({
        id: s.id,
        admissionNumber: s.admissionNumber,
        studentName: s.studentName,
        currentGrade: s.currentGrade,
        currentSection: s.currentSection,
        currentAcademicYear: s.currentAcademicYear,
        status: s.status,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        guardianEmail: s.guardianEmail,
        guardianRelation: s.guardianRelation,
      })),
    );

    if (normPhone && !input.allowSharedPhone) {
      const dup = Object.values(store.guardians).find((g) => g.normalizedPhone === normPhone);
      if (dup) {
        throw new ConflictError(
          `A guardian (${dup.fullName}) already uses phone ${input.phone}. Link the existing guardian instead.`,
        );
      }
    }

    const nowIso = new Date().toISOString();
    const gId = randomUUID();
    store.guardians[gId] = {
      id: gId,
      schoolId,
      userId: null,
      fullName: input.fullName,
      phone: input.phone,
      normalizedPhone: input.allowSharedPhone
        ? `${normPhone || "NOPHONE"}#${randomBytes(2).toString("hex")}`
        : normPhone,
      alternatePhone: input.alternatePhone || null,
      email: input.email ? input.email.trim() : null,
      occupation: input.occupation || null,
      employer: input.employer || null,
      education: input.education || null,
      preferredLanguage: input.preferredLanguage || "English",
      address: input.address ?? null,
      idProofType: input.idProofType || null,
      idProofMasked: input.idProofMasked || null,
      photoKey: null,
      phoneVerified: false,
      emailVerified: false,
      portalStatus: "NOT_INVITED",
      portalInvitedAt: null,
      status: "ACTIVE",
      communicationPrefs: { ...DEFAULT_PREFS, ...(input.communicationPrefs ?? {}) },
      notes: input.notes || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    for (const ward of input.wards ?? []) {
      const existsStu = studentSnap.students.some((s) => s.id === ward.studentId);
      if (!existsStu) throw new NotFoundError(`Student (${ward.studentId})`);
      if (ward.isPrimary) {
        for (const l of store.links) {
          if (l.studentId === ward.studentId) l.isPrimary = false;
        }
        await studentRepository.updateStudent(
          schoolId,
          ward.studentId,
          actor,
          {
            guardianName: input.fullName,
            guardianPhone: input.phone,
            guardianEmail: input.email || null,
            guardianRelation: ward.relation || "Parent",
          },
          options,
        );
      }
      store.links.push({
        id: randomUUID(),
        studentId: ward.studentId,
        guardianId: gId,
        relation: ward.relation || "Parent",
        isPrimary: ward.isPrimary,
        isEmergencyContact: ward.isEmergencyContact,
        canPickup: ward.canPickup,
        isFeePayer: ward.isFeePayer,
        receivesAcademicAlerts: ward.receivesAcademicAlerts,
        receivesFeeAlerts: ward.receivesFeeAlerts,
        custodyNote: ward.custodyNote || null,
        restrictedContact: ward.restrictedContact,
        isActive: true,
        linkedAt: nowIso,
        unlinkedAt: null,
      });
    }

    await this.invalidateCaches(schoolId);
    return (await this.getGuardianDossier(schoolId, gId, options)).guardian;
  }

  async updateGuardian(
    explicitSchoolId: string,
    guardianId: string,
    actor: ActorMeta,
    input: UpdateGuardianInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<GuardianRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const nextNorm = input.phone ? normalizeGuardianPhone(input.phone) : undefined;

    if (await authRepository.canUsePrismaForPlatform()) {
      const done = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;
          const existing = await (tx as any).guardian.findFirst({
            where: { id: guardianId, schoolId },
          });
          if (!existing) throw new NotFoundError("Guardian");

          if (nextNorm && nextNorm !== existing.normalizedPhone) {
            const clash = await (tx as any).guardian.findFirst({
              where: { schoolId, normalizedPhone: nextNorm, NOT: { id: guardianId } },
              select: { id: true, fullName: true },
            });
            if (clash) {
              throw new ConflictError(
                `Phone already assigned to ${clash.fullName}. Use Merge Guardians instead.`,
              );
            }
          }

          if (input.status === "ARCHIVED") {
            const solePrimaryLinks = await (tx as any).studentGuardianLink.findMany({
              where: { schoolId, guardianId, isPrimary: true, isActive: true },
              select: { studentId: true },
            });
            for (const link of solePrimaryLinks) {
              const altCount = await (tx as any).studentGuardianLink.count({
                where: {
                  schoolId,
                  studentId: link.studentId,
                  isActive: true,
                  NOT: { guardianId },
                },
              });
              if (altCount === 0) {
                throw new ValidationError(
                  "Cannot archive guardian who is the sole active guardian for an enrolled student. Reassign or link another guardian first.",
                );
              }
            }
          }

          const mergedPrefs = input.communicationPrefs
            ? { ...mergePrefs(existing.communicationPrefs), ...input.communicationPrefs }
            : undefined;

          const updated = await (tx as any).guardian.update({
            where: { id: guardianId },
            data: {
              ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
              ...(input.phone !== undefined ? { phone: input.phone, normalizedPhone: nextNorm } : {}),
              ...(input.alternatePhone !== undefined
                ? { alternatePhone: input.alternatePhone || null }
                : {}),
              ...(input.email !== undefined
                ? { email: input.email ? input.email.trim() : null }
                : {}),
              ...(input.occupation !== undefined ? { occupation: input.occupation || null } : {}),
              ...(input.employer !== undefined ? { employer: input.employer || null } : {}),
              ...(input.education !== undefined ? { education: input.education || null } : {}),
              ...(input.preferredLanguage !== undefined
                ? { preferredLanguage: input.preferredLanguage || "English" }
                : {}),
              ...(input.address !== undefined ? { addressJson: input.address ?? null } : {}),
              ...(input.idProofType !== undefined ? { idProofType: input.idProofType || null } : {}),
              ...(input.idProofMasked !== undefined
                ? { idProofMasked: input.idProofMasked || null }
                : {}),
              ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
              ...(input.status !== undefined ? { status: input.status } : {}),
              ...(input.portalStatus !== undefined ? { portalStatus: input.portalStatus } : {}),
              ...(mergedPrefs ? { communicationPrefs: mergedPrefs } : {}),
            },
          });

          // Sync primary display fields to linked primary students
          if (
            input.fullName !== undefined ||
            input.phone !== undefined ||
            input.email !== undefined
          ) {
            const primaryLinks = await (tx as any).studentGuardianLink.findMany({
              where: { schoolId, guardianId, isPrimary: true, isActive: true },
              select: { studentId: true },
            });
            const primaryIds = primaryLinks.map((l: any) => l.studentId);
            if (primaryIds.length > 0) {
              await (tx as any).student.updateMany({
                where: { schoolId, id: { in: primaryIds } },
                data: {
                  guardianName: updated.fullName,
                  guardianPhone: updated.phone,
                  guardianEmail: updated.email,
                },
              });
            }
          }

          return true;
        },
        options,
      );

      if (done) {
        await this.invalidateCaches(schoolId);
        return (await this.getGuardianDossier(schoolId, guardianId, options)).guardian;
      }
    }

    const store = getMemoryStore(schoolId);
    const existing = store.guardians[guardianId];
    if (!existing) throw new NotFoundError("Guardian");

    if (nextNorm && nextNorm !== existing.normalizedPhone) {
      const clash = Object.values(store.guardians).find(
        (g) => g.normalizedPhone === nextNorm && g.id !== guardianId,
      );
      if (clash) {
        throw new ConflictError(
          `Phone already assigned to ${clash.fullName}. Use Merge Guardians instead.`,
        );
      }
    }

    if (input.status === "ARCHIVED") {
      const solePrimary = store.links.filter(
        (l) => l.guardianId === guardianId && l.isPrimary && l.isActive,
      );
      for (const link of solePrimary) {
        const hasOther = store.links.some(
          (l) => l.studentId === link.studentId && l.isActive && l.guardianId !== guardianId,
        );
        if (!hasOther) {
          throw new ValidationError(
            "Cannot archive guardian who is the sole active guardian for an enrolled student.",
          );
        }
      }
    }

    const updated = {
      ...existing,
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone, normalizedPhone: nextNorm ?? null } : {}),
      ...(input.alternatePhone !== undefined
        ? { alternatePhone: input.alternatePhone || null }
        : {}),
      ...(input.email !== undefined ? { email: input.email ? input.email.trim() : null } : {}),
      ...(input.occupation !== undefined ? { occupation: input.occupation || null } : {}),
      ...(input.employer !== undefined ? { employer: input.employer || null } : {}),
      ...(input.education !== undefined ? { education: input.education || null } : {}),
      ...(input.preferredLanguage !== undefined
        ? { preferredLanguage: input.preferredLanguage || "English" }
        : {}),
      ...(input.address !== undefined ? { address: input.address ?? null } : {}),
      ...(input.idProofType !== undefined ? { idProofType: input.idProofType || null } : {}),
      ...(input.idProofMasked !== undefined ? { idProofMasked: input.idProofMasked || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.portalStatus !== undefined ? { portalStatus: input.portalStatus } : {}),
      communicationPrefs: input.communicationPrefs
        ? { ...existing.communicationPrefs, ...input.communicationPrefs }
        : existing.communicationPrefs,
      updatedAt: new Date().toISOString(),
    };
    store.guardians[guardianId] = updated;

    if (input.fullName !== undefined || input.phone !== undefined || input.email !== undefined) {
      const primaryWards = store.links.filter(
        (l) => l.guardianId === guardianId && l.isPrimary && l.isActive,
      );
      for (const pw of primaryWards) {
        await studentRepository
          .updateStudent(
            schoolId,
            pw.studentId,
            actor,
            {
              guardianName: updated.fullName,
              guardianPhone: updated.phone,
              guardianEmail: updated.email,
            },
            options,
          )
          .catch(() => {});
      }
    }

    await this.invalidateCaches(schoolId);
    return (await this.getGuardianDossier(schoolId, guardianId, options)).guardian;
  }

  async linkOrUpdateWard(
    explicitSchoolId: string,
    guardianId: string,
    actor: ActorMeta,
    input: WardLinkInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<GuardianRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await authRepository.canUsePrismaForPlatform()) {
      const done = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;
          const [guardian, student] = await Promise.all([
            (tx as any).guardian.findFirst({ where: { id: guardianId, schoolId } }),
            (tx as any).student.findFirst({ where: { id: input.studentId, schoolId } }),
          ]);
          if (!guardian) throw new NotFoundError("Guardian");
          if (!student) throw new NotFoundError("Student");

          if (input.isPrimary) {
            await (tx as any).studentGuardianLink.updateMany({
              where: {
                schoolId,
                studentId: input.studentId,
                isPrimary: true,
                NOT: { guardianId },
              },
              data: { isPrimary: false },
            });
            await (tx as any).student.update({
              where: { id: input.studentId },
              data: {
                guardianName: guardian.fullName,
                guardianPhone: guardian.phone,
                guardianEmail: guardian.email,
                guardianRelation: input.relation || "Parent",
              },
            });
          }

          await (tx as any).studentGuardianLink.upsert({
            where: {
              schoolId_studentId_guardianId: {
                schoolId,
                studentId: input.studentId,
                guardianId,
              },
            },
            create: {
              schoolId,
              studentId: input.studentId,
              guardianId,
              relation: input.relation || "Parent",
              isPrimary: input.isPrimary,
              isEmergencyContact: input.isEmergencyContact,
              canPickup: input.restrictedContact ? false : input.canPickup,
              isFeePayer: input.isFeePayer,
              receivesAcademicAlerts: input.receivesAcademicAlerts,
              receivesFeeAlerts: input.receivesFeeAlerts,
              custodyNote: input.custodyNote || null,
              restrictedContact: input.restrictedContact,
              isActive: true,
            },
            update: {
              relation: input.relation || "Parent",
              isPrimary: input.isPrimary,
              isEmergencyContact: input.isEmergencyContact,
              canPickup: input.restrictedContact ? false : input.canPickup,
              isFeePayer: input.isFeePayer,
              receivesAcademicAlerts: input.receivesAcademicAlerts,
              receivesFeeAlerts: input.receivesFeeAlerts,
              custodyNote: input.custodyNote || null,
              restrictedContact: input.restrictedContact,
              isActive: true,
              unlinkedAt: null,
            },
          });

          return true;
        },
        options,
      );

      if (done) {
        await this.invalidateCaches(schoolId);
        return (await this.getGuardianDossier(schoolId, guardianId, options)).guardian;
      }
    }

    const store = getMemoryStore(schoolId);
    const guardian = store.guardians[guardianId];
    if (!guardian) throw new NotFoundError("Guardian");
    const studentSnap = await studentRepository.getSnapshot(schoolId, options);
    if (!studentSnap.students.some((s) => s.id === input.studentId)) {
      throw new NotFoundError("Student");
    }

    const nowIso = new Date().toISOString();
    if (input.isPrimary) {
      for (const l of store.links) {
        if (l.studentId === input.studentId && l.guardianId !== guardianId) {
          l.isPrimary = false;
        }
      }
      await studentRepository
        .updateStudent(
          schoolId,
          input.studentId,
          actor,
          {
            guardianName: guardian.fullName,
            guardianPhone: guardian.phone,
            guardianEmail: guardian.email,
            guardianRelation: input.relation || "Parent",
          },
          options,
        )
        .catch(() => {});
    }

    const existing = store.links.find(
      (l) => l.studentId === input.studentId && l.guardianId === guardianId,
    );
    if (existing) {
      existing.relation = input.relation || "Parent";
      existing.isPrimary = input.isPrimary;
      existing.isEmergencyContact = input.isEmergencyContact;
      existing.canPickup = input.restrictedContact ? false : input.canPickup;
      existing.isFeePayer = input.isFeePayer;
      existing.receivesAcademicAlerts = input.receivesAcademicAlerts;
      existing.receivesFeeAlerts = input.receivesFeeAlerts;
      existing.custodyNote = input.custodyNote || null;
      existing.restrictedContact = input.restrictedContact;
      existing.isActive = true;
      existing.unlinkedAt = null;
    } else {
      store.links.push({
        id: randomUUID(),
        studentId: input.studentId,
        guardianId,
        relation: input.relation || "Parent",
        isPrimary: input.isPrimary,
        isEmergencyContact: input.isEmergencyContact,
        canPickup: input.restrictedContact ? false : input.canPickup,
        isFeePayer: input.isFeePayer,
        receivesAcademicAlerts: input.receivesAcademicAlerts,
        receivesFeeAlerts: input.receivesFeeAlerts,
        custodyNote: input.custodyNote || null,
        restrictedContact: input.restrictedContact,
        isActive: true,
        linkedAt: nowIso,
        unlinkedAt: null,
      });
    }

    await this.invalidateCaches(schoolId);
    return (await this.getGuardianDossier(schoolId, guardianId, options)).guardian;
  }

  async unlinkWard(
    explicitSchoolId: string,
    guardianId: string,
    studentId: string,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<GuardianRecord> {
    const schoolId = this.requireSchoolId(explicitSchoolId);

    if (await authRepository.canUsePrismaForPlatform()) {
      const done = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;
          const link = await (tx as any).studentGuardianLink.findFirst({
            where: { schoolId, guardianId, studentId, isActive: true },
          });
          if (!link) throw new NotFoundError("Guardian-Ward link");

          if (link.isPrimary) {
            const otherActive = await (tx as any).studentGuardianLink.count({
              where: { schoolId, studentId, isActive: true, NOT: { guardianId } },
            });
            if (otherActive === 0) {
              throw new ValidationError(
                "Cannot unlink the sole primary guardian for a student. Assign another primary guardian first.",
              );
            }
          }

          await (tx as any).studentGuardianLink.update({
            where: { id: link.id },
            data: { isActive: false, isPrimary: false, unlinkedAt: new Date() },
          });
          return true;
        },
        options,
      );

      if (done) {
        await this.invalidateCaches(schoolId);
        return (await this.getGuardianDossier(schoolId, guardianId, options)).guardian;
      }
    }

    const store = getMemoryStore(schoolId);
    const link = store.links.find(
      (l) => l.guardianId === guardianId && l.studentId === studentId && l.isActive,
    );
    if (!link) throw new NotFoundError("Guardian-Ward link");

    if (link.isPrimary) {
      const other = store.links.some(
        (l) => l.studentId === studentId && l.isActive && l.guardianId !== guardianId,
      );
      if (!other) {
        throw new ValidationError(
          "Cannot unlink the sole primary guardian for a student. Assign another primary guardian first.",
        );
      }
    }
    link.isActive = false;
    link.isPrimary = false;
    link.unlinkedAt = new Date().toISOString();

    await this.invalidateCaches(schoolId);
    return (await this.getGuardianDossier(schoolId, guardianId, options)).guardian;
  }

  async mergeGuardians(
    explicitSchoolId: string,
    input: MergeGuardiansInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{ targetGuardian: GuardianRecord; mergedCount: number }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const sourceIds = input.sourceGuardianIds.filter((id) => id !== input.targetGuardianId);
    if (sourceIds.length === 0) {
      throw new ValidationError("Select at least one distinct duplicate guardian to merge.");
    }

    if (await authRepository.canUsePrismaForPlatform()) {
      const merged = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;
          const target = await (tx as any).guardian.findFirst({
            where: { id: input.targetGuardianId, schoolId },
          });
          if (!target) throw new NotFoundError("Target guardian");

          const sources = await (tx as any).guardian.findMany({
            where: { schoolId, id: { in: sourceIds } },
          });
          if (sources.length === 0) throw new NotFoundError("Source guardians");

          for (const src of sources) {
            const srcLinks = await (tx as any).studentGuardianLink.findMany({
              where: { schoolId, guardianId: src.id, isActive: true },
            });
            for (const l of srcLinks) {
              const existingOnTarget = await (tx as any).studentGuardianLink.findFirst({
                where: { schoolId, studentId: l.studentId, guardianId: target.id },
              });
              if (existingOnTarget) {
                await (tx as any).studentGuardianLink.update({
                  where: { id: existingOnTarget.id },
                  data: {
                    isPrimary: existingOnTarget.isPrimary || l.isPrimary,
                    isEmergencyContact: existingOnTarget.isEmergencyContact || l.isEmergencyContact,
                    canPickup: existingOnTarget.canPickup || l.canPickup,
                    isFeePayer: existingOnTarget.isFeePayer || l.isFeePayer,
                    isActive: true,
                    unlinkedAt: null,
                  },
                });
                await (tx as any).studentGuardianLink.update({
                  where: { id: l.id },
                  data: { isActive: false, isPrimary: false, unlinkedAt: new Date() },
                });
              } else {
                await (tx as any).studentGuardianLink.update({
                  where: { id: l.id },
                  data: { guardianId: target.id },
                });
              }
            }

            await (tx as any).guardianCommunication.updateMany({
              where: { schoolId, guardianId: src.id },
              data: { guardianId: target.id },
            });

            await (tx as any).guardian.update({
              where: { id: src.id },
              data: {
                status: "ARCHIVED",
                normalizedPhone: src.normalizedPhone
                  ? `${src.normalizedPhone}#merged-${src.id.slice(0, 6)}`
                  : null,
                notes: `${src.notes ? `${src.notes}\n` : ""}Merged into ${target.fullName} (${target.id}).`,
              },
            });
          }

          return sources.length;
        },
        options,
      );

      if (merged !== null) {
        await this.invalidateCaches(schoolId);
        const dossier = await this.getGuardianDossier(schoolId, input.targetGuardianId, options);
        return { targetGuardian: dossier.guardian, mergedCount: merged };
      }
    }

    const store = getMemoryStore(schoolId);
    const target = store.guardians[input.targetGuardianId];
    if (!target) throw new NotFoundError("Target guardian");

    let count = 0;
    for (const sid of sourceIds) {
      const src = store.guardians[sid];
      if (!src) continue;
      count += 1;
      for (const l of store.links.filter((x) => x.guardianId === sid && x.isActive)) {
        const dupLink = store.links.find(
          (x) => x.studentId === l.studentId && x.guardianId === target.id,
        );
        if (dupLink) {
          dupLink.isPrimary = dupLink.isPrimary || l.isPrimary;
          dupLink.canPickup = dupLink.canPickup || l.canPickup;
          dupLink.isFeePayer = dupLink.isFeePayer || l.isFeePayer;
          dupLink.isActive = true;
          dupLink.unlinkedAt = null;
          l.isActive = false;
          l.isPrimary = false;
        } else {
          l.guardianId = target.id;
        }
      }
      for (const c of store.communications) {
        if (c.guardianId === sid) c.guardianId = target.id;
      }
      src.status = "ARCHIVED";
      src.normalizedPhone = src.normalizedPhone
        ? `${src.normalizedPhone}#merged-${src.id.slice(0, 6)}`
        : null;
    }

    await this.invalidateCaches(schoolId);
    const dossier = await this.getGuardianDossier(schoolId, input.targetGuardianId, options);
    return { targetGuardian: dossier.guardian, mergedCount: count };
  }

  async autoLinkHouseholds(
    explicitSchoolId: string,
    actor: ActorMeta,
    mode: "PREVIEW" | "APPLY",
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{
    clusters: HouseholdCluster[];
    linkedCount: number;
    mergedCount: number;
  }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const snap = await this.getSnapshot(schoolId, { ...options, bypassCache: true });
    const clusters = buildHouseholdClusters(snap.guardians, snap.students);

    if (mode === "PREVIEW") {
      return { clusters, linkedCount: 0, mergedCount: 0 };
    }

    let linkedCount = 0;
    let mergedCount = 0;

    for (const cluster of clusters) {
      if (cluster.guardians.length === 0) continue;
      const primaryGuardian = cluster.guardians[0]!;
      const alreadyLinked = new Set(
        primaryGuardian.wards.filter((w) => w.isActive).map((w) => w.studentId),
      );
      for (const stu of cluster.students) {
        if (!alreadyLinked.has(stu.id)) {
          await this.linkOrUpdateWard(
            schoolId,
            primaryGuardian.id,
            actor,
            {
              studentId: stu.id,
              relation: stu.guardianRelation || "Parent",
              isPrimary: false,
              isEmergencyContact: true,
              canPickup: true,
              isFeePayer: false,
              receivesAcademicAlerts: true,
              receivesFeeAlerts: true,
              restrictedContact: false,
            },
            options,
          );
          linkedCount += 1;
        }
      }
      if (cluster.guardians.length > 1 && cluster.matchBasis === "PHONE") {
        const srcIds = cluster.guardians.slice(1).map((g) => g.id);
        const res = await this.mergeGuardians(
          schoolId,
          { targetGuardianId: primaryGuardian.id, sourceGuardianIds: srcIds },
          options,
        );
        mergedCount += res.mergedCount;
      }
    }

    const refreshed = await this.getSnapshot(schoolId, { ...options, bypassCache: true });
    return {
      clusters: buildHouseholdClusters(refreshed.guardians, refreshed.students),
      linkedCount,
      mergedCount,
    };
  }

  async updatePortalAccess(
    explicitSchoolId: string,
    guardianIds: string[],
    action: PortalInviteInput["action"],
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{ updatedCount: number }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const targetStatus: GuardianPortalStatus =
      action === "ACTIVATE" ? "ACTIVE" : action === "SUSPEND" ? "SUSPENDED" : "INVITED";

    if (await authRepository.canUsePrismaForPlatform()) {
      const updated = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;
          const guardians = await (tx as any).guardian.findMany({
            where: { schoolId, id: { in: guardianIds } },
          });
          let count = 0;
          for (const g of guardians) {
            let userId = g.userId as string | null;
            if (!userId && action !== "SUSPEND") {
              const existingUser = await (tx as any).user.findFirst({
                where: { schoolId, phone: g.phone },
                select: { id: true },
              });
              if (existingUser) {
                userId = existingUser.id;
              } else {
                const newUser = await (tx as any).user.create({
                  data: {
                    schoolId,
                    name: g.fullName,
                    email: g.email || null,
                    phone: g.phone,
                    passwordHash: `OTP_ONLY_${randomBytes(16).toString("hex")}`,
                    role: "PARENT",
                    status: action === "ACTIVATE" ? "ACTIVE" : "PENDING_VERIFICATION",
                  },
                });
                userId = newUser.id;
              }
            }
            await (tx as any).guardian.update({
              where: { id: g.id },
              data: {
                userId,
                portalStatus: targetStatus,
                portalInvitedAt: action === "INVITE" ? new Date() : g.portalInvitedAt,
              },
            });
            count += 1;
          }
          return count;
        },
        options,
      );

      if (updated !== null) {
        await this.invalidateCaches(schoolId);
        return { updatedCount: updated };
      }
    }

    const store = getMemoryStore(schoolId);
    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    for (const gId of guardianIds) {
      const g = store.guardians[gId];
      if (!g) continue;
      if (!g.userId && action !== "SUSPEND") {
        g.userId = randomUUID();
      }
      g.portalStatus = targetStatus;
      if (action === "INVITE") g.portalInvitedAt = nowIso;
      g.updatedAt = nowIso;
      updatedCount += 1;
    }
    await this.invalidateCaches(schoolId);
    return { updatedCount };
  }

  async sendCommunication(
    explicitSchoolId: string,
    actor: ActorMeta,
    input: SendGuardianCommunicationInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{ sentCount: number; records: GuardianCommunicationRecord[] }> {
    const schoolId = this.requireSchoolId(explicitSchoolId);
    const snap = await this.getSnapshot(schoolId, options);
    const guardianMap = new Map(snap.guardians.map((g) => [g.id, g]));

    if (await authRepository.canUsePrismaForPlatform()) {
      const created = await runTenantParentTx(
        schoolId,
        async (tx) => {
          if (!(await hasParentTables(tx))) return null;
          const out: GuardianCommunicationRecord[] = [];
          for (const gId of input.guardianIds) {
            const g = guardianMap.get(gId);
            if (!g) continue;
            const row = await (tx as any).guardianCommunication.create({
              data: {
                schoolId,
                guardianId: gId,
                studentId: input.studentId || null,
                channel: input.channel,
                direction: "OUTBOUND",
                senderName: actor.userName,
                recipientName: g.fullName,
                subject: input.subject || null,
                body: input.body,
                status: "SENT",
              },
            });
            if (input.studentId) {
              await (tx as any).studentCommunication.create({
                data: {
                  schoolId,
                  studentId: input.studentId,
                  channel: input.channel === "WHATSAPP" || input.channel === "CALL" ? "MESSAGE" : input.channel,
                  direction: "OUTBOUND",
                  senderName: actor.userName,
                  recipientName: g.fullName,
                  subject: input.subject || null,
                  body: input.body,
                  status: "SENT",
                },
              });
            }
            out.push(mapCommRow(row));
          }
          return out;
        },
        options,
      );

      if (created) {
        await this.invalidateCaches(schoolId);
        return { sentCount: created.length, records: created };
      }
    }

    const store = getMemoryStore(schoolId);
    const nowIso = new Date().toISOString();
    const records: GuardianCommunicationRecord[] = [];
    for (const gId of input.guardianIds) {
      const g = guardianMap.get(gId);
      if (!g) continue;
      const rec: GuardianCommunicationRecord = {
        id: randomUUID(),
        schoolId,
        guardianId: gId,
        studentId: input.studentId || null,
        studentName: input.studentId
          ? (snap.students.find((s) => s.id === input.studentId)?.studentName ?? null)
          : null,
        channel: input.channel,
        direction: "OUTBOUND",
        senderName: actor.userName,
        recipientName: g.fullName,
        subject: input.subject || null,
        body: input.body,
        status: "SENT",
        createdAt: nowIso,
      };
      store.communications.unshift(rec);
      records.push(rec);
    }
    await this.invalidateCaches(schoolId);
    return { sentCount: records.length, records };
  }
}

export const parentRepository = new ParentRepository();
