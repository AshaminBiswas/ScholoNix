"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  Eye,
  Filter,
  GraduationCap,
  Headphones,
  Layers,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  SAAS_PLAN_CATALOG,
  type PlatformOverviewData,
  type PlatformOverviewPeriodDays,
  type PlatformSchoolEntry,
  type PlatformTab,
} from "@/modules/platform/types";
import { PlatformDonutChart, PlatformSignupAreaChart } from "./platform-charts";
import {
  PlanBadge,
  exportRowsToCsv,
  formatDateShort,
  formatDateTime,
  formatInrFromPaise,
} from "./platform-shared";

const PERIOD_LABELS: Record<PlatformOverviewPeriodDays, string> = {
  7: "Last 7 Days",
  30: "Last 30 Days",
  90: "Last 90 Days",
  365: "Last 12 Months",
};

function PriorityPill({ priority }: { priority: string }) {
  const upper = priority.toUpperCase();
  const cls =
    upper === "URGENT" || upper === "HIGH"
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70"
      : upper === "MEDIUM"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70"
        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70";
  const label = upper.charAt(0) + upper.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${cls}`}
    >
      {label}
    </span>
  );
}

function StatusDotPill({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const dotCls =
    upper === "ACTIVE"
      ? "bg-emerald-500"
      : upper === "TRIAL" || upper === "TRIALING"
        ? "bg-sky-500"
        : upper === "PAST_DUE" || upper === "SUSPENDED"
          ? "bg-amber-500"
          : "bg-rose-500";
  const boxCls =
    upper === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70"
      : upper === "TRIAL" || upper === "TRIALING"
        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70"
        : upper === "PAST_DUE" || upper === "SUSPENDED"
          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70"
          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70";
  const label =
    upper === "TRIAL" ? "Trialing" : upper.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${boxCls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
      <span>{label}</span>
    </span>
  );
}

function CommandKpiCard({
  icon,
  label,
  value,
  trendText,
  trendTone = "positive",
  accentClass = "bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trendText: string;
  trendTone?: "positive" | "warning" | "danger" | "neutral";
  accentClass?: string;
}) {
  const toneCls =
    trendTone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : trendTone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : trendTone === "danger"
          ? "text-rose-600 dark:text-rose-400"
          : "text-[#4D5072] dark:text-[#9DA6CC]";

  return (
    <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-4 shadow-xs transition hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#141731] dark:hover:border-[#663CF6]">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${accentClass}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#9DA6CC]">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-black tracking-tight text-[#08093B] truncate dark:text-[#F3F5FF]">
            {value}
          </p>
          <p className={`mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold ${toneCls}`}>
            {trendTone === "positive" && <ArrowUpRight className="h-3 w-3" />}
            {trendTone === "danger" && <ArrowDownRight className="h-3 w-3" />}
            <span className="truncate">{trendText}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function PlatformOverviewTab({
  overview,
  schools,
  periodDays,
  loadingPeriod,
  onChangePeriod,
  onRefreshOverview,
  onSelectSchool,
  onNavigateTab,
  onOpenProvision,
}: {
  overview: PlatformOverviewData;
  schools: PlatformSchoolEntry[];
  periodDays: PlatformOverviewPeriodDays;
  loadingPeriod: boolean;
  onChangePeriod: (days: PlatformOverviewPeriodDays) => void;
  onRefreshOverview: () => void;
  onSelectSchool: (schoolId: string) => void;
  onNavigateTab: (tab: PlatformTab) => void;
  onOpenProvision: () => void;
}) {
  const {
    kpis,
    planBreakdown,
    subscriptionBreakdown,
    signupTrend,
    dailySignupTrend,
    recentRegistrations,
    recentOpenTickets,
    expiringTrials,
    health,
  } = overview;

  const [dirSearch, setDirSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  const periodLabel = PERIOD_LABELS[periodDays];

  const planSegments = useMemo(
    () =>
      planBreakdown.map((item) => ({
        key: item.plan,
        label: item.label,
        count: item.count,
        percentage: item.percentage,
        color:
          item.plan === "STARTER"
            ? "#663CF6"
            : item.plan === "PROFESSIONAL"
              ? "#8B5CF6"
              : "#C4B5FD",
      })),
    [planBreakdown],
  );

  const subSegments = useMemo(() => {
    const src =
      subscriptionBreakdown && subscriptionBreakdown.length > 0
        ? subscriptionBreakdown
        : [
            {
              status: "ACTIVE",
              label: "Active",
              count: kpis.activeSchools,
              percentage:
                kpis.totalSchools > 0
                  ? Math.round((kpis.activeSchools / kpis.totalSchools) * 1000) / 10
                  : 0,
            },
            {
              status: "TRIALING",
              label: "Trialing",
              count: kpis.trialSchools,
              percentage:
                kpis.totalSchools > 0
                  ? Math.round((kpis.trialSchools / kpis.totalSchools) * 1000) / 10
                  : 0,
            },
            { status: "PAST_DUE", label: "Past Due", count: 0, percentage: 0 },
            {
              status: "CANCELED",
              label: "Canceled",
              count: kpis.suspendedSchools,
              percentage:
                kpis.totalSchools > 0
                  ? Math.round((kpis.suspendedSchools / kpis.totalSchools) * 1000) / 10
                  : 0,
            },
          ];

    return src.map((item) => ({
      key: item.status,
      label: item.label,
      count: item.count,
      percentage: item.percentage,
      color:
        item.status === "ACTIVE"
          ? "#10B981"
          : item.status === "TRIALING"
            ? "#0EA5E9"
            : item.status === "PAST_DUE"
              ? "#F59E0B"
              : "#EF4444",
    }));
  }, [kpis.activeSchools, kpis.suspendedSchools, kpis.totalSchools, kpis.trialSchools, subscriptionBreakdown]);

  const displayedRecentSchools = useMemo(() => {
    if (recentRegistrations && recentRegistrations.length > 0) return recentRegistrations;
    return [...schools]
      .map((s) => s.school)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 5);
  }, [recentRegistrations, schools]);

  const filteredDirectorySchools = useMemo(() => {
    const q = dirSearch.trim().toLowerCase();
    return schools.filter((entry) => {
      if (statusFilter !== "ALL" && entry.school.status.toUpperCase() !== statusFilter) {
        return false;
      }
      if (planFilter !== "ALL" && entry.school.plan !== planFilter) {
        return false;
      }
      if (!q) return true;
      return [
        entry.school.name,
        entry.school.uniqueId,
        entry.school.slug,
        entry.school.city,
        entry.school.contactEmail,
      ].some((f) => (f ? f.toLowerCase().includes(q) : false));
    });
  }, [dirSearch, planFilter, schools, statusFilter]);

  const handleExportQuickSchools = () => {
    exportRowsToCsv(
      "scholonix-schools-overview.csv",
      ["SNX ID", "School Name", "Plan", "Status", "Students", "Staff", "Trial End"],
      filteredDirectorySchools.map((entry) => [
        entry.school.uniqueId || entry.school.slug,
        entry.school.name,
        SAAS_PLAN_CATALOG[entry.school.plan]?.name || entry.school.plan,
        entry.school.status,
        entry.counts.studentCount ?? entry.counts.admitted,
        entry.counts.staffCount ?? entry.counts.users,
        entry.school.trialEndsAt ? formatDateShort(entry.school.trialEndsAt) : "",
      ]),
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Row with Period Selector & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Platform Overview
          </h2>
          <p className="text-xs font-medium text-[#4D5072] dark:text-[#9DA6CC]">
            Company Super-Admin Command Center — Monitor, manage, and grow the ScholoNix SaaS platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="inline-flex items-center gap-2 rounded-[12px] border border-[#D6DBF0] bg-white px-3 py-2 text-xs font-bold text-[#08093B] shadow-xs dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#F3F5FF]">
            <Calendar className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
            <select
              aria-label="Overview timeframe"
              value={periodDays}
              disabled={loadingPeriod}
              onChange={(e) =>
                onChangePeriod(Number(e.target.value) as PlatformOverviewPeriodDays)
              }
              className="bg-transparent font-bold focus:outline-none cursor-pointer dark:bg-[#141731]"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={365}>Last 12 Months</option>
            </select>
          </label>

          <button
            type="button"
            onClick={onOpenProvision}
            className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Provision New School</span>
          </button>
        </div>
      </div>

      {/* 8-Card Command KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <CommandKpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Total Schools"
          value={kpis.totalSchools.toLocaleString("en-IN")}
          trendText={`+${kpis.schoolsDelta ?? 0} (${kpis.schoolsGrowthPct ?? 0}%) vs prev`}
          trendTone={(kpis.schoolsDelta ?? 0) >= 0 ? "positive" : "neutral"}
        />
        <CommandKpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Active Schools"
          value={kpis.activeSchools.toLocaleString("en-IN")}
          trendText={`+${kpis.activeSchoolsDelta ?? 0} (${kpis.activeSchoolsGrowthPct ?? 0}%) active`}
          trendTone="positive"
        />
        <CommandKpiCard
          icon={<Users className="h-4 w-4" />}
          label="Total Users"
          value={kpis.totalUsers.toLocaleString("en-IN")}
          trendText={`+${(kpis.usersDelta ?? 0).toLocaleString("en-IN")} (${kpis.usersGrowthPct ?? 0}%)`}
          trendTone="positive"
        />
        <CommandKpiCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Total Admissions"
          value={kpis.totalAdmittedStudents.toLocaleString("en-IN")}
          trendText={`${kpis.totalApplications} apps · ${kpis.totalEnquiries} enquiries`}
          trendTone="neutral"
        />

        <CommandKpiCard
          icon={<CreditCard className="h-4 w-4" />}
          label={`Fee Volume (${periodLabel})`}
          value={formatInrFromPaise(
            kpis.feeVolumePeriodPaise ?? kpis.studentFeeCollectedPaise,
          )}
          trendText={`${(kpis.feeVolumeGrowthPct ?? 0) >= 0 ? "+" : ""}${kpis.feeVolumeGrowthPct ?? 0}% vs prev period`}
          trendTone={(kpis.feeVolumeGrowthPct ?? 0) >= 0 ? "positive" : "warning"}
        />
        <CommandKpiCard
          icon={<Layers className="h-4 w-4" />}
          label="MRR (Monthly Recurring)"
          value={formatInrFromPaise(kpis.mrrPaise ?? kpis.saasRevenueCollectedPaise)}
          trendText={`+${kpis.mrrGrowthPct ?? 0}% (${formatInrFromPaise(kpis.saasRevenueCollectedPaise)} billed)`}
          trendTone="positive"
        />
        <CommandKpiCard
          icon={<Calendar className="h-4 w-4" />}
          label="Trials Expiring Soon"
          value={kpis.trialsExpiringNext7Days ?? expiringTrials.length}
          trendText="Next 7 days"
          trendTone="warning"
          accentClass="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300"
        />
        <CommandKpiCard
          icon={<Headphones className="h-4 w-4" />}
          label="Open Support Tickets"
          value={kpis.openSupportTickets}
          trendText={`+${kpis.ticketsDelta ?? 0} (${kpis.ticketsGrowthPct ?? 0}%) in period`}
          trendTone={kpis.openSupportTickets > 0 ? "danger" : "positive"}
          accentClass={
            kpis.openSupportTickets > 0
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
          }
        />
      </div>

      {/* Charts Row 1: New School Signups + Schools by Plan */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className="xl:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  New School Signups
                </h3>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  Tenant registrations across {periodLabel.toLowerCase()}
                </p>
              </div>
            </div>

            <span className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-1 text-[11px] font-bold text-[#4D5072] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#B4BDD9]">
              {periodLabel}
            </span>
          </div>

          <PlatformSignupAreaChart
            points={
              dailySignupTrend && dailySignupTrend.length > 0 ? dailySignupTrend : signupTrend
            }
          />
        </section>

        <section className="xl:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <Layers className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Schools by Plan
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("billing")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              Billing →
            </button>
          </div>

          <div className="pt-2">
            <PlatformDonutChart
              centerValue={kpis.totalSchools}
              centerLabel="Schools"
              segments={planSegments}
            />
          </div>
        </section>
      </div>

      {/* Row 2: Recent School Registrations + Subscription Status + Open Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent School Registrations */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
              <Building2 className="h-4 w-4 text-[#663CF6]" />
              <span>Recent School Registrations</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("schools")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View All →
            </button>
          </div>

          {displayedRecentSchools.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No schools registered yet.
            </p>
          ) : (
            <div className="space-y-2">
              {displayedRecentSchools.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSchool(s.id)}
                  className="w-full flex items-center justify-between gap-2 rounded-[12px] border border-[#EEF1FA] bg-[#FAF8FE]/70 px-3 py-2 text-left hover:border-[#663CF6] transition cursor-pointer dark:border-[#232746] dark:bg-[#10142C]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      <Building2 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {s.name}
                      </p>
                      <p className="text-[10px] font-semibold text-[#76799C] truncate dark:text-[#9DA6CC]">
                        {s.uniqueId || s.slug} · {SAAS_PLAN_CATALOG[s.plan]?.name || s.plan}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      {formatDateShort(s.createdAt)}
                    </span>
                    <StatusDotPill status={s.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Subscription Status Donut */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#663CF6]" />
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Subscription Status
            </h3>
          </div>
          <div className="pt-1">
            <PlatformDonutChart
              centerValue={kpis.totalSchools}
              centerLabel="Schools"
              segments={subSegments}
            />
          </div>
        </section>

        {/* Open Support Tickets */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
              <Headphones className="h-4 w-4 text-[#663CF6]" />
              <span>Open Support Tickets</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("support")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View All →
            </button>
          </div>

          {!recentOpenTickets || recentOpenTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DFE3F5] p-6 text-center text-xs text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
              All support &amp; feedback queues are clear.
            </div>
          ) : (
            <div className="space-y-2">
              {recentOpenTickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onNavigateTab("support")}
                  className="w-full flex items-center justify-between gap-2 rounded-[12px] border border-[#EEF1FA] bg-[#FAF8FE]/70 px-3 py-2 text-left hover:border-[#663CF6] transition cursor-pointer dark:border-[#232746] dark:bg-[#10142C]"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                      {t.referenceCode}
                    </p>
                    <p className="text-[11px] text-[#4D5072] truncate dark:text-[#9DA6CC]">
                      {t.subject}
                    </p>
                  </div>
                  <PriorityPill priority={t.priority} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Schools Quick Directory Table */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Building2 className="h-4 w-4" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Schools ({filteredDirectorySchools.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
              <input
                type="search"
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                placeholder="Search by school name or SNX ID..."
                aria-label="Quick filter schools"
                className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] pl-8 pr-3 py-1.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleExportQuickSchools}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <select
              aria-label="Filter schools by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-bold dark:border-[#343B6B] dark:bg-[#141731]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              aria-label="Filter schools by plan"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-bold dark:border-[#343B6B] dark:bg-[#141731]"
            >
              <option value="ALL">All Plans</option>
              <option value="STARTER">Starter</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            {(statusFilter !== "ALL" || planFilter !== "ALL" || dirSearch) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPlanFilter("ALL");
                  setDirSearch("");
                }}
                className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {filteredDirectorySchools.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
            No registered schools match the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">School Name</th>
                  <th className="px-3 py-2.5">SNX ID</th>
                  <th className="px-3 py-2.5">Plan</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Students</th>
                  <th className="px-3 py-2.5 text-right">Staff</th>
                  <th className="px-3 py-2.5">Trial End</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {filteredDirectorySchools.slice(0, 8).map((entry, idx) => (
                  <tr
                    key={entry.school.id}
                    className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]"
                  >
                    <td className="px-3 py-2.5 font-bold text-[#76799C] dark:text-[#9DA6CC]">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      {entry.school.name}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                      {entry.school.uniqueId || entry.school.slug}
                    </td>
                    <td className="px-3 py-2.5">
                      <PlanBadge plan={entry.school.plan} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusDotPill status={entry.school.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      {(entry.counts.studentCount ?? entry.counts.admitted).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      {(entry.counts.staffCount ?? entry.counts.users).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-[#76799C] dark:text-[#9DA6CC]">
                      {entry.school.status === "TRIAL" && entry.school.trialEndsAt
                        ? formatDateShort(entry.school.trialEndsAt)
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => onSelectSchool(entry.school.id)}
                        title="Inspect school data & settings"
                        aria-label={`Inspect ${entry.school.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#CAD0EB] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectSchool(entry.school.id)}
                        title="Manage school"
                        aria-label={`Manage ${entry.school.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#CAD0EB] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredDirectorySchools.length > 8 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onNavigateTab("schools")}
              className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View all {filteredDirectorySchools.length} schools →
            </button>
          </div>
        )}
      </section>

      {/* System Health Strip */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              System Health
            </h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${
                health.databaseConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {health.databaseConnected ? "All Systems Operational" : "In-Memory / Fallback Mode"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            <span>
              Last checked: {formatDateTime(health.lastCheckedIso || health.serverTimeIso)}
            </span>
            <button
              type="button"
              onClick={onRefreshOverview}
              aria-label="Refresh system health"
              className="rounded-lg border border-[#CAD0EB] p-1.5 text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#B4BDD9]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Database className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Database</p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {health.databaseConnected ? "Operational" : "Fallback Store"}
              </p>
              <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                Latency: {health.dbLatencyMs ?? 0} ms
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Layers className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Cache (Redis)
              </p>
              <p
                className={`text-[11px] font-bold ${
                  health.redisConfigured
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {health.redisConfigured ? "Operational" : "Memory Fallback"}
              </p>
              <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                {health.redisLatencyMs != null
                  ? `Latency: ${health.redisLatencyMs} ms`
                  : "Upstash env optional locally"}
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Server className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                API Services
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Operational ({health.environment})
              </p>
              <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                Avg. Response: {health.avgApiResponseMs ?? 0} ms
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Rate Limiting
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Operational
              </p>
              <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                Blocked (24h): {health.blockedRequests24h ?? 0}
              </p>
            </div>
          </div>
        </div>

        {!health.platformSchemaProvisioned && (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Database Note:</strong> Run{" "}
            <code className="font-mono font-bold">
              prisma/migrations/20261127110000_company_admin_platform/migration.sql
            </code>{" "}
            in Supabase SQL Editor to enable persistent invoices, support tickets, and announcements.
          </div>
        )}
      </section>
    </div>
  );
}
