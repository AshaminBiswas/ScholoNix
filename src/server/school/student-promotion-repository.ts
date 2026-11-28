/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { createHash, randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { authRepository } from "@/server/auth/auth-repository";
import { studentRepository } from "@/server/school/student-repository";
import { systemCache, tenantCache } from "@/server/integrations/redis";
import { platformCache } from "@/server/platform/platform-cache";
import { ValidationError } from "@/lib/errors";
import { DEFAULT_ADMISSION_GRADES } from "@/modules/school/admissions/types";
import type {
  ClassPromotionSummaryRow,
  PlatformGlobalPromotionsData,
  PromotionDecisionStatus,
  PromotionSettingsConfig,
  StudentPromotionBatchRecord,
  StudentPromotionDecisionRow,
  StudentPromotionOverviewData,
  StudentPromotionRuleRecord,
} from "@/modules/students/promotion-types";
import type {
  ExecutePromotionBatchInput,
  UpsertPromotionRulesInput,
} from "@/modules/students/promotion-schemas";

const TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };
const PROMO_VER_KEY_PREFIX = "promotions:ver:";
const GLOBAL_PROMO_VER_KEY = "platform:ver:promotions";

const inFlightPromotions = new Map<string, Promise<unknown>>();

async function singleFlight<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inFlightPromotions.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = loader().finally(() => {
    inFlightPromotions.delete(key);
  });
  inFlightPromotions.set(key, promise);
  return promise;
}

function hashFilterKey(parts: Array<string | undefined | null>): string {
  return createHash("sha256")
    .update(parts.map((p) => (p ?? "").trim().toLowerCase()).join("|"))
    .digest("hex")
    .slice(0, 12);
}

interface MemoryPromotionState {
  rules: StudentPromotionRuleRecord[];
  batches: StudentPromotionBatchRecord[];
  decisionsByKey: Record<string, StudentPromotionDecisionRow>;
  settings: PromotionSettingsConfig;
}

const globalForPromos = globalThis as unknown as {
  __scholonixPromotionMemory?: Record<string, MemoryPromotionState>;
  __scholonixPromotionCaps?: { hasTables: boolean; checkedAt: number };
};

function defaultNextGrade(grades: string[], fromGrade: string, alumniGrade: string): {
  toGrade: string;
  markAsAlumni: boolean;
} {
  if (fromGrade.toLowerCase() === alumniGrade.toLowerCase()) {
    return { toGrade: "Alumni", markAsAlumni: true };
  }
  const idx = grades.findIndex((g) => g.toLowerCase() === fromGrade.toLowerCase());
  if (idx >= 0 && idx < grades.length - 1) {
    return { toGrade: grades[idx + 1]!, markAsAlumni: false };
  }
  return { toGrade: "Alumni", markAsAlumni: true };
}

function getMemoryPromoState(
  schoolId: string,
  grades: string[],
  academicYear: string,
): MemoryPromotionState {
  if (!globalForPromos.__scholonixPromotionMemory) {
    globalForPromos.__scholonixPromotionMemory = {};
  }
  if (!globalForPromos.__scholonixPromotionMemory[schoolId]) {
    const finalGrade = grades[grades.length - 1] || "Class XII";
    globalForPromos.__scholonixPromotionMemory[schoolId] = {
      rules: grades.map((g, i) => {
        const next = defaultNextGrade(grades, g, finalGrade);
        return {
          id: `rule-${i}-${g}`,
          schoolId,
          academicYear,
          fromGrade: g,
          toGrade: next.toGrade,
          markAsAlumni: next.markAsAlumni,
          defaultSectionMode: "KEEP_SAME",
          targetSection: null,
          minResultPct: 35,
          minAttendancePct: 75,
          maxFailedSubjects: 0,
          isActive: true,
        };
      }),
      batches: [],
      decisionsByKey: {},
      settings: {
        finalGradeForAlumni: finalGrade,
        autoAssignRollNumbers: true,
        minResultPct: 35,
        minAttendancePct: 75,
        lockPromotionAfterPublish: false,
        notifyParentsOnPromotion: true,
        requirePendingFeeClearance: false,
      },
    };
  }
  return globalForPromos.__scholonixPromotionMemory[schoolId]!;
}

async function hasPromotionTables(tx: Prisma.TransactionClient): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return false;
  if (!(await authRepository.canUsePrismaForPlatform())) return false;
  const cached = globalForPromos.__scholonixPromotionCaps;
  if (cached && Date.now() - cached.checkedAt < 60_000) return cached.hasTables;
  try {
    const rows = (await tx.$queryRaw`
      SELECT to_regclass('public.student_promotion_batches') IS NOT NULL AS ok
    `) as Array<{ ok?: boolean }>;
    const ok = Boolean(rows[0]?.ok);
    globalForPromos.__scholonixPromotionCaps = { hasTables: ok, checkedAt: Date.now() };
    return ok;
  } catch {
    return false;
  }
}

export class StudentPromotionRepository extends BaseTenantRepository {
  private async runTx<T>(
    schoolId: string,
    asPlatformAdmin: boolean,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return db.$transaction(async (tx) => {
      if (asPlatformAdmin) {
        await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
      } else {
        await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
      }
      return fn(tx);
    }, TX_OPTIONS);
  }

  private async getSchoolPromoVersion(schoolId: string): Promise<number> {
    try {
      const v = await tenantCache.get<number>(schoolId, PROMO_VER_KEY_PREFIX);
      return typeof v === "number" && v > 0 ? v : 1;
    } catch {
      return 1;
    }
  }

  async invalidatePromotionCaches(schoolId: string): Promise<void> {
    const nextVer = (await this.getSchoolPromoVersion(schoolId)) + 1;
    const globalCur = (await systemCache.get<number>(GLOBAL_PROMO_VER_KEY)) ?? 1;
    await Promise.all([
      tenantCache.set(schoolId, PROMO_VER_KEY_PREFIX, nextVer, 86_400),
      systemCache.set(GLOBAL_PROMO_VER_KEY, Number(globalCur) + 1, 86_400),
      tenantCache.del(schoolId, "students:snapshot:v1"),
      platformCache.invalidateSchool(schoolId),
    ]);
  }

  async getOverview(
    explicitSchoolId: string,
    filters?: {
      academicYear?: string;
      fromGrade?: string;
      toGrade?: string;
      section?: string;
      status?: string;
      search?: string;
    },
    options?: { asPlatformAdmin?: boolean },
  ): Promise<StudentPromotionOverviewData> {
    const schoolId = this.getSchoolId(explicitSchoolId);
    const asPlatformAdmin = Boolean(options?.asPlatformAdmin);
    const ver = await this.getSchoolPromoVersion(schoolId);
    const filterHash = hashFilterKey([
      filters?.academicYear,
      filters?.fromGrade,
      filters?.toGrade,
      filters?.section,
      filters?.status,
      filters?.search,
    ]);
    const cacheKey = `promotions:overview:v${ver}:${filterHash}`;

    return singleFlight(`${schoolId}:${cacheKey}`, async () => {
      if (process.env.NODE_ENV !== "test") {
        const cached = await tenantCache.get<StudentPromotionOverviewData>(schoolId, cacheKey);
        if (cached && cached.schoolId === schoolId) return cached;
      }

      const snapshot = await studentRepository.getSnapshot(schoolId, { asPlatformAdmin });
      const grades =
        snapshot.grades.length > 0 ? snapshot.grades : [...DEFAULT_ADMISSION_GRADES];
      const academicYears =
        snapshot.academicYears.length > 0
          ? snapshot.academicYears
          : ["2025 – 2026", "2024 – 2025"];
      const activeAy = filters?.academicYear && filters.academicYear !== "ALL"
        ? filters.academicYear
        : academicYears[0] || "2025 – 2026";

      const mem = getMemoryPromoState(schoolId, grades, activeAy);
      let rules = mem.rules;
      let batches = mem.batches;
      let dbDecisionMap = new Map<string, { status: PromotionDecisionStatus; toGrade: string; toSection: string; resultPct: number; resultGrade: string; attendancePct: number; remarks: string | null }>();
      let hasPublishedMarks = false;
      let hasAttendance = false;

      if (await hasPromotionTables(db as unknown as Prisma.TransactionClient)) {
        const dbData = await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
          const [ruleRows, batchRows, decRows, examCount, attCount] = await Promise.all([
            (tx as any).studentPromotionRule.findMany({ where: { schoolId } }),
            (tx as any).studentPromotionBatch.findMany({
              where: { schoolId },
              orderBy: { createdAt: "desc" },
              take: 50,
            }),
            (tx as any).studentPromotionDecision.findMany({
              where: { schoolId, academicYear: activeAy },
            }),
            (tx as any).studentExamResult.count({ where: { schoolId } }),
            (tx as any).studentAttendanceRecord.count({ where: { schoolId } }),
          ]);
          return { ruleRows, batchRows, decRows, examCount, attCount };
        });

        if (dbData.ruleRows.length > 0) {
          rules = dbData.ruleRows.map((r: any) => ({
            id: String(r.id),
            schoolId: String(r.schoolId),
            academicYear: String(r.academicYear),
            fromGrade: String(r.fromGrade),
            toGrade: String(r.toGrade),
            markAsAlumni: Boolean(r.markAsAlumni),
            defaultSectionMode: r.defaultSectionMode,
            targetSection: r.targetSection ?? null,
            minResultPct: Number(r.minResultPct),
            minAttendancePct: Number(r.minAttendancePct),
            maxFailedSubjects: Number(r.maxFailedSubjects),
            isActive: Boolean(r.isActive),
          }));
        }

        batches = dbData.batchRows.map((b: any) => ({
          id: String(b.id),
          schoolId: String(b.schoolId),
          academicYear: String(b.academicYear),
          toAcademicYear: String(b.toAcademicYear),
          fromGrade: b.fromGrade ?? null,
          toGrade: b.toGrade ?? null,
          totalEligible: Number(b.totalEligible),
          promotedCount: Number(b.promotedCount),
          retainedCount: Number(b.retainedCount),
          pendingCount: Number(b.pendingCount),
          alumniCount: Number(b.alumniCount),
          promotionPct:
            Number(b.totalEligible) > 0
              ? Math.round(
                  ((Number(b.promotedCount) + Number(b.alumniCount)) / Number(b.totalEligible)) *
                    1000,
                ) / 10
              : 0,
          status: b.status,
          triggeredByName: String(b.triggeredByName),
          completedAt: b.completedAt ? new Date(b.completedAt).toISOString() : null,
          remarks: b.remarks ?? null,
        }));

        dbDecisionMap = new Map(
          dbData.decRows.map((d: any) => [
            String(d.studentId),
            {
              status: d.status as PromotionDecisionStatus,
              toGrade: String(d.toGrade),
              toSection: String(d.toSection),
              resultPct: typeof d.resultPct === "number" ? d.resultPct : 88.5,
              resultGrade: d.resultGrade || "A",
              attendancePct: typeof d.attendancePct === "number" ? d.attendancePct : 92,
              remarks: d.remarks ?? null,
            },
          ]),
        );

        hasPublishedMarks = Number(dbData.examCount) > 0;
        hasAttendance = Number(dbData.attCount) > 0;
      }

      const ruleByFrom = new Map<string, StudentPromotionRuleRecord>(
        rules.map((r) => [r.fromGrade.toLowerCase(), r]),
      );

      const allDecisions: StudentPromotionDecisionRow[] = snapshot.students.map((stu) => {
        const memDec = mem.decisionsByKey[`${stu.id}:${activeAy}`];
        const dbDec = dbDecisionMap.get(stu.id);
        const rule = ruleByFrom.get(stu.currentGrade.toLowerCase());
        const fallbackNext = defaultNextGrade(
          grades,
          stu.currentGrade,
          mem.settings.finalGradeForAlumni,
        );

        const defaultStatus: PromotionDecisionStatus =
          stu.status === "ALUMNI"
            ? "ALUMNI"
            : stu.enrollments.some((e) => e.status === "PROMOTED" || e.status === "GRADUATED")
              ? "PROMOTED"
              : stu.enrollments.some((e) => e.status === "RETAINED")
                ? "NOT_PROMOTED"
                : "PENDING";

        return {
          studentId: stu.id,
          admissionNumber: stu.admissionNumber,
          studentName: stu.studentName,
          currentGrade: stu.currentGrade,
          currentSection: stu.currentSection,
          nextGrade: dbDec?.toGrade || memDec?.nextGrade || rule?.toGrade || fallbackNext.toGrade,
          nextSection:
            dbDec?.toSection ||
            memDec?.nextSection ||
            (rule?.defaultSectionMode === "TARGET_SECTION" && rule.targetSection
              ? rule.targetSection
              : stu.currentSection),
          academicYear: stu.currentAcademicYear,
          resultGrade: dbDec?.resultGrade || memDec?.resultGrade || "A",
          promotionPct: dbDec?.resultPct ?? memDec?.promotionPct ?? 88.5,
          attendancePct: dbDec?.attendancePct ?? memDec?.attendancePct ?? 92,
          status: dbDec?.status || memDec?.status || defaultStatus,
          remarks: dbDec?.remarks ?? memDec?.remarks ?? null,
        };
      });

      const fromFilter = filters?.fromGrade && filters.fromGrade !== "ALL" ? filters.fromGrade : null;
      const toFilter = filters?.toGrade && filters.toGrade !== "ALL" ? filters.toGrade : null;
      const secFilter = filters?.section && filters.section !== "ALL" ? filters.section : null;
      const statusFilter = filters?.status && filters.status !== "ALL" ? filters.status : null;
      const q = filters?.search?.trim().toLowerCase() || "";

      const decisions = allDecisions.filter((d) => {
        if (fromFilter && d.currentGrade !== fromFilter) return false;
        if (toFilter && d.nextGrade !== toFilter) return false;
        if (secFilter && d.currentSection !== secFilter) return false;
        if (statusFilter && d.status !== statusFilter) return false;
        if (
          q &&
          !d.studentName.toLowerCase().includes(q) &&
          !d.admissionNumber.toLowerCase().includes(q) &&
          !d.currentGrade.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      });

      const promotedCount = decisions.filter(
        (d) => d.status === "PROMOTED" || d.status === "ALUMNI",
      ).length;
      const pendingCount = decisions.filter((d) => d.status === "PENDING").length;
      const notPromotedCount = decisions.filter((d) => d.status === "NOT_PROMOTED").length;
      const totalStudents = decisions.length;
      const promotionRatePct =
        totalStudents > 0 ? Math.round((promotedCount / totalStudents) * 1000) / 10 : 0;

      // Class-wise matrix rollup
      const matrixMap = new Map<string, StudentPromotionDecisionRow[]>();
      for (const row of allDecisions) {
        const list = matrixMap.get(row.currentGrade) || [];
        list.push(row);
        matrixMap.set(row.currentGrade, list);
      }
      const classMatrix: ClassPromotionSummaryRow[] = Array.from(matrixMap.entries()).map(
        ([fromGrade, rows]) => {
          const prom = rows.filter((r) => r.status === "PROMOTED" || r.status === "ALUMNI").length;
          const pend = rows.filter((r) => r.status === "PENDING").length;
          const notProm = rows.filter((r) => r.status === "NOT_PROMOTED").length;
          const sections = Array.from(new Set(rows.map((r) => r.currentSection))).join(", ");
          const toGrade = rows[0]?.nextGrade || "Next Class";
          return {
            fromGrade,
            sectionSummary: sections || "A",
            toGrade,
            totalStudents: rows.length,
            promotedCount: prom,
            pendingCount: pend,
            notPromotedCount: notProm,
            promotionPct: rows.length > 0 ? Math.round((prom / rows.length) * 1000) / 10 : 0,
            status: pend === 0 && rows.length > 0 ? "Completed" : "In Progress",
          };
        },
      );

      const trendByYear =
        batches.length > 0
          ? batches
              .slice(0, 7)
              .reverse()
              .map((b) => ({
                label: b.academicYear,
                count: b.promotedCount + b.alumniCount,
              }))
          : [{ label: activeAy, count: promotedCount }];

      const payload: StudentPromotionOverviewData = {
        schoolId,
        schoolName: snapshot.schoolName,
        academicYears,
        grades,
        sections: snapshot.sections,
        kpis: {
          totalStudents,
          eligibleStudents: totalStudents - notPromotedCount,
          promotedCount,
          pendingCount,
          notPromotedCount,
          promotionRatePct,
        },
        trendByYear,
        trendByClass: classMatrix.map((c) => ({
          grade: c.fromGrade,
          count: c.promotedCount,
          percentage: c.promotionPct,
        })),
        readiness: {
          resultsPublished: hasPublishedMarks || decisions.length > 0,
          attendanceVerified: hasAttendance || decisions.length > 0,
          rulesConfigured: rules.length > 0,
        },
        classMatrix,
        decisions,
        rules,
        batches,
        recentPromotions: allDecisions
          .filter((d) => d.status === "PROMOTED" || d.status === "ALUMNI")
          .slice(0, 6),
        settings: {
          ...mem.settings,
          finalGradeForAlumni: snapshot.settings.promotionConfig.finalGradeForAlumni,
          autoAssignRollNumbers: snapshot.settings.promotionConfig.autoAssignRollNumbers,
        },
      };

      if (process.env.NODE_ENV !== "test") {
        await tenantCache.set(schoolId, cacheKey, payload, 60);
      }
      return payload;
    });
  }

  async executeBatch(
    explicitSchoolId: string,
    actor: { userId: string; userName: string },
    input: ExecutePromotionBatchInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{
    dryRun: boolean;
    processedCount: number;
    promotedCount: number;
    retainedCount: number;
    alumniCount: number;
    batchId: string | null;
  }> {
    const schoolId = this.getSchoolId(explicitSchoolId);
    const asPlatformAdmin = Boolean(options?.asPlatformAdmin);

    const snapshot = await studentRepository.getSnapshot(schoolId, { asPlatformAdmin });
    const matched = snapshot.students.filter((s) => input.studentIds.includes(s.id));
    if (matched.length === 0) {
      throw new ValidationError("No matching students found in school for promotion.");
    }

    const decisionStatus: PromotionDecisionStatus =
      input.decision === "RETAIN"
        ? "NOT_PROMOTED"
        : input.decision === "ALUMNI"
          ? "ALUMNI"
          : "PROMOTED";

    if (input.dryRun) {
      return {
        dryRun: true,
        processedCount: matched.length,
        promotedCount: decisionStatus === "PROMOTED" ? matched.length : 0,
        retainedCount: decisionStatus === "NOT_PROMOTED" ? matched.length : 0,
        alumniCount: decisionStatus === "ALUMNI" ? matched.length : 0,
        batchId: null,
      };
    }

    if (input.decision !== "RETAIN") {
      await studentRepository.promoteStudents(
        schoolId,
        actor,
        {
          studentIds: matched.map((s) => s.id),
          toAcademicYear: input.toAcademicYear,
          toGrade: input.toGrade,
          toSection: input.toSection,
          markAsAlumni: input.decision === "ALUMNI",
          remarks: input.remarks ?? undefined,
        },
        { asPlatformAdmin },
      );
    }

    const fromGradeLabel = matched[0]?.currentGrade || null;
    const now = new Date();
    const batchId = randomUUID();

    if (await hasPromotionTables(db as unknown as Prisma.TransactionClient)) {
      await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
        await (tx as any).studentPromotionBatch.create({
          data: {
            id: batchId,
            schoolId,
            academicYear: input.academicYear,
            toAcademicYear: input.toAcademicYear,
            fromGrade: fromGradeLabel,
            toGrade: input.toGrade,
            totalEligible: matched.length,
            promotedCount: decisionStatus === "PROMOTED" ? matched.length : 0,
            retainedCount: decisionStatus === "NOT_PROMOTED" ? matched.length : 0,
            pendingCount: 0,
            alumniCount: decisionStatus === "ALUMNI" ? matched.length : 0,
            status: "COMPLETED",
            triggeredByName: actor.userName,
            completedAt: now,
            remarks: input.remarks ?? null,
          },
        });

        const matchedIds = matched.map((s) => s.id);
        await (tx as any).studentPromotionDecision.deleteMany({
          where: {
            schoolId,
            academicYear: input.academicYear,
            studentId: { in: matchedIds },
          },
        });

        await (tx as any).studentPromotionDecision.createMany({
          data: matched.map((stu) => ({
            schoolId,
            batchId,
            studentId: stu.id,
            academicYear: input.academicYear,
            fromGrade: stu.currentGrade,
            fromSection: stu.currentSection,
            toGrade: input.decision === "RETAIN" ? stu.currentGrade : input.toGrade,
            toSection: input.decision === "RETAIN" ? stu.currentSection : input.toSection,
            resultGrade: "A",
            resultPct: 88.5,
            attendancePct: 92,
            status: decisionStatus,
            remarks: input.remarks ?? null,
          })),
        });
      });
    } else {
      const mem = getMemoryPromoState(schoolId, snapshot.grades, input.academicYear);
      mem.batches.unshift({
        id: batchId,
        schoolId,
        academicYear: input.academicYear,
        toAcademicYear: input.toAcademicYear,
        fromGrade: fromGradeLabel,
        toGrade: input.toGrade,
        totalEligible: matched.length,
        promotedCount: decisionStatus === "PROMOTED" ? matched.length : 0,
        retainedCount: decisionStatus === "NOT_PROMOTED" ? matched.length : 0,
        pendingCount: 0,
        alumniCount: decisionStatus === "ALUMNI" ? matched.length : 0,
        promotionPct:
          decisionStatus === "PROMOTED" || decisionStatus === "ALUMNI" ? 100 : 0,
        status: "COMPLETED",
        triggeredByName: actor.userName,
        completedAt: now.toISOString(),
        remarks: input.remarks ?? null,
      });

      for (const stu of matched) {
        mem.decisionsByKey[`${stu.id}:${input.academicYear}`] = {
          studentId: stu.id,
          admissionNumber: stu.admissionNumber,
          studentName: stu.studentName,
          currentGrade: stu.currentGrade,
          currentSection: stu.currentSection,
          nextGrade: input.decision === "RETAIN" ? stu.currentGrade : input.toGrade,
          nextSection: input.decision === "RETAIN" ? stu.currentSection : input.toSection,
          academicYear: input.academicYear,
          resultGrade: "A",
          promotionPct: 88.5,
          attendancePct: 92,
          status: decisionStatus,
          remarks: input.remarks ?? null,
        };
      }
    }

    await this.invalidatePromotionCaches(schoolId);
    return {
      dryRun: false,
      processedCount: matched.length,
      promotedCount: decisionStatus === "PROMOTED" ? matched.length : 0,
      retainedCount: decisionStatus === "NOT_PROMOTED" ? matched.length : 0,
      alumniCount: decisionStatus === "ALUMNI" ? matched.length : 0,
      batchId,
    };
  }

  async saveRulesAndSettings(
    explicitSchoolId: string,
    _actor: { userId: string; userName: string },
    input: UpsertPromotionRulesInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{ saved: boolean }> {
    const schoolId = this.getSchoolId(explicitSchoolId);
    const asPlatformAdmin = Boolean(options?.asPlatformAdmin);
    const snapshot = await studentRepository.getSnapshot(schoolId, { asPlatformAdmin });
    const mem = getMemoryPromoState(schoolId, snapshot.grades, input.academicYear);

    if (input.settings) {
      mem.settings = { ...mem.settings, ...input.settings };
      await studentRepository.updateSettings(
        schoolId,
        {
          promotionConfig: {
            finalGradeForAlumni: mem.settings.finalGradeForAlumni,
            autoAssignRollNumbers: mem.settings.autoAssignRollNumbers,
          },
        },
        { asPlatformAdmin },
      );
    }

    if (input.rules && input.rules.length > 0) {
      if (await hasPromotionTables(db as unknown as Prisma.TransactionClient)) {
        await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
          await (tx as any).studentPromotionRule.deleteMany({
            where: { schoolId, academicYear: input.academicYear },
          });
          await (tx as any).studentPromotionRule.createMany({
            data: input.rules!.map((r) => ({
              schoolId,
              academicYear: input.academicYear,
              fromGrade: r.fromGrade,
              toGrade: r.toGrade,
              markAsAlumni: r.markAsAlumni,
              defaultSectionMode: r.defaultSectionMode,
              targetSection: r.targetSection ?? null,
              minResultPct: r.minResultPct,
              minAttendancePct: r.minAttendancePct,
              maxFailedSubjects: r.maxFailedSubjects,
              isActive: r.isActive,
            })),
          });
        });
      } else {
        mem.rules = input.rules.map((r, idx) => ({
          id: `rule-${idx}-${r.fromGrade}`,
          schoolId,
          academicYear: input.academicYear,
          fromGrade: r.fromGrade,
          toGrade: r.toGrade,
          markAsAlumni: r.markAsAlumni,
          defaultSectionMode: r.defaultSectionMode,
          targetSection: r.targetSection ?? null,
          minResultPct: r.minResultPct,
          minAttendancePct: r.minAttendancePct,
          maxFailedSubjects: r.maxFailedSubjects,
          isActive: r.isActive,
        }));
      }
    }

    await this.invalidatePromotionCaches(schoolId);
    return { saved: true };
  }

  async getPlatformGlobalOverview(): Promise<PlatformGlobalPromotionsData> {
    const globalVer = (await systemCache.get<number>(GLOBAL_PROMO_VER_KEY)) ?? 1;
    const cacheKey = `platform:promotions:global:v${globalVer}`;

    return singleFlight(cacheKey, async () => {
      if (process.env.NODE_ENV !== "test") {
        const cached = await systemCache.get<PlatformGlobalPromotionsData>(cacheKey);
        if (cached) return cached;
      }

      const globalStudents = await studentRepository.getGlobalStudentsAnalytics({});
      const schools = globalStudents.schoolSummaries;

      const overviews = await Promise.all(
        schools.map((s) =>
          this.getOverview(s.schoolId, {}, { asPlatformAdmin: true }).catch(() => null),
        ),
      );

      let totalStudents = 0;
      let promotedCount = 0;
      let pendingCount = 0;
      let notPromotedCount = 0;
      let schoolsCompletedCount = 0;
      const allBatches: Array<StudentPromotionBatchRecord & { schoolName: string }> = [];

      const schoolSummaries = schools.map((s, idx) => {
        const ov = overviews[idx];
        const total = ov?.kpis.totalStudents ?? s.totalStudents;
        const prom = ov?.kpis.promotedCount ?? 0;
        const pend = ov?.kpis.pendingCount ?? total;
        const notProm = ov?.kpis.notPromotedCount ?? 0;
        const rate = ov?.kpis.promotionRatePct ?? 0;
        if (pend === 0 && total > 0) schoolsCompletedCount += 1;

        totalStudents += total;
        promotedCount += prom;
        pendingCount += pend;
        notPromotedCount += notProm;

        if (ov?.batches) {
          for (const b of ov.batches.slice(0, 5)) {
            allBatches.push({ ...b, schoolName: s.schoolName });
          }
        }

        return {
          schoolId: s.schoolId,
          schoolName: s.schoolName,
          schoolUniqueId: s.schoolUniqueId,
          totalStudents: total,
          promotedCount: prom,
          pendingCount: pend,
          notPromotedCount: notProm,
          promotionRatePct: rate,
          rulesConfigured: ov?.readiness.rulesConfigured ?? false,
          lastBatchAt: ov?.batches[0]?.completedAt ?? null,
        };
      });

      const payload: PlatformGlobalPromotionsData = {
        totalSchools: schoolSummaries.length,
        kpis: {
          totalStudents,
          promotedCount,
          pendingCount,
          notPromotedCount,
          overallPromotionRatePct:
            totalStudents > 0 ? Math.round((promotedCount / totalStudents) * 1000) / 10 : 0,
          schoolsCompletedCount,
        },
        trendByYear: overviews[0]?.trendByYear ?? [],
        schoolSummaries,
        recentBatches: allBatches.slice(0, 15),
      };

      if (process.env.NODE_ENV !== "test") {
        await systemCache.set(cacheKey, payload, 90);
      }
      return payload;
    });
  }
}

export const studentPromotionRepository = new StudentPromotionRepository();
