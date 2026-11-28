"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  KeyRound,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type {
  PromotionAuditLogEntry,
  PromotionAuditLogsResponse,
  PromotionRoleConfigItem,
  PromotionRoleMatrixRow,
  PromotionSettingsSuiteConfig,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

const INPUT_CLS =
  "h-9 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

const MATRIX_CAPS = ["view", "create", "edit", "delete", "approve", "export"] as const;

export function SettingsAccessPermissionsTab({
  data,
  accessControl,
  canManageSettings,
  saving,
  onAccessChange,
  onReset,
  onSave,
}: {
  data: StudentPromotionOverviewData;
  accessControl: PromotionSettingsSuiteConfig["accessControl"];
  canManageSettings: boolean;
  saving: boolean;
  onAccessChange: (patch: Partial<PromotionSettingsSuiteConfig["accessControl"]>) => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState(
    accessControl.roles[0]?.id || "role-teacher",
  );
  const [newRoleName, setNewRoleName] = useState("");
  const [assignUserId, setAssignUserId] = useState(data.schoolStaff[0]?.id || "");
  const [assignClasses, setAssignClasses] = useState(data.grades.slice(0, 2).join(", ") || "Class I");

  const activeRole =
    accessControl.roles.find((r) => r.id === selectedRoleId) ?? accessControl.roles[0];

  const updateActiveRole = (patch: Partial<PromotionRoleConfigItem>) => {
    if (!activeRole) return;
    onAccessChange({
      roles: accessControl.roles.map((r) => (r.id === activeRole.id ? { ...r, ...patch } : r)),
    });
  };

  const toggleMatrixCell = (moduleName: string, cap: keyof PromotionRoleMatrixRow) => {
    if (!activeRole || !canManageSettings) return;
    const currentRow = activeRole.matrix[moduleName] ?? {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
    };
    updateActiveRole({
      matrix: {
        ...activeRole.matrix,
        [moduleName]: { ...currentRow, [cap]: !currentRow[cap] },
      },
    });
  };

  const roleUsers = accessControl.userAssignments.filter(
    (u) => !activeRole || u.roleName === activeRole.name,
  );

  const exportPermissionCsv = () => {
    if (!activeRole) return;
    const rows = Object.entries(activeRole.matrix).map(([mod, perms]) =>
      [mod, perms.view, perms.create, perms.edit, perms.delete, perms.approve, perms.export].join(","),
    );
    const csv = ["Module,View,Create,Edit,Delete,Approve,Export", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotion-permissions-${activeRole.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StudentKpiCard
          label="Total Roles"
          value={accessControl.roles.length}
          icon={<Shield className="h-5 w-5" />}
          tone="violet"
          subtitle="Promotion roles"
        />
        <StudentKpiCard
          label="School Staff"
          value={data.schoolStaff.length}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
          subtitle="Eligible staff members"
        />
        <StudentKpiCard
          label="Active Assignments"
          value={accessControl.userAssignments.filter((u) => u.active).length}
          icon={<UserCheck className="h-5 w-5" />}
          tone="emerald"
          subtitle="Explicit class bindings"
        />
        <StudentKpiCard
          label="Permission Modules"
          value={Object.keys(activeRole?.matrix ?? {}).length}
          icon={<KeyRound className="h-5 w-5" />}
          tone="amber"
          subtitle="Scoped controls"
        />
      </div>

      {/* Role Management + Role Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Role Management</h4>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 px-2">Role Name</th>
                <th className="py-2 px-2">Access Level</th>
                <th className="py-2 pl-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {accessControl.roles.map((r, idx) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`cursor-pointer ${
                    r.id === activeRole?.id
                      ? "bg-[#EDE7FF]/55 dark:bg-[#221A44]/70"
                      : "hover:bg-[#F6F5FF]/70 dark:hover:bg-[#1B1F3F]/60"
                  }`}
                >
                  <td className="py-2 pr-2 text-[#76799C]">{idx + 1}</td>
                  <td className="py-2 px-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {r.name}
                  </td>
                  <td className="py-2 px-2">
                    <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#4F27E8] dark:bg-[#251D4A] dark:text-[#DDD6FE]">
                      {r.accessLevel}
                    </span>
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {r.active ? "Active" : "Paused"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canManageSettings && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Add custom role (e.g. Exam Coordinator)"
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newRoleName.trim()) return;
                  const id = `role-${Date.now()}`;
                  const templateMatrix = activeRole?.matrix ?? accessControl.roles[0]!.matrix;
                  onAccessChange({
                    roles: [
                      ...accessControl.roles,
                      {
                        id,
                        name: newRoleName.trim(),
                        accessLevel: "Custom",
                        description: "Custom promotion access role.",
                        active: true,
                        matrix: JSON.parse(JSON.stringify(templateMatrix)),
                      },
                    ],
                  });
                  setSelectedRoleId(id);
                  setNewRoleName("");
                }}
                className="h-9 shrink-0 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Role</span>
              </button>
            </div>
          )}
        </div>

        {activeRole && (
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3 text-xs`}>
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
              Role Details
            </h4>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Role Name</span>
              <input
                type="text"
                disabled={!canManageSettings}
                value={activeRole.name}
                onChange={(e) => updateActiveRole({ name: e.target.value })}
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Access Level</span>
              <select
                disabled={!canManageSettings}
                value={activeRole.accessLevel}
                onChange={(e) =>
                  updateActiveRole({
                    accessLevel: e.target.value as PromotionRoleConfigItem["accessLevel"],
                  })
                }
                className={INPUT_CLS}
              >
                <option value="Full Access">Full Access</option>
                <option value="Manage">Manage</option>
                <option value="Limited">Limited</option>
                <option value="Custom">Custom</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Description</span>
              <textarea
                rows={2}
                disabled={!canManageSettings}
                value={activeRole.description}
                onChange={(e) => updateActiveRole({ description: e.target.value })}
                className="w-full rounded-xl border border-[#D9DEF2] bg-white p-2.5 text-xs text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              />
            </label>
          </div>
        )}
      </div>

      {/* 7x6 Permission Matrix */}
      {activeRole && (
        <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
          <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-2 dark:border-[#272B4D]">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Permission Matrix — {activeRole.name}
            </h4>
            <button
              type="button"
              onClick={exportPermissionCsv}
              className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Matrix CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                  <th className="py-2.5 px-4">Module / Permission</th>
                  {MATRIX_CAPS.map((cap) => (
                    <th key={cap} className="py-2.5 px-3 text-center capitalize">
                      {cap}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {Object.entries(activeRole.matrix).map(([modName, row]) => (
                  <tr key={modName}>
                    <td className="py-2.5 px-4 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {modName}
                    </td>
                    {MATRIX_CAPS.map((cap) => (
                      <td key={cap} className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={!canManageSettings}
                          checked={Boolean(row[cap])}
                          onChange={() => toggleMatrixCell(modName, cap)}
                          aria-label={`${modName} ${cap}`}
                          className="h-4 w-4 accent-[#663CF6]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Module Quick Controls + Assigned Users + Access Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            Access Policy
          </h4>
          {(
            [
              { key: "restrictToAssignedClasses", label: "Restrict Access to Assigned Classes" },
              { key: "viewOnlyNonClassTeachers", label: "Allow Only View for Non-Class Teachers" },
              { key: "requireApprovalForChanges", label: "Require Approval for Promotion Changes" },
              { key: "logAllPermissionChanges", label: "Log All Permission Changes" },
              { key: "exportOnlyAdminPrincipal", label: "Allow Export Only for Admin / Principal" },
            ] as const
          ).map((pol) => (
            <label
              key={pol.key}
              className="flex items-center justify-between py-1.5 border-b border-[#F2F4FC] last:border-0 cursor-pointer dark:border-[#232746]"
            >
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{pol.label}</span>
              <input
                type="checkbox"
                disabled={!canManageSettings}
                checked={accessControl.policies[pol.key]}
                onChange={(e) =>
                  onAccessChange({
                    policies: { ...accessControl.policies, [pol.key]: e.target.checked },
                  })
                }
                className="h-4 w-4 accent-[#663CF6]"
              />
            </label>
          ))}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Assigned Users ({activeRole?.name})
          </h4>
          {roleUsers.length === 0 ? (
            <p className="py-4 text-center text-[#76799C] dark:text-[#9DA6CC]">
              No explicit staff class bindings yet. Assign staff below.
            </p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-2">Staff Name</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2">Assigned Classes</th>
                  <th className="py-2 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {roleUsers.map((u) => (
                  <tr key={`${u.userId}-${u.roleName}`}>
                    <td className="py-2 pr-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {u.userName}
                    </td>
                    <td className="py-2 px-2">{u.roleName}</td>
                    <td className="py-2 px-2 text-[#4D5072] dark:text-[#B4BDD9]">
                      {u.assignedClasses}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {canManageSettings && data.schoolStaff.length > 0 && activeRole && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-2.5 text-xs font-semibold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              >
                {data.schoolStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={assignClasses}
                onChange={(e) => setAssignClasses(e.target.value)}
                placeholder="Class I, Class II"
                className={`${INPUT_CLS} flex-1 min-w-[140px]`}
              />
              <button
                type="button"
                onClick={() => {
                  const staff = data.schoolStaff.find((s) => s.id === assignUserId);
                  if (!staff) return;
                  onAccessChange({
                    userAssignments: [
                      ...accessControl.userAssignments.filter(
                        (a) => !(a.userId === staff.id && a.roleName === activeRole.name),
                      ),
                      {
                        userId: staff.id,
                        userName: staff.name,
                        roleName: activeRole.name,
                        assignedClasses: assignClasses.trim() || "All Classes",
                        active: true,
                      },
                    ],
                  });
                }}
                className="h-9 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
              >
                + Assign User
              </button>
            </div>
          )}
        </div>
      </div>

      {canManageSettings && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white px-4 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:bg-[#141731] dark:text-[#C5CCF0]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Access Settings"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function SettingsAuditLogsTab({
  mode,
  schoolId,
}: {
  mode: "school" | "platform";
  schoolId: string;
}) {
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Success" | "Warning" | "Failed">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [logsData, setLogsData] = useState<PromotionAuditLogsResponse | null>(null);
  const [selectedLog, setSelectedLog] = useState<PromotionAuditLogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const base =
        mode === "platform"
          ? `/api/platform/schools/${schoolId}/promotions?view=logs`
          : `/api/school/students/promotions/logs?`;
      const qs = new URLSearchParams();
      if (moduleFilter !== "ALL") qs.set("module", moduleFilter);
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      const url = mode === "platform" ? `${base}&${qs.toString()}` : `${base}${qs.toString()}`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) {
        setLogsData(json);
        if (Array.isArray(json.logs) && json.logs.length > 0) {
          setSelectedLog(json.logs[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [mode, schoolId, moduleFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const exportLogsCsv = () => {
    const rows = (logsData?.logs ?? []).map((l) =>
      [
        `"${l.createdAt}"`,
        `"${l.actorName}"`,
        `"${l.module}"`,
        `"${l.action}"`,
        `"${l.description.replace(/"/g, '""')}"`,
        `"${l.ipAddress}"`,
        `"${l.status}"`,
      ].join(","),
    );
    const csv = ["Timestamp,User,Module,Action,Description,IP Address,Status", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotion-audit-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil((logsData?.totalLogs ?? 0) / pageSize));
  const maxModCount = Math.max(1, ...(logsData?.moduleSummary.map((m) => m.count) ?? [1]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StudentKpiCard
          label="Total Logs"
          value={logsData?.totalLogs ?? 0}
          icon={<FileText className="h-5 w-5" />}
          tone="violet"
          subtitle="Promotion & settings audit trail"
        />
        <StudentKpiCard
          label="Unique Users"
          value={logsData?.uniqueUsers ?? 0}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
          subtitle="Actors recorded"
        />
        <StudentKpiCard
          label="Settings Changes"
          value={logsData?.settingsChanges ?? 0}
          icon={<Activity className="h-5 w-5" />}
          tone="amber"
          subtitle="Rules & config edits"
        />
        <StudentKpiCard
          label="Promotion Actions"
          value={logsData?.promotionActions ?? 0}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="emerald"
          subtitle="Batches & notifications"
        />
      </div>

      {/* Filter Logs Strip */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 flex flex-wrap items-end justify-between gap-3`}>
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <label className="flex flex-col gap-1 min-w-[160px]">
            <span className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
              Module
            </span>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className={INPUT_CLS}
            >
              <option value="ALL">All Modules</option>
              <option value="Promotion">Promotion</option>
              <option value="Promotion Rules">Promotion Rules</option>
              <option value="Settings">Settings</option>
              <option value="Notifications">Notifications</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 min-w-[140px]">
            <span className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "ALL" | "Success" | "Warning" | "Failed");
                setPage(1);
              }}
              className={INPUT_CLS}
            >
              <option value="ALL">All Status</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModuleFilter("ALL");
              setStatusFilter("ALL");
              setPage(1);
            }}
            className="h-9 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            className="h-9 inline-flex items-center gap-1 rounded-xl bg-[#EDE7FF] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:bg-[#251D4A] dark:text-[#DDD6FE]"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Apply Filter</span>
          </button>
          <button
            type="button"
            onClick={exportLogsCsv}
            className="h-9 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-3.5 text-xs font-bold text-white cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Audit Report</span>
          </button>
        </div>
      </div>

      {/* Audit Log Records Table */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 border-b border-[#EAEEFA] flex items-center justify-between dark:border-[#272B4D]">
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Audit Log Records
          </h4>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-7 rounded-lg border border-[#D9DEF2] bg-white px-2 text-xs font-bold dark:border-[#2E345E] dark:bg-[#10132A]"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Date &amp; Time</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#76799C]">
                    Loading audit logs...
                  </td>
                </tr>
              ) : (logsData?.logs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#76799C]">
                    No promotion audit logs recorded matching these filters yet.
                  </td>
                </tr>
              ) : (
                logsData!.logs.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedLog(row)}
                    className={`cursor-pointer transition-colors ${
                      selectedLog?.id === row.id
                        ? "bg-[#EDE7FF]/55 dark:bg-[#221A44]/70"
                        : "hover:bg-[#F6F5FF]/70 dark:hover:bg-[#1B1F3F]/60"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-[#76799C]">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#4D5072] dark:text-[#B4BDD9]">
                      {new Date(row.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {row.actorName}
                    </td>
                    <td className="py-2.5 px-3">{row.module}</td>
                    <td className="py-2.5 px-3">
                      <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#4F27E8] dark:bg-[#251D4A] dark:text-[#DDD6FE]">
                        {row.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[#4D5072] dark:text-[#B4BDD9]">
                      {row.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{row.ipAddress}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[#EAEEFA] flex items-center justify-between text-[11px] text-[#76799C] dark:border-[#272B4D]">
          <span>Total {logsData?.totalLogs ?? 0} log entries</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-bold text-[#08093B] dark:text-[#EEF0FF]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Bento: Log Details | Activity Summary | Top 5 Users */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-4 space-y-2 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            Log Details
          </h4>
          {selectedLog ? (
            <div className="space-y-1.5">
              <p><span className="text-[#76799C]">Log ID:</span> <span className="font-mono font-bold">{selectedLog.id}</span></p>
              <p><span className="text-[#76799C]">User:</span> <span className="font-bold">{selectedLog.actorName}</span></p>
              <p><span className="text-[#76799C]">Module:</span> <span className="font-bold">{selectedLog.module}</span></p>
              <p><span className="text-[#76799C]">IP Address:</span> <span className="font-mono">{selectedLog.ipAddress}</span></p>
              <div className="rounded-xl border border-[#EAEEFA] bg-[#FAF8FE] p-2.5 text-[11px] text-[#4D5072] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#B4BDD9]">
                {selectedLog.description}
              </div>
            </div>
          ) : (
            <p className="text-[#76799C] py-4">Select any log row above to inspect details.</p>
          )}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-4 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            Activity Summary
          </h4>
          {(logsData?.moduleSummary ?? []).length === 0 ? (
            <p className="text-[#76799C] py-4">No activity metrics yet.</p>
          ) : (
            logsData!.moduleSummary.map((m) => (
              <div key={m.module} className="space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>{m.module}</span>
                  <span>{m.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#EDE7FF] overflow-hidden dark:bg-[#232746]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#663CF6] to-[#4F27E8]"
                    style={{ width: `${Math.round((m.count / maxModCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-4 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            User Activity (Top 5)
          </h4>
          {(logsData?.topUsers ?? []).length === 0 ? (
            <p className="text-[#76799C] py-4">No user activity yet.</p>
          ) : (
            logsData!.topUsers.map((u) => (
              <div
                key={u.userName}
                className="flex items-center justify-between py-1 border-b border-[#F2F4FC] last:border-0 dark:border-[#232746]"
              >
                <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{u.userName}</span>
                <span className="font-semibold text-[#4F27E8] dark:text-[#C4B5FD]">
                  {u.count} actions
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
