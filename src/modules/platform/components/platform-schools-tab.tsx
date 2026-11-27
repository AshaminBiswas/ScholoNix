"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  IndianRupee,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Search,
  Settings2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  DEFAULT_PLATFORM_MODULE_FLAGS,
  SAAS_PLAN_CATALOG,
  type PlatformAuditLogRecord,
  type PlatformModuleFlags,
  type PlatformSchoolDataInspectResult,
  type PlatformSchoolEntry,
  type PlatformSchoolUserItem,
  type SaaSBillingCycleValue,
  type SaaSPlanValue,
  type SaaSSubscriptionStatusValue,
} from "@/modules/platform/types";
import {
  PlanBadge,
  SchoolStatusBadge,
  exportRowsToCsv,
  formatDateShort,
  formatDateTime,
  formatInrFromPaise,
} from "./platform-shared";
import { PlatformProvisionSchoolModal } from "./platform-provision-modal";

type SchoolSubTab = "profile" | "plan" | "users" | "admissions" | "fees" | "audit";

const MODULE_FLAG_LABELS: Array<{ key: keyof PlatformModuleFlags; label: string; desc: string }> = [
  { key: "admissions", label: "Admissions Management", desc: "Core 4-step application & review pipeline" },
  { key: "enquiries", label: "Enquiries & CRM Follow-ups", desc: "Lead capture, sources, notes & communications" },
  { key: "admittedStudents", label: "Admitted Students Workbench", desc: "Confirmed roster, ID cards & documents" },
  { key: "feeLedgers", label: "Student Fee Ledgers & Receipts", desc: "Classwise fee plans, concessions & receipts" },
  { key: "customFields", label: "Custom Form Builder", desc: "School-specific admission fields" },
  { key: "crmIntegration", label: "CRM Sync Hooks", desc: "Lead sync across admission stages" },
  { key: "reportsExport", label: "CSV & PDF Exports", desc: "A4 dossiers and spreadsheet downloads" },
  { key: "smsAlerts", label: "SMS & Email Alerts", desc: "Automated status and verification templates" },
];

export function PlatformSchoolsTab({
  schools,
  selectedSchoolId,
  onSelectSchoolId,
  onRefreshSchools,
  onToast,
}: {
  schools: PlatformSchoolEntry[];
  selectedSchoolId: string | null;
  onSelectSchoolId: (id: string | null) => void;
  onRefreshSchools: (filters?: { q?: string; status?: string; plan?: string }) => Promise<void>;
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [searching, setSearching] = useState(false);

  const [subTab, setSubTab] = useState<SchoolSubTab>("profile");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);

  const selectedEntry =
    schools.find((e) => e.school.id === selectedSchoolId) ?? schools[0] ?? null;

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editBoard, setEditBoard] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editTrialEnds, setEditTrialEnds] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [suspendReasonInput, setSuspendReasonInput] = useState("");
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Plan & Modules state
  const [planVal, setPlanVal] = useState<SaaSPlanValue>("STARTER");
  const [billingCycleVal, setBillingCycleVal] = useState<SaaSBillingCycleValue>("MONTHLY");
  const [subStatusVal, setSubStatusVal] = useState<SaaSSubscriptionStatusValue>("TRIALING");
  const [maxStudentsVal, setMaxStudentsVal] = useState(500);
  const [maxStaffVal, setMaxStaffVal] = useState(50);
  const [modulesVal, setModulesVal] = useState<PlatformModuleFlags>({
    ...DEFAULT_PLATFORM_MODULE_FLAGS,
  });

  // Users sub-tab state
  const [schoolUsers, setSchoolUsers] = useState<PlatformSchoolUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("STAFF");
  const [creatingUser, setCreatingUser] = useState(false);

  // Deep data & audit sub-tabs state
  const [schoolData, setSchoolData] = useState<PlatformSchoolDataInspectResult | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [schoolAuditLogs, setSchoolAuditLogs] = useState<PlatformAuditLogRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Sync form fields when selectedEntry changes
  useEffect(() => {
    if (!selectedEntry) return;
    const s = selectedEntry.school;
    setEditName(s.name);
    setEditBoard(s.affiliationBoard || "");
    setEditCategory(s.category || "");
    setEditPhone(s.contactPhone || "");
    setEditEmail(s.contactEmail || "");
    setEditCity(s.city || "");
    setEditState(s.state || "");
    setEditTrialEnds(s.trialEndsAt ? s.trialEndsAt.slice(0, 10) : "");
    setEditNotes(s.internalNotes || "");
    setSuspendReasonInput(s.suspendedReason || "");
    setDeleteConfirmSlug("");

    setPlanVal(s.plan);
    setBillingCycleVal(s.billingCycle);
    setSubStatusVal(s.subscriptionStatus);
    setMaxStudentsVal(s.maxStudentsLimit);
    setMaxStaffVal(s.maxStaffLimit);
    setModulesVal(s.enabledModules || { ...DEFAULT_PLATFORM_MODULE_FLAGS });

    setSchoolUsers(selectedEntry.users);
    setSchoolData(null);
    setSchoolAuditLogs([]);
  }, [selectedEntry]);

  // Lazy load sub-tab data when opened
  useEffect(() => {
    if (!selectedEntry) return;
    const schoolId = selectedEntry.school.id;

    if (subTab === "users") {
      setLoadingUsers(true);
      fetch(`/api/platform/schools/${schoolId}/users`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (j.success && Array.isArray(j.users)) setSchoolUsers(j.users);
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    } else if (subTab === "admissions" || subTab === "fees") {
      setLoadingData(true);
      fetch(`/api/platform/schools/${schoolId}/data`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (j.success && j.data) setSchoolData(j.data);
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    } else if (subTab === "audit") {
      setLoadingAudit(true);
      fetch(`/api/platform/audit-logs?schoolId=${encodeURIComponent(schoolId)}`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.success && Array.isArray(j.logs)) setSchoolAuditLogs(j.logs);
        })
        .catch(() => {})
        .finally(() => setLoadingAudit(false));
    }
  }, [subTab, selectedEntry]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      await onRefreshSchools({ q: query, status: statusFilter, plan: planFilter });
    } finally {
      setSearching(false);
    }
  };

  const handleCopy = (key: string, val: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(val).catch(() => {});
    }
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const patchSchool = async (payload: Record<string, unknown>, successMsg: string) => {
    if (!selectedEntry) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/platform/schools/${selectedEntry.school.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to update school.");
      }
      onToast("success", successMsg);
      await onRefreshSchools({ q: query, status: statusFilter, plan: planFilter });
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Failed to update school.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!selectedEntry) return;
    if (deleteConfirmSlug.trim() !== selectedEntry.school.slug) {
      onToast("error", `Type exact slug "${selectedEntry.school.slug}" to confirm deletion.`);
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/platform/schools/${selectedEntry.school.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Unable to delete school.");
      }
      onToast("success", `${selectedEntry.school.name} permanently removed.`);
      onSelectSchoolId(null);
      await onRefreshSchools({ q: query, status: statusFilter, plan: planFilter });
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateSchoolUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;
    setCreatingUser(true);
    try {
      const res = await fetch(`/api/platform/schools/${selectedEntry.school.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          password: newUserPassword,
          role: newUserRole,
          status: "ACTIVE",
          emailVerified: true,
          phoneVerified: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to create school user.");
      }
      setSchoolUsers((prev) => [...prev, json.user]);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserPassword("");
      onToast("success", `Created ${json.user.role} account for ${json.user.name}.`);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "User creation failed.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUser = async (
    userId: string,
    payload: Record<string, unknown>,
    successMsg: string,
  ) => {
    if (!selectedEntry) return;
    try {
      const res = await fetch(
        `/api/platform/schools/${selectedEntry.school.id}/users/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to update user.");
      }
      setSchoolUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...json.user } : u)),
      );
      onToast("success", successMsg);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "User update failed.");
    }
  };

  const handleTenantDataMutation = async (payload: Record<string, unknown>, msg: string) => {
    if (!selectedEntry) return;
    try {
      const res = await fetch(`/api/platform/schools/${selectedEntry.school.id}/data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to update tenant record.");
      }
      onToast("success", msg);
      const refresh = await fetch(`/api/platform/schools/${selectedEntry.school.id}/data`, {
        cache: "no-store",
      });
      const rJson = await refresh.json();
      if (rJson.success && rJson.data) setSchoolData(rJson.data);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Tenant update failed.");
    }
  };

  const handleExportSchoolsCsv = () => {
    exportRowsToCsv(
      "scholonix-schools-directory.csv",
      [
        "Unique ID",
        "School Name",
        "Slug",
        "Status",
        "Plan",
        "Board",
        "City",
        "State",
        "Phone",
        "Email",
        "Users",
        "Applications",
        "Enquiries",
        "Admitted",
        "Fee Collected (INR)",
      ],
      schools.map((e) => [
        e.school.uniqueId || "",
        e.school.name,
        e.school.slug,
        e.school.status,
        e.school.plan,
        e.school.affiliationBoard || "",
        e.school.city || "",
        e.school.state || "",
        e.school.contactPhone || "",
        e.school.contactEmail || "",
        e.counts.users,
        e.counts.applications,
        e.counts.enquiries,
        e.counts.admitted,
        (e.counts.feeCollectedPaise / 100).toFixed(2),
      ]),
    );
  };

  return (
    <div className="space-y-5">
      {/* Search, Filter & Provision Bar */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Registered Schools &amp; Tenant Governance
            </h2>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              Provision schools, control subscriptions &amp; feature flags, manage tenant users, and inspect admissions or fee data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportSchoolsCsv}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#D6DBF0] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setProvisionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Provision New School</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C] dark:text-[#9DA6CC]" />
            <input
              type="search"
              aria-label="Search schools by Unique ID, name, city, or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Unique ID (SNX-...), name, code, city, email..."
              className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] pl-10 pr-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>
          <select
            aria-label="Filter by school status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              void onRefreshSchools({ q: query, status: e.target.value, plan: planFilter });
            }}
            className="md:col-span-2 rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            aria-label="Filter by SaaS plan"
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              void onRefreshSchools({ q: query, status: statusFilter, plan: e.target.value });
            }}
            className="md:col-span-2 rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          >
            <option value="ALL">All Plans</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <button
            type="submit"
            disabled={searching}
            className="md:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            <span>Search ({schools.length})</span>
          </button>
        </form>
      </section>

      {/* Split Master-Detail */}
      {schools.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#D6DBF0] bg-white p-10 text-center dark:border-[#2E345B] dark:bg-[#141731]">
          <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            No matching schools found
          </p>
          <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Adjust your search filters or provision a new school above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left School Cards (4 cols) */}
          <aside className="xl:col-span-4 space-y-2.5 max-h-[820px] overflow-y-auto school-menu-scrollbar pr-1">
            {schools.map((entry) => {
              const active = selectedEntry?.school.id === entry.school.id;
              return (
                <button
                  key={entry.school.id}
                  type="button"
                  onClick={() => {
                    setSubTab("profile");
                    onSelectSchoolId(entry.school.id);
                  }}
                  className={`w-full text-left rounded-[16px] border p-4 transition cursor-pointer ${
                    active
                      ? "border-[#663CF6] bg-[#FAF8FE] shadow-sm dark:border-[#8B5CF6] dark:bg-[#1B1740]"
                      : "border-[#D6DBF0] bg-white hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#141731]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {entry.school.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#A78BFA]">
                        {entry.school.uniqueId || entry.school.slug}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <SchoolStatusBadge status={entry.school.status} />
                      <PlanBadge plan={entry.school.plan} />
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                    <span>{entry.school.city || "—"}, {entry.school.state || "—"}</span>
                    <span>·</span>
                    <span>{entry.counts.users} users</span>
                    <span>·</span>
                    <span>{entry.counts.admitted} admitted</span>
                    <span>·</span>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {formatInrFromPaise(entry.counts.feeCollectedPaise)}
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Right School Master Workbench (8 cols) */}
          {selectedEntry && (
            <section className="xl:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-xs space-y-5 dark:border-[#272B4D] dark:bg-[#141731]">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#DFE3F5] pb-4 dark:border-[#232746]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
                    <h3 className="text-lg font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                      {selectedEntry.school.name}
                    </h3>
                    <SchoolStatusBadge status={selectedEntry.school.status} />
                    <PlanBadge plan={selectedEntry.school.plan} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#EDE7FF] px-2.5 py-1 font-mono text-xs font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>{selectedEntry.school.uniqueId || "N/A"}</span>
                    </span>
                    {selectedEntry.school.uniqueId && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(selectedEntry.school.id, selectedEntry.school.uniqueId!)
                        }
                        className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] px-2 py-1 text-[11px] font-bold text-[#4D5072] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C5CCF0]"
                      >
                        {copiedId === selectedEntry.school.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedId === selectedEntry.school.id ? "Copied" : "Copy ID"}</span>
                      </button>
                    )}
                    <span className="font-mono text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      /{selectedEntry.school.slug}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/${selectedEntry.school.slug}` as Route}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4F27E8]"
                >
                  <span>Open School Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Users</p>
                  <p className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">{selectedEntry.counts.users}</p>
                </div>
                <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Applications</p>
                  <p className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">{selectedEntry.counts.applications}</p>
                </div>
                <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Admitted</p>
                  <p className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">{selectedEntry.counts.admitted}</p>
                </div>
                <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Fees Collected</p>
                  <p className="text-lg font-black text-[#663CF6] dark:text-[#C4B5FD]">
                    {formatInrFromPaise(selectedEntry.counts.feeCollectedPaise)}
                  </p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex flex-wrap gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-1 dark:border-[#272B4D] dark:bg-[#10142C]">
                {(
                  [
                    { id: "profile", label: "Profile & Lifecycle", icon: Building2 },
                    { id: "plan", label: "Plan & Modules", icon: Settings2 },
                    { id: "users", label: "Users & Sessions", icon: Users },
                    { id: "admissions", label: "Admissions Data", icon: Database },
                    { id: "fees", label: "Fee Ledgers", icon: IndianRupee },
                    { id: "audit", label: "Audit Trail", icon: FileText },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const active = subTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSubTab(t.id)}
                      className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                        active
                          ? "bg-[#663CF6] text-white shadow-2xs"
                          : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC] dark:hover:text-[#F3F5FF]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: PROFILE & LIFECYCLE */}
              {subTab === "profile" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold mb-1">School Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Affiliation Board</label>
                      <input
                        type="text"
                        value={editBoard}
                        onChange={(e) => setEditBoard(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">City</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">State</label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Category</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Trial Ends Date</label>
                      <input
                        type="date"
                        value={editTrialEnds}
                        onChange={(e) => setEditTrialEnds(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold mb-1">Internal Company Notes</label>
                      <textarea
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Account manager notes, onboarding status, custom SLA..."
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={() =>
                        void patchSchool(
                          {
                            name: editName,
                            affiliationBoard: editBoard,
                            category: editCategory,
                            contactPhone: editPhone,
                            contactEmail: editEmail,
                            city: editCity,
                            state: editState,
                            trialEndsAt: editTrialEnds || null,
                            internalNotes: editNotes,
                          },
                          "School profile updated.",
                        )
                      }
                      className="rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
                    >
                      Save School Profile
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedEntry.school.status !== "ACTIVE" && (
                        <button
                          type="button"
                          disabled={savingProfile}
                          onClick={() =>
                            void patchSchool(
                              { status: "ACTIVE", subscriptionStatus: "ACTIVE", suspendedReason: null },
                              `${selectedEntry.school.name} activated.`,
                            )
                          }
                          className="rounded-[10px] bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Activate School
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={savingProfile}
                        onClick={() => {
                          const base = editTrialEnds ? new Date(editTrialEnds) : new Date();
                          const extended = new Date(base.getTime() + 14 * 86_400_000)
                            .toISOString()
                            .slice(0, 10);
                          setEditTrialEnds(extended);
                          void patchSchool(
                            { status: "TRIAL", subscriptionStatus: "TRIALING", trialEndsAt: extended },
                            `Trial extended by 14 days until ${extended}.`,
                          );
                        }}
                        className="rounded-[10px] border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 cursor-pointer dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                      >
                        Extend Trial +14d
                      </button>
                    </div>
                  </div>

                  {/* Governance: Suspend / Delete */}
                  <div className="rounded-[16px] border border-rose-200 bg-rose-50/60 p-4 space-y-3 dark:border-rose-900/60 dark:bg-rose-950/20">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Tenant Suspension &amp; Danger Zone</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={suspendReasonInput}
                        onChange={(e) => setSuspendReasonInput(e.target.value)}
                        placeholder="Reason for suspension (e.g., overdue invoice / policy review)"
                        className="flex-1 rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs dark:border-rose-800 dark:bg-[#10142C]"
                      />
                      <button
                        type="button"
                        disabled={savingProfile}
                        onClick={() =>
                          void patchSchool(
                            {
                              status: "SUSPENDED",
                              suspendedReason: suspendReasonInput || "Suspended by platform admin.",
                            },
                            `${selectedEntry.school.name} suspended & active sessions revoked.`,
                          )
                        }
                        className="rounded-[10px] bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                      >
                        Suspend School
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-rose-200/70 dark:border-rose-900/50">
                      <input
                        type="text"
                        value={deleteConfirmSlug}
                        onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                        placeholder={`Type "${selectedEntry.school.slug}" to permanently delete`}
                        className="flex-1 rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-mono dark:border-rose-800 dark:bg-[#10142C]"
                      />
                      <button
                        type="button"
                        disabled={savingProfile || deleteConfirmSlug.trim() !== selectedEntry.school.slug}
                        onClick={handleDeleteSchool}
                        className="inline-flex items-center justify-center gap-1 rounded-[10px] border border-rose-500 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-600 hover:text-white disabled:opacity-40 cursor-pointer dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Tenant</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: PLAN, LIMITS & MODULE FLAGS */}
              {subTab === "plan" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">SaaS Plan</label>
                      <select
                        value={planVal}
                        onChange={(e) => {
                          const nextPlan = e.target.value as SaaSPlanValue;
                          setPlanVal(nextPlan);
                          setMaxStudentsVal(SAAS_PLAN_CATALOG[nextPlan].defaultMaxStudents);
                          setMaxStaffVal(SAAS_PLAN_CATALOG[nextPlan].defaultMaxStaff);
                        }}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                      >
                        <option value="STARTER">Starter (₹1,999/mo)</option>
                        <option value="PROFESSIONAL">Professional (₹3,999/mo)</option>
                        <option value="ENTERPRISE">Enterprise (₹7,999/mo)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Billing Cycle</label>
                      <select
                        value={billingCycleVal}
                        onChange={(e) => setBillingCycleVal(e.target.value as SaaSBillingCycleValue)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Subscription Status</label>
                      <select
                        value={subStatusVal}
                        onChange={(e) =>
                          setSubStatusVal(e.target.value as SaaSSubscriptionStatusValue)
                        }
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                      >
                        <option value="TRIALING">Trialing</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAST_DUE">Past Due</option>
                        <option value="CANCELED">Canceled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Max Students Quota</label>
                      <input
                        type="number"
                        min={10}
                        value={maxStudentsVal}
                        onChange={(e) => setMaxStudentsVal(Math.max(10, Number(e.target.value) || 500))}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Max Staff Accounts</label>
                      <input
                        type="number"
                        min={1}
                        value={maxStaffVal}
                        onChange={(e) => setMaxStaffVal(Math.max(1, Number(e.target.value) || 50))}
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] mb-2 dark:text-[#F3F5FF]">
                      Per-School Feature Modules
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {MODULE_FLAG_LABELS.map((item) => {
                        const enabled = modulesVal[item.key];
                        return (
                          <label
                            key={item.key}
                            className={`flex items-start justify-between gap-2 rounded-[12px] border p-3 cursor-pointer ${
                              enabled
                                ? "border-[#663CF6] bg-[#FAF8FE] dark:border-[#8B5CF6] dark:bg-[#1D1940]"
                                : "border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#10142C]"
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                {item.label}
                              </p>
                              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                {item.desc}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) =>
                                setModulesVal((prev) => ({ ...prev, [item.key]: e.target.checked }))
                              }
                              className="mt-0.5 h-4 w-4 accent-[#663CF6]"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={() =>
                      void patchSchool(
                        {
                          plan: planVal,
                          billingCycle: billingCycleVal,
                          subscriptionStatus: subStatusVal,
                          maxStudentsLimit: maxStudentsVal,
                          maxStaffLimit: maxStaffVal,
                          enabledModules: modulesVal,
                        },
                        `Updated SaaS plan & modules for ${selectedEntry.school.name}.`,
                      )
                    }
                    className="rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
                  >
                    Save Plan, Quotas &amp; Feature Flags
                  </button>
                </div>
              )}

              {/* SUB-TAB 3: USERS & SESSIONS */}
              {subTab === "users" && (
                <div className="space-y-4">
                  <form
                    onSubmit={handleCreateSchoolUser}
                    className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 space-y-2.5 dark:border-[#272B4D] dark:bg-[#10142C]"
                  >
                    <p className="text-xs font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
                      <UserPlus className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>Add User Account to {selectedEntry.school.name}</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Full Name *"
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                      />
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Email"
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                      />
                      <input
                        type="tel"
                        required
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        placeholder="Phone *"
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Password (8+ chars)"
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                      />
                      <div className="flex gap-1.5">
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="flex-1 rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#141731]"
                        >
                          <option value="PRINCIPAL">Principal</option>
                          <option value="SCHOOL_ADMIN">Admin</option>
                          <option value="STAFF">Staff</option>
                          <option value="TEACHER">Teacher</option>
                          <option value="ACCOUNTANT">Accountant</option>
                          <option value="PARENT">Parent</option>
                          <option value="STUDENT">Student</option>
                        </select>
                        <button
                          type="submit"
                          disabled={creatingUser}
                          className="rounded-lg bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </form>

                  {loadingUsers ? (
                    <div className="py-6 text-center text-xs text-[#76799C]">Loading users...</div>
                  ) : (
                    <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                          <tr>
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-center">Sessions</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                          {schoolUsers.map((u) => (
                            <tr key={u.id}>
                              <td className="px-3 py-2">
                                <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{u.name}</p>
                                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                  {u.email || "—"} · {u.phone || "—"}
                                </p>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  aria-label={`Role for ${u.name}`}
                                  value={u.role}
                                  onChange={(e) =>
                                    void handleUpdateUser(
                                      u.id,
                                      { role: e.target.value },
                                      `Updated ${u.name} role to ${e.target.value}.`,
                                    )
                                  }
                                  className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-[11px] font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                                >
                                  {[
                                    "SCHOOL_ADMIN",
                                    "PRINCIPAL",
                                    "TEACHER",
                                    "ACCOUNTANT",
                                    "STAFF",
                                    "PARENT",
                                    "STUDENT",
                                  ].map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  aria-label={`Status for ${u.name}`}
                                  value={u.status}
                                  onChange={(e) =>
                                    void handleUpdateUser(
                                      u.id,
                                      { status: e.target.value },
                                      `Updated ${u.name} status to ${e.target.value}.`,
                                    )
                                  }
                                  className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-[11px] font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                                >
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="SUSPENDED">SUSPENDED</option>
                                  <option value="INACTIVE">INACTIVE</option>
                                  <option value="PENDING_VERIFICATION">PENDING</option>
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center font-bold">
                                {u.activeSessionCount ?? 0}
                              </td>
                              <td className="px-3 py-2 text-right space-x-1.5">
                                {(!u.emailVerified || !u.phoneVerified) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleUpdateUser(
                                        u.id,
                                        { emailVerified: true, phoneVerified: true, status: "ACTIVE" },
                                        `Verified & activated ${u.name}.`,
                                      )
                                    }
                                    className="rounded border border-emerald-300 px-2 py-1 text-[10px] font-bold text-emerald-700 cursor-pointer dark:border-emerald-800 dark:text-emerald-300"
                                  >
                                    Verify
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUpdateUser(
                                      u.id,
                                      { revokeSessions: true },
                                      `Revoked all active sessions for ${u.name}.`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded border border-[#CAD0EB] px-2 py-1 text-[10px] font-bold text-[#4D5072] hover:border-rose-400 hover:text-rose-600 cursor-pointer dark:border-[#343B6B] dark:text-[#C5CCF0]"
                                >
                                  <Lock className="h-3 w-3" />
                                  <span>Revoke</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 4: ADMISSIONS & SETTINGS DATA EXPLORER */}
              {subTab === "admissions" && (
                <div className="space-y-4">
                  {loadingData || !schoolData ? (
                    <div className="py-6 text-center text-xs text-[#76799C]">
                      Inspecting tenant admissions &amp; configuration...
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                        <div>
                          <p className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                            Admission Settings Snapshot
                          </p>
                          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                            AY: {String(schoolData.settings?.currentAcademicYear || "—")} · Prefix:{" "}
                            {String(schoolData.settings?.applicationPrefix || "APP")} · Grades:{" "}
                            {Array.isArray(schoolData.settings?.enabledGrades)
                              ? schoolData.settings.enabledGrades.length
                              : 0}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            exportRowsToCsv(
                              `${selectedEntry.school.slug}-applications.csv`,
                              ["Code", "Student", "Grade", "AY", "Guardian", "Phone", "Status", "Verification"],
                              schoolData.applications.map((a) => [
                                a.applicationCode,
                                a.studentName,
                                a.gradeApplied,
                                a.academicYear,
                                a.guardianName,
                                a.guardianPhone,
                                a.status,
                                a.verificationStatus,
                              ]),
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CAD0EB] bg-white px-3 py-1.5 text-[11px] font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C4B5FD]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export Applications ({schoolData.applications.length})</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                            <tr>
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Student</th>
                              <th className="px-3 py-2">Class</th>
                              <th className="px-3 py-2">Guardian</th>
                              <th className="px-3 py-2">Status Override</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                            {schoolData.applications.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-[#76799C]">
                                  No admission applications recorded for this school yet.
                                </td>
                              </tr>
                            ) : (
                              schoolData.applications.map((a) => (
                                <tr key={a.id}>
                                  <td className="px-3 py-2 font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                                    {a.applicationCode}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                    {a.studentName}
                                  </td>
                                  <td className="px-3 py-2">{a.gradeApplied}</td>
                                  <td className="px-3 py-2">
                                    {a.guardianName} ({a.guardianPhone})
                                  </td>
                                  <td className="px-3 py-2">
                                    <select
                                      aria-label={`Status for ${a.studentName}`}
                                      value={a.status}
                                      onChange={(e) =>
                                        void handleTenantDataMutation(
                                          {
                                            action: "update_application_status",
                                            applicationId: a.id,
                                            status: e.target.value,
                                          },
                                          `Updated ${a.studentName} application to ${e.target.value}.`,
                                        )
                                      }
                                      className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-[11px] font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                                    >
                                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                                      <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
                                      <option value="SHORTLISTED">SHORTLISTED</option>
                                      <option value="ADMITTED">ADMITTED</option>
                                      <option value="REJECTED">REJECTED</option>
                                    </select>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <p className="text-xs font-extrabold text-[#08093B] mb-2 dark:text-[#F3F5FF]">
                          School Enquiries ({schoolData.enquiries.length})
                        </p>
                        <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                              <tr>
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Student</th>
                                <th className="px-3 py-2">Source</th>
                                <th className="px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                              {schoolData.enquiries.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-5 text-center text-[#76799C]">
                                    No enquiries recorded yet.
                                  </td>
                                </tr>
                              ) : (
                                schoolData.enquiries.map((enq) => (
                                  <tr key={enq.id}>
                                    <td className="px-3 py-2 font-mono font-bold">{enq.enquiryCode}</td>
                                    <td className="px-3 py-2 font-bold">{enq.studentName}</td>
                                    <td className="px-3 py-2">{enq.source}</td>
                                    <td className="px-3 py-2">
                                      <select
                                        aria-label={`Enquiry status for ${enq.studentName}`}
                                        value={enq.status}
                                        onChange={(e) =>
                                          void handleTenantDataMutation(
                                            {
                                              action: "update_enquiry_status",
                                              enquiryId: enq.id,
                                              status: e.target.value,
                                            },
                                            `Updated enquiry ${enq.enquiryCode} status.`,
                                          )
                                        }
                                        className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-[11px] font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                                      >
                                        <option value="NEW">NEW</option>
                                        <option value="CONTACTED">CONTACTED</option>
                                        <option value="FOLLOW_UP">FOLLOW_UP</option>
                                        <option value="CONVERTED">CONVERTED</option>
                                        <option value="CLOSED">CLOSED</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SUB-TAB 5: STUDENT FEE LEDGERS & RECEIPTS */}
              {subTab === "fees" && (
                <div className="space-y-4">
                  {loadingData || !schoolData ? (
                    <div className="py-6 text-center text-xs text-[#76799C]">
                      Loading school fee ledgers &amp; payment receipts...
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                          Student Fee Ledgers ({schoolData.feeLedgers.length}) &amp; Receipts ({schoolData.feePayments.length})
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            exportRowsToCsv(
                              `${selectedEntry.school.slug}-fee-receipts.csv`,
                              ["Receipt No", "Student", "Fee Head", "Amount (INR)", "Mode", "Date"],
                              schoolData.feePayments.map((p) => [
                                p.receiptNumber,
                                p.studentName,
                                p.feeHead,
                                (p.amountPaise / 100).toFixed(2),
                                p.paymentMode,
                                formatDateShort(p.paymentDate),
                              ]),
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CAD0EB] px-3 py-1.5 text-[11px] font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export Receipts CSV</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                            <tr>
                              <th className="px-3 py-2">Student</th>
                              <th className="px-3 py-2">Academic Year</th>
                              <th className="px-3 py-2 text-right">Total Fee</th>
                              <th className="px-3 py-2 text-right">Concession</th>
                              <th className="px-3 py-2 text-right">Paid</th>
                              <th className="px-3 py-2 text-right">Outstanding</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                            {schoolData.feeLedgers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-[#76799C]">
                                  No student fee ledgers recorded for this school yet.
                                </td>
                              </tr>
                            ) : (
                              schoolData.feeLedgers.map((l) => (
                                <tr key={l.id}>
                                  <td className="px-3 py-2 font-bold">{l.studentName}</td>
                                  <td className="px-3 py-2">{l.academicYear}</td>
                                  <td className="px-3 py-2 text-right">{formatInrFromPaise(l.totalFeePaise)}</td>
                                  <td className="px-3 py-2 text-right">{formatInrFromPaise(l.concessionPaise)}</td>
                                  <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-300">
                                    {formatInrFromPaise(l.paidPaise)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-amber-700 dark:text-amber-300">
                                    {formatInrFromPaise(l.outstandingPaise)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SUB-TAB 6: SCHOOL AUDIT TRAIL */}
              {subTab === "audit" && (
                <div className="space-y-3">
                  {loadingAudit ? (
                    <div className="py-6 text-center text-xs text-[#76799C]">Loading audit trail...</div>
                  ) : schoolAuditLogs.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#76799C]">
                      No audit trail events logged for this school yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                          <tr>
                            <th className="px-3 py-2">When</th>
                            <th className="px-3 py-2">Action</th>
                            <th className="px-3 py-2">Actor</th>
                            <th className="px-3 py-2">Entity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                          {schoolAuditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                              <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                                {log.action}
                              </td>
                              <td className="px-3 py-2">{log.actorName || log.actorId || "System"}</td>
                              <td className="px-3 py-2 font-mono text-[11px]">
                                {log.entityType}:{log.entityId.slice(0, 16)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <PlatformProvisionSchoolModal
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        onToast={onToast}
        onSuccess={async (newSchoolId) => {
          onSelectSchoolId(newSchoolId);
          await onRefreshSchools({ q: query, status: statusFilter, plan: planFilter });
        }}
      />
    </div>
  );
}
