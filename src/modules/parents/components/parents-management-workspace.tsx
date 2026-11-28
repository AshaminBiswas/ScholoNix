"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  GitMerge,
  Home,
  Link2,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";
import {
  buildHouseholdClusters,
  computeParentAnalytics,
  filterAndSortGuardians,
} from "@/modules/parents/analytics";
import type {
  GuardianRecord,
  HouseholdCluster,
  ParentDashboardAnalytics,
  ParentFilterParams,
  ParentNavSection,
  ParentWorkspaceSnapshot,
} from "@/modules/parents/types";
import { GuardianProfileDossier } from "./guardian-profile-dossier";
import {
  AddEditGuardianModal,
  LinkWardModal,
  SendGuardianCommModal,
} from "./parent-modals";

const CONTROL_INPUT =
  "rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-medium text-[#1B1D45] placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 dark:border-[#313761] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7C83AA] dark:focus:border-[#8B5CF6]";

export function ParentsManagementWorkspace({
  mode = "school",
  schoolId,
  initialSnapshot,
  initialAnalytics,
  initialHouseholds,
  initialSection = "directory",
  initialGuardianId = null,
  permissions,
  onNavigateSection,
}: {
  mode?: "school" | "platform";
  schoolId: string;
  initialSnapshot: ParentWorkspaceSnapshot;
  initialAnalytics: ParentDashboardAnalytics;
  initialHouseholds: HouseholdCluster[];
  initialSection?: ParentNavSection;
  initialGuardianId?: string | null;
  permissions: {
    canWrite: boolean;
    canLink: boolean;
    canPortal: boolean;
    canCommunicate: boolean;
    canExport: boolean;
  };
  onNavigateSection?: (section: ParentNavSection, guardianId?: string | null) => void;
}) {
  const [snapshot, setSnapshot] = useState<ParentWorkspaceSnapshot>(initialSnapshot);
  const [section, setSection] = useState<ParentNavSection>(initialSection);
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(initialGuardianId);
  const [filters, setFilters] = useState<ParentFilterParams>({
    relation: "ALL",
    portalStatus: "ALL",
    status: "ALL",
    grade: "ALL",
    sortBy: "fullName",
    sortDir: "asc",
    page: 1,
    pageSize: 10,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<GuardianRecord | null>(null);
  const [linkingGuardian, setLinkingGuardian] = useState<GuardianRecord | null>(null);
  const [commTargets, setCommTargets] = useState<GuardianRecord[] | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const apiBase =
    mode === "platform"
      ? `/api/platform/schools/${encodeURIComponent(schoolId)}/parents`
      : "/api/school/parents";

  const analytics = useMemo(
    () =>
      snapshot === initialSnapshot
        ? initialAnalytics
        : computeParentAnalytics(snapshot.guardians, snapshot.grades),
    [snapshot, initialSnapshot, initialAnalytics],
  );

  const households = useMemo(
    () =>
      snapshot === initialSnapshot
        ? initialHouseholds
        : buildHouseholdClusters(snapshot.guardians, snapshot.students),
    [snapshot, initialSnapshot, initialHouseholds],
  );

  const filteredGuardians = useMemo(
    () => filterAndSortGuardians(snapshot.guardians, filters),
    [snapshot.guardians, filters],
  );

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(filteredGuardians.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedGuardians = filteredGuardians.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeGuardian = useMemo(
    () => snapshot.guardians.find((g) => g.id === selectedGuardianId) ?? null,
    [snapshot.guardians, selectedGuardianId],
  );

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const refreshWorkspace = async () => {
    const res = await fetch(`${apiBase}?pageSize=100`);
    const json = await res.json();
    if (res.ok && json?.snapshot) {
      setSnapshot(json.snapshot);
    }
  };

  const switchSection = (nextSection: ParentNavSection, guardianId?: string | null) => {
    setSection(nextSection);
    if (guardianId !== undefined) setSelectedGuardianId(guardianId);
    onNavigateSection?.(nextSection, guardianId ?? null);
  };

  const handleCreateGuardian = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/school/parents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Failed to add guardian.");
    }
    await refreshWorkspace();
    notify("ok", `${json.guardian.fullName} added successfully.`);
  };

  const handleUpdateGuardian = async (guardianId: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/school/parents/${encodeURIComponent(guardianId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Failed to update guardian.");
    }
    await refreshWorkspace();
    notify("ok", "Guardian profile updated.");
  };

  const handleLinkWard = async (guardianId: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/school/parents/${encodeURIComponent(guardianId)}/wards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Failed to link ward.");
    }
    await refreshWorkspace();
    notify("ok", "Guardian-ward link updated.");
  };

  const handleUnlinkWard = async (guardianId: string, studentId: string) => {
    setBusyAction(true);
    try {
      const res = await fetch(`/api/school/parents/${encodeURIComponent(guardianId)}/wards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Cannot unlink ward.");
      }
      await refreshWorkspace();
      notify("ok", "Ward link removed.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed to unlink ward.");
    } finally {
      setBusyAction(false);
    }
  };

  const handlePortalAction = async (
    guardianIds: string[],
    action: "INVITE" | "ACTIVATE" | "SUSPEND",
  ) => {
    if (guardianIds.length === 0) return;
    setBusyAction(true);
    try {
      const targetUrl =
        mode === "platform"
          ? apiBase
          : `/api/school/parents/${encodeURIComponent(guardianIds[0]!)}/portal-invite`;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianIds, action }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Failed to update portal access.");
      }
      await refreshWorkspace();
      setSelectedIds([]);
      notify("ok", `Portal access updated for ${json.updatedCount} guardian(s).`);
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Portal action failed.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleAutoLinkHouseholds = async () => {
    setBusyAction(true);
    try {
      const res = await fetch("/api/school/parents/households/auto-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "APPLY" }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Auto-linking failed.");
      }
      await refreshWorkspace();
      notify(
        "ok",
        `Linked ${json.linkedCount} sibling record(s) and merged ${json.mergedCount} duplicate profile(s).`,
      );
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Auto-linking failed.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleMergeCluster = async (cluster: HouseholdCluster) => {
    if (cluster.guardians.length < 2) return;
    setBusyAction(true);
    try {
      const target = cluster.guardians[0]!;
      const sourceIds = cluster.guardians.slice(1).map((g) => g.id);
      const res = await fetch("/api/school/parents/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetGuardianId: target.id,
          sourceGuardianIds: sourceIds,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Merge failed.");
      }
      await refreshWorkspace();
      notify("ok", `Merged ${json.mergedCount} duplicate profile(s) into ${target.fullName}.`);
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Merge failed.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleSendCommunication = async (payload: {
    guardianIds: string[];
    studentId?: string | null;
    channel: "SMS" | "EMAIL" | "WHATSAPP" | "APP" | "CALL";
    subject?: string;
    body: string;
  }) => {
    const res = await fetch("/api/school/parents/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Communication dispatch failed.");
    }
    await refreshWorkspace();
    notify("ok", `Dispatched message to ${json.sentCount} guardian(s).`);
  };

  if (section === "profile" && activeGuardian) {
    return (
      <div className="space-y-4">
        {toast && (
          <div
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
              toast.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {toast.text}
          </div>
        )}
        <GuardianProfileDossier
          schoolSlug={snapshot.schoolSlug}
          guardian={activeGuardian}
          communications={snapshot.communications.filter((c) => c.guardianId === activeGuardian.id)}
          availableStudents={snapshot.students}
          permissions={{
            canWrite: permissions.canWrite,
            canLink: permissions.canLink,
            canPortal: permissions.canPortal,
            canCommunicate: permissions.canCommunicate,
          }}
          onBack={() => switchSection("directory", null)}
          onUpdateGuardian={handleUpdateGuardian}
          onLinkWard={handleLinkWard}
          onUnlinkWard={handleUnlinkWard}
          onPortalAction={(gId, action) => handlePortalAction([gId], action)}
          onSendMessage={handleSendCommunication}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
            toast.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Home &gt; Parents &amp; Guardians &gt;{" "}
            <span className="text-[#663CF6] dark:text-[#C4B5FD]">
              {section === "directory"
                ? "Guardian Directory"
                : section === "households"
                  ? "Households & Siblings"
                  : section === "portal"
                    ? "Portal & Consents"
                    : "Communications"}
            </span>
          </p>
          <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Parents &amp; Guardians
          </h1>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Manage family contacts, sibling households, pickup authorization, and Parent Portal access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canWrite && mode === "school" && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Guardian</span>
            </button>
          )}
          {permissions.canLink && mode === "school" && (
            <button
              type="button"
              disabled={busyAction}
              onClick={handleAutoLinkHouseholds}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#663CF6] hover:bg-[#FAF8FE] cursor-pointer disabled:opacity-60 dark:border-[#313761] dark:bg-[#141731] dark:text-[#C4B5FD]"
            >
              {busyAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>Auto-Link Siblings</span>
            </button>
          )}
          {permissions.canExport && mode === "school" && (
            <button
              type="button"
              onClick={() => window.location.assign("/api/school/parents/export")}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#141731] dark:text-[#B4BDD9]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Navigation Pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "directory", label: "Guardian Directory", icon: Users },
            { id: "households", label: `Households & Siblings (${households.length})`, icon: Home },
            { id: "portal", label: "Portal Access & Consents", icon: ShieldCheck },
            { id: "communications", label: `Communications (${snapshot.communications.length})`, icon: MessageSquare },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchSection(tab.id)}
              className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                active
                  ? "bg-gradient-to-r from-[#663CF6] to-[#7C5CFC] text-white shadow-md"
                  : "border border-[#D6DBF0] bg-white/90 text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#B4BDD9]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DIRECTORY & OVERVIEW */}
      {section === "directory" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <StudentKpiCard
              label="Total Guardians"
              value={analytics.kpis.totalGuardians}
              icon={<Users className="h-5 w-5" />}
              tone="violet"
              subtitle={`${analytics.kpis.activeGuardians} active records`}
            />
            <StudentKpiCard
              label="Linked Households"
              value={analytics.kpis.linkedHouseholds}
              icon={<Home className="h-5 w-5" />}
              tone="sky"
              subtitle={`${analytics.kpis.multiChildFamilies} multi-child families`}
            />
            <StudentKpiCard
              label="Portal Activated"
              value={`${analytics.kpis.portalActivationPct}%`}
              icon={<BadgeCheck className="h-5 w-5" />}
              tone="emerald"
              subtitle={`${analytics.kpis.portalActivated} of ${analytics.kpis.totalGuardians} guardians`}
            />
            <StudentKpiCard
              label="Pickup & Custody"
              value={analytics.kpis.pickupAuthorizedCount}
              icon={<ShieldAlert className="h-5 w-5" />}
              tone="amber"
              subtitle={`${analytics.kpis.restrictedContactsCount} restricted alert(s)`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StudentDonutChart
              title="Guardian Relation Distribution"
              centerTotal={analytics.kpis.totalGuardians}
              centerLabel="Guardians"
              slices={analytics.relationSlices}
            />
            <StudentDonutChart
              title="Parent Portal Onboarding"
              centerTotal={analytics.kpis.portalActivated}
              centerLabel="Activated"
              slices={analytics.portalSlices}
            />
          </div>

          {/* Filter Strip */}
          <div className={`${STUDENT_CARD_SURFACE} p-4 space-y-3`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#76799C]" />
                <input
                  type="search"
                  value={filters.search ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                  }
                  placeholder="Search guardian, phone, email, or ward..."
                  className={`${CONTROL_INPUT} w-full pl-8`}
                />
              </div>

              <select
                aria-label="Filter by relation"
                value={filters.relation ?? "ALL"}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, relation: e.target.value, page: 1 }))
                }
                className={CONTROL_INPUT}
              >
                <option value="ALL">All Relations</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Parent">Parent</option>
                <option value="Grandparent">Grandparent</option>
              </select>

              <select
                aria-label="Filter by grade"
                value={filters.grade ?? "ALL"}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, grade: e.target.value, page: 1 }))
                }
                className={CONTROL_INPUT}
              >
                <option value="ALL">All Classes</option>
                {snapshot.grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by portal status"
                value={filters.portalStatus ?? "ALL"}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    portalStatus: e.target.value as ParentFilterParams["portalStatus"],
                    page: 1,
                  }))
                }
                className={CONTROL_INPUT}
              >
                <option value="ALL">All Portal Statuses</option>
                <option value="ACTIVE">Portal Active</option>
                <option value="INVITED">Invited</option>
                <option value="NOT_INVITED">Not Invited</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D5072] cursor-pointer dark:text-[#B4BDD9]">
                <input
                  type="checkbox"
                  checked={Boolean(filters.multiChildOnly)}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      multiChildOnly: e.target.checked,
                      page: 1,
                    }))
                  }
                  className="rounded accent-[#663CF6]"
                />
                <span>Multi-Child Siblings</span>
              </label>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DDD6FE] bg-[#FAF8FE] px-3.5 py-2 dark:border-[#2C285A] dark:bg-[#191638]">
                <span className="text-xs font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                  {selectedIds.length} guardian(s) selected
                </span>
                <div className="flex flex-wrap gap-2">
                  {permissions.canPortal && (
                    <button
                      type="button"
                      onClick={() => handlePortalAction(selectedIds, "INVITE")}
                      className="rounded-lg bg-[#663CF6] px-3 py-1 text-[11px] font-bold text-white cursor-pointer"
                    >
                      Send Portal Invites
                    </button>
                  )}
                  {permissions.canCommunicate && (
                    <button
                      type="button"
                      onClick={() =>
                        setCommTargets(snapshot.guardians.filter((g) => selectedIds.includes(g.id)))
                      }
                      className="rounded-lg border border-[#CAD0EB] bg-white px-3 py-1 text-[11px] font-bold text-[#1B1D45] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                    >
                      Message Selected
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#DFE3F5] dark:border-[#272B4D]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F6F5FD] text-[10px] font-extrabold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                  <tr>
                    <th className="px-3 py-2.5 w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all visible guardians"
                        checked={
                          pagedGuardians.length > 0 &&
                          pagedGuardians.every((g) => selectedIds.includes(g.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(pagedGuardians.map((g) => g.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="rounded accent-[#663CF6]"
                      />
                    </th>
                    <th className="px-3 py-2.5">Guardian</th>
                    <th className="px-3 py-2.5">Contact</th>
                    <th className="px-3 py-2.5">Linked Wards (Siblings)</th>
                    <th className="px-3 py-2.5">Governance</th>
                    <th className="px-3 py-2.5">Portal</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                  {pagedGuardians.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#76799C] dark:text-[#9DA6CC]">
                        No guardians match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    pagedGuardians.map((g) => {
                      const activeWards = g.wards.filter((w) => w.isActive);
                      const hasRestricted = activeWards.some((w) => w.restrictedContact);
                      const canPickupAny = activeWards.some((w) => w.canPickup && !w.restrictedContact);
                      const isFeePayerAny = activeWards.some((w) => w.isFeePayer);
                      return (
                        <tr
                          key={g.id}
                          className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#191D3D]/60 transition"
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              aria-label={`Select ${g.fullName}`}
                              checked={selectedIds.includes(g.id)}
                              onChange={(e) => {
                                setSelectedIds((prev) =>
                                  e.target.checked
                                    ? [...prev, g.id]
                                    : prev.filter((id) => id !== g.id),
                                );
                              }}
                              className="rounded accent-[#663CF6]"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => switchSection("profile", g.id)}
                              className="text-left font-black text-[#08093B] hover:text-[#663CF6] cursor-pointer dark:text-[#F3F5FF] dark:hover:text-[#C4B5FD]"
                            >
                              {g.fullName}
                            </button>
                            {g.occupation && (
                              <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                {g.occupation}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
                              {g.phone}
                            </p>
                            <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                              {g.email || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            {activeWards.length === 0 ? (
                              <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                Unlinked
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {activeWards.map((w) => (
                                  <Link
                                    key={w.linkId}
                                    href={`/${encodeURIComponent(snapshot.schoolSlug)}/students/profile/${encodeURIComponent(w.studentId)}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-[#FAF8FE] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] hover:bg-[#EDE7FF] dark:border-[#342B63] dark:bg-[#1D183D] dark:text-[#CBB8FF]"
                                  >
                                    <span>{w.studentName}</span>
                                    <span className="opacity-75">({w.currentGrade})</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                              {hasRestricted ? (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                  Custody Alert
                                </span>
                              ) : canPickupAny ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Pickup OK
                                </span>
                              ) : null}
                              {isFeePayerAny && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                  Fee Payer
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                g.portalStatus === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : g.portalStatus === "INVITED"
                                    ? "bg-violet-50 text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                                    : g.portalStatus === "SUSPENDED"
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-[#1B1F3F] dark:text-[#9DA6CC]"
                              }`}
                            >
                              {g.portalStatus.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => switchSection("profile", g.id)}
                                className="rounded-lg border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                                title="View Guardian 360°"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {permissions.canWrite && mode === "school" && (
                                <button
                                  type="button"
                                  onClick={() => setEditingGuardian(g)}
                                  className="rounded-lg border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                                  title="Edit Guardian"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {permissions.canLink && mode === "school" && (
                                <button
                                  type="button"
                                  onClick={() => setLinkingGuardian(g)}
                                  className="rounded-lg border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                                  title="Link Ward"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {permissions.canCommunicate && mode === "school" && (
                                <button
                                  type="button"
                                  onClick={() => setCommTargets([g])}
                                  className="rounded-lg border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                                  title="Send Message"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              <span>
                Showing {pagedGuardians.length} of {filteredGuardians.length} guardians
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setFilters((p) => ({ ...p, page: safePage - 1 }))}
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 font-bold disabled:opacity-50 dark:border-[#313761] dark:bg-[#10142C]"
                >
                  Prev
                </button>
                <span className="px-2 font-bold">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setFilters((p) => ({ ...p, page: safePage + 1 }))}
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 font-bold disabled:opacity-50 dark:border-[#313761] dark:bg-[#10142C]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOUSEHOLDS & SIBLINGS */}
      {section === "households" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                Detected Family Households &amp; Sibling Clusters
              </h2>
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Automatically groups siblings and duplicate guardian profiles sharing phone numbers or emails.
              </p>
            </div>
            {permissions.canLink && mode === "school" && (
              <button
                type="button"
                disabled={busyAction}
                onClick={handleAutoLinkHouseholds}
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sync &amp; Auto-Link All Households</span>
              </button>
            )}
          </div>

          {households.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CAD0EB] p-8 text-center text-xs text-[#76799C] dark:border-[#313761] dark:text-[#9DA6CC]">
              No multi-student households or duplicate guardian records detected yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {households.map((cluster) => (
                <div
                  key={cluster.clusterKey}
                  className="rounded-2xl border border-[#DFE3F5] bg-[#FAF8FE]/75 p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {cluster.householdLabel}
                      </h3>
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#663CF6] dark:text-[#C4B5FD]">
                        <Phone className="h-3 w-3" />
                        Matched by {cluster.matchBasis}: {cluster.matchValue}
                      </p>
                    </div>
                    {cluster.hasMultiGuardianMergeCandidate && permissions.canLink && mode === "school" && (
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => handleMergeCluster(cluster)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 cursor-pointer"
                      >
                        <GitMerge className="h-3 w-3" />
                        <span>Merge ({cluster.guardians.length})</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-[#76799C] dark:text-[#9DA6CC] mb-1">
                      Students / Siblings ({cluster.students.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.students.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-full border border-[#D6DBF0] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#1B1D45] dark:border-[#313761] dark:bg-[#141731] dark:text-[#DCE1F9]"
                        >
                          {s.studentName} · {s.currentGrade}
                        </span>
                      ))}
                    </div>
                  </div>

                  {cluster.hasUnlinkedSiblings && (
                    <p className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Some siblings share this contact but are not yet linked to one canonical guardian.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PORTAL ACCESS & CONSENTS */}
      {section === "portal" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                Parent Portal Onboarding &amp; Channel Consents
              </h2>
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Provision school-scoped Parent Portal accounts and audit SMS/WhatsApp/Media consents.
              </p>
            </div>
            {permissions.canPortal && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() =>
                    handlePortalAction(
                      snapshot.guardians
                        .filter((g) => g.portalStatus === "NOT_INVITED")
                        .slice(0, 50)
                        .map((g) => g.id),
                      "INVITE",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] cursor-pointer disabled:opacity-60"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Invite All Uninvited Guardians</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-extrabold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2.5">Guardian</th>
                  <th className="px-3 py-2.5">Portal Status</th>
                  <th className="px-3 py-2.5">Channels Enabled</th>
                  <th className="px-3 py-2.5">Media Consent</th>
                  <th className="px-3 py-2.5 text-right">Portal Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {snapshot.guardians.map((g) => (
                  <tr key={g.id}>
                    <td className="px-3 py-2.5 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {g.fullName}
                      <p className="text-[10px] font-normal text-[#76799C] dark:text-[#9DA6CC]">
                        {g.phone}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 font-bold">{g.portalStatus.replace("_", " ")}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                        {g.communicationPrefs.sms && (
                          <span className="rounded bg-[#EDE7FF] px-1.5 py-0.5 text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                            SMS
                          </span>
                        )}
                        {g.communicationPrefs.email && (
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                            Email
                          </span>
                        )}
                        {g.communicationPrefs.whatsapp && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            WhatsApp
                          </span>
                        )}
                        {g.communicationPrefs.inApp && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            App
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {g.communicationPrefs.mediaConsent ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Granted
                        </span>
                      ) : (
                        <span className="text-[#76799C] dark:text-[#9DA6CC]">Opted Out</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {permissions.canPortal && (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePortalAction([g.id], "INVITE")}
                            className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                          >
                            Invite
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePortalAction([g.id], "ACTIVATE")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer"
                          >
                            Activate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMMUNICATIONS */}
      {section === "communications" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                Guardian Communication Center
              </h2>
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Broadcast notices or follow up with guardians across SMS, Email, WhatsApp, and Portal App.
              </p>
            </div>
            {permissions.canCommunicate && mode === "school" && snapshot.guardians.length > 0 && (
              <button
                type="button"
                onClick={() => setCommTargets(snapshot.guardians.slice(0, 50))}
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Broadcast to Active Guardians</span>
              </button>
            )}
          </div>

          {snapshot.communications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CAD0EB] p-8 text-center text-xs text-[#76799C] dark:border-[#313761] dark:text-[#9DA6CC]">
              No guardian communications logged yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {snapshot.communications.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                      To: {c.recipientName} · [{c.channel}] {c.subject || "Notice"}
                    </span>
                    <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                      {new Date(c.createdAt).toLocaleString()} · {c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[#4D5072] dark:text-[#B4BDD9]">{c.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {addOpen && (
        <AddEditGuardianModal
          open={addOpen}
          mode="create"
          students={snapshot.students}
          onClose={() => setAddOpen(false)}
          onSave={handleCreateGuardian}
        />
      )}

      {editingGuardian && (
        <AddEditGuardianModal
          open={Boolean(editingGuardian)}
          mode="edit"
          guardian={editingGuardian}
          students={snapshot.students}
          onClose={() => setEditingGuardian(null)}
          onSave={(payload) => handleUpdateGuardian(editingGuardian.id, payload)}
        />
      )}

      {linkingGuardian && (
        <LinkWardModal
          open={Boolean(linkingGuardian)}
          guardian={linkingGuardian}
          students={snapshot.students}
          onClose={() => setLinkingGuardian(null)}
          onSave={(payload) => handleLinkWard(linkingGuardian.id, payload)}
        />
      )}

      {commTargets && (
        <SendGuardianCommModal
          open={Boolean(commTargets)}
          guardians={commTargets}
          onClose={() => setCommTargets(null)}
          onSend={handleSendCommunication}
        />
      )}
    </div>
  );
}
