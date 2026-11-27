"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  CalendarClock,
  CheckSquare,
  Download,
  FileText,
  FolderKanban,
  IndianRupee,
  Plus,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  SAAS_PLAN_CATALOG,
  type PlatformAdminRecord,
  type PlatformOverviewData,
  type PlatformSchoolEntry,
  type PlatformTab,
} from "@/modules/platform/types";
import { exportRowsToCsv, formatDateShort, formatInrFromPaise } from "./platform-shared";

type OpsTabKey =
  | "employees"
  | "recruitment"
  | "attendance"
  | "leaves"
  | "payroll"
  | "expenses"
  | "projects"
  | "tasks"
  | "sales"
  | "documents"
  | "reports";

interface OpsRecordItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  amountPaise?: number;
  status: string;
  createdAt: string;
}

interface OpsModuleConfig {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDesc: string;
  addLabel: string;
  titlePlaceholder: string;
  subtitlePlaceholder: string;
  categories: string[];
  statuses: string[];
  hasAmount?: boolean;
  icon: React.ReactNode;
}

const CARD_SURFACE =
  "rounded-[18px] border border-white/80 bg-white/85 backdrop-blur-md shadow-[0_8px_24px_rgba(79,39,232,0.06)] dark:border-[#272B4D] dark:bg-[#141731]/95 dark:shadow-[0_10px_28px_rgba(3,5,18,0.45)]";

const OPS_CONFIGS: Record<
  Exclude<OpsTabKey, "sales" | "reports">,
  OpsModuleConfig
> = {
  employees: {
    title: "Company Employees & Departments",
    subtitle: "Manage internal ScholoNix workforce records alongside active Company Admins.",
    emptyTitle: "No additional employee records logged in this session",
    emptyDesc: "Active platform team members appear automatically above. Add department staff records as needed.",
    addLabel: "Add Employee Record",
    titlePlaceholder: "Full name (e.g., Operations Specialist)",
    subtitlePlaceholder: "Department & role (e.g., Onboarding · Mumbai)",
    categories: ["Engineering", "Operations", "Sales", "Support", "Finance"],
    statuses: ["ACTIVE", "ONBOARDING", "ON_LEAVE"],
    icon: <Users className="h-5 w-5" />,
  },
  recruitment: {
    title: "Recruitment & Open Positions",
    subtitle: "Track company hiring requisitions, interviews, and candidate pipelines.",
    emptyTitle: "No open requisitions yet",
    emptyDesc: "Create an open position to track applicants and interview stages.",
    addLabel: "Add Job Opening",
    titlePlaceholder: "Position title (e.g., School Implementation Specialist)",
    subtitlePlaceholder: "Location & experience (e.g., Remote · 2–4 yrs)",
    categories: ["Engineering", "Customer Success", "Sales", "Support", "Marketing"],
    statuses: ["OPEN", "INTERVIEWING", "CLOSED"],
    icon: <UserPlus className="h-5 w-5" />,
  },
  attendance: {
    title: "Team Attendance & Timesheets",
    subtitle: "Monitor daily check-ins, remote work logs, and shift coverage.",
    emptyTitle: "No attendance logs recorded today",
    emptyDesc: "Log a team check-in or shift update to track daily coverage.",
    addLabel: "Log Attendance",
    titlePlaceholder: "Team member or shift label",
    subtitlePlaceholder: "Check-in window & mode (e.g., 09:30 AM · Remote)",
    categories: ["Full Day", "Remote", "Half Day", "Shift Duty"],
    statuses: ["PRESENT", "LATE", "ABSENT"],
    icon: <CalendarCheck className="h-5 w-5" />,
  },
  leaves: {
    title: "Leave & Holidays",
    subtitle: "Review company leave requests and upcoming regional holiday schedules.",
    emptyTitle: "No pending leave requests",
    emptyDesc: "New leave requests or company holidays added here stay organized by status.",
    addLabel: "Add Leave / Holiday",
    titlePlaceholder: "Leave title or holiday name",
    subtitlePlaceholder: "Date range & notes (e.g., 28–29 Mar 2026)",
    categories: ["Casual Leave", "Sick Leave", "Public Holiday", "Company Offsite"],
    statuses: ["PENDING", "APPROVED", "DECLINED"],
    icon: <CalendarClock className="h-5 w-5" />,
  },
  payroll: {
    title: "Company Payroll Runs",
    subtitle: "Prepare internal salary cycles and exact-INR disbursement summaries.",
    emptyTitle: "No payroll runs scheduled",
    emptyDesc: "Add a monthly payroll batch to track salary totals and disbursement status.",
    addLabel: "Create Payroll Batch",
    titlePlaceholder: "Payroll cycle (e.g., Monthly Payroll Batch)",
    subtitlePlaceholder: "Department or pay group",
    categories: ["Monthly Cycle", "Bonus / Incentive", "Contractor Payout"],
    statuses: ["DRAFT", "PROCESSING", "PAID"],
    hasAmount: true,
    icon: <IndianRupee className="h-5 w-5" />,
  },
  expenses: {
    title: "Expenses & Reimbursements",
    subtitle: "Track SaaS infrastructure, travel, and employee reimbursement claims.",
    emptyTitle: "No expense claims recorded",
    emptyDesc: "Submit an infrastructure or operational expense entry to monitor spend.",
    addLabel: "Add Expense",
    titlePlaceholder: "Expense item (e.g., Cloud Hosting / Travel)",
    subtitlePlaceholder: "Vendor or cost center",
    categories: ["Infrastructure", "Travel", "Marketing", "Software", "Office"],
    statuses: ["PENDING", "APPROVED", "REIMBURSED"],
    hasAmount: true,
    icon: <Receipt className="h-5 w-5" />,
  },
  projects: {
    title: "Internal Projects & Rollouts",
    subtitle: "Coordinate school onboarding rollouts, platform upgrades, and milestones.",
    emptyTitle: "No internal projects created yet",
    emptyDesc: "Add a rollout or product milestone to track owners and delivery progress.",
    addLabel: "Create Project",
    titlePlaceholder: "Project name (e.g., CBSE School Onboarding Cohort)",
    subtitlePlaceholder: "Owner & target delivery date",
    categories: ["Product", "Onboarding", "Infrastructure", "Compliance"],
    statuses: ["PLANNING", "IN_PROGRESS", "COMPLETED"],
    icon: <FolderKanban className="h-5 w-5" />,
  },
  tasks: {
    title: "Operations Tasks",
    subtitle: "Assign and monitor operational checklists across onboarding and support.",
    emptyTitle: "All caught up — zero open tasks",
    emptyDesc: "Create an operational task to assign follow-ups and deadlines.",
    addLabel: "Add Task",
    titlePlaceholder: "Task title",
    subtitlePlaceholder: "Assignee & due date",
    categories: ["Onboarding", "Billing", "Support Escalation", "Security"],
    statuses: ["TODO", "IN_PROGRESS", "DONE"],
    icon: <CheckSquare className="h-5 w-5" />,
  },
  documents: {
    title: "Company Documents & Policies",
    subtitle: "Central index for DPDP compliance policies, school MSAs, and SOPs.",
    emptyTitle: "No custom company documents indexed yet",
    emptyDesc: "Register policy docs, SLA agreements, or onboarding templates for the admin team.",
    addLabel: "Add Document Entry",
    titlePlaceholder: "Document title (e.g., School SaaS MSA v2)",
    subtitlePlaceholder: "Version & review owner",
    categories: ["Legal & MSA", "Security Policy", "SOP", "Onboarding Kit"],
    statuses: ["ACTIVE", "DRAFT", "ARCHIVED"],
    icon: <FileText className="h-5 w-5" />,
  },
};

export function PlatformCompanyOpsTab({
  tab,
  overview,
  schools,
  onNavigateTab,
  onToast,
}: {
  tab: OpsTabKey;
  overview: PlatformOverviewData;
  schools: PlatformSchoolEntry[];
  onNavigateTab: (next: PlatformTab) => void;
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [recordsByTab, setRecordsByTab] = useState<Record<string, OpsRecordItem[]>>({});
  const [admins, setAdmins] = useState<PlatformAdminRecord[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [titleInput, setTitleInput] = useState("");
  const [subtitleInput, setSubtitleInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [amountRupeesInput, setAmountRupeesInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    setTitleInput("");
    setSubtitleInput("");
    setCategoryInput("");
    setAmountRupeesInput("");
    setStatusFilter("ALL");

    if (tab === "employees") {
      setLoadingAdmins(true);
      fetch("/api/platform/admins", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.success && Array.isArray(j.admins)) setAdmins(j.admins);
        })
        .catch(() => {})
        .finally(() => setLoadingAdmins(false));
    }
  }, [tab]);

  const currentRecords = useMemo(() => recordsByTab[tab] ?? [], [recordsByTab, tab]);
  const filteredRecords = useMemo(
    () =>
      statusFilter === "ALL"
        ? currentRecords
        : currentRecords.filter((r) => r.status === statusFilter),
    [currentRecords, statusFilter],
  );

  if (tab === "sales") {
    const activeSubscriptions = schools.filter(
      (s) => s.school.subscriptionStatus === "ACTIVE",
    ).length;
    const trialingSchools = schools.filter(
      (s) => s.school.status === "TRIAL" || s.school.subscriptionStatus === "TRIALING",
    ).length;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
              Sales &amp; Client Invoicing
            </h2>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              Track SaaS conversion pipeline, active subscriptions, and client invoices across ScholoNix.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab("billing")}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-4 py-2 text-xs font-extrabold text-white shadow-xs cursor-pointer"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Open Invoices &amp; MRR</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("schools")}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
            >
              <span>Inspect Client Schools</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className={`${CARD_SURFACE} p-4`}>
            <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Monthly Recurring (MRR)</p>
            <p className="mt-1 text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
              {formatInrFromPaise(overview.kpis.mrrPaise ?? overview.kpis.saasRevenueCollectedPaise)}
            </p>
          </div>
          <div className={`${CARD_SURFACE} p-4`}>
            <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">SaaS Revenue Collected</p>
            <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatInrFromPaise(overview.kpis.saasRevenueCollectedPaise)}
            </p>
          </div>
          <div className={`${CARD_SURFACE} p-4`}>
            <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Active Paid Clients</p>
            <p className="mt-1 text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
              {activeSubscriptions}
            </p>
          </div>
          <div className={`${CARD_SURFACE} p-4`}>
            <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Trial Pipeline</p>
            <p className="mt-1 text-xl font-black text-[#663CF6] dark:text-[#CBB8FF]">
              {trialingSchools}
            </p>
          </div>
        </div>

        <section className={`${CARD_SURFACE} p-5 space-y-3`}>
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Client Subscription Pipeline ({schools.length})
          </h3>
          {schools.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No client schools registered yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] dark:bg-[#1B1F3F] dark:text-[#B4BDD9]">
                  <tr>
                    <th className="px-3 py-2.5">School</th>
                    <th className="px-3 py-2.5">Plan</th>
                    <th className="px-3 py-2.5">Billing Cycle</th>
                    <th className="px-3 py-2.5">Subscription</th>
                    <th className="px-3 py-2.5 text-right">SaaS Billed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                  {schools.map((entry) => (
                    <tr key={entry.school.id}>
                      <td className="px-3 py-2.5 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                        {entry.school.name}
                      </td>
                      <td className="px-3 py-2.5">{SAAS_PLAN_CATALOG[entry.school.plan]?.name}</td>
                      <td className="px-3 py-2.5">{entry.school.billingCycle}</td>
                      <td className="px-3 py-2.5">{entry.school.subscriptionStatus}</td>
                      <td className="px-3 py-2.5 text-right font-bold">
                        {formatInrFromPaise(entry.counts.saasBilledPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (tab === "reports") {
    const handleExportSchoolsReport = () => {
      exportRowsToCsv(
        "scholonix-client-schools-report.csv",
        ["SNX ID", "Name", "Plan", "Status", "Subscription", "Users", "Students", "SaaS Billed (INR)"],
        schools.map((s) => [
          s.school.uniqueId || s.school.slug,
          s.school.name,
          s.school.plan,
          s.school.status,
          s.school.subscriptionStatus,
          s.counts.users,
          s.counts.studentCount ?? s.counts.admitted,
          ((s.counts.saasBilledPaise || 0) / 100).toFixed(2),
        ]),
      );
      onToast("success", "Exported client schools report CSV.");
    };

    const handleExportAuditReport = () => {
      exportRowsToCsv(
        "scholonix-platform-audit-report.csv",
        ["Timestamp", "School", "Action", "Entity Type", "Entity ID"],
        (overview.recentAuditLogs ?? []).map((log) => [
          log.createdAt,
          log.schoolName || "Platform",
          log.action,
          log.entityType,
          log.entityId,
        ]),
      );
      onToast("success", "Exported recent platform audit logs CSV.");
    };

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
            Platform Reports &amp; Exports
          </h2>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Download real-time CSV snapshots of registered schools, billing KPIs, and security audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${CARD_SURFACE} p-5 space-y-3`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Client Schools Directory
            </h3>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              {schools.length} registered schools with plan tiers, user counts, and billed INR totals.
            </p>
            <button
              type="button"
              onClick={handleExportSchoolsReport}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#4F27E8] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Schools CSV</span>
            </button>
          </div>

          <div className={`${CARD_SURFACE} p-5 space-y-3`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Briefcase className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Security &amp; Audit Activity
            </h3>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              {(overview.recentAuditLogs ?? []).length} recent security and governance events available for export.
            </p>
            <button
              type="button"
              onClick={handleExportAuditReport}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#4F27E8] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className={`${CARD_SURFACE} p-5 space-y-3`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <IndianRupee className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Revenue &amp; Plan Breakdown
            </h3>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              MRR: {formatInrFromPaise(overview.kpis.mrrPaise ?? 0)} · Collected:{" "}
              {formatInrFromPaise(overview.kpis.saasRevenueCollectedPaise)}
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab("billing")}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <span>Inspect Billing Ledger</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cfg = OPS_CONFIGS[tab];
  const activeCategory = categoryInput || cfg.categories[0]!;

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      onToast("error", "Please enter a title before saving.");
      return;
    }
    let amountPaise: number | undefined;
    if (cfg.hasAmount) {
      const parsedRupees = Number(amountRupeesInput || "0");
      if (!Number.isFinite(parsedRupees) || parsedRupees < 0) {
        onToast("error", "Enter a valid non-negative amount in INR.");
        return;
      }
      amountPaise = Math.round(parsedRupees * 100);
    }

    const nextItem: OpsRecordItem = {
      id: `${tab}-${Date.now()}`,
      title: titleInput.trim(),
      subtitle: subtitleInput.trim() || activeCategory,
      category: activeCategory,
      amountPaise,
      status: cfg.statuses[0]!,
      createdAt: new Date().toISOString(),
    };

    setRecordsByTab((prev) => ({
      ...prev,
      [tab]: [nextItem, ...(prev[tab] ?? [])],
    }));
    setTitleInput("");
    setSubtitleInput("");
    setAmountRupeesInput("");
    onToast("success", `${cfg.title} item added.`);
  };

  const handleCycleStatus = (id: string) => {
    setRecordsByTab((prev) => ({
      ...prev,
      [tab]: (prev[tab] ?? []).map((item) => {
        if (item.id !== id) return item;
        const idx = cfg.statuses.indexOf(item.status);
        const nextStatus = cfg.statuses[(idx + 1) % cfg.statuses.length]!;
        return { ...item, status: nextStatus };
      }),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            {cfg.icon}
          </span>
          <div>
            <h2 className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">{cfg.title}</h2>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">{cfg.subtitle}</p>
          </div>
        </div>
        {tab === "employees" && (
          <button
            type="button"
            onClick={() => onNavigateTab("admins")}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
          >
            <span>Manage Company Admins</span>
          </button>
        )}
      </div>

      {tab === "employees" && (
        <section className={`${CARD_SURFACE} p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Registered Platform Team ({admins.length})
            </h3>
            {loadingAdmins && (
              <span className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                Loading...
              </span>
            )}
          </div>
          {admins.length === 0 ? (
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Company Admins appear here when loaded by a Super Admin.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {admins.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <p className="text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                    {a.name}
                  </p>
                  <p className="text-[11px] text-[#4D5072] truncate dark:text-[#9DA6CC]">{a.email}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                    <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      {a.role}
                    </span>
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">
                      {a.department || "Executive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Interactive Create Form */}
      <form onSubmit={handleAddRecord} className={`${CARD_SURFACE} p-5 space-y-3`}>
        <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
          {cfg.addLabel}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder={cfg.titlePlaceholder}
            className="md:col-span-4 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          />
          <input
            type="text"
            value={subtitleInput}
            onChange={(e) => setSubtitleInput(e.target.value)}
            placeholder={cfg.subtitlePlaceholder}
            className="md:col-span-3 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          />
          <select
            value={activeCategory}
            onChange={(e) => setCategoryInput(e.target.value)}
            aria-label="Category"
            className="md:col-span-2 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          >
            {cfg.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {cfg.hasAmount && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountRupeesInput}
              onChange={(e) => setAmountRupeesInput(e.target.value)}
              placeholder="Amount (INR)"
              className="md:col-span-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          )}
          <button
            type="submit"
            className={`${cfg.hasAmount ? "md:col-span-2" : "md:col-span-3"} inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:opacity-95 cursor-pointer`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{cfg.addLabel}</span>
          </button>
        </div>
      </form>

      {/* Records List */}
      <section className={`${CARD_SURFACE} p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Records ({filteredRecords.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", ...cfg.statuses].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#663CF6] text-white"
                    : "border border-[#D6DBF0] bg-white text-[#4D5072] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D6DBF0] p-8 text-center space-y-1 dark:border-[#272B4D]">
            <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {cfg.emptyTitle}
            </p>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{cfg.emptyDesc}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] px-3.5 py-2.5 dark:border-[#272B4D] dark:bg-[#10142C]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                    {item.category} · {item.subtitle} · {formatDateShort(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {typeof item.amountPaise === "number" && (
                    <span className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {formatInrFromPaise(item.amountPaise)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCycleStatus(item.id)}
                    title="Click to update status"
                    className="rounded-full border border-[#C4B5FD] bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#663CF6] cursor-pointer dark:border-[#4B3D91] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                  >
                    {item.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
