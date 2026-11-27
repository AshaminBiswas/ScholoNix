"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  Eye,
  Filter,
  Headphones,
  Layers,
  Megaphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import {
  SAAS_PLAN_CATALOG,
  type PlatformOverviewData,
  type PlatformOverviewPeriodDays,
  type PlatformSchoolEntry,
  type PlatformTab,
} from "@/modules/platform/types";
import {
  PlatformDonutChart,
  PlatformSignupAreaChart,
  PlatformVerticalBarChart,
} from "./platform-charts";
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

const CARD_SURFACE =
  "rounded-[18px] border border-white/80 bg-white/85 backdrop-blur-md shadow-[0_8px_24px_rgba(79,39,232,0.06)] dark:border-[#272B4D] dark:bg-[#141731]/95 dark:shadow-[0_10px_28px_rgba(3,5,18,0.45)]";

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
    upper === "TRIAL"
      ? "Trialing"
      : upper.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

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
    <div
      className={`${CARD_SURFACE} p-4 transition hover:border-[#9B76FF] dark:hover:border-[#663CF6]`}
    >
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
          <p className="mt-0.5 text-lg sm:text-xl font-black tracking-tight text-[#08093B] truncate dark:text-[#F3F5FF]">
            {value}
          </p>
          <p className={`mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold ${toneCls}`}>
            {trendTone === "positive" && <ArrowUpRight className="h-3 w-3 shrink-0" />}
            {trendTone === "danger" && <ArrowDownRight className="h-3 w-3 shrink-0" />}
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
    boardBreakdown,
    signupTrend,
    dailySignupTrend,
    recentRegistrations,
    recentOpenTickets,
    recentAuditLogs,
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
            ? "#0EA5E9"
            : item.plan === "PROFESSIONAL"
              ? "#663CF6"
              : "#10B981",
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

  const boardBars = useMemo(() => {
    if (boardBreakdown && boardBreakdown.length > 0) {
      return boardBreakdown.map((b) => ({ label: b.board, count: b.count }));
    }
    return planBreakdown.map((p) => ({ label: p.label, count: p.count }));
  }, [boardBreakdown, planBreakdown]);

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

  const quickNavTiles: Array<{
    label: string;
    tab: PlatformTab;
    icon: React.ReactNode;
  }> = [
    { label: "Schools", tab: "schools", icon: <Building2 className="h-5 w-5" /> },
    { label: "Global Users", tab: "users", icon: <Users className="h-5 w-5" /> },
    { label: "Billing", tab: "billing", icon: <CreditCard className="h-5 w-5" /> },
    { label: "Support", tab: "support", icon: <Headphones className="h-5 w-5" /> },
    { label: "Admins", tab: "admins", icon: <UserCog className="h-5 w-5" /> },
    { label: "Audit Logs", tab: "audit", icon: <Activity className="h-5 w-5" /> },
    { label: "Notices", tab: "announcements", icon: <Megaphone className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header Row with Period Selector & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Platform Overview
          </h2>
          <p className="text-xs font-medium text-[#4D5072] dark:text-[#9DA6CC]">
            Overview of ScholoNix tenant operations, schools, SaaS billing, and platform health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="inline-flex items-center gap-2 rounded-[12px] border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold text-[#08093B] shadow-xs backdrop-blur-md dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#F3F5FF]">
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
            className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(102,60,246,0.28)] hover:opacity-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Provision New School</span>
          </button>
        </div>
      </div>

      {/* Row 1: 5-Card Top KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <CommandKpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Total Schools"
          value={kpis.totalSchools.toLocaleString("en-IN")}
          trendText={`+${kpis.schoolsDelta ?? 0} (${kpis.schoolsGrowthPct ?? 0}%)`}
          trendTone={(kpis.schoolsDelta ?? 0) >= 0 ? "positive" : "neutral"}
        />
        <CommandKpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Active Schools"
          value={kpis.activeSchools.toLocaleString("en-IN")}
          trendText={`+${kpis.activeSchoolsDelta ?? 0} (${kpis.activeSchoolsGrowthPct ?? 0}%)`}
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
          icon={<CreditCard className="h-4 w-4" />}
          label="MRR (Monthly Recurring)"
          value={formatInrFromPaise(kpis.mrrPaise ?? kpis.saasRevenueCollectedPaise)}
          trendText={`+${kpis.mrrGrowthPct ?? 0}% (${formatInrFromPaise(kpis.feeVolumePeriodPaise ?? kpis.studentFeeCollectedPaise)} fees)`}
          trendTone="positive"
        />
        <CommandKpiCard
          icon={<Headphones className="h-4 w-4" />}
          label="Open Support Tickets"
          value={kpis.openSupportTickets}
          trendText={`${kpis.trialsExpiringNext7Days ?? expiringTrials.length} trials expiring soon`}
          trendTone={kpis.openSupportTickets > 0 ? "danger" : "positive"}
          accentClass={
            kpis.openSupportTickets > 0
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
          }
        />
      </div>

      {/* Row 2: 7-Tile Quick Module Shortcut Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {quickNavTiles.map((tile) => (
          <button
            key={tile.tab}
            type="button"
            onClick={() => onNavigateTab(tile.tab)}
            className={`${CARD_SURFACE} flex flex-col items-center justify-center gap-2 py-3.5 px-2 text-center transition hover:-translate-y-0.5 hover:border-[#663CF6] cursor-pointer dark:hover:border-[#8B5CF6]`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              {tile.icon}
            </span>
            <span className="text-[11px] font-extrabold text-[#08093B] truncate max-w-full dark:text-[#F3F5FF]">
              {tile.label}
            </span>
          </button>
        ))}
      </div>

      {/* Row 3: 2-Column Analytical Charts (Vertical Bars + Area Trend) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className={`${CARD_SURFACE} p-5 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Schools by Board &amp; Segment
                </h3>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  Registered school distribution by affiliation board
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("schools")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View Details →
            </button>
          </div>

          <PlatformVerticalBarChart bars={boardBars} />
        </section>

        <section className={`${CARD_SURFACE} p-5 space-y-3`}>
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
      </div>

      {/* Row 4: 2-Column Donut Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className={`${CARD_SURFACE} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Schools by Plan
                </h3>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  SaaS billed: {formatInrFromPaise(kpis.saasRevenueCollectedPaise)} · Pending:{" "}
                  {formatInrFromPaise(kpis.saasPendingPaise)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("billing")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View Details →
            </button>
          </div>

          <PlatformDonutChart
            centerValue={kpis.totalSchools}
            centerLabel="Schools"
            segments={planSegments}
          />
        </section>

        <section className={`${CARD_SURFACE} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Subscription Status
                </h3>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  {kpis.totalAdmittedStudents.toLocaleString("en-IN")} admitted students ·{" "}
                  {kpis.totalApplications.toLocaleString("en-IN")} applications
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("schools")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View Details →
            </button>
          </div>

          <PlatformDonutChart
            centerValue={kpis.totalSchools}
            centerLabel="Schools"
            segments={subSegments}
          />
        </section>
      </div>

      {/* Row 5: Recent Support Tickets & Registrations + 6-Tile Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className={`lg:col-span-7 ${CARD_SURFACE} p-5 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
              <Headphones className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <span>Open Support Tickets &amp; Recent Signups</span>
            </h3>
            <button
              type="button"
              onClick={() =>
                onNavigateTab(recentOpenTickets && recentOpenTickets.length > 0 ? "support" : "schools")
              }
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2">
            {recentOpenTickets &&
              recentOpenTickets.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onNavigateTab("support")}
                  className="w-full flex items-center justify-between gap-3 rounded-[12px] border border-[#EEF1FA] bg-[#FAF8FE]/80 px-3 py-2 text-left hover:border-[#663CF6] transition cursor-pointer dark:border-[#232746] dark:bg-[#10142C]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-[10px] font-black text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      TK
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {t.referenceCode}
                      </p>
                      <p className="text-[11px] text-[#4D5072] truncate dark:text-[#9DA6CC]">
                        {t.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      {formatDateShort(t.createdAt)}
                    </span>
                    <PriorityPill priority={t.priority} />
                  </div>
                </button>
              ))}

            {displayedRecentSchools.slice(0, recentOpenTickets?.length ? 2 : 5).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSchool(s.id)}
                className="w-full flex items-center justify-between gap-3 rounded-[12px] border border-[#EEF1FA] bg-[#FAF8FE]/80 px-3 py-2 text-left hover:border-[#663CF6] transition cursor-pointer dark:border-[#232746] dark:bg-[#10142C]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E6F4FE] text-[10px] font-black text-[#0284C7] dark:bg-[#10243D] dark:text-[#38BDF8]">
                    SC
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

            {(!recentOpenTickets || recentOpenTickets.length === 0) &&
              displayedRecentSchools.length === 0 && (
                <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  No schools or open tickets yet.
                </p>
              )}
          </div>
        </section>

        <section className={`lg:col-span-5 ${CARD_SURFACE} p-5 space-y-3`}>
          <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
            <Zap className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
            <span>Quick Actions</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onOpenProvision}
              className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/85 p-3.5 text-center transition hover:border-[#663CF6] hover:bg-white cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
            >
              <Plus className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
              <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Add School
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("billing")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/85 p-3.5 text-center transition hover:border-[#663CF6] hover:bg-white cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
            >
              <CreditCard className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
              <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Create Invoice
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("admins")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/85 p-3.5 text-center transition hover:border-[#663CF6] hover:bg-white cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
            >
              <UserCog className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
              <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Add Admin
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("announcements")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/85 p-3.5 text-center transition hover:border-[#663CF6] hover:bg-white cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
            >
              <Megaphone className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
              <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Post Notice
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/85 p-3.5 text-center transition hover:border-[#663CF6] hover:bg-white cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
            >
              <Users className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
              <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Global Users
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("settings")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/85 p-3.5 text-center transition hover:border-[#663CF6] hover:bg-white cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
            >
              <ShieldCheck className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
              <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Security &amp; 2FA
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Row 6: Recent Activities + System Health & Trial Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className={`${CARD_SURFACE} p-5 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
              <Bell className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <span>Recent Activities</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("audit")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View All →
            </button>
          </div>

          {!recentAuditLogs || recentAuditLogs.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No audit events recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentAuditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#EEF1FA] bg-[#FAF8FE]/70 px-3 py-2 text-xs dark:border-[#232746] dark:bg-[#10142C]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-[#663CF6] shrink-0 dark:bg-[#A78BFA]" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-[#76799C] truncate dark:text-[#9DA6CC]">
                        {log.schoolName || "Platform"} · {log.entityType}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                    {formatDateShort(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`${CARD_SURFACE} p-5 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                System Health &amp; Trial Notices
              </h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
                  health.databaseConnected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {health.databaseConnected ? "All Systems Operational" : "Fallback Mode"}
              </span>
            </div>
            <button
              type="button"
              onClick={onRefreshOverview}
              aria-label="Refresh system health"
              className="rounded-lg border border-[#CAD0EB] p-1.5 text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#B4BDD9]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE]/80 p-3 flex items-center gap-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
              <Database className="h-4 w-4 text-[#663CF6] shrink-0 dark:text-[#CBB8FF]" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  Database
                </p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {health.databaseConnected ? `Operational · ${health.dbLatencyMs ?? 0}ms` : "Fallback"}
                </p>
              </div>
            </div>
            <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE]/80 p-3 flex items-center gap-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
              <Layers className="h-4 w-4 text-[#663CF6] shrink-0 dark:text-[#CBB8FF]" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  Cache (Redis)
                </p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {health.redisConfigured
                    ? `Operational · ${health.redisLatencyMs ?? 0}ms`
                    : "Memory Fallback"}
                </p>
              </div>
            </div>
            <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE]/80 p-3 flex items-center gap-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
              <Server className="h-4 w-4 text-[#663CF6] shrink-0 dark:text-[#CBB8FF]" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  API Services
                </p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {health.avgApiResponseMs ?? 0}ms ({health.environment})
                </p>
              </div>
            </div>
            <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE]/80 p-3 flex items-center gap-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
              <Activity className="h-4 w-4 text-[#663CF6] shrink-0 dark:text-[#CBB8FF]" />
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  Rate Limiting
                </p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Blocked (24h): {health.blockedRequests24h ?? 0}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Last checked: {formatDateTime(health.lastCheckedIso || health.serverTimeIso)}
          </p>

          {!health.platformSchemaProvisioned && (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200">
              <strong>Note:</strong> Apply{" "}
              <code className="font-mono font-bold">20261127110000_company_admin_platform</code>{" "}
              migration in Supabase SQL Editor.
            </div>
          )}
        </section>
      </div>

      {/* Schools Quick Directory Table */}
      <section className={`${CARD_SURFACE} p-5 space-y-3.5`}>
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
                className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
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
    </div>
  );
}
