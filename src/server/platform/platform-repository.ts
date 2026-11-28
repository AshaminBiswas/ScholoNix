/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { randomBytes, randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { authRepository } from "@/server/auth/auth-repository";
import { checkRedisHealth } from "@/server/integrations/redis";
import { admissionsRepository } from "@/server/school/admissions-repository";
import { getRecentInMemoryAuditEntries } from "@/server/security/audit-logger";
import {
  generateSchoolUniqueIdCandidate,
  hashPassword,
} from "@/server/security/crypto";
import { ConflictError, NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/errors";
import { platformCache } from "./platform-cache";
import {
  DEFAULT_ADMISSION_GRADES,
  createDefaultExtendedSettings,
} from "@/modules/school/admissions/types";
import {
  SAAS_PLAN_CATALOG,
  mergePlatformModuleFlags,
  type PlatformAnnouncementRecord,
  type PlatformAuditLogRecord,
  type PlatformHealthSnapshot,
  type PlatformInvoiceRecord,
  type PlatformOverviewData,
  type PlatformOverviewPeriodDays,
  type PlatformSchoolDataInspectResult,
  type PlatformSchoolEntry,
  type PlatformSchoolItem,
  type PlatformSchoolUserItem,
  type PlatformSupportTicketRecord,
  type SaaSBillingCycleValue,
  type SaaSPlanValue,
  type SaaSSubscriptionStatusValue,
  type SchoolStatusValue,
} from "@/modules/platform/types";
import type {
  CreateAnnouncementInput,
  CreatePlatformInvoiceInput,
  CreatePlatformSchoolUserInput,
  ProvisionSchoolInput,
  UpdateAnnouncementInput,
  UpdatePlatformInvoiceInput,
  UpdatePlatformSchoolInput,
  UpdatePlatformSchoolUserInput,
  UpdateSupportTicketInput,
} from "@/modules/platform/schemas";

const PLATFORM_TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PlatformFallbackStore {
  invoices: Record<string, PlatformInvoiceRecord>;
  tickets: Record<string, PlatformSupportTicketRecord>;
  announcements: Record<string, PlatformAnnouncementRecord>;
  invoiceSeq: number;
}

const platformMemoryStore: PlatformFallbackStore = {
  invoices: {},
  tickets: {},
  announcements: {},
  invoiceSeq: 1,
};

interface PlatformSchemaCaps {
  hasSchoolSaasCols: boolean;
  hasInvoicesTable: boolean;
  hasTicketsTable: boolean;
  hasAnnouncementsTable: boolean;
  hasFeeLedgers: boolean;
  hasFeePayments: boolean;
}

let cachedCaps: { value: PlatformSchemaCaps; checkedAt: number } | null = null;

async function getPlatformSchemaCaps(tx: Prisma.TransactionClient): Promise<PlatformSchemaCaps> {
  if (cachedCaps && Date.now() - cachedCaps.checkedAt < 60_000) {
    return cachedCaps.value;
  }
  try {
    const rows = (await tx.$queryRaw`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'subscription_status'
        ) AS has_school_saas_cols,
        to_regclass('public.platform_subscription_invoices') IS NOT NULL AS has_invoices_table,
        to_regclass('public.platform_support_tickets') IS NOT NULL AS has_tickets_table,
        to_regclass('public.platform_announcements') IS NOT NULL AS has_announcements_table,
        to_regclass('public.admission_fee_ledgers') IS NOT NULL AS has_fee_ledgers,
        to_regclass('public.admission_fee_payments') IS NOT NULL AS has_fee_payments
    `) as Array<Record<string, unknown>>;
    const r = rows[0] ?? {};
    const caps: PlatformSchemaCaps = {
      hasSchoolSaasCols: Boolean(r.has_school_saas_cols),
      hasInvoicesTable: Boolean(r.has_invoices_table),
      hasTicketsTable: Boolean(r.has_tickets_table),
      hasAnnouncementsTable: Boolean(r.has_announcements_table),
      hasFeeLedgers: Boolean(r.has_fee_ledgers),
      hasFeePayments: Boolean(r.has_fee_payments),
    };
    cachedCaps = { value: caps, checkedAt: Date.now() };
    return caps;
  } catch {
    return {
      hasSchoolSaasCols: false,
      hasInvoicesTable: false,
      hasTicketsTable: false,
      hasAnnouncementsTable: false,
      hasFeeLedgers: false,
      hasFeePayments: false,
    };
  }
}

async function runPlatformTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
    return fn(tx);
  }, PLATFORM_TX_OPTIONS);
}

async function runScopedTenantTx<T>(
  schoolId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!UUID_REGEX.test(schoolId)) {
    throw new ValidationError("Invalid tenant school identifier.");
  }
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
    await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
    return fn(tx);
  }, PLATFORM_TX_OPTIONS);
}

function normalizePlan(raw?: string | null): SaaSPlanValue {
  const upper = String(raw || "STARTER").trim().toUpperCase();
  if (upper === "PROFESSIONAL" || upper === "PRO") return "PROFESSIONAL";
  if (upper === "ENTERPRISE") return "ENTERPRISE";
  return "STARTER";
}

function mapSchoolItem(row: any): PlatformSchoolItem {
  const plan = normalizePlan(row.plan);
  const catalog = SAAS_PLAN_CATALOG[plan];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    uniqueId: row.uniqueId ?? null,
    code: row.code ?? null,
    category: row.category ?? null,
    affiliationBoard: row.affiliationBoard ?? null,
    contactPhone: row.contactPhone ?? null,
    contactEmail: row.contactEmail ?? null,
    website: row.website ?? null,
    addressLine: row.addressLine ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    pinCode: row.pinCode ?? null,
    country: row.country || "India",
    status: (row.status as SchoolStatusValue) || "TRIAL",
    plan,
    billingCycle: (row.billingCycle as SaaSBillingCycleValue) || "MONTHLY",
    subscriptionStatus:
      (row.subscriptionStatus as SaaSSubscriptionStatusValue) ||
      (row.status === "ACTIVE" ? "ACTIVE" : "TRIALING"),
    maxStudentsLimit: Number(row.maxStudentsLimit || catalog.defaultMaxStudents),
    maxStaffLimit: Number(row.maxStaffLimit || catalog.defaultMaxStaff),
    enabledModules: mergePlatformModuleFlags(row.enabledModules),
    suspendedReason: row.suspendedReason ?? null,
    internalNotes: row.internalNotes ?? null,
    onboardingStep: Number(row.onboardingStep ?? 1),
    onboardingDone: Boolean(row.onboardingDone),
    trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt).toISOString() : null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function getSchoolSelect(caps: PlatformSchemaCaps) {
  return {
    id: true,
    name: true,
    slug: true,
    uniqueId: true,
    code: true,
    category: true,
    affiliationBoard: true,
    contactPhone: true,
    contactEmail: true,
    website: true,
    addressLine: true,
    city: true,
    state: true,
    pinCode: true,
    country: true,
    status: true,
    onboardingStep: true,
    onboardingDone: true,
    trialEndsAt: true,
    createdAt: true,
    ...(caps.hasSchoolSaasCols
      ? {
          plan: true,
          billingCycle: true,
          subscriptionStatus: true,
          maxStudentsLimit: true,
          maxStaffLimit: true,
          enabledModules: true,
          suspendedReason: true,
          internalNotes: true,
        }
      : {}),
  };
}

function rupeesToPaise(rupees: number): number {
  return Math.max(0, Math.round(Number(rupees) * 100));
}

function mapInvoiceRow(row: any): PlatformInvoiceRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    schoolName: row.school?.name || "School",
    schoolUniqueId: row.school?.uniqueId ?? null,
    invoiceNumber: row.invoiceNumber,
    idempotencyKey: row.idempotencyKey,
    plan: normalizePlan(row.plan),
    billingCycle: (row.billingCycle as SaaSBillingCycleValue) || "MONTHLY",
    amountPaise: Number(row.amountPaise || 0),
    currency: row.currency || "INR",
    periodStart: new Date(row.periodStart).toISOString(),
    periodEnd: new Date(row.periodEnd).toISOString(),
    status: row.status,
    paymentMode: row.paymentMode ?? null,
    paymentReference: row.paymentReference ?? null,
    paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : null,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function mapTicketRow(row: any): PlatformSupportTicketRecord {
  return {
    id: row.id,
    referenceCode: row.referenceCode,
    source: row.source,
    schoolId: row.schoolId ?? null,
    userId: row.userId ?? null,
    senderName: row.senderName,
    senderEmail: row.senderEmail ?? null,
    senderPhone: row.senderPhone ?? null,
    schoolName: row.schoolName ?? null,
    role: row.role ?? null,
    category: row.category,
    subject: row.subject,
    message: row.message,
    rating: row.rating ?? null,
    sentiment: row.sentiment ?? null,
    module: row.module ?? null,
    status: row.status,
    priority: row.priority,
    resolutionNotes: row.resolutionNotes ?? null,
    resolvedAt: row.resolvedAt ? new Date(row.resolvedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapAnnouncementRow(row: any): PlatformAnnouncementRecord {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    severity: row.severity,
    targetPlan: row.targetPlan ? normalizePlan(row.targetPlan) : null,
    targetSchoolId: row.targetSchoolId ?? null,
    targetSchoolName: row.targetSchool?.name ?? null,
    isActive: Boolean(row.isActive),
    startsAt: new Date(row.startsAt).toISOString(),
    endsAt: row.endsAt ? new Date(row.endsAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function buildPeriodSignupTrend(
  schools: Array<{ createdAt: string }>,
  days: PlatformOverviewPeriodDays,
): Array<{ date: string; label: string; count: number }> {
  const now = new Date();

  if (days === 365) {
    const buckets = new Map<string, number>();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, 0);
    }
    for (const s of schools) {
      const d = new Date(s.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([key, count]) => {
      const [yr, mo] = key.split("-");
      const d = new Date(Date.UTC(Number(yr), Number(mo) - 1, 1));
      return {
        date: key,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }),
        count,
      };
    });
  }

  // Group 90 days into 15 x 6-day buckets; 7 & 30 days into daily buckets
  const bucketSize = days === 90 ? 6 : 1;
  const bucketCount = days === 90 ? 15 : days;
  const buckets: Array<{ startMs: number; endMs: number; date: string; label: string; count: number }> = [];
  const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const startUtc = endUtc - days * 86_400_000;

  for (let i = 0; i < bucketCount; i += 1) {
    const bStart = startUtc + i * bucketSize * 86_400_000;
    const bEnd = i === bucketCount - 1 ? endUtc : bStart + bucketSize * 86_400_000;
    const d = new Date(bStart);
    buckets.push({
      startMs: bStart,
      endMs: bEnd,
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" }),
      count: 0,
    });
  }

  for (const s of schools) {
    const t = Date.parse(s.createdAt);
    if (Number.isNaN(t) || t < startUtc || t >= endUtc) continue;
    const idx = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((t - startUtc) / (bucketSize * 86_400_000))),
    );
    buckets[idx]!.count += 1;
  }

  return buckets.map(({ date, label, count }) => ({ date, label, count }));
}

function calcGrowthPct(total: number, addedInPeriod: number): number {
  const baseline = total - addedInPeriod;
  if (baseline > 0) return Math.round((addedInPeriod / baseline) * 1000) / 10;
  return addedInPeriod > 0 ? 100 : 0;
}

async function querySchoolsWithTx(
  tx: Prisma.TransactionClient,
  caps: PlatformSchemaCaps,
  params?: { q?: string; status?: string; plan?: string },
): Promise<PlatformSchoolEntry[]> {
  const q = (params?.q || "").trim();
  const qUpper = q.toUpperCase();
  const qLower = q.toLowerCase();
  const statusFilter = (params?.status || "").trim().toUpperCase();
  const planFilter = (params?.plan || "").trim().toUpperCase();

  const where: any = {};
  if (q) {
    where.OR = [
      { uniqueId: { contains: qUpper, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { slug: { contains: qLower, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: qLower, mode: "insensitive" } },
      { contactPhone: { contains: q } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
    ];
  }
  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }
  if (planFilter && planFilter !== "ALL" && caps.hasSchoolSaasCols) {
    where.plan = planFilter;
  }

  const rows = (await (tx.school as any).findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      ...getSchoolSelect(caps),
      users: {
        select: {
          id: true,
          schoolId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 30,
      },
      _count: {
        select: {
          users: true,
          admissionApplications: true,
          admissionEnquiries: true,
        },
      },
    },
  })) as any[];

  const schoolIds = rows.map((r) => r.id);
  const admittedMap = new Map<string, number>();
  const staffMap = new Map<string, number>();
  const studentUsersMap = new Map<string, number>();
  const feePaidMap = new Map<string, number>();
  const saasBilledMap = new Map<string, number>();

  if (schoolIds.length > 0) {
    const admittedRows = await tx.admissionApplication.groupBy({
      by: ["schoolId"],
      where: { schoolId: { in: schoolIds }, status: "ADMITTED" },
      _count: { _all: true },
    });
    const userRoleRows = await tx.user.groupBy({
      by: ["schoolId", "role"],
      where: { schoolId: { in: schoolIds } },
      _count: { _all: true },
    });
    for (const a of admittedRows) {
      admittedMap.set(a.schoolId, a._count._all);
    }
    for (const ur of userRoleRows) {
      if (!ur.schoolId) continue;
      if (ur.role === "STUDENT") {
        studentUsersMap.set(ur.schoolId, (studentUsersMap.get(ur.schoolId) ?? 0) + ur._count._all);
      } else if (ur.role !== "PARENT") {
        staffMap.set(ur.schoolId, (staffMap.get(ur.schoolId) ?? 0) + ur._count._all);
      }
    }

    if (caps.hasFeePayments && (tx as any).admissionFeePayment) {
      const payRows = await (tx as any).admissionFeePayment.groupBy({
        by: ["schoolId"],
        where: { schoolId: { in: schoolIds } },
        _sum: { amountPaise: true },
      });
      for (const p of payRows) {
        feePaidMap.set(p.schoolId, Number(p._sum?.amountPaise || 0));
      }
    }

    if (caps.hasInvoicesTable && (tx as any).platformSubscriptionInvoice) {
      const invRows = await (tx as any).platformSubscriptionInvoice.groupBy({
        by: ["schoolId"],
        where: { schoolId: { in: schoolIds }, status: "PAID" },
        _sum: { amountPaise: true },
      });
      for (const inv of invRows) {
        saasBilledMap.set(inv.schoolId, Number(inv._sum?.amountPaise || 0));
      }
    }
  }

  return rows.map((row) => ({
    school: mapSchoolItem(row),
    users: (row.users || []).map((u: any) => ({
      id: u.id,
      schoolId: u.schoolId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      emailVerified: Boolean(u.emailVerified),
      phoneVerified: Boolean(u.phoneVerified),
      createdAt: new Date(u.createdAt).toISOString(),
    })),
    counts: {
      users: row._count?.users ?? 0,
      staffCount: staffMap.get(row.id) ?? 0,
      studentCount: Math.max(
        admittedMap.get(row.id) ?? 0,
        studentUsersMap.get(row.id) ?? 0,
      ),
      applications: row._count?.admissionApplications ?? 0,
      enquiries: row._count?.admissionEnquiries ?? 0,
      admitted: admittedMap.get(row.id) ?? 0,
      feeCollectedPaise: feePaidMap.get(row.id) ?? 0,
      saasBilledPaise: saasBilledMap.get(row.id) ?? 0,
    },
  }));
}

async function queryInvoicesWithTx(
  tx: Prisma.TransactionClient,
  caps: PlatformSchemaCaps,
  filters?: { schoolId?: string; status?: string },
): Promise<PlatformInvoiceRecord[]> {
  if (!caps.hasInvoicesTable || !(tx as any).platformSubscriptionInvoice) return [];
  const where: any = {};
  if (filters?.schoolId) where.schoolId = filters.schoolId;
  if (filters?.status && filters.status !== "ALL") where.status = filters.status;
  const rows = await (tx as any).platformSubscriptionInvoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { school: { select: { name: true, uniqueId: true } } },
  });
  return (rows as any[]).map(mapInvoiceRow);
}

async function querySupportTicketsWithTx(
  tx: Prisma.TransactionClient,
  caps: PlatformSchemaCaps,
  status?: string,
): Promise<PlatformSupportTicketRecord[]> {
  if (!caps.hasTicketsTable || !(tx as any).platformSupportTicket) {
    return Object.values(platformMemoryStore.tickets);
  }
  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  const rows = await (tx as any).platformSupportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
  });
  return (rows as any[]).map(mapTicketRow);
}

async function queryAuditLogsWithTx(
  tx: Prisma.TransactionClient,
  params?: { schoolId?: string; q?: string },
): Promise<PlatformAuditLogRecord[]> {
  const q = (params?.q || "").trim().toLowerCase();
  const where: any = {};
  if (params?.schoolId) where.schoolId = params.schoolId;
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await tx.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      school: { select: { name: true } },
      user: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    schoolId: r.schoolId,
    schoolName: r.school?.name ?? "Platform",
    actorId: r.actorId,
    actorName: r.user?.name ?? null,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    createdAt: r.createdAt.toISOString(),
  }));
}

export const platformRepository = {
  async listSchools(params?: {
    q?: string;
    status?: string;
    plan?: string;
  }): Promise<PlatformSchoolEntry[]> {
    const q = (params?.q || "").trim();
    const qLower = q.toLowerCase();
    const statusFilter = (params?.status || "").trim().toUpperCase();
    const planFilter = (params?.plan || "").trim().toUpperCase();

    const allSchools = await platformCache.getOrLoadAllSchools(async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx(async (tx) => {
          const caps = await getPlatformSchemaCaps(tx);
          return querySchoolsWithTx(tx, caps);
        });
      }

      const store = authRepository.getPlatformAuthStore();
      const entries = Object.values(store.schools).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const results: PlatformSchoolEntry[] = [];
      for (const s of entries) {
        const users = Object.values(store.users)
          .filter((u) => u.schoolId === s.id)
          .map((u) => ({
            id: u.id,
            schoolId: u.schoolId,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            emailVerified: u.emailVerified,
            phoneVerified: u.phoneVerified,
            createdAt: new Date(u.createdAt).toISOString(),
          }));
        const snapshot = await admissionsRepository.getTenantSnapshot(s.id);
        const feeCollectedPaise = (snapshot.admittedFeePayments ?? []).reduce(
          (sum, p) => sum + p.amountPaise,
          0,
        );
        const saasBilledPaise = Object.values(platformMemoryStore.invoices)
          .filter((inv) => inv.schoolId === s.id && inv.status === "PAID")
          .reduce((sum, inv) => sum + inv.amountPaise, 0);

        const admittedCount = snapshot.applications.filter((a) => a.status === "ADMITTED").length;
        const staffCount = users.filter(
          (u) => u.role !== "STUDENT" && u.role !== "PARENT",
        ).length;
        const studentUsersCount = users.filter((u) => u.role === "STUDENT").length;

        results.push({
          school: mapSchoolItem(s),
          users,
          counts: {
            users: users.length,
            staffCount,
            studentCount: Math.max(admittedCount, studentUsersCount),
            applications: snapshot.applications.length,
            enquiries: snapshot.enquiries.length,
            admitted: admittedCount,
            feeCollectedPaise,
            saasBilledPaise,
          },
        });
      }
      return results;
    });

    return allSchools.filter((entry) => {
      const s = entry.school;
      if (q) {
        const hit = [
          s.uniqueId,
          s.code,
          s.slug,
          s.name,
          s.contactEmail,
          s.contactPhone,
          s.city,
          s.state,
        ].some((f) => (f ? f.toLowerCase().includes(qLower) : false));
        if (!hit) return false;
      }
      if (statusFilter && statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (planFilter && planFilter !== "ALL" && normalizePlan(s.plan) !== planFilter) return false;
      return true;
    });
  },

  async provisionSchool(
    _actorId: string,
    input: ProvisionSchoolInput,
  ): Promise<PlatformSchoolEntry> {
    const plan = input.plan ?? "STARTER";
    const catalog = SAAS_PLAN_CATALOG[plan];
    const billingCycle = input.billingCycle ?? "MONTHLY";
    const status = input.status ?? "ACTIVE";
    const trialEndsAt =
      (input.trialDays ?? 14) > 0
        ? new Date(Date.now() + (input.trialDays ?? 14) * 86_400_000)
        : null;
    const passwordHash = await hashPassword(input.adminPassword);
    const schoolCode =
      input.code?.trim() ||
      `SNX-${randomBytes(2).toString("hex").toUpperCase()}`;
    const slug = `sc_${randomBytes(10).toString("hex")}`;
    const uniqueId = generateSchoolUniqueIdCandidate();

    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        const existingEmail = await tx.user.findFirst({
          where: { email: { equals: input.adminEmail.trim().toLowerCase(), mode: "insensitive" } },
          select: { id: true },
        });
        if (existingEmail) {
          throw new ConflictError("A user account with this email already exists.");
        }

        const schoolId = randomUUID();
        const userId = randomUUID();
        const createdSchool = await (tx.school as any).create({
          data: {
            id: schoolId,
            name: input.name.trim(),
            slug,
            uniqueId,
            code: schoolCode,
            category: input.category ?? "Co-Educational School",
            affiliationBoard: input.affiliationBoard ?? "CBSE",
            contactPhone: input.contactPhone.trim(),
            contactEmail: input.contactEmail?.trim() || null,
            website: input.website?.trim() || null,
            addressLine: input.addressLine?.trim() || "",
            city: input.city.trim(),
            state: input.state.trim(),
            pinCode: input.pinCode?.trim() || "",
            country: input.country ?? "India",
            status,
            trialEndsAt,
            onboardingDone: true,
            onboardingStep: 4,
            ...(caps.hasSchoolSaasCols
              ? {
                  plan,
                  billingCycle,
                  subscriptionStatus: status === "TRIAL" ? "TRIALING" : "ACTIVE",
                  maxStudentsLimit: catalog.defaultMaxStudents,
                  maxStaffLimit: catalog.defaultMaxStaff,
                }
              : {}),
          },
          select: getSchoolSelect(caps),
        });

        const createdUser = await tx.user.create({
          data: {
            id: userId,
            schoolId,
            name: input.adminName.trim(),
            email: input.adminEmail.trim().toLowerCase(),
            phone: input.adminPhone.trim().replace(/\s+/g, ""),
            passwordHash,
            role: input.adminRole ?? "PRINCIPAL",
            status: "ACTIVE",
            emailVerified: true,
            phoneVerified: true,
            emailVerifiedAt: new Date(),
            phoneVerifiedAt: new Date(),
          },
          select: {
            id: true,
            schoolId: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
            createdAt: true,
          },
        });

        await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
        await tx.admissionSetting.create({
          data: {
            schoolId,
            currentAcademicYear: `${new Date().getFullYear()} – ${new Date().getFullYear() + 1}`,
            applicationPrefix: "APP",
            enabledGrades: [...DEFAULT_ADMISSION_GRADES],
            extendedConfig: createDefaultExtendedSettings() as never,
          },
        });

        const createdEntry = {
          school: mapSchoolItem(createdSchool),
          users: [
            {
              ...createdUser,
              createdAt: createdUser.createdAt.toISOString(),
            },
          ],
          counts: {
            users: 1,
            applications: 0,
            enquiries: 0,
            admitted: 0,
            feeCollectedPaise: 0,
            saasBilledPaise: 0,
          },
        };
        await platformCache.invalidateSchool(createdEntry.school.id);
        return createdEntry;
      });
    }

    const store = authRepository.getPlatformAuthStore();
    const dupEmail = Object.values(store.users).some(
      (u) => u.email?.toLowerCase() === input.adminEmail.trim().toLowerCase(),
    );
    if (dupEmail) {
      throw new ConflictError("A user account with this email already exists.");
    }

    const created = await authRepository.createUserWithSchool({
      school: {
        name: input.name,
        slug,
        uniqueId,
        code: schoolCode,
        category: input.category ?? "Co-Educational School",
        affiliationBoard: input.affiliationBoard ?? "CBSE",
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail || undefined,
        website: input.website || undefined,
        addressLine: input.addressLine || "",
        city: input.city,
        state: input.state,
        pinCode: input.pinCode || "",
        country: input.country ?? "India",
        plan,
      },
      user: {
        name: input.adminName,
        email: input.adminEmail,
        phone: input.adminPhone,
        passwordHash,
        role: input.adminRole ?? "PRINCIPAL",
        emailVerified: true,
        phoneVerified: true,
      },
    });
    const storedSchool = store.schools[created.school.id];
    if (storedSchool) {
      storedSchool.status = status;
      storedSchool.plan = plan;
      storedSchool.billingCycle = billingCycle;
      storedSchool.subscriptionStatus = status === "TRIAL" ? "TRIALING" : "ACTIVE";
      storedSchool.maxStudentsLimit = catalog.defaultMaxStudents;
      storedSchool.maxStaffLimit = catalog.defaultMaxStaff;
      storedSchool.trialEndsAt = trialEndsAt;
      storedSchool.onboardingDone = true;
      storedSchool.onboardingStep = 4;
      authRepository.commitPlatformAuthStore();
    }

    authRepository.commitPlatformAuthStore();
    await platformCache.invalidateSchool(created.school.id);
    return {
      school: mapSchoolItem(storedSchool || created.school),
      users: [
        {
          id: created.user.id,
          schoolId: created.school.id,
          name: created.user.name,
          email: created.user.email,
          phone: created.user.phone,
          role: created.user.role,
          status: created.user.status,
          emailVerified: created.user.emailVerified,
          phoneVerified: created.user.phoneVerified,
          createdAt: created.user.createdAt.toISOString(),
        },
      ],
      counts: {
        users: 1,
        applications: 0,
        enquiries: 0,
        admitted: 0,
        feeCollectedPaise: 0,
        saasBilledPaise: 0,
      },
    };
  },

  async updateSchool(
    schoolId: string,
    input: UpdatePlatformSchoolInput,
  ): Promise<PlatformSchoolItem> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        const existing = await tx.school.findUnique({ where: { id: schoolId }, select: { id: true } });
        if (!existing) throw new NotFoundError("School");

        const data: Record<string, unknown> = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.code !== undefined) data.code = input.code || null;
        if (input.category !== undefined) data.category = input.category;
        if (input.affiliationBoard !== undefined) data.affiliationBoard = input.affiliationBoard;
        if (input.contactPhone !== undefined) data.contactPhone = input.contactPhone;
        if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail || null;
        if (input.website !== undefined) data.website = input.website || null;
        if (input.addressLine !== undefined) data.addressLine = input.addressLine;
        if (input.city !== undefined) data.city = input.city;
        if (input.state !== undefined) data.state = input.state;
        if (input.pinCode !== undefined) data.pinCode = input.pinCode;
        if (input.country !== undefined) data.country = input.country;
        if (input.status !== undefined) data.status = input.status;
        if (input.onboardingDone !== undefined) data.onboardingDone = input.onboardingDone;
        if (input.trialEndsAt !== undefined) {
          data.trialEndsAt = input.trialEndsAt ? new Date(input.trialEndsAt) : null;
        }
        if (caps.hasSchoolSaasCols) {
          if (input.plan !== undefined) data.plan = input.plan;
          if (input.billingCycle !== undefined) data.billingCycle = input.billingCycle;
          if (input.subscriptionStatus !== undefined) data.subscriptionStatus = input.subscriptionStatus;
          if (input.maxStudentsLimit !== undefined) data.maxStudentsLimit = input.maxStudentsLimit;
          if (input.maxStaffLimit !== undefined) data.maxStaffLimit = input.maxStaffLimit;
          if (input.enabledModules !== undefined) data.enabledModules = input.enabledModules;
          if (input.suspendedReason !== undefined) data.suspendedReason = input.suspendedReason;
          if (input.internalNotes !== undefined) data.internalNotes = input.internalNotes;
        }

        const updated = await (tx.school as any).update({
          where: { id: schoolId },
          data,
          select: getSchoolSelect(caps),
        });

        // Revoke active tenant sessions immediately if suspended/deactivated
        if (input.status === "SUSPENDED" || input.status === "INACTIVE") {
          await tx.userSession.updateMany({
            where: {
              revokedAt: null,
              user: { schoolId, role: { not: "PLATFORM_SUPER_ADMIN" } },
            },
            data: { revokedAt: new Date() },
          });
        }

        return mapSchoolItem(updated);
      }).then(async (item) => {
        await platformCache.invalidateSchool(schoolId);
        return item;
      });
    }

    const store = authRepository.getPlatformAuthStore();
    const s = store.schools[schoolId];
    if (!s) throw new NotFoundError("School");

    if (input.name !== undefined) s.name = input.name;
    if (input.code !== undefined) s.code = input.code || "";
    if (input.category !== undefined) s.category = input.category;
    if (input.affiliationBoard !== undefined) s.affiliationBoard = input.affiliationBoard;
    if (input.contactPhone !== undefined) s.contactPhone = input.contactPhone;
    if (input.contactEmail !== undefined) s.contactEmail = input.contactEmail || null;
    if (input.website !== undefined) s.website = input.website || null;
    if (input.addressLine !== undefined) s.addressLine = input.addressLine;
    if (input.city !== undefined) s.city = input.city;
    if (input.state !== undefined) s.state = input.state;
    if (input.pinCode !== undefined) s.pinCode = input.pinCode;
    if (input.country !== undefined) s.country = input.country;
    if (input.status !== undefined) s.status = input.status;
    if (input.plan !== undefined) s.plan = input.plan;
    if (input.billingCycle !== undefined) s.billingCycle = input.billingCycle;
    if (input.subscriptionStatus !== undefined) s.subscriptionStatus = input.subscriptionStatus;
    if (input.maxStudentsLimit !== undefined) s.maxStudentsLimit = input.maxStudentsLimit;
    if (input.maxStaffLimit !== undefined) s.maxStaffLimit = input.maxStaffLimit;
    if (input.enabledModules !== undefined) s.enabledModules = input.enabledModules;
    if (input.suspendedReason !== undefined) s.suspendedReason = input.suspendedReason;
    if (input.internalNotes !== undefined) s.internalNotes = input.internalNotes;
    if (input.trialEndsAt !== undefined) {
      s.trialEndsAt = input.trialEndsAt ? new Date(input.trialEndsAt) : null;
    }
    if (input.onboardingDone !== undefined) s.onboardingDone = input.onboardingDone;
    s.updatedAt = new Date();

    if (input.status === "SUSPENDED" || input.status === "INACTIVE") {
      const now = new Date();
      for (const sess of Object.values(store.sessions)) {
        const owner = store.users[sess.userId];
        if (owner && owner.schoolId === schoolId && owner.role !== "PLATFORM_SUPER_ADMIN") {
          sess.revokedAt = now;
        }
      }
    }

    authRepository.commitPlatformAuthStore();
    await platformCache.invalidateSchool(schoolId);
    return mapSchoolItem(s);
  },

  async deleteSchool(schoolId: string): Promise<void> {
    if (await authRepository.canUsePrismaForPlatform()) {
      await runPlatformTx(async (tx) => {
        const existing = await tx.school.findUnique({ where: { id: schoolId }, select: { id: true } });
        if (!existing) throw new NotFoundError("School");
        await tx.school.delete({ where: { id: schoolId } });
      });
      await platformCache.invalidateSchool(schoolId);
      return;
    }
    const store = authRepository.getPlatformAuthStore();
    if (!store.schools[schoolId]) throw new NotFoundError("School");
    delete store.schools[schoolId];
    for (const [uid, u] of Object.entries(store.users)) {
      if (u.schoolId === schoolId) delete store.users[uid];
    }
    authRepository.commitPlatformAuthStore();
    await platformCache.invalidateSchool(schoolId);
  },

  async listSchoolUsers(schoolId: string): Promise<PlatformSchoolUserItem[]> {
    return platformCache.getOrLoadSchoolUsers(schoolId, async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx(async (tx) => {
          const rows = await tx.user.findMany({
            where: { schoolId },
            orderBy: { createdAt: "asc" },
            include: {
              _count: {
                select: {
                  sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
                },
              },
            },
          });
          return rows.map((u) => ({
            id: u.id,
            schoolId: u.schoolId,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            emailVerified: u.emailVerified,
            phoneVerified: u.phoneVerified,
            activeSessionCount: u._count.sessions,
            createdAt: u.createdAt.toISOString(),
          }));
        });
      }
      const store = authRepository.getPlatformAuthStore();
      const now = Date.now();
      return Object.values(store.users)
        .filter((u) => u.schoolId === schoolId)
        .map((u) => ({
          id: u.id,
          schoolId: u.schoolId,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          emailVerified: u.emailVerified,
          phoneVerified: u.phoneVerified,
          activeSessionCount: Object.values(store.sessions).filter(
            (s) => s.userId === u.id && !s.revokedAt && new Date(s.expiresAt).getTime() > now,
          ).length,
          createdAt: new Date(u.createdAt).toISOString(),
        }));
    });
  },

  async createSchoolUser(
    schoolId: string,
    input: CreatePlatformSchoolUserInput,
  ): Promise<PlatformSchoolUserItem> {
    const passwordHash = await hashPassword(input.password);
    const normalizedPhone = input.phone.trim().replace(/\s+/g, "");
    const normalizedEmail = input.email?.trim().toLowerCase() || null;

    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const school = await tx.school.findUnique({ where: { id: schoolId }, select: { id: true } });
        if (!school) throw new NotFoundError("School");

        const existingPhone = await tx.user.findFirst({
          where: { schoolId, phone: normalizedPhone },
          select: { id: true },
        });
        if (existingPhone) {
          throw new ConflictError("A user with this phone number already exists in this school.");
        }

        const created = await tx.user.create({
          data: {
            schoolId,
            name: input.name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role: input.role ?? "STAFF",
            status: (input.status ?? "ACTIVE") as any,
            emailVerified: input.emailVerified ?? true,
            phoneVerified: input.phoneVerified ?? true,
            emailVerifiedAt: input.emailVerified ? new Date() : null,
            phoneVerifiedAt: input.phoneVerified ? new Date() : null,
          },
        });
        return {
          id: created.id,
          schoolId: created.schoolId,
          name: created.name,
          email: created.email,
          phone: created.phone,
          role: created.role,
          status: created.status,
          emailVerified: created.emailVerified,
          phoneVerified: created.phoneVerified,
          activeSessionCount: 0,
          createdAt: created.createdAt.toISOString(),
        };
      }).then(async (user) => {
        await platformCache.invalidateSchool(schoolId);
        return user;
      });
    }

    const store = authRepository.getPlatformAuthStore();
    if (!store.schools[schoolId]) throw new NotFoundError("School");
    const dupPhone = Object.values(store.users).some(
      (u) => u.schoolId === schoolId && u.phone === normalizedPhone,
    );
    if (dupPhone) {
      throw new ConflictError("A user with this phone number already exists in this school.");
    }
    const id = randomUUID();
    const now = new Date();
    store.users[id] = {
      id,
      schoolId,
      name: input.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: input.role ?? "STAFF",
      status: (input.status ?? "ACTIVE") as any,
      emailVerified: input.emailVerified ?? true,
      phoneVerified: input.phoneVerified ?? true,
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
      createdAt: now,
    };
    authRepository.commitPlatformAuthStore();
    await platformCache.invalidateSchool(schoolId);
    return {
      id,
      schoolId,
      name: store.users[id]!.name,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: store.users[id]!.role,
      status: store.users[id]!.status,
      emailVerified: store.users[id]!.emailVerified,
      phoneVerified: store.users[id]!.phoneVerified,
      activeSessionCount: 0,
      createdAt: now.toISOString(),
    };
  },

  async updateSchoolUser(
    schoolId: string,
    userId: string,
    input: UpdatePlatformSchoolUserInput,
  ): Promise<PlatformSchoolUserItem> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const user = await tx.user.findFirst({
          where: { id: userId, schoolId },
        });
        if (!user) throw new NotFoundError("School user");

        const data: Record<string, unknown> = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.role !== undefined) data.role = input.role;
        if (input.status !== undefined) data.status = input.status;
        if (input.emailVerified !== undefined) {
          data.emailVerified = input.emailVerified;
          if (input.emailVerified) data.emailVerifiedAt = new Date();
        }
        if (input.phoneVerified !== undefined) {
          data.phoneVerified = input.phoneVerified;
          if (input.phoneVerified) data.phoneVerifiedAt = new Date();
        }
        if (input.newPassword) {
          data.passwordHash = await hashPassword(input.newPassword);
        }

        const updated = await tx.user.update({
          where: { id: userId },
          data: data as any,
        });

        if (
          input.revokeSessions ||
          input.status === "SUSPENDED" ||
          input.status === "INACTIVE"
        ) {
          await tx.userSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }

        return {
          id: updated.id,
          schoolId: updated.schoolId,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          role: updated.role,
          status: updated.status,
          emailVerified: updated.emailVerified,
          phoneVerified: updated.phoneVerified,
          createdAt: updated.createdAt.toISOString(),
        };
      }).then(async (user) => {
        await platformCache.invalidateSchool(schoolId);
        return user;
      });
    }

    const store = authRepository.getPlatformAuthStore();
    const u = store.users[userId];
    if (!u || u.schoolId !== schoolId) throw new NotFoundError("School user");
    if (input.name !== undefined) u.name = input.name;
    if (input.role !== undefined) u.role = input.role;
    if (input.status !== undefined) u.status = input.status;
    if (input.emailVerified !== undefined) u.emailVerified = input.emailVerified;
    if (input.phoneVerified !== undefined) u.phoneVerified = input.phoneVerified;
    if (input.newPassword) u.passwordHash = await hashPassword(input.newPassword);

    if (
      input.revokeSessions ||
      input.status === "SUSPENDED" ||
      input.status === "INACTIVE"
    ) {
      const now = new Date();
      for (const s of Object.values(store.sessions)) {
        if (s.userId === userId && !s.revokedAt) s.revokedAt = now;
      }
    }
    authRepository.commitPlatformAuthStore();
    await platformCache.invalidateSchool(schoolId);
    return {
      id: u.id,
      schoolId: u.schoolId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      phoneVerified: u.phoneVerified,
      createdAt: new Date(u.createdAt).toISOString(),
    };
  },

  async listGlobalUsers(params?: {
    q?: string;
    role?: string;
    status?: string;
  }): Promise<PlatformSchoolUserItem[]> {
    return platformCache.getOrLoadGlobalUsers(params, async () => {
      const q = (params?.q || "").trim().toLowerCase();
      const roleFilter = (params?.role || "").trim().toUpperCase();
      const statusFilter = (params?.status || "").trim().toUpperCase();

      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx(async (tx) => {
          const where: any = {};
          if (q) {
            where.OR = [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ];
          }
          if (roleFilter && roleFilter !== "ALL") where.role = roleFilter;
          if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;

          const rows = await tx.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 150,
            include: {
              school: { select: { name: true, slug: true, uniqueId: true } },
              _count: {
                select: {
                  sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
                },
              },
            },
          });
          return rows.map((u) => ({
            id: u.id,
            schoolId: u.schoolId,
            schoolName: u.school?.name ?? "Platform",
            schoolSlug: u.school?.slug ?? null,
            schoolUniqueId: u.school?.uniqueId ?? null,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            emailVerified: u.emailVerified,
            phoneVerified: u.phoneVerified,
            activeSessionCount: u._count.sessions,
            createdAt: u.createdAt.toISOString(),
          }));
        });
      }

      const store = authRepository.getPlatformAuthStore();
      const now = Date.now();
      return Object.values(store.users)
        .filter((u) => {
          if (q) {
            const hit = [u.name, u.email, u.phone].some((f) =>
              f ? f.toLowerCase().includes(q) : false,
            );
            if (!hit) return false;
          }
          if (roleFilter && roleFilter !== "ALL" && u.role !== roleFilter) return false;
          if (statusFilter && statusFilter !== "ALL" && u.status !== statusFilter) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 150)
        .map((u) => {
          const sch = u.schoolId ? store.schools[u.schoolId] : undefined;
          return {
            id: u.id,
            schoolId: u.schoolId,
            schoolName: sch?.name ?? "Platform",
            schoolSlug: sch?.slug ?? null,
            schoolUniqueId: sch?.uniqueId ?? null,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            emailVerified: u.emailVerified,
            phoneVerified: u.phoneVerified,
            activeSessionCount: Object.values(store.sessions).filter(
              (s) => s.userId === u.id && !s.revokedAt && new Date(s.expiresAt).getTime() > now,
            ).length,
            createdAt: new Date(u.createdAt).toISOString(),
          };
        });
    });
  },

  async revokeUserSessions(userId: string): Promise<void> {
    if (await authRepository.canUsePrismaForPlatform()) {
      await runPlatformTx(async (tx) => {
        await tx.userSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      });
      await platformCache.bumpGlobalVersion();
      return;
    }
    const store = authRepository.getPlatformAuthStore();
    const now = new Date();
    for (const s of Object.values(store.sessions)) {
      if (s.userId === userId && !s.revokedAt) s.revokedAt = now;
    }
    authRepository.commitPlatformAuthStore();
    await platformCache.bumpGlobalVersion();
  },

  async inspectSchoolData(schoolId: string): Promise<PlatformSchoolDataInspectResult> {
    return platformCache.getOrLoadSchoolInspect(schoolId, async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
      return runScopedTenantTx(schoolId, async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        const [setting, apps, enqs, ledgers, payments, saasInvoices, supportTickets] =
          await Promise.all([
            tx.admissionSetting.findUnique({ where: { schoolId } }),
            tx.admissionApplication.findMany({
              where: { schoolId },
              orderBy: { createdAt: "desc" },
              take: 150,
            }),
            tx.admissionEnquiry.findMany({
              where: { schoolId },
              orderBy: { createdAt: "desc" },
              take: 150,
            }),
            caps.hasFeeLedgers && (tx as any).admissionFeeLedger
              ? (tx as any).admissionFeeLedger.findMany({
                  where: { schoolId },
                  include: { application: { select: { studentName: true } } },
                  orderBy: { updatedAt: "desc" },
                  take: 150,
                })
              : Promise.resolve([]),
            caps.hasFeePayments && (tx as any).admissionFeePayment
              ? (tx as any).admissionFeePayment.findMany({
                  where: { schoolId },
                  include: { application: { select: { studentName: true } } },
                  orderBy: { paymentDate: "desc" },
                  take: 150,
                })
              : Promise.resolve([]),
            caps.hasInvoicesTable && (tx as any).platformSubscriptionInvoice
              ? (tx as any).platformSubscriptionInvoice.findMany({
                  where: { schoolId },
                  orderBy: { createdAt: "desc" },
                  take: 100,
                  include: { school: { select: { name: true, uniqueId: true } } },
                })
              : Promise.resolve([]),
            caps.hasTicketsTable && (tx as any).platformSupportTicket
              ? (tx as any).platformSupportTicket.findMany({
                  where: { schoolId },
                  orderBy: { createdAt: "desc" },
                  take: 100,
                })
              : Promise.resolve([]),
          ]);

        const paidByApp = new Map<string, number>();
        for (const p of payments as any[]) {
          paidByApp.set(
            p.applicationId,
            (paidByApp.get(p.applicationId) ?? 0) + Number(p.amountPaise || 0),
          );
        }

        const extractParentFields = (gdRaw: unknown) => {
          const gd = (gdRaw && typeof gdRaw === "object" ? gdRaw : {}) as Record<string, any>;
          let fatherName = typeof gd.fatherName === "string" ? gd.fatherName : null;
          let fatherPhone = typeof gd.fatherPhone === "string" ? gd.fatherPhone : null;
          let motherName = typeof gd.motherName === "string" ? gd.motherName : null;
          let motherPhone = typeof gd.motherPhone === "string" ? gd.motherPhone : null;
          for (const g of [gd.primary, gd.secondary]) {
            if (!g || typeof g !== "object") continue;
            const rel = String(g.relationship || "").toLowerCase();
            if (rel.includes("father") && !fatherName) {
              fatherName = typeof g.fullName === "string" ? g.fullName : null;
              fatherPhone = typeof g.phone === "string" ? g.phone : fatherPhone;
            }
            if (rel.includes("mother") && !motherName) {
              motherName = typeof g.fullName === "string" ? g.fullName : null;
              motherPhone = typeof g.phone === "string" ? g.phone : motherPhone;
            }
          }
          return { gd, fatherName, fatherPhone, motherName, motherPhone };
        };

        return {
          schoolId,
          settings: setting ? (setting as unknown as Record<string, unknown>) : null,
          applications: apps.map((a: any) => {
            const { gd, fatherName, fatherPhone, motherName, motherPhone } =
              extractParentFields(a.guardianDetails);
            return {
              id: a.id,
              applicationCode: a.applicationCode,
              admissionNumber: a.admissionNumber,
              studentName: a.studentName,
              gender: a.gender ?? null,
              dateOfBirth: a.dateOfBirth ? new Date(a.dateOfBirth).toISOString().slice(0, 10) : null,
              bloodGroup: a.bloodGroup ?? null,
              nationality: a.nationality ?? null,
              studentIdNumber: a.studentIdNumber ?? null,
              previousSchool: a.previousSchool ?? null,
              admissionType: a.admissionType ?? null,
              gradeApplied: a.gradeApplied,
              academicYear: a.academicYear,
              guardianName: a.guardianName,
              guardianRelation: a.guardianRelation ?? null,
              guardianPhone: a.guardianPhone,
              guardianEmail: a.guardianEmail ?? null,
              fatherName,
              fatherPhone,
              motherName,
              motherPhone,
              studentDetails: a.studentDetails && typeof a.studentDetails === "object" ? a.studentDetails : null,
              guardianDetails: Object.keys(gd).length > 0 ? gd : null,
              academicDetails: a.academicDetails && typeof a.academicDetails === "object" ? a.academicDetails : null,
              documentsChecklist: Array.isArray(a.documentsChecklist) ? a.documentsChecklist : [],
              uploadedDocuments: Array.isArray(a.uploadedDocuments) ? a.uploadedDocuments : [],
              status: a.status,
              verificationStatus: a.verificationStatus,
              verificationNotes: a.verificationNotes ?? null,
              enrollmentStatus: a.enrollmentStatus || "ACTIVE",
              appliedAt: a.appliedAt.toISOString(),
              shortlistedAt: a.shortlistedAt ? a.shortlistedAt.toISOString() : null,
              verifiedAt: a.verifiedAt ? a.verifiedAt.toISOString() : null,
              admittedAt: a.admittedAt ? a.admittedAt.toISOString() : null,
              rejectedAt: a.rejectedAt ? a.rejectedAt.toISOString() : null,
            };
          }),
          enquiries: enqs.map((e) => ({
            id: e.id,
            enquiryCode: e.enquiryCode,
            studentName: e.studentName,
            guardianName: e.guardianName,
            guardianPhone: e.guardianPhone,
            gradeApplied: e.gradeApplied,
            academicYear: e.academicYear,
            source: e.source,
            status: e.status,
            createdAt: e.createdAt.toISOString(),
          })),
          feeLedgers: (ledgers as any[]).map((l) => {
            const paid = paidByApp.get(l.applicationId) ?? 0;
            const net = Math.max(0, Number(l.totalFeePaise || 0) - Number(l.concessionPaise || 0));
            return {
              id: l.id,
              applicationId: l.applicationId,
              studentName: l.application?.studentName || "Student",
              academicYear: l.academicYear,
              totalFeePaise: Number(l.totalFeePaise || 0),
              concessionPaise: Number(l.concessionPaise || 0),
              paidPaise: paid,
              outstandingPaise: Math.max(0, net - paid),
              updatedAt: new Date(l.updatedAt).toISOString(),
            };
          }),
          feePayments: (payments as any[]).map((p) => ({
            id: p.id,
            applicationId: p.applicationId,
            receiptNumber: p.receiptNumber,
            studentName: p.application?.studentName || "Student",
            feeHead: p.feeHead,
            amountPaise: Number(p.amountPaise || 0),
            paymentMode: p.paymentMode,
            paymentDate: new Date(p.paymentDate).toISOString(),
          })),
          saasInvoices: (saasInvoices as any[]).map(mapInvoiceRow),
          supportTickets: (supportTickets as any[]).map(mapTicketRow),
        };
      });
    }

    const snap = await admissionsRepository.getTenantSnapshot(schoolId);
    const appNames = new Map(snap.applications.map((a) => [a.id, a.studentName]));
    return {
      schoolId,
      settings: snap.settings as unknown as Record<string, unknown>,
      applications: snap.applications.map((a: any) => {
        const gd = (a.guardianDetails || {}) as Record<string, any>;
        let fatherName = typeof gd.fatherName === "string" ? gd.fatherName : null;
        let fatherPhone = typeof gd.fatherPhone === "string" ? gd.fatherPhone : null;
        let motherName = typeof gd.motherName === "string" ? gd.motherName : null;
        let motherPhone = typeof gd.motherPhone === "string" ? gd.motherPhone : null;
        for (const g of [gd.primary, gd.secondary]) {
          if (!g || typeof g !== "object") continue;
          const rel = String(g.relationship || "").toLowerCase();
          if (rel.includes("father") && !fatherName) {
            fatherName = typeof g.fullName === "string" ? g.fullName : null;
            fatherPhone = typeof g.phone === "string" ? g.phone : fatherPhone;
          }
          if (rel.includes("mother") && !motherName) {
            motherName = typeof g.fullName === "string" ? g.fullName : null;
            motherPhone = typeof g.phone === "string" ? g.phone : motherPhone;
          }
        }
        return {
          id: a.id,
          applicationCode: a.applicationCode,
          admissionNumber: a.admissionNumber,
          studentName: a.studentName,
          gender: a.gender ?? null,
          dateOfBirth: a.dateOfBirth ?? null,
          bloodGroup: a.bloodGroup ?? null,
          nationality: a.nationality ?? null,
          studentIdNumber: a.studentIdNumber ?? null,
          previousSchool: a.previousSchool ?? null,
          admissionType: a.admissionType ?? null,
          gradeApplied: a.gradeApplied,
          academicYear: a.academicYear,
          guardianName: a.guardianName,
          guardianRelation: a.guardianRelation ?? null,
          guardianPhone: a.guardianPhone,
          guardianEmail: a.guardianEmail ?? null,
          fatherName,
          fatherPhone,
          motherName,
          motherPhone,
          studentDetails: a.studentDetails ?? null,
          guardianDetails: a.guardianDetails ?? null,
          academicDetails: a.academicDetails ?? null,
          documentsChecklist: Array.isArray(a.documentsChecklist) ? a.documentsChecklist : [],
          uploadedDocuments: Array.isArray(a.uploadedDocuments) ? a.uploadedDocuments : [],
          status: a.status,
          verificationStatus: a.verificationStatus,
          verificationNotes: a.verificationNotes ?? null,
          enrollmentStatus: a.enrollmentStatus || "ACTIVE",
          appliedAt: a.appliedAt,
          shortlistedAt: a.shortlistedAt ?? null,
          verifiedAt: a.verifiedAt ?? null,
          admittedAt: a.admittedAt ?? null,
          rejectedAt: a.rejectedAt ?? null,
        };
      }),
      enquiries: snap.enquiries.map((e) => ({
        id: e.id,
        enquiryCode: e.enquiryCode,
        studentName: e.studentName,
        guardianName: e.guardianName,
        guardianPhone: e.guardianPhone,
        gradeApplied: e.gradeApplied,
        academicYear: e.academicYear,
        source: e.source,
        status: e.status,
        createdAt: e.createdAt,
      })),
      feeLedgers: (snap.admittedFeeLedgers ?? []).map((l) => ({
        id: l.id,
        applicationId: l.applicationId,
        studentName: appNames.get(l.applicationId) || "Student",
        academicYear: l.academicYear,
        totalFeePaise: l.totalFeePaise,
        concessionPaise: l.concessionPaise,
        paidPaise: l.paidPaise,
        outstandingPaise: l.outstandingPaise,
        updatedAt: l.updatedAt,
      })),
      feePayments: (snap.admittedFeePayments ?? []).map((p) => ({
        id: p.id,
        applicationId: p.applicationId,
        receiptNumber: p.receiptNumber,
        studentName: p.studentName || appNames.get(p.applicationId) || "Student",
        feeHead: p.feeHead,
        amountPaise: p.amountPaise,
        paymentMode: p.paymentMode,
        paymentDate: p.paymentDate,
      })),
      saasInvoices: Object.values(platformMemoryStore.invoices)
        .filter((i) => i.schoolId === schoolId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      supportTickets: Object.values(platformMemoryStore.tickets)
        .filter((t) => t.schoolId === schoolId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    };
    });
  },

  async listInvoices(filters?: {
    schoolId?: string;
    status?: string;
  }): Promise<PlatformInvoiceRecord[]> {
    return platformCache.getOrLoadInvoices(filters, async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx(async (tx) => {
          const caps = await getPlatformSchemaCaps(tx);
          return queryInvoicesWithTx(tx, caps, filters);
        });
      }

      return Object.values(platformMemoryStore.invoices)
        .filter((inv) => {
          if (filters?.schoolId && inv.schoolId !== filters.schoolId) return false;
          if (filters?.status && filters.status !== "ALL" && inv.status !== filters.status) return false;
          return true;
        })
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    });
  },

  async createInvoice(
    actorId: string,
    input: CreatePlatformInvoiceInput,
  ): Promise<PlatformInvoiceRecord> {
    const amountPaise = rupeesToPaise(input.amountRupees);
    const now = new Date();
    const yr = now.getUTCFullYear();

    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        if (!caps.hasInvoicesTable || !(tx as any).platformSubscriptionInvoice) {
          throw new ServiceUnavailableError(
            "Platform billing table is not provisioned yet. Apply platform migration first.",
          );
        }
        const existingByKey = await (tx as any).platformSubscriptionInvoice.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { school: { select: { name: true, uniqueId: true } } },
        });
        if (existingByKey) return mapInvoiceRow(existingByKey);

        const school = await tx.school.findUnique({
          where: { id: input.schoolId },
          select: { id: true, name: true, uniqueId: true },
        });
        if (!school) throw new NotFoundError("School");

        const count = await (tx as any).platformSubscriptionInvoice.count();
        const invoiceNumber = `INV-${yr}-${String(count + 1).padStart(4, "0")}`;

        const created = await (tx as any).platformSubscriptionInvoice.create({
          data: {
            schoolId: input.schoolId,
            invoiceNumber,
            idempotencyKey: input.idempotencyKey,
            plan: input.plan,
            billingCycle: input.billingCycle,
            amountPaise,
            periodStart: new Date(input.periodStart),
            periodEnd: new Date(input.periodEnd),
            status: input.status ?? "PENDING",
            paymentMode: input.paymentMode || null,
            paymentReference: input.paymentReference || null,
            paidAt: input.status === "PAID" ? now : null,
            notes: input.notes || null,
            createdByUserId: UUID_REGEX.test(actorId) ? actorId : null,
          },
          include: { school: { select: { name: true, uniqueId: true } } },
        });
        return mapInvoiceRow(created);
      }).then(async (inv) => {
        await platformCache.invalidateSchool(inv.schoolId);
        return inv;
      });
    }

    const dup = Object.values(platformMemoryStore.invoices).find(
      (i) => i.idempotencyKey === input.idempotencyKey,
    );
    if (dup) return dup;

    const store = authRepository.getPlatformAuthStore();
    const school = store.schools[input.schoolId];
    if (!school) throw new NotFoundError("School");

    const seq = platformMemoryStore.invoiceSeq++;
    const rec: PlatformInvoiceRecord = {
      id: randomUUID(),
      schoolId: input.schoolId,
      schoolName: school.name,
      schoolUniqueId: school.uniqueId ?? null,
      invoiceNumber: `INV-${yr}-${String(seq).padStart(4, "0")}`,
      idempotencyKey: input.idempotencyKey,
      plan: input.plan,
      billingCycle: input.billingCycle,
      amountPaise,
      currency: "INR",
      periodStart: new Date(input.periodStart).toISOString(),
      periodEnd: new Date(input.periodEnd).toISOString(),
      status: input.status ?? "PENDING",
      paymentMode: input.paymentMode || null,
      paymentReference: input.paymentReference || null,
      paidAt: input.status === "PAID" ? now.toISOString() : null,
      notes: input.notes || null,
      createdAt: now.toISOString(),
    };
    platformMemoryStore.invoices[rec.id] = rec;
    await platformCache.invalidateSchool(rec.schoolId);
    return rec;
  },

  async updateInvoice(input: UpdatePlatformInvoiceInput): Promise<PlatformInvoiceRecord> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        if (!caps.hasInvoicesTable || !(tx as any).platformSubscriptionInvoice) {
          throw new ServiceUnavailableError("Platform billing table is not provisioned.");
        }
        const existing = await (tx as any).platformSubscriptionInvoice.findUnique({
          where: { id: input.invoiceId },
        });
        if (!existing) throw new NotFoundError("Invoice");
        if (existing.status === "PAID" && input.status !== "VOID") {
          throw new ValidationError("Paid invoices cannot be edited silently; mark VOID if reversed.");
        }
        const updated = await (tx as any).platformSubscriptionInvoice.update({
          where: { id: input.invoiceId },
          data: {
            status: input.status,
            paymentMode: input.paymentMode || existing.paymentMode,
            paymentReference: input.paymentReference || existing.paymentReference,
            notes: input.notes !== undefined ? input.notes : existing.notes,
            paidAt: input.status === "PAID" && !existing.paidAt ? new Date() : existing.paidAt,
          },
          include: { school: { select: { name: true, uniqueId: true } } },
        });
        return mapInvoiceRow(updated);
      }).then(async (inv) => {
        await platformCache.invalidateSchool(inv.schoolId);
        return inv;
      });
    }

    const inv = platformMemoryStore.invoices[input.invoiceId];
    if (!inv) throw new NotFoundError("Invoice");
    if (inv.status === "PAID" && input.status !== "VOID") {
      throw new ValidationError("Paid invoices cannot be edited silently; mark VOID if reversed.");
    }
    inv.status = input.status;
    if (input.paymentMode !== undefined) inv.paymentMode = input.paymentMode || null;
    if (input.paymentReference !== undefined) inv.paymentReference = input.paymentReference || null;
    if (input.notes !== undefined) inv.notes = input.notes;
    if (input.status === "PAID" && !inv.paidAt) inv.paidAt = new Date().toISOString();
    await platformCache.invalidateSchool(inv.schoolId);
    return inv;
  },

  async createSupportTicket(input: {
    referenceCode: string;
    source: "CONTACT_FORM" | "FEEDBACK_FORM" | "PORTAL_SUPPORT";
    schoolId?: string | null;
    userId?: string | null;
    senderName: string;
    senderEmail?: string | null;
    senderPhone?: string | null;
    schoolName?: string | null;
    role?: string | null;
    category: string;
    subject: string;
    message: string;
    rating?: number | null;
    sentiment?: string | null;
    module?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }): Promise<PlatformSupportTicketRecord> {
    const now = new Date().toISOString();
    if (await authRepository.canUsePrismaForPlatform()) {
      try {
        return await runPlatformTx(async (tx) => {
          const caps = await getPlatformSchemaCaps(tx);
          if (!caps.hasTicketsTable || !(tx as any).platformSupportTicket) {
            throw new Error("NO_TICKETS_TABLE");
          }
          const created = await (tx as any).platformSupportTicket.create({
            data: {
              referenceCode: input.referenceCode,
              source: input.source,
              schoolId: input.schoolId && UUID_REGEX.test(input.schoolId) ? input.schoolId : null,
              userId: input.userId && UUID_REGEX.test(input.userId) ? input.userId : null,
              senderName: input.senderName,
              senderEmail: input.senderEmail || null,
              senderPhone: input.senderPhone || null,
              schoolName: input.schoolName || null,
              role: input.role || null,
              category: input.category,
              subject: input.subject,
              message: input.message,
              rating: input.rating ?? null,
              sentiment: input.sentiment || null,
              module: input.module || null,
              status: "OPEN",
              priority: input.priority ?? "MEDIUM",
            },
          });
          return mapTicketRow(created);
        }).then(async (t) => {
          if (t.schoolId) await platformCache.invalidateSchool(t.schoolId);
          else await platformCache.bumpGlobalVersion();
          return t;
        });
      } catch {
        // Fallback to memory so public contact/feedback forms never fail if migration isn't applied yet
      }
    }

    const rec: PlatformSupportTicketRecord = {
      id: randomUUID(),
      referenceCode: input.referenceCode,
      source: input.source,
      schoolId: input.schoolId ?? null,
      userId: input.userId ?? null,
      senderName: input.senderName,
      senderEmail: input.senderEmail ?? null,
      senderPhone: input.senderPhone ?? null,
      schoolName: input.schoolName ?? null,
      role: input.role ?? null,
      category: input.category,
      subject: input.subject,
      message: input.message,
      rating: input.rating ?? null,
      sentiment: input.sentiment ?? null,
      module: input.module ?? null,
      status: "OPEN",
      priority: input.priority ?? "MEDIUM",
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    platformMemoryStore.tickets[rec.id] = rec;
    await platformCache.bumpGlobalVersion();
    return rec;
  },

  async listSupportTickets(status?: string): Promise<PlatformSupportTicketRecord[]> {
    return platformCache.getOrLoadSupportTickets(status, async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx(async (tx) => {
          const caps = await getPlatformSchemaCaps(tx);
          return querySupportTicketsWithTx(tx, caps, status);
        });
      }
      return Object.values(platformMemoryStore.tickets)
        .filter((t) => (!status || status === "ALL" ? true : t.status === status))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    });
  },

  async updateSupportTicket(
    actorId: string,
    input: UpdateSupportTicketInput,
  ): Promise<PlatformSupportTicketRecord> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        if (!caps.hasTicketsTable || !(tx as any).platformSupportTicket) {
          throw new ServiceUnavailableError("Support tickets table is not provisioned.");
        }
        const existing = await (tx as any).platformSupportTicket.findUnique({
          where: { id: input.ticketId },
        });
        if (!existing) throw new NotFoundError("Support ticket");

        const isResolved = input.status === "RESOLVED" || input.status === "CLOSED";
        const updated = await (tx as any).platformSupportTicket.update({
          where: { id: input.ticketId },
          data: {
            ...(input.status ? { status: input.status } : {}),
            ...(input.priority ? { priority: input.priority } : {}),
            ...(input.resolutionNotes !== undefined
              ? { resolutionNotes: input.resolutionNotes }
              : {}),
            ...(isResolved && !existing.resolvedAt
              ? {
                  resolvedAt: new Date(),
                  resolvedByUserId: UUID_REGEX.test(actorId) ? actorId : null,
                }
              : {}),
          },
        });
        return mapTicketRow(updated);
      }).then(async (t) => {
        if (t.schoolId) await platformCache.invalidateSchool(t.schoolId);
        else await platformCache.bumpGlobalVersion();
        return t;
      });
    }

    const t = platformMemoryStore.tickets[input.ticketId];
    if (!t) throw new NotFoundError("Support ticket");
    if (input.status) t.status = input.status;
    if (input.priority) t.priority = input.priority;
    if (input.resolutionNotes !== undefined) t.resolutionNotes = input.resolutionNotes;
    if ((input.status === "RESOLVED" || input.status === "CLOSED") && !t.resolvedAt) {
      t.resolvedAt = new Date().toISOString();
    }
    t.updatedAt = new Date().toISOString();
    await platformCache.bumpGlobalVersion();
    return t;
  },

  async listAuditLogs(params?: {
    schoolId?: string;
    q?: string;
  }): Promise<PlatformAuditLogRecord[]> {
    return platformCache.getOrLoadAuditLogs(params, async () => {
      const q = (params?.q || "").trim().toLowerCase();
      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx((tx) => queryAuditLogsWithTx(tx, params));
      }

      const store = authRepository.getPlatformAuthStore();
      return getRecentInMemoryAuditEntries()
        .filter((entry) => {
          if (params?.schoolId && entry.schoolId !== params.schoolId) return false;
          if (q) {
            const hit = [entry.action, entry.entityType, entry.entityId].some((f) =>
              f.toLowerCase().includes(q),
            );
            if (!hit) return false;
          }
          return true;
        })
        .slice(0, 150)
        .map((entry) => ({
          ...entry,
          schoolName: entry.schoolId ? store.schools[entry.schoolId]?.name ?? "School" : "Platform",
          actorName: entry.actorId ? store.users[entry.actorId]?.name ?? null : null,
        }));
    });
  },

  async listAnnouncements(): Promise<PlatformAnnouncementRecord[]> {
    return platformCache.getOrLoadAnnouncements(async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        return runPlatformTx(async (tx) => {
          const caps = await getPlatformSchemaCaps(tx);
          if (!caps.hasAnnouncementsTable || !(tx as any).platformAnnouncement) return [];
          const rows = await (tx as any).platformAnnouncement.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { targetSchool: { select: { name: true } } },
          });
          return (rows as any[]).map(mapAnnouncementRow);
        });
      }
      return Object.values(platformMemoryStore.announcements).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    });
  },

  async createAnnouncement(
    actorId: string,
    input: CreateAnnouncementInput,
  ): Promise<PlatformAnnouncementRecord> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        if (!caps.hasAnnouncementsTable || !(tx as any).platformAnnouncement) {
          throw new ServiceUnavailableError("Announcements table is not provisioned.");
        }
        const created = await (tx as any).platformAnnouncement.create({
          data: {
            title: input.title,
            message: input.message,
            severity: input.severity ?? "INFO",
            targetPlan: input.targetPlan || null,
            targetSchoolId: input.targetSchoolId || null,
            isActive: input.isActive ?? true,
            endsAt: input.endsAt ? new Date(input.endsAt) : null,
            createdByUserId: UUID_REGEX.test(actorId) ? actorId : null,
          },
          include: { targetSchool: { select: { name: true } } },
        });
        return mapAnnouncementRow(created);
      }).then(async (a) => {
        await platformCache.bumpGlobalVersion();
        return a;
      });
    }

    const store = authRepository.getPlatformAuthStore();
    const targetSchoolName = input.targetSchoolId
      ? store.schools[input.targetSchoolId]?.name ?? null
      : null;
    const rec: PlatformAnnouncementRecord = {
      id: randomUUID(),
      title: input.title,
      message: input.message,
      severity: input.severity ?? "INFO",
      targetPlan: input.targetPlan || null,
      targetSchoolId: input.targetSchoolId || null,
      targetSchoolName,
      isActive: input.isActive ?? true,
      startsAt: new Date().toISOString(),
      endsAt: input.endsAt ? new Date(input.endsAt).toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    platformMemoryStore.announcements[rec.id] = rec;
    await platformCache.bumpGlobalVersion();
    return rec;
  },

  async updateAnnouncement(
    input: UpdateAnnouncementInput,
  ): Promise<PlatformAnnouncementRecord> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        if (!caps.hasAnnouncementsTable || !(tx as any).platformAnnouncement) {
          throw new ServiceUnavailableError("Announcements table is not provisioned.");
        }
        const updated = await (tx as any).platformAnnouncement.update({
          where: { id: input.announcementId },
          data: {
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.message !== undefined ? { message: input.message } : {}),
            ...(input.severity !== undefined ? { severity: input.severity } : {}),
          },
          include: { targetSchool: { select: { name: true } } },
        });
        return mapAnnouncementRow(updated);
      }).then(async (a) => {
        await platformCache.bumpGlobalVersion();
        return a;
      });
    }
    const existing = platformMemoryStore.announcements[input.announcementId];
    if (!existing) throw new NotFoundError("Announcement");
    if (input.isActive !== undefined) existing.isActive = input.isActive;
    if (input.title !== undefined) existing.title = input.title;
    if (input.message !== undefined) existing.message = input.message;
    if (input.severity !== undefined) existing.severity = input.severity;
    await platformCache.bumpGlobalVersion();
    return existing;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (await authRepository.canUsePrismaForPlatform()) {
      await runPlatformTx(async (tx) => {
        const caps = await getPlatformSchemaCaps(tx);
        if (!caps.hasAnnouncementsTable || !(tx as any).platformAnnouncement) return;
        await (tx as any).platformAnnouncement.delete({ where: { id } });
      });
      await platformCache.bumpGlobalVersion();
      return;
    }
    delete platformMemoryStore.announcements[id];
    await platformCache.bumpGlobalVersion();
  },

  async getHealthSnapshot(): Promise<PlatformHealthSnapshot> {
    return platformCache.getOrLoadHealthSnapshot(async () => {
      const start = Date.now();
      let databaseConnected = false;
      let dbLatencyMs: number | null = null;
      let platformSchemaProvisioned = false;
      let admissionsSchemaProvisioned = false;

      const redisConfigured = Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
      );

      const [dbCheckResult, redisHealth] = await Promise.all([
        (async () => {
          if (!(await authRepository.canUsePrismaForPlatform())) return;
          try {
            await runPlatformTx(async (tx) => {
              const caps = await getPlatformSchemaCaps(tx);
              platformSchemaProvisioned =
                caps.hasSchoolSaasCols &&
                caps.hasInvoicesTable &&
                caps.hasTicketsTable &&
                caps.hasAnnouncementsTable;
              admissionsSchemaProvisioned = caps.hasFeeLedgers && caps.hasFeePayments;
            });
            databaseConnected = true;
            dbLatencyMs = Date.now() - start;
          } catch {
            databaseConnected = false;
          }
        })(),
        checkRedisHealth().catch(() => null),
      ]);
      void dbCheckResult;

      const nowIso = new Date().toISOString();
      return {
        databaseConnected,
        dbLatencyMs,
        redisConfigured,
        redisLatencyMs:
          redisHealth && redisHealth.provider !== "unconfigured" ? redisHealth.latencyMs : null,
        avgApiResponseMs: Date.now() - start,
        blockedRequests24h: 0,
        lastCheckedIso: nowIso,
        platformSchemaProvisioned,
        admissionsSchemaProvisioned,
        serverTimeIso: nowIso,
        environment: process.env.NODE_ENV || "development",
      };
    });
  },

  async getOverview(periodDays: PlatformOverviewPeriodDays = 30): Promise<PlatformOverviewData> {
    const { overview } = await this.getOverviewWithSchools(periodDays);
    return overview;
  },

  async getOverviewWithSchools(periodDays: PlatformOverviewPeriodDays = 30): Promise<{
    overview: PlatformOverviewData;
    schools: PlatformSchoolEntry[];
  }> {
    return platformCache.getOrLoadOverviewWithSchools(periodDays, async () => {
      const reqStart = Date.now();
      const redisConfigured = Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
      );

    let schools: PlatformSchoolEntry[];
    let invoices: PlatformInvoiceRecord[];
    let tickets: PlatformSupportTicketRecord[];
    let auditLogs: PlatformAuditLogRecord[];
    let health: PlatformHealthSnapshot;

    if (await authRepository.canUsePrismaForPlatform()) {
      // Execute all platform overview queries on ONE transaction connection so
      // small serverless/pgbouncer pools never hit P2028 transaction pool exhaustion.
      const dbStart = Date.now();
      const [dbData, redisHealth] = await Promise.all([
        runPlatformTx(async (tx) => {
          const caps = await getPlatformSchemaCaps(tx);
          const s = await querySchoolsWithTx(tx, caps);
          const inv = await queryInvoicesWithTx(tx, caps);
          const t = await querySupportTicketsWithTx(tx, caps);
          const a = await queryAuditLogsWithTx(tx);
          return { caps, schools: s, invoices: inv, tickets: t, auditLogs: a };
        }),
        checkRedisHealth().catch(() => null),
      ]);
      const nowIso = new Date().toISOString();
      schools = dbData.schools;
      invoices = dbData.invoices;
      tickets = dbData.tickets;
      auditLogs = dbData.auditLogs;
      health = {
        databaseConnected: true,
        dbLatencyMs: Date.now() - dbStart,
        redisConfigured,
        redisLatencyMs:
          redisHealth && redisHealth.provider !== "unconfigured" ? redisHealth.latencyMs : null,
        avgApiResponseMs: Date.now() - reqStart,
        blockedRequests24h: 0,
        lastCheckedIso: nowIso,
        platformSchemaProvisioned:
          dbData.caps.hasSchoolSaasCols &&
          dbData.caps.hasInvoicesTable &&
          dbData.caps.hasTicketsTable &&
          dbData.caps.hasAnnouncementsTable,
        admissionsSchemaProvisioned:
          dbData.caps.hasFeeLedgers && dbData.caps.hasFeePayments,
        serverTimeIso: nowIso,
        environment: process.env.NODE_ENV || "development",
      };
    } else {
      schools = await this.listSchools();
      invoices = await this.listInvoices();
      tickets = await this.listSupportTickets();
      auditLogs = await this.listAuditLogs();
      health = await this.getHealthSnapshot();
    }

    const nowMs = Date.now();
    const windowStartMs = nowMs - periodDays * 86_400_000;
    const prevWindowStartMs = windowStartMs - periodDays * 86_400_000;
    const last24hMs = nowMs - 86_400_000;
    const next7DaysMs = nowMs + 7 * 86_400_000;

    const totalSchools = schools.length;
    const activeSchools = schools.filter((s) => s.school.status === "ACTIVE").length;
    const trialSchools = schools.filter((s) => s.school.status === "TRIAL").length;
    const suspendedSchools = schools.filter(
      (s) => s.school.status === "SUSPENDED" || s.school.status === "INACTIVE",
    ).length;

    const schoolsDelta = schools.filter(
      (s) => Date.parse(s.school.createdAt) >= windowStartMs,
    ).length;
    const activeSchoolsDelta = schools.filter(
      (s) => s.school.status === "ACTIVE" && Date.parse(s.school.createdAt) >= windowStartMs,
    ).length;

    const totalUsers = schools.reduce((sum, s) => sum + s.counts.users, 0);
    const totalApplications = schools.reduce((sum, s) => sum + s.counts.applications, 0);
    const totalEnquiries = schools.reduce((sum, s) => sum + s.counts.enquiries, 0);
    const totalAdmittedStudents = schools.reduce((sum, s) => sum + s.counts.admitted, 0);
    const studentFeeCollectedPaise = schools.reduce(
      (sum, s) => sum + s.counts.feeCollectedPaise,
      0,
    );

    const usersInWindow = schools.reduce(
      (sum, s) =>
        sum + s.users.filter((u) => Date.parse(u.createdAt) >= windowStartMs).length,
      0,
    );

    const mrrPaise = schools.reduce((sum, s) => {
      if (
        (s.school.status === "ACTIVE" || s.school.status === "TRIAL") &&
        s.school.subscriptionStatus !== "CANCELED"
      ) {
        const cat = SAAS_PLAN_CATALOG[s.school.plan];
        return (
          sum +
          (s.school.billingCycle === "YEARLY"
            ? cat.yearlyMonthlyEquivalentPaise
            : cat.monthlyPaise)
        );
      }
      return sum;
    }, 0);

    const newMrrPaise = schools.reduce((sum, s) => {
      if (
        Date.parse(s.school.createdAt) >= windowStartMs &&
        (s.school.status === "ACTIVE" || s.school.status === "TRIAL") &&
        s.school.subscriptionStatus !== "CANCELED"
      ) {
        const cat = SAAS_PLAN_CATALOG[s.school.plan];
        return (
          sum +
          (s.school.billingCycle === "YEARLY"
            ? cat.yearlyMonthlyEquivalentPaise
            : cat.monthlyPaise)
        );
      }
      return sum;
    }, 0);

    const saasRevenueCollectedPaise = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.amountPaise, 0);
    const saasPendingPaise = invoices
      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((sum, i) => sum + i.amountPaise, 0);

    const feePaidPeriodInvoices = invoices
      .filter(
        (i) =>
          i.status === "PAID" &&
          Date.parse(i.paidAt || i.createdAt) >= windowStartMs,
      )
      .reduce((sum, i) => sum + i.amountPaise, 0);
    const feePaidPrevInvoices = invoices
      .filter((i) => {
        const ts = Date.parse(i.paidAt || i.createdAt);
        return i.status === "PAID" && ts >= prevWindowStartMs && ts < windowStartMs;
      })
      .reduce((sum, i) => sum + i.amountPaise, 0);

    // Track period fee volume using real invoice collections + school fee collections
    const feeVolumePeriodPaise =
      studentFeeCollectedPaise > 0 ? studentFeeCollectedPaise : feePaidPeriodInvoices;
    const feeVolumeGrowthPct =
      feePaidPrevInvoices > 0
        ? Math.round(
            ((feePaidPeriodInvoices - feePaidPrevInvoices) / feePaidPrevInvoices) * 1000,
          ) / 10
        : feeVolumePeriodPaise > 0
          ? 0
          : 0;

    const openTicketsList = tickets.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
    );
    const openSupportTickets = openTicketsList.length;
    const ticketsDelta = openTicketsList.filter(
      (t) => Date.parse(t.createdAt) >= windowStartMs,
    ).length;

    const trialsExpiringNext7Days = schools.filter((s) => {
      if (s.school.status !== "TRIAL" || !s.school.trialEndsAt) return false;
      const t = Date.parse(s.school.trialEndsAt);
      return !Number.isNaN(t) && t >= nowMs - 86_400_000 && t <= next7DaysMs;
    }).length;

    const planCounts = new Map<SaaSPlanValue, number>([
      ["STARTER", 0],
      ["PROFESSIONAL", 0],
      ["ENTERPRISE", 0],
    ]);
    const subCounts = new Map<SaaSSubscriptionStatusValue, number>([
      ["ACTIVE", 0],
      ["TRIALING", 0],
      ["PAST_DUE", 0],
      ["CANCELED", 0],
    ]);
    const boardCounts = new Map<string, number>();

    for (const entry of schools) {
      planCounts.set(entry.school.plan, (planCounts.get(entry.school.plan) ?? 0) + 1);
      subCounts.set(
        entry.school.subscriptionStatus,
        (subCounts.get(entry.school.subscriptionStatus) ?? 0) + 1,
      );
      const board = entry.school.affiliationBoard || "Unspecified";
      boardCounts.set(board, (boardCounts.get(board) ?? 0) + 1);
    }

    const planBreakdown: PlatformOverviewData["planBreakdown"] = (
      ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as SaaSPlanValue[]
    ).map((plan) => {
      const count = planCounts.get(plan) ?? 0;
      return {
        plan,
        label: SAAS_PLAN_CATALOG[plan].name,
        count,
        percentage: totalSchools > 0 ? Math.round((count / totalSchools) * 1000) / 10 : 0,
      };
    });

    const subLabelMap: Record<SaaSSubscriptionStatusValue, string> = {
      ACTIVE: "Active",
      TRIALING: "Trialing",
      PAST_DUE: "Past Due",
      CANCELED: "Canceled",
    };
    const subscriptionBreakdown: NonNullable<PlatformOverviewData["subscriptionBreakdown"]> = (
      ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"] as SaaSSubscriptionStatusValue[]
    ).map((status) => {
      const count = subCounts.get(status) ?? 0;
      return {
        status,
        label: subLabelMap[status],
        count,
        percentage: totalSchools > 0 ? Math.round((count / totalSchools) * 1000) / 10 : 0,
      };
    });

    const boardBreakdown = Array.from(boardCounts.entries())
      .map(([board, count]) => ({ board, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const expiringTrials = schools
      .map((s) => s.school)
      .filter((s) => s.status === "TRIAL" && s.trialEndsAt)
      .sort((a, b) => Date.parse(a.trialEndsAt!) - Date.parse(b.trialEndsAt!))
      .slice(0, 6);

    const recentRegistrations = [...schools]
      .map((s) => s.school)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 5);

    const priorityRank: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const recentOpenTickets = [...openTicketsList]
      .sort((a, b) => {
        const diff = (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
        return diff !== 0 ? diff : Date.parse(b.createdAt) - Date.parse(a.createdAt);
      })
      .slice(0, 5);

    const blockedRequests24h = auditLogs.filter(
      (log) =>
        Date.parse(log.createdAt) >= last24hMs &&
        /DENIED|BLOCK|FAILED|RATE_LIMIT/i.test(log.action),
    ).length;

    const dailySignupTrend = buildPeriodSignupTrend(
      schools.map((s) => s.school),
      periodDays,
    );
    const monthlyTrend = buildPeriodSignupTrend(
      schools.map((s) => s.school),
      365,
    ).slice(-6);

    const mrrGrowthPct =
      mrrPaise - newMrrPaise > 0
        ? Math.round((newMrrPaise / (mrrPaise - newMrrPaise)) * 1000) / 10
        : newMrrPaise > 0
          ? 100
          : 0;

    const overview: PlatformOverviewData = {
      periodDays,
      kpis: {
        totalSchools,
        activeSchools,
        trialSchools,
        suspendedSchools,
        totalUsers,
        totalApplications,
        totalEnquiries,
        totalAdmittedStudents,
        studentFeeCollectedPaise,
        saasRevenueCollectedPaise,
        saasPendingPaise,
        openSupportTickets,
        mrrPaise,
        feeVolumePeriodPaise,
        trialsExpiringNext7Days,
        schoolsDelta,
        schoolsGrowthPct: calcGrowthPct(totalSchools, schoolsDelta),
        activeSchoolsDelta,
        activeSchoolsGrowthPct: calcGrowthPct(activeSchools, activeSchoolsDelta),
        usersDelta: usersInWindow,
        usersGrowthPct: calcGrowthPct(totalUsers, usersInWindow),
        admissionsDelta: 0,
        admissionsGrowthPct: 0,
        feeVolumeGrowthPct,
        mrrGrowthPct,
        ticketsDelta,
        ticketsGrowthPct: calcGrowthPct(openSupportTickets, ticketsDelta),
      },
      planBreakdown,
      subscriptionBreakdown,
      boardBreakdown,
      signupTrend: monthlyTrend.map(({ label, count }) => ({ label, count })),
      dailySignupTrend,
      expiringTrials,
      recentRegistrations,
      recentOpenTickets,
      recentAuditLogs: auditLogs.slice(0, 12),
      health: {
        ...health,
        avgApiResponseMs: Date.now() - reqStart,
        blockedRequests24h,
        lastCheckedIso: new Date().toISOString(),
      },
    };
    return { overview, schools };
    });
  },
};
