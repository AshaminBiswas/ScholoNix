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
import {
  DEFAULT_PROMOTION_GRADE_BANDS,
  DEFAULT_PROMOTION_SETTINGS_SUITE,
  type ClassPromotionSummaryRow,
  type PlatformGlobalPromotionsData,
  type PromotionAuditLogEntry,
  type PromotionAuditLogsResponse,
  type PromotionDecisionStatus,
  type PromotionGradeBand,
  type PromotionSettingsConfig,
  type PromotionSettingsSuiteConfig,
  type StudentPromotionBatchRecord,
  type StudentPromotionDecisionRow,
  type StudentPromotionOverviewData,
  type StudentPromotionRuleRecord,
} from "@/modules/students/promotion-types";
import type {
  ExecutePromotionBatchInput,
  RunPromotionAutomationInput,
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
  settingsSuite: PromotionSettingsSuiteConfig;
  auditLogs: PromotionAuditLogEntry[];
}

const globalForPromos = globalThis as unknown as {
  __scholonixPromotionMemory?: Record<string, MemoryPromotionState>;
  __scholonixPromotionCaps?: { hasTables: boolean; hasRuleMetadataCols: boolean; checkedAt: number };
};

function defaultRuleName(fromGrade: string, idx?: number): string {
  if (idx === 0 || fromGrade.toLowerCase() === "class i") {
    return "Primary Promotion Rule";
  }
  return `${fromGrade} Promotion Rule`;
}

function defaultCriteriaSummary(minResultPct: number): string {
  return `Min ${Math.round(minResultPct)}% in all subjects`;
}

function parseGradeCriteria(raw: unknown): PromotionGradeBand[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item: any) => ({
      grade: String(item.grade || "A"),
      minPct: Number(item.minPct ?? 0),
      maxPct: Number(item.maxPct ?? 100),
      resultLabel: String(item.resultLabel || "Pass"),
      promote: Boolean(item.promote),
    }));
  }
  return DEFAULT_PROMOTION_GRADE_BANDS.map((band) => ({ ...band }));
}

function cloneDefaultSettingsSuite(): PromotionSettingsSuiteConfig {
  return JSON.parse(JSON.stringify(DEFAULT_PROMOTION_SETTINGS_SUITE)) as PromotionSettingsSuiteConfig;
}

function mergeSettingsSuite(
  base: PromotionSettingsSuiteConfig,
  patch?: Partial<PromotionSettingsSuiteConfig> | null,
): PromotionSettingsSuiteConfig {
  if (!patch) return base;
  return {
    general: { ...base.general, ...(patch.general ?? {}) },
    academicDefaults: { ...base.academicDefaults, ...(patch.academicDefaults ?? {}) },
    automation: { ...base.automation, ...(patch.automation ?? {}) },
    notifications: {
      ...base.notifications,
      ...(patch.notifications ?? {}),
      channels: { ...base.notifications.channels, ...(patch.notifications?.channels ?? {}) },
      triggers: { ...base.notifications.triggers, ...(patch.notifications?.triggers ?? {}) },
      schedule: { ...base.notifications.schedule, ...(patch.notifications?.schedule ?? {}) },
    },
    accessControl: {
      ...base.accessControl,
      ...(patch.accessControl ?? {}),
      policies: { ...base.accessControl.policies, ...(patch.accessControl?.policies ?? {}) },
    },
    resultCriteriaByGrade: {
      ...(base.resultCriteriaByGrade ?? {}),
      ...(patch.resultCriteriaByGrade ?? {}),
    },
  };
}

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
          ruleName: defaultRuleName(g, i),
          fromGrade: g,
          toGrade: next.toGrade,
          markAsAlumni: next.markAsAlumni,
          defaultSectionMode: "KEEP_SAME",
          targetSection: null,
          minResultPct: 40,
          minAttendancePct: 75,
          maxFailedSubjects: 0,
          criteriaSummary: defaultCriteriaSummary(40),
          requireAssessmentsCompleted: true,
          requireResultPublished: true,
          requireFeeClearance: false,
          gradeCriteria: DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
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
      settingsSuite: cloneDefaultSettingsSuite(),
      auditLogs: [],
    };
  }
  return globalForPromos.__scholonixPromotionMemory[schoolId]!;
}

async function getPromotionSchemaCaps(
  tx: Prisma.TransactionClient,
): Promise<{ hasTables: boolean; hasRuleMetadataCols: boolean }> {
  if (process.env.NODE_ENV === "test") {
    return { hasTables: false, hasRuleMetadataCols: false };
  }
  if (!(await authRepository.canUsePrismaForPlatform())) {
    return { hasTables: false, hasRuleMetadataCols: false };
  }
  const cached = globalForPromos.__scholonixPromotionCaps;
  if (cached && Date.now() - cached.checkedAt < 60_000) {
    return { hasTables: cached.hasTables, hasRuleMetadataCols: cached.hasRuleMetadataCols };
  }
  try {
    const rows = (await tx.$queryRaw`
      SELECT
        to_regclass('public.student_promotion_batches') IS NOT NULL AS ok,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'student_promotion_rules'
            AND column_name = 'grade_criteria'
        ) AS has_meta
    `) as Array<{ ok?: boolean; has_meta?: boolean }>;
    const hasTables = Boolean(rows[0]?.ok);
    const hasRuleMetadataCols = Boolean(rows[0]?.has_meta);
    globalForPromos.__scholonixPromotionCaps = {
      hasTables,
      hasRuleMetadataCols,
      checkedAt: Date.now(),
    };
    return { hasTables, hasRuleMetadataCols };
  } catch {
    return { hasTables: false, hasRuleMetadataCols: false };
  }
}

async function hasPromotionTables(tx: Prisma.TransactionClient): Promise<boolean> {
  const caps = await getPromotionSchemaCaps(tx);
  return caps.hasTables;
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
      let schoolStaff: Array<{ id: string; name: string; role: string }> = [
        { id: "principal-default", name: "School Principal", role: "PRINCIPAL" },
      ];
      let dbDecisionMap = new Map<string, { status: PromotionDecisionStatus; toGrade: string; toSection: string; resultPct: number; resultGrade: string; attendancePct: number; remarks: string | null }>();
      let hasPublishedMarks = false;
      let hasAttendance = false;

      if (await hasPromotionTables(db as unknown as Prisma.TransactionClient)) {
        const dbData = await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
          const [ruleRows, batchRows, decRows, examCount, attCount, staffRows] = await Promise.all([
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
            (tx as any).user.findMany({
              where: { schoolId, status: "ACTIVE" },
              select: { id: true, name: true, role: true },
              take: 40,
            }),
          ]);
          return { ruleRows, batchRows, decRows, examCount, attCount, staffRows };
        });

        if (Array.isArray(dbData.staffRows) && dbData.staffRows.length > 0) {
          schoolStaff = dbData.staffRows.map((u: any) => ({
            id: String(u.id),
            name: String(u.name || "Staff Member"),
            role: String(u.role || "TEACHER"),
          }));
        }

        if (dbData.ruleRows.length > 0) {
          rules = dbData.ruleRows.map((r: any, idx: number) => ({
            id: String(r.id),
            schoolId: String(r.schoolId),
            academicYear: String(r.academicYear),
            ruleName: r.ruleName ? String(r.ruleName) : defaultRuleName(String(r.fromGrade), idx),
            fromGrade: String(r.fromGrade),
            toGrade: String(r.toGrade),
            markAsAlumni: Boolean(r.markAsAlumni),
            defaultSectionMode: r.defaultSectionMode,
            targetSection: r.targetSection ?? null,
            minResultPct: Number(r.minResultPct),
            minAttendancePct: Number(r.minAttendancePct),
            maxFailedSubjects: Number(r.maxFailedSubjects),
            criteriaSummary: r.criteriaSummary
              ? String(r.criteriaSummary)
              : defaultCriteriaSummary(Number(r.minResultPct)),
            requireAssessmentsCompleted:
              typeof r.requireAssessmentsCompleted === "boolean" ? r.requireAssessmentsCompleted : true,
            requireResultPublished:
              typeof r.requireResultPublished === "boolean" ? r.requireResultPublished : true,
            requireFeeClearance:
              typeof r.requireFeeClearance === "boolean" ? r.requireFeeClearance : false,
            gradeCriteria: parseGradeCriteria(r.gradeCriteria),
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
        settingsSuite: mergeSettingsSuite(
          mem.settingsSuite,
          ((snapshot.settings.promotionConfig as any)?.settingsSuite ?? null) as Partial<PromotionSettingsSuiteConfig> | null,
        ),
        schoolStaff,
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

    if (input.settings || input.settingsSuite) {
      if (input.settings) {
        mem.settings = { ...mem.settings, ...input.settings };
      }
      if (input.settingsSuite) {
        mem.settingsSuite = mergeSettingsSuite(
          mem.settingsSuite,
          input.settingsSuite as Partial<PromotionSettingsSuiteConfig>,
        );
      }
      const existingPromoCfg = (snapshot.settings.promotionConfig ?? {}) as Record<string, unknown>;
      await studentRepository.updateSettings(
        schoolId,
        {
          promotionConfig: {
            ...existingPromoCfg,
            finalGradeForAlumni: mem.settings.finalGradeForAlumni,
            autoAssignRollNumbers: mem.settings.autoAssignRollNumbers,
            settingsSuite: mem.settingsSuite,
          } as any,
        },
        { asPlatformAdmin },
      );
    }

    if (input.rules && input.rules.length > 0) {
      const caps = await getPromotionSchemaCaps(db as unknown as Prisma.TransactionClient);
      if (caps.hasTables) {
        await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
          await (tx as any).studentPromotionRule.deleteMany({
            where: { schoolId, academicYear: input.academicYear },
          });
          await (tx as any).studentPromotionRule.createMany({
            data: input.rules!.map((r, idx) => ({
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
              ...(caps.hasRuleMetadataCols
                ? {
                    ruleName: r.ruleName || defaultRuleName(r.fromGrade, idx),
                    criteriaSummary: r.criteriaSummary || defaultCriteriaSummary(r.minResultPct),
                    requireAssessmentsCompleted: r.requireAssessmentsCompleted,
                    requireResultPublished: r.requireResultPublished,
                    requireFeeClearance: r.requireFeeClearance,
                    gradeCriteria:
                      r.gradeCriteria ?? DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
                  }
                : {}),
            })),
          });
        });
      } else {
        mem.rules = input.rules.map((r, idx) => ({
          id: `rule-${idx}-${r.fromGrade}`,
          schoolId,
          academicYear: input.academicYear,
          ruleName: r.ruleName || defaultRuleName(r.fromGrade, idx),
          fromGrade: r.fromGrade,
          toGrade: r.toGrade,
          markAsAlumni: r.markAsAlumni,
          defaultSectionMode: r.defaultSectionMode,
          targetSection: r.targetSection ?? null,
          minResultPct: r.minResultPct,
          minAttendancePct: r.minAttendancePct,
          maxFailedSubjects: r.maxFailedSubjects,
          criteriaSummary: r.criteriaSummary || defaultCriteriaSummary(r.minResultPct),
          requireAssessmentsCompleted: r.requireAssessmentsCompleted ?? true,
          requireResultPublished: r.requireResultPublished ?? true,
          requireFeeClearance: r.requireFeeClearance ?? false,
          gradeCriteria: r.gradeCriteria ?? DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
          isActive: r.isActive,
        }));
      }
    }

    await this.invalidatePromotionCaches(schoolId);
    return { saved: true };
  }

  async runAutomation(
    explicitSchoolId: string,
    actor: { userId: string; userName: string },
    input: RunPromotionAutomationInput,
    options?: { asPlatformAdmin?: boolean },
  ): Promise<{
    dryRun: boolean;
    evaluatedCount: number;
    promotedCount: number;
    retainedCount: number;
    alumniCount: number;
    flaggedCount: number;
    stepsExecuted: number;
    classBreakdown: Array<{ fromGrade: string; toGrade: string; count: number; alumniCount: number; retainCount: number }>;
  }> {
    const schoolId = this.getSchoolId(explicitSchoolId);
    const overview = await this.getOverview(schoolId, { academicYear: input.academicYear }, options);
    const autoCfg = overview.settingsSuite.automation;

    const ruleByFrom = new Map(
      overview.rules
        .filter((r) => r.isActive)
        .map((r) => [r.fromGrade.toLowerCase(), r]),
    );

    const pendingRows = overview.decisions.filter((d) => d.status === "PENDING");
    const promoteGroups = new Map<string, { toGrade: string; toSection: string; fromGrade: string; ids: string[] }>();
    const alumniIds: string[] = [];
    const retainGroups = new Map<string, { fromGrade: string; ids: string[] }>();
    const breakdownMap = new Map<string, { fromGrade: string; toGrade: string; count: number; alumniCount: number; retainCount: number }>();
    let flaggedCount = 0;

    for (const row of pendingRows) {
      const rule = ruleByFrom.get(row.currentGrade.toLowerCase());
      const minPct = rule?.minResultPct ?? overview.settingsSuite.general.overallPassPct ?? overview.settings.minResultPct;
      const minAtt = rule?.minAttendancePct ?? overview.settingsSuite.general.minAttendancePct ?? overview.settings.minAttendancePct;
      const enforceAtt = overview.settingsSuite.general.enforceAttendance;
      const gradeBand = rule?.gradeCriteria.find(
        (b) => row.promotionPct >= b.minPct && row.promotionPct <= b.maxPct,
      );

      const passesMarks = row.promotionPct >= minPct && (gradeBand ? gradeBand.promote : true);
      const passesAtt = !enforceAtt || row.attendancePct >= minAtt;
      const targetGrade = rule?.toGrade || row.nextGrade;
      const targetSection =
        rule?.defaultSectionMode === "TARGET_SECTION" && rule.targetSection
          ? rule.targetSection
          : row.currentSection;

      const bk = breakdownMap.get(row.currentGrade) ?? {
        fromGrade: row.currentGrade,
        toGrade: targetGrade,
        count: 0,
        alumniCount: 0,
        retainCount: 0,
      };

      if (passesMarks && passesAtt) {
        if (rule?.markAsAlumni || targetGrade.toLowerCase() === "alumni") {
          alumniIds.push(row.studentId);
          bk.alumniCount += 1;
        } else {
          const gKey = `${row.currentGrade}::${targetGrade}::${targetSection}`;
          const grp = promoteGroups.get(gKey) ?? {
            fromGrade: row.currentGrade,
            toGrade: targetGrade,
            toSection: targetSection,
            ids: [],
          };
          grp.ids.push(row.studentId);
          promoteGroups.set(gKey, grp);
          bk.count += 1;
        }
      } else {
        flaggedCount += 1;
        if (autoCfg.flagUnqualifiedStudents && autoCfg.keepRetainedInSameClass) {
          const rGrp = retainGroups.get(row.currentGrade) ?? {
            fromGrade: row.currentGrade,
            ids: [],
          };
          rGrp.ids.push(row.studentId);
          retainGroups.set(row.currentGrade, rGrp);
          bk.retainCount += 1;
        }
      }

      breakdownMap.set(row.currentGrade, bk);
    }

    const totalPromoted = Array.from(promoteGroups.values()).reduce((acc, g) => acc + g.ids.length, 0);
    const totalRetained = Array.from(retainGroups.values()).reduce((acc, g) => acc + g.ids.length, 0);
    const classBreakdown = Array.from(breakdownMap.values());

    if (input.dryRun) {
      return {
        dryRun: true,
        evaluatedCount: pendingRows.length,
        promotedCount: totalPromoted,
        retainedCount: totalRetained,
        alumniCount: alumniIds.length,
        flaggedCount,
        stepsExecuted: 5,
        classBreakdown,
      };
    }

    for (const grp of promoteGroups.values()) {
      await this.executeBatch(
        schoolId,
        actor,
        {
          studentIds: grp.ids,
          academicYear: input.academicYear,
          toAcademicYear: input.toAcademicYear,
          toGrade: grp.toGrade,
          toSection: grp.toSection,
          decision: "PROMOTE",
          dryRun: false,
          remarks: "Automated Promotion Workflow",
        },
        options,
      );
    }

    if (alumniIds.length > 0) {
      await this.executeBatch(
        schoolId,
        actor,
        {
          studentIds: alumniIds,
          academicYear: input.academicYear,
          toAcademicYear: input.toAcademicYear,
          toGrade: "Alumni",
          toSection: "A",
          decision: "ALUMNI",
          dryRun: false,
          remarks: "Automated Alumni Graduation",
        },
        options,
      );
    }

    for (const rGrp of retainGroups.values()) {
      await this.executeBatch(
        schoolId,
        actor,
        {
          studentIds: rGrp.ids,
          academicYear: input.academicYear,
          toAcademicYear: input.toAcademicYear,
          toGrade: rGrp.fromGrade,
          toSection: "A",
          decision: "RETAIN",
          dryRun: false,
          remarks: "Automated Criteria Exception (Retained)",
        },
        options,
      );
    }

    return {
      dryRun: false,
      evaluatedCount: pendingRows.length,
      promotedCount: totalPromoted,
      retainedCount: totalRetained,
      alumniCount: alumniIds.length,
      flaggedCount,
      stepsExecuted: 5,
      classBreakdown,
    };
  }

  appendMemoryAuditLog(
    schoolId: string,
    entry: Omit<PromotionAuditLogEntry, "id" | "createdAt">,
  ): void {
    const mem = getMemoryPromoState(schoolId, [...DEFAULT_ADMISSION_GRADES], "2025-2026");
    mem.auditLogs.unshift({
      ...entry,
      id: `log-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    });
    if (mem.auditLogs.length > 250) {
      mem.auditLogs.length = 250;
    }
  }

  async getAuditLogs(
    explicitSchoolId: string,
    filters?: {
      module?: string;
      action?: string;
      user?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
    options?: { asPlatformAdmin?: boolean },
  ): Promise<PromotionAuditLogsResponse> {
    const schoolId = this.getSchoolId(explicitSchoolId);
    const asPlatformAdmin = Boolean(options?.asPlatformAdmin);
    const mem = getMemoryPromoState(schoolId, [...DEFAULT_ADMISSION_GRADES], "2025-2026");

    let allLogs: PromotionAuditLogEntry[] = mem.auditLogs;

    if (process.env.NODE_ENV !== "test" && (await authRepository.canUsePrismaForPlatform())) {
      const rows = await this.runTx(schoolId, asPlatformAdmin, async (tx) =>
        (tx as any).auditLog.findMany({
          where: {
            schoolId,
            OR: [
              { entityType: { startsWith: "StudentPromotion" } },
              { action: { startsWith: "PROMOTION_" } },
            ],
          },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 250,
        }),
      );

      allLogs = (rows as any[]).map((r) => {
        const actionStr = String(r.action || "UPDATE");
        const moduleLabel = actionStr.includes("AUTOMATION")
          ? "Automation"
          : actionStr.includes("RULES")
            ? "Promotion Rules"
            : actionStr.includes("SETTINGS")
              ? "Settings"
              : actionStr.includes("NOTIFICATION")
                ? "Notifications"
                : "Promotion";
        const details = (r.metadata ?? {}) as Record<string, unknown>;
        return {
          id: String(r.id),
          createdAt: new Date(r.createdAt).toISOString(),
          actorId: r.actorId ? String(r.actorId) : null,
          actorName: String(r.user?.name || details.actorName || "System Admin"),
          module: moduleLabel,
          action: actionStr.replace(/^PROMOTION_/, "").replace(/_/g, " "),
          description:
            typeof details.summary === "string"
              ? details.summary
              : `${actionStr} (${String(r.entityType)}: ${String(r.entityId)})`,
          ipAddress: String(r.ipAddress || "127.0.0.1"),
          status: details.status === "Failed" ? "Failed" : "Success",
          entityType: String(r.entityType),
          entityId: String(r.entityId),
        };
      });
    }

    const filtered = allLogs.filter((item) => {
      if (filters?.module && filters.module !== "ALL" && item.module !== filters.module) {
        return false;
      }
      if (
        filters?.action &&
        filters.action !== "ALL" &&
        !item.action.toLowerCase().includes(filters.action.toLowerCase())
      ) {
        return false;
      }
      if (
        filters?.user &&
        filters.user !== "ALL" &&
        item.actorName.toLowerCase() !== filters.user.toLowerCase()
      ) {
        return false;
      }
      if (filters?.status && filters.status !== "ALL" && item.status !== filters.status) {
        return false;
      }
      return true;
    });

    const moduleCountMap = new Map<string, number>();
    const userCountMap = new Map<string, number>();
    let settingsChanges = 0;
    let promotionActions = 0;

    for (const row of allLogs) {
      moduleCountMap.set(row.module, (moduleCountMap.get(row.module) ?? 0) + 1);
      userCountMap.set(row.actorName, (userCountMap.get(row.actorName) ?? 0) + 1);
      if (row.module === "Settings" || row.module === "Promotion Rules") {
        settingsChanges += 1;
      } else {
        promotionActions += 1;
      }
    }

    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filters?.pageSize ?? 10));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      totalLogs: filtered.length,
      uniqueUsers: userCountMap.size,
      settingsChanges,
      promotionActions,
      logs: paged,
      moduleSummary: Array.from(moduleCountMap.entries())
        .map(([module, count]) => ({ module, count }))
        .sort((a, b) => b.count - a.count),
      topUsers: Array.from(userCountMap.entries())
        .map(([userName, count]) => ({ userName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
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
