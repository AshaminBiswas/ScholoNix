"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  GraduationCap,
  Headphones,
  IndianRupee,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
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
import type { SchoolSubTab } from "@/modules/platform/routing";
import { StudentManagementWorkspace } from "@/modules/students/components/student-management-workspace";
import type {
  StudentDashboardAnalytics,
  StudentWorkspaceSnapshot,
} from "@/modules/students/types";

const CARD_SURFACE =
  "rounded-[18px] border border-white/80 bg-white/85 backdrop-blur-md shadow-[0_8px_24px_rgba(79,39,232,0.06)] dark:border-[#272B4D] dark:bg-[#141731]/95 dark:shadow-[0_10px_28px_rgba(3,5,18,0.45)]";

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
  selectedSubTab,
  onSelectSubTab,
  selectedStudentId,
  onSelectStudentId,
  onRefreshSchools,
  onToast,
}: {
  schools: PlatformSchoolEntry[];
  selectedSchoolId: string | null;
  onSelectSchoolId: (id: string | null) => void;
  selectedSubTab?: SchoolSubTab;
  onSelectSubTab?: (tab: SchoolSubTab) => void;
  selectedStudentId?: string | null;
  onSelectStudentId?: (id: string | null) => void;
  onRefreshSchools: (filters?: { q?: string; status?: string; plan?: string }) => Promise<void>;
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [searching, setSearching] = useState(false);

  const [internalSubTab, setInternalSubTab] = useState<SchoolSubTab>("all");
  const [internalStudentId, setInternalStudentId] = useState<string | null>(null);
  const subTab = selectedSubTab ?? internalSubTab;
  const setSubTab = (next: SchoolSubTab) => {
    setInternalSubTab(next);
    onSelectSubTab?.(next);
  };
  const activeStudentId = selectedStudentId !== undefined ? selectedStudentId : internalStudentId;
  const setActiveStudentId = (nextId: string | null) => {
    setInternalStudentId(nextId);
    if (onSelectStudentId) {
      onSelectStudentId(nextId);
    } else if (nextId) {
      setInternalSubTab("students");
    }
  };
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);

  const selectedEntry = selectedSchoolId
    ? schools.find(
        (e) =>
          e.school.id === selectedSchoolId ||
          e.school.slug === selectedSchoolId ||
          e.school.uniqueId === selectedSchoolId,
      ) ?? null
    : null;
  const selectedSchoolKey = selectedEntry?.school.id ?? null;

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editBoard, setEditBoard] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editAddressLine, setEditAddressLine] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPinCode, setEditPinCode] = useState("");
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
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "ALL" | "ADMIN" | "STAFF" | "PARENT" | "STUDENT"
  >("ALL");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("STAFF");
  const [creatingUser, setCreatingUser] = useState(false);

  // Students & Parents sub-tab state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"ALL" | "ADMITTED" | "IN_PROGRESS">("ALL");
  const [studentSuiteData, setStudentSuiteData] = useState<{
    snapshot: StudentWorkspaceSnapshot;
    analytics: StudentDashboardAnalytics;
  } | null>(null);

  // Deep data & audit sub-tabs state
  const [schoolData, setSchoolData] = useState<PlatformSchoolDataInspectResult | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [schoolAuditLogs, setSchoolAuditLogs] = useState<PlatformAuditLogRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Sync form fields when selectedEntry changes
  useEffect(() => {
    if (!selectedEntry) return;
    const s = selectedEntry.school;
    setEditName(s.name);
    setEditCode(s.code || "");
    setEditBoard(s.affiliationBoard || "");
    setEditCategory(s.category || "");
    setEditPhone(s.contactPhone || "");
    setEditEmail(s.contactEmail || "");
    setEditWebsite(s.website || "");
    setEditAddressLine(s.addressLine || "");
    setEditCity(s.city || "");
    setEditState(s.state || "");
    setEditPinCode(s.pinCode || "");
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
    setStudentSuiteData(null);
    setDataError(null);
    setSchoolAuditLogs([]);
    setUserSearch("");
    setUserRoleFilter("ALL");
    setStudentSearch("");
    setStudentFilter("ALL");
  }, [selectedEntry]);

  // Client-side session cache for visited/hovered schools (eliminates repeat round trips)
  const schoolClientCacheRef = useRef<
    Map<
      string,
      {
        data?: PlatformSchoolDataInspectResult;
        studentSuite?: {
          snapshot: StudentWorkspaceSnapshot;
          analytics: StudentDashboardAnalytics;
        };
        users?: PlatformSchoolUserItem[];
        logs?: PlatformAuditLogRecord[];
        cachedAt: number;
      }
    >
  >(new Map());

  const prefetchSchoolInspect = (schoolId: string) => {
    const existing = schoolClientCacheRef.current.get(schoolId);
    if (existing && Date.now() - existing.cachedAt < 30_000) return;
    fetch(`/api/platform/schools/${schoolId}/data`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success && j.data) {
          const prev = schoolClientCacheRef.current.get(schoolId);
          schoolClientCacheRef.current.set(schoolId, {
            ...prev,
            data: j.data,
            cachedAt: Date.now(),
          });
        }
      })
      .catch(() => {});
  };

  // Load complete tenant inspect data, full users list, and audit trail (client cache + Upstash Redis backend)
  useEffect(() => {
    if (!selectedSchoolKey) return;
    let active = true;

    const cached = schoolClientCacheRef.current.get(selectedSchoolKey);
    const isFresh = Boolean(cached && Date.now() - cached.cachedAt < 30_000 && cached.data);

    if (cached?.data) {
      setSchoolData(cached.data);
    }
    if (cached?.studentSuite) {
      setStudentSuiteData(cached.studentSuite);
    }
    if (cached?.users) {
      setSchoolUsers(cached.users);
    }
    if (cached?.logs) {
      setSchoolAuditLogs(cached.logs);
    }
    if (isFresh) {
      setLoadingData(false);
      setLoadingUsers(false);
      setLoadingAudit(false);
      return;
    }

    setLoadingData(!cached?.data);
    setDataError(null);
    setLoadingUsers(!cached?.users);
    setLoadingAudit(!cached?.logs);

    Promise.allSettled([
      fetch(`/api/platform/schools/${selectedSchoolKey}/data`, { cache: "no-store" }).then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.success) {
          throw new Error(j?.error?.message || `Failed to load school data (${r.status}).`);
        }
        return j;
      }),
      fetch(`/api/platform/schools/${selectedSchoolKey}/users`, { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`/api/platform/audit-logs?schoolId=${encodeURIComponent(selectedSchoolKey)}`, {
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/platform/schools/${selectedSchoolKey}/students`, { cache: "no-store" }).then((r) =>
        r.ok ? r.json().catch(() => null) : null,
      ),
    ])
      .then(([dataRes, usersRes, auditRes, studentsSuiteRes]) => {
        if (!active) return;
        const entry = { ...(schoolClientCacheRef.current.get(selectedSchoolKey) ?? {}), cachedAt: Date.now() };
        if (dataRes.status === "fulfilled" && dataRes.value?.data) {
          setSchoolData(dataRes.value.data);
          entry.data = dataRes.value.data;
        } else if (dataRes.status === "rejected") {
          setDataError(
            dataRes.reason instanceof Error
              ? dataRes.reason.message
              : "Failed to load student and tenant data.",
          );
        }
        if (
          usersRes.status === "fulfilled" &&
          usersRes.value?.success &&
          Array.isArray(usersRes.value.users)
        ) {
          setSchoolUsers(usersRes.value.users);
          entry.users = usersRes.value.users;
        }
        if (
          auditRes.status === "fulfilled" &&
          auditRes.value?.success &&
          Array.isArray(auditRes.value.logs)
        ) {
          setSchoolAuditLogs(auditRes.value.logs);
          entry.logs = auditRes.value.logs;
        }
        if (
          studentsSuiteRes.status === "fulfilled" &&
          studentsSuiteRes.value?.success &&
          studentsSuiteRes.value?.snapshot &&
          studentsSuiteRes.value?.analytics
        ) {
          const suitePayload = {
            snapshot: studentsSuiteRes.value.snapshot as StudentWorkspaceSnapshot,
            analytics: studentsSuiteRes.value.analytics as StudentDashboardAnalytics,
          };
          setStudentSuiteData(suitePayload);
          entry.studentSuite = suitePayload;
        }
        schoolClientCacheRef.current.set(selectedSchoolKey, entry);
      })
      .finally(() => {
        if (!active) return;
        setLoadingData(false);
        setLoadingUsers(false);
        setLoadingAudit(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSchoolKey]);

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
      schoolClientCacheRef.current.delete(selectedEntry.school.id);
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
      schoolClientCacheRef.current.delete(selectedEntry.school.id);
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
      schoolClientCacheRef.current.delete(selectedEntry.school.id);
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
      schoolClientCacheRef.current.delete(selectedEntry.school.id);
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
      if (rJson.success && rJson.data) {
        setSchoolData(rJson.data);
        const prev = schoolClientCacheRef.current.get(selectedEntry.school.id);
        schoolClientCacheRef.current.set(selectedEntry.school.id, {
          ...prev,
          data: rJson.data,
          cachedAt: Date.now(),
        });
      }
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
        "Billing Cycle",
        "Subscription",
        "Board",
        "City",
        "State",
        "Phone",
        "Email",
        "Users",
        "Students",
        "Staff",
        "Applications",
        "Admitted",
        "Fee Collected (INR)",
        "SaaS Billed (INR)",
      ],
      schools.map((e) => [
        e.school.uniqueId || "",
        e.school.name,
        e.school.slug,
        e.school.status,
        e.school.plan,
        e.school.billingCycle,
        e.school.subscriptionStatus,
        e.school.affiliationBoard || "",
        e.school.city || "",
        e.school.state || "",
        e.school.contactPhone || "",
        e.school.contactEmail || "",
        e.counts.users,
        e.counts.studentCount ?? e.counts.admitted,
        e.counts.staffCount ?? e.counts.users,
        e.counts.applications,
        e.counts.admitted,
        (e.counts.feeCollectedPaise / 100).toFixed(2),
        (e.counts.saasBilledPaise / 100).toFixed(2),
      ]),
    );
  };

  const handleExportSchoolJson = () => {
    if (!selectedEntry) return;
    const payload = {
      exportedAtIso: new Date().toISOString(),
      school: selectedEntry.school,
      counts: selectedEntry.counts,
      users: schoolUsers,
      tenantData: schoolData,
      auditLogs: schoolAuditLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedEntry.school.slug}-complete-dossier.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return schoolUsers.filter((u) => {
      if (userRoleFilter === "ADMIN" && u.role !== "PRINCIPAL" && u.role !== "SCHOOL_ADMIN") {
        return false;
      }
      if (
        userRoleFilter === "STAFF" &&
        !["TEACHER", "ACCOUNTANT", "STAFF"].includes(u.role)
      ) {
        return false;
      }
      if (userRoleFilter === "PARENT" && u.role !== "PARENT") return false;
      if (userRoleFilter === "STUDENT" && u.role !== "STUDENT") return false;
      if (!q) return true;
      return [u.name, u.email, u.phone, u.role].some((v) =>
        v ? v.toLowerCase().includes(q) : false,
      );
    });
  }, [schoolUsers, userRoleFilter, userSearch]);

  const userBreakdown = useMemo(() => {
    const admins = schoolUsers.filter(
      (u) => u.role === "PRINCIPAL" || u.role === "SCHOOL_ADMIN",
    ).length;
    const staff = schoolUsers.filter((u) =>
      ["TEACHER", "ACCOUNTANT", "STAFF"].includes(u.role),
    ).length;
    const parents = schoolUsers.filter((u) => u.role === "PARENT").length;
    const students = schoolUsers.filter((u) => u.role === "STUDENT").length;
    return { admins, staff, parents, students };
  }, [schoolUsers]);

  const ledgerByApplicationId = useMemo(() => {
    const map = new Map<
      string,
      { totalFeePaise: number; paidPaise: number; outstandingPaise: number }
    >();
    for (const l of schoolData?.feeLedgers ?? []) {
      map.set(l.applicationId, {
        totalFeePaise: l.totalFeePaise,
        paidPaise: l.paidPaise,
        outstandingPaise: l.outstandingPaise,
      });
    }
    return map;
  }, [schoolData?.feeLedgers]);

  const filteredStudentsAndParents = useMemo(() => {
    const apps = schoolData?.applications ?? [];
    const q = studentSearch.trim().toLowerCase();
    return apps.filter((a) => {
      if (studentFilter === "ADMITTED" && a.status !== "ADMITTED") return false;
      if (studentFilter === "IN_PROGRESS" && a.status === "ADMITTED") return false;
      if (!q) return true;
      return [
        a.studentName,
        a.applicationCode,
        a.admissionNumber,
        a.gradeApplied,
        a.guardianName,
        a.guardianPhone,
        a.guardianEmail,
        a.fatherName,
        a.motherName,
      ].some((v) => (v ? v.toLowerCase().includes(q) : false));
    });
  }, [schoolData?.applications, studentFilter, studentSearch]);

  const selectedStudentRecord = useMemo(() => {
    if (!activeStudentId || !schoolData?.applications) return null;
    return (
      schoolData.applications.find(
        (a) =>
          a.id === activeStudentId ||
          a.applicationCode === activeStudentId ||
          a.admissionNumber === activeStudentId,
      ) ?? null
    );
  }, [activeStudentId, schoolData?.applications]);

  const selectedStudentLedger = useMemo(() => {
    if (!selectedStudentRecord) return null;
    return (
      schoolData?.feeLedgers.find((l) => l.applicationId === selectedStudentRecord.id) ?? null
    );
  }, [selectedStudentRecord, schoolData?.feeLedgers]);

  const selectedStudentReceipts = useMemo(() => {
    if (!selectedStudentRecord) return [];
    return (schoolData?.feePayments ?? []).filter(
      (p) =>
        p.applicationId === selectedStudentRecord.id ||
        p.studentName === selectedStudentRecord.studentName,
    );
  }, [selectedStudentRecord, schoolData?.feePayments]);

  const selectedStudentPortalUsers = useMemo(() => {
    if (!selectedStudentRecord) return [];
    const sd = (selectedStudentRecord.studentDetails || {}) as Record<string, unknown>;
    const targets = new Set(
      [
        selectedStudentRecord.guardianEmail,
        selectedStudentRecord.guardianPhone,
        typeof sd.email === "string" ? sd.email : null,
        typeof sd.phone === "string" ? sd.phone : null,
        selectedStudentRecord.fatherPhone,
        selectedStudentRecord.motherPhone,
      ]
        .filter((v): v is string => Boolean(v && v.trim()))
        .map((v) => v.trim().toLowerCase()),
    );
    if (targets.size === 0) return [];
    return schoolUsers.filter((u) =>
      [u.email, u.phone].some((f) => (f ? targets.has(f.trim().toLowerCase()) : false)),
    );
  }, [selectedStudentRecord, schoolUsers]);

  const selectedPlanCatalog = selectedEntry ? SAAS_PLAN_CATALOG[selectedEntry.school.plan] : null;
  const studentUsedCount = selectedEntry
    ? selectedEntry.counts.studentCount ?? selectedEntry.counts.admitted
    : 0;
  const staffUsedCount = selectedEntry
    ? selectedEntry.counts.staffCount ?? selectedEntry.counts.users
    : 0;

  return (
    <div className="space-y-5">
      {!selectedEntry ? (
        <>
          {/* ALL SCHOOLS LIST MODE: Search, Filter & Provision Bar */}
          <section className={`${CARD_SURFACE} p-5 space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                  All Schools List &amp; Client Directory
                </h2>
                <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
                  Click any school below to inspect complete profile details, subscription &amp; invoices, all user accounts, students &amp; parent records, fee ledgers, and audit trail.
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
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-4 py-2 text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(102,60,246,0.28)] hover:opacity-95 cursor-pointer"
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

          {/* FULL-WIDTH ALL SCHOOLS LIST */}
          {schools.length === 0 ? (
            <div className={`${CARD_SURFACE} p-10 text-center`}>
              <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                No matching schools found
              </p>
              <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Adjust your search filters or provision a new school above.
              </p>
            </div>
          ) : (
            <section className={`${CARD_SURFACE} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F5FD] text-[10px] font-extrabold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                    <tr>
                      <th className="px-4 py-3">School &amp; Unique ID</th>
                      <th className="px-4 py-3">Status &amp; Onboarding</th>
                      <th className="px-4 py-3">Subscription</th>
                      <th className="px-4 py-3">Users &amp; Students</th>
                      <th className="px-4 py-3 text-right">Student Fees / SaaS Billed</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                    {schools.map((entry) => {
                      const studentsUsed = entry.counts.studentCount ?? entry.counts.admitted;
                      return (
                        <tr
                          key={entry.school.id}
                          onMouseEnter={() => prefetchSchoolInspect(entry.school.id)}
                          className="hover:bg-[#FAF8FE] transition dark:hover:bg-[#1B1F3F]/60"
                        >
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => onSelectSchoolId(entry.school.id)}
                              className="text-left group cursor-pointer"
                            >
                              <p className="text-sm font-extrabold text-[#08093B] group-hover:text-[#663CF6] transition dark:text-[#F3F5FF] dark:group-hover:text-[#C4B5FD]">
                                {entry.school.name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="font-mono font-bold text-[#663CF6] dark:text-[#A78BFA]">
                                  {entry.school.uniqueId || entry.school.slug}
                                </span>
                                {(entry.school.city || entry.school.state) && (
                                  <span className="text-[#76799C] dark:text-[#9DA6CC]">
                                    · {[entry.school.city, entry.school.state].filter(Boolean).join(", ")}
                                  </span>
                                )}
                              </div>
                              {(entry.school.contactEmail || entry.school.contactPhone) && (
                                <p className="mt-0.5 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                  {[entry.school.contactEmail, entry.school.contactPhone].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <SchoolStatusBadge status={entry.school.status} />
                            <p className="mt-1 text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                              {entry.school.onboardingDone
                                ? "Onboarding Complete"
                                : `Onboarding Step ${entry.school.onboardingStep}`}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <PlanBadge plan={entry.school.plan} />
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                              {entry.school.subscriptionStatus} · {entry.school.billingCycle}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              {entry.counts.users} users · {studentsUsed} /{" "}
                              {entry.school.maxStudentsLimit.toLocaleString("en-IN")} students
                            </p>
                            <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                              {entry.counts.applications} apps · {entry.counts.enquiries} enquiries
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <p className="font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                              {formatInrFromPaise(entry.counts.feeCollectedPaise)}
                            </p>
                            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              SaaS: {formatInrFromPaise(entry.counts.saasBilledPaise)}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onSelectSchoolId(entry.school.id)}
                              className="inline-flex items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#8B5CF6] to-[#663CF6] px-3 py-1.5 text-[11px] font-extrabold text-white shadow-2xs hover:opacity-95 cursor-pointer"
                            >
                              <span>View All Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : (
        /* SELECTED SCHOOL FULL DETAILS DOSSIER MODE */
        <div className="space-y-5">
          {/* Top Back-to-All-Schools & Export Dossier Bar */}
          <div className={`${CARD_SURFACE} px-4 py-3 flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => onSelectSchoolId(null)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-extrabold text-[#08093B] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:hover:text-[#C4B5FD]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to All Schools</span>
              </button>
              <span className="text-xs font-semibold text-[#76799C] truncate dark:text-[#9DA6CC]">
                Clients / Schools /{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {selectedEntry.school.name}
                </strong>
                {subTab === "students" && activeStudentId && (
                  <>
                    {" / Students / "}
                    <strong className="text-[#663CF6] dark:text-[#C4B5FD]">
                      {selectedStudentRecord?.studentName || activeStudentId}
                    </strong>
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportSchoolJson}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
              >
                <FileJson className="h-3.5 w-3.5" />
                <span>Download Complete School Data (JSON)</span>
              </button>
            </div>
          </div>

          <section className={`${CARD_SURFACE} p-5 sm:p-6 space-y-5`}>
            {/* School Identity Hero Banner */}
            <div className="rounded-[18px] border border-[#DDD6FE] bg-gradient-to-br from-[#F7F3FF] via-white to-[#EDF6FF] p-4 sm:p-5 dark:border-[#342B63] dark:from-[#1B1740] dark:via-[#141731] dark:to-[#112038]">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#4F27E8] text-white shadow-xs">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                          {selectedEntry.school.name}
                        </h3>
                        <SchoolStatusBadge status={selectedEntry.school.status} />
                        <PlanBadge plan={selectedEntry.school.plan} />
                      </div>
                      <p className="text-[11px] font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                        {selectedEntry.school.category || "School"} ·{" "}
                        {selectedEntry.school.affiliationBoard || "Board Unspecified"} · Onboarded{" "}
                        {formatDateShort(selectedEntry.school.createdAt)} · Slug: /
                        {selectedEntry.school.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#EDE7FF] px-2.5 py-1 font-mono font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      <KeyRound className="h-3 w-3" />
                      <span>{selectedEntry.school.uniqueId || "N/A"}</span>
                    </span>
                    {selectedEntry.school.uniqueId && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(selectedEntry.school.id, selectedEntry.school.uniqueId!)
                        }
                        className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] bg-white px-2 py-1 font-bold text-[#4D5072] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0]"
                      >
                        {copiedId === selectedEntry.school.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedId === selectedEntry.school.id ? "Copied" : "Copy ID"}</span>
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1 text-[#4D5072] dark:text-[#9DA6CC]">
                      <MapPin className="h-3 w-3 text-[#663CF6] dark:text-[#A78BFA]" />
                      <span>
                        {[
                          selectedEntry.school.addressLine,
                          selectedEntry.school.city || "—",
                          selectedEntry.school.state || "—",
                          selectedEntry.school.pinCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                    {selectedEntry.school.contactPhone && (
                      <span className="inline-flex items-center gap-1 text-[#4D5072] dark:text-[#9DA6CC]">
                        <Phone className="h-3 w-3 text-[#663CF6] dark:text-[#A78BFA]" />
                        <span>{selectedEntry.school.contactPhone}</span>
                      </span>
                    )}
                    {selectedEntry.school.contactEmail && (
                      <span className="inline-flex items-center gap-1 text-[#4D5072] dark:text-[#9DA6CC]">
                        <Mail className="h-3 w-3 text-[#663CF6] dark:text-[#A78BFA]" />
                        <span>{selectedEntry.school.contactEmail}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/${selectedEntry.school.slug}` as Route}
                    className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:opacity-95"
                  >
                    <span>Open School Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 6-Card School KPI & Subscription Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Total Users
                </p>
                <p className="mt-0.5 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {schoolUsers.length || selectedEntry.counts.users}
                </p>
                <p className="text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                  {staffUsedCount} staff / {selectedEntry.school.maxStaffLimit} cap
                </p>
              </div>

              <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Students
                </p>
                <p className="mt-0.5 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {studentUsedCount}
                </p>
                <p className="text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                  of {selectedEntry.school.maxStudentsLimit.toLocaleString("en-IN")} seats
                </p>
              </div>

              <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Applications
                </p>
                <p className="mt-0.5 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {selectedEntry.counts.applications}
                </p>
                <p className="text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                  {selectedEntry.counts.enquiries} enquiries
                </p>
              </div>

              <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Student Fees
                </p>
                <p className="mt-0.5 text-lg font-black text-[#663CF6] dark:text-[#C4B5FD]">
                  {formatInrFromPaise(selectedEntry.counts.feeCollectedPaise)}
                </p>
                <p className="text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                  {selectedEntry.counts.admitted} admitted
                </p>
              </div>

              <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Subscription
                </p>
                <p className="mt-0.5 text-sm font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {selectedPlanCatalog?.name}
                </p>
                <p className="text-[10px] font-bold text-[#663CF6] dark:text-[#CBB8FF]">
                  {selectedEntry.school.subscriptionStatus} · {selectedEntry.school.billingCycle}
                </p>
              </div>

              <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  SaaS Billed
                </p>
                <p className="mt-0.5 text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatInrFromPaise(selectedEntry.counts.saasBilledPaise)}
                </p>
                <p className="text-[10px] text-[#4D5072] truncate dark:text-[#9DA6CC]">
                  {selectedEntry.school.trialEndsAt
                    ? `Trial: ${formatDateShort(selectedEntry.school.trialEndsAt)}`
                    : "Active term"}
                </p>
              </div>
            </div>

            {dataError && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{dataError}</span>
                </span>
              </div>
            )}

            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-1.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-1 dark:border-[#272B4D] dark:bg-[#10142C]">
              {(
                [
                  { id: "all", label: "All Details", icon: Layers },
                  { id: "profile", label: "Profile & Lifecycle", icon: Building2 },
                  { id: "plan", label: "Plan & Modules", icon: Settings2 },
                  { id: "users", label: "Users & Sessions", icon: Users },
                  { id: "students", label: "Students & Parents", icon: GraduationCap },
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
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#663CF6] text-white shadow-2xs"
                        : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC] dark:hover:text-[#F3F5FF]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB 0: ALL DETAILS (EVERYTHING ABOUT THE SELECTED SCHOOL) */}
            {subTab === "all" && (
              <div className="space-y-6">
                {/* 1. Complete School Profile & Configuration */}
                <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 sm:p-5 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
                      <Building2 className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                      <span>Complete School Profile &amp; Contact Information</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSubTab("profile")}
                      className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                    >
                      Edit Profile &amp; Lifecycle →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">School Code / Slug</p>
                      <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.code || "—"} · /{selectedEntry.school.slug}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Website</p>
                      <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {selectedEntry.school.website || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Onboarding Stage</p>
                      <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.onboardingDone
                          ? "Completed"
                          : `Step ${selectedEntry.school.onboardingStep}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Country</p>
                      <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.country || "IN"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Full Address</p>
                      <p className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                        {[
                          selectedEntry.school.addressLine,
                          selectedEntry.school.city,
                          selectedEntry.school.state,
                          selectedEntry.school.pinCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No address provided"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Internal Company Notes / Suspension</p>
                      <p className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.suspendedReason
                          ? `Suspended: ${selectedEntry.school.suspendedReason}`
                          : selectedEntry.school.internalNotes || "None"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Complete Subscription, Modules & SaaS Invoices */}
                <div className="rounded-[16px] border border-[#DDD6FE] bg-[#FAF8FE] p-4 sm:p-5 space-y-4 dark:border-[#322960] dark:bg-[#10142C]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
                      <CreditCard className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                      <span>
                        Active Subscription: {selectedPlanCatalog?.name} ({selectedEntry.school.billingCycle})
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSubTab("plan")}
                      className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                    >
                      Manage Plan &amp; Modules →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-3 dark:border-[#272B4D] dark:bg-[#141731]">
                      <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">Pricing &amp; Status</p>
                      <p className="mt-1 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.billingCycle === "YEARLY"
                          ? `${formatInrFromPaise(selectedPlanCatalog?.yearlyTotalPaise ?? 0)} / yr`
                          : `${formatInrFromPaise(selectedPlanCatalog?.monthlyPaise ?? 0)} / mo`}
                      </p>
                      <p className="text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                        Status: {selectedEntry.school.subscriptionStatus}
                        {selectedEntry.school.trialEndsAt
                          ? ` · Trial Ends ${formatDateShort(selectedEntry.school.trialEndsAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-3 space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>Student Seat Utilization</span>
                        <span>
                          {studentUsedCount} / {selectedEntry.school.maxStudentsLimit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#EDE7FF] overflow-hidden dark:bg-[#251D4A]">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#663CF6]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (studentUsedCount / Math.max(1, selectedEntry.school.maxStudentsLimit)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-3 space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>Staff Seat Utilization</span>
                        <span>
                          {staffUsedCount} / {selectedEntry.school.maxStaffLimit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E6F4FE] overflow-hidden dark:bg-[#10243D]">
                        <div
                          className="h-full bg-[#0EA5E9]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (staffUsedCount / Math.max(1, selectedEntry.school.maxStaffLimit)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {MODULE_FLAG_LABELS.map((m) => {
                      const on = selectedEntry.school.enabledModules?.[m.key] ?? true;
                      return (
                        <span
                          key={m.key}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            on
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
                              : "bg-slate-100 border border-slate-200 text-slate-500 line-through dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {m.label}
                        </span>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      SaaS Subscription Invoices ({schoolData?.saasInvoices?.length ?? 0})
                    </p>
                    <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#141731]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                          <tr>
                            <th className="px-3 py-2">Invoice #</th>
                            <th className="px-3 py-2">Plan &amp; Cycle</th>
                            <th className="px-3 py-2">Period</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                          {!schoolData?.saasInvoices || schoolData.saasInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-[#76799C] dark:text-[#9DA6CC]">
                                No SaaS subscription invoices issued yet.
                              </td>
                            </tr>
                          ) : (
                            schoolData.saasInvoices.map((inv) => (
                              <tr key={inv.id}>
                                <td className="px-3 py-2 font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="px-3 py-2">{SAAS_PLAN_CATALOG[inv.plan]?.name} · {inv.billingCycle}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {formatDateShort(inv.periodStart)} – {formatDateShort(inv.periodEnd)}
                                </td>
                                <td className="px-3 py-2 text-right font-bold">{formatInrFromPaise(inv.amountPaise)}</td>
                                <td className="px-3 py-2 font-bold">{inv.status}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 3. All Users & Accounts Summary */}
                <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 sm:p-5 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
                      <Users className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                      <span>All School Users ({schoolUsers.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSubTab("users")}
                      className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                    >
                      Manage / Create Users →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Admins / Principals</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.admins}</p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Teachers / Staff</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.staff}</p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Parents</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.parents}</p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-white p-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Student Logins</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.students}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#141731]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                        <tr>
                          <th className="px-3 py-2">User</th>
                          <th className="px-3 py-2">Email &amp; Phone</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Verified</th>
                          <th className="px-3 py-2 text-center">Sessions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                        {loadingUsers && schoolUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center text-[#76799C]">
                              Loading users...
                            </td>
                          </tr>
                        ) : schoolUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center text-[#76799C]">
                              No users registered for this school yet.
                            </td>
                          </tr>
                        ) : (
                          schoolUsers.map((u) => (
                            <tr key={u.id}>
                              <td className="px-3 py-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">{u.name}</td>
                              <td className="px-3 py-2 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                {u.email || "—"} · {u.phone || "—"}
                              </td>
                              <td className="px-3 py-2 font-bold">{u.role}</td>
                              <td className="px-3 py-2">{u.status}</td>
                              <td className="px-3 py-2 text-[10px] font-bold">
                                {u.emailVerified ? "Email ✓" : "Email Pending"} ·{" "}
                                {u.phoneVerified ? "Phone ✓" : "Phone Pending"}
                              </td>
                              <td className="px-3 py-2 text-center font-bold">{u.activeSessionCount ?? 0}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Students & Parents Complete Directory */}
                <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 sm:p-5 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
                      <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                      <span>Students &amp; Parents Directory ({schoolData?.applications.length ?? 0})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSubTab("students")}
                      className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                    >
                      Filter &amp; Export Students →
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#141731]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                        <tr>
                          <th className="px-3 py-2">Student Details</th>
                          <th className="px-3 py-2">Class &amp; Session</th>
                          <th className="px-3 py-2">Parent / Guardian Details</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Fee Summary</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                        {loadingData ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-5 text-center text-[#76799C]">
                              Loading student &amp; parent records...
                            </td>
                          </tr>
                        ) : !schoolData?.applications || schoolData.applications.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-5 text-center text-[#76799C]">
                              No student or guardian records recorded for this school yet.
                            </td>
                          </tr>
                        ) : (
                          schoolData.applications.map((a) => {
                            const ledger = ledgerByApplicationId.get(a.id);
                            return (
                              <tr key={a.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B1F3F]/50">
                                <td className="px-3 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveStudentId(a.id)}
                                    className="text-left font-extrabold text-[#08093B] hover:text-[#663CF6] cursor-pointer dark:text-[#F3F5FF] dark:hover:text-[#C4B5FD]"
                                  >
                                    {a.studentName}
                                  </button>
                                  <p className="font-mono text-[10px] text-[#663CF6] dark:text-[#C4B5FD]">
                                    {a.admissionNumber || a.applicationCode}
                                  </p>
                                  {(a.gender || a.dateOfBirth || a.bloodGroup) && (
                                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                      {[a.gender, a.dateOfBirth, a.bloodGroup].filter(Boolean).join(" · ")}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <p className="font-bold">{a.gradeApplied}</p>
                                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">AY {a.academicYear}</p>
                                </td>
                                <td className="px-3 py-2.5">
                                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                    {a.guardianName}{" "}
                                    <span className="font-normal text-[#76799C] dark:text-[#9DA6CC]">
                                      ({a.guardianRelation || "Parent"})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                    {a.guardianPhone}
                                    {a.guardianEmail ? ` · ${a.guardianEmail}` : ""}
                                  </p>
                                  {(a.fatherName || a.motherName) && (
                                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                      {a.fatherName ? `F: ${a.fatherName}` : ""}
                                      {a.fatherName && a.motherName ? " · " : ""}
                                      {a.motherName ? `M: ${a.motherName}` : ""}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="font-bold text-[#663CF6] dark:text-[#CBB8FF]">{a.status}</span>
                                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{a.enrollmentStatus}</p>
                                </td>
                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                  {ledger ? (
                                    <div>
                                      <p className="font-bold text-emerald-600 dark:text-emerald-300">
                                        Paid: {formatInrFromPaise(ledger.paidPaise)}
                                      </p>
                                      <p className="text-[10px] text-amber-600 dark:text-amber-300">
                                        Due: {formatInrFromPaise(ledger.outstandingPaise)}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-[#76799C]">No ledger</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setActiveStudentId(a.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#D6DBF0] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                                  >
                                    <span>View Student</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Enquiries, Fee Receipts, Support & Audit Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                        Admissions Enquiries ({schoolData?.enquiries.length ?? 0}) &amp; Fee Receipts ({schoolData?.feePayments.length ?? 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSubTab("fees")}
                        className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                      >
                        Open Fee Ledgers →
                      </button>
                    </div>
                    <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                      AY: {String(schoolData?.settings?.currentAcademicYear || "—")} · Prefix:{" "}
                      {String(schoolData?.settings?.applicationPrefix || "APP")} · Ledgers:{" "}
                      {schoolData?.feeLedgers.length ?? 0}
                    </p>
                    {schoolData?.feePayments && schoolData.feePayments.length > 0 ? (
                      <div className="space-y-1.5">
                        {schoolData.feePayments.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-lg border border-[#DFE3F5] bg-white px-3 py-1.5 text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                          >
                            <span>
                              <strong className="font-mono text-[#663CF6] dark:text-[#C4B5FD]">{p.receiptNumber}</strong>{" "}
                              · {p.studentName} ({p.feeHead})
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-300">
                              {formatInrFromPaise(p.amountPaise)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                        No student fee payment receipts recorded yet.
                      </p>
                    )}
                  </div>

                  <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                        Audit Trail ({schoolAuditLogs.length}) &amp; Support Tickets ({schoolData?.supportTickets?.length ?? 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSubTab("audit")}
                        className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                      >
                        Open Audit &amp; Support →
                      </button>
                    </div>
                    {schoolAuditLogs.length === 0 && (!schoolData?.supportTickets || schoolData.supportTickets.length === 0) ? (
                      <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                        No audit logs or support tickets recorded for this school yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {schoolAuditLogs.slice(0, 4).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg border border-[#DFE3F5] bg-white px-3 py-1.5 text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                          >
                            <span className="font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">{log.action}</span>
                            <span className="text-[#76799C] dark:text-[#9DA6CC]">
                              {log.actorName || "System"} · {formatDateShort(log.createdAt)}
                            </span>
                          </div>
                        ))}
                        {(schoolData?.supportTickets ?? []).slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-lg border border-[#DFE3F5] bg-white px-3 py-1.5 text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                          >
                            <span>
                              <strong className="font-mono">{t.referenceCode}</strong> · {t.subject}
                            </span>
                            <span className="font-bold">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 1: PROFILE & LIFECYCLE */}
              {subTab === "profile" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                      <label className="block text-xs font-bold mb-1">School Code</label>
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
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
                      <label className="block text-xs font-bold mb-1">Category</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
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
                      <label className="block text-xs font-bold mb-1">Website</label>
                      <input
                        type="text"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        placeholder="https://school.edu.in"
                        className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold mb-1">Street Address</label>
                      <input
                        type="text"
                        value={editAddressLine}
                        onChange={(e) => setEditAddressLine(e.target.value)}
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
                      <label className="block text-xs font-bold mb-1">PIN Code</label>
                      <input
                        type="text"
                        value={editPinCode}
                        onChange={(e) => setEditPinCode(e.target.value)}
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
                            code: editCode,
                            affiliationBoard: editBoard,
                            category: editCategory,
                            contactPhone: editPhone,
                            contactEmail: editEmail,
                            website: editWebsite,
                            addressLine: editAddressLine,
                            city: editCity,
                            state: editState,
                            pinCode: editPinCode,
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

              {/* SUB-TAB 2: SUBSCRIPTION, PLAN, QUOTAS, INVOICES & MODULES */}
              {subTab === "plan" && (
                <div className="space-y-5">
                  {/* Current Subscription & Seat Utilization Card */}
                  <div className="rounded-[16px] border border-[#DDD6FE] bg-[#FAF8FE] p-4 space-y-4 dark:border-[#322960] dark:bg-[#10142C]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                          <CreditCard className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                            Active Subscription: {selectedPlanCatalog?.name} ({selectedEntry.school.billingCycle})
                          </p>
                          <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                            Rate:{" "}
                            {selectedEntry.school.billingCycle === "YEARLY"
                              ? `${formatInrFromPaise(selectedPlanCatalog?.yearlyTotalPaise ?? 0)} / yr`
                              : `${formatInrFromPaise(selectedPlanCatalog?.monthlyPaise ?? 0)} / mo`}{" "}
                            · Status: <strong>{selectedEntry.school.subscriptionStatus}</strong>
                            {selectedEntry.school.trialEndsAt
                              ? ` · Trial Ends ${formatDateShort(selectedEntry.school.trialEndsAt)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                        <Calendar className="h-3 w-3" />
                        <span>Total Billed: {formatInrFromPaise(selectedEntry.counts.saasBilledPaise)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#DFE3F5] bg-white p-3 space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>Student Seat Utilization</span>
                          <span>
                            {studentUsedCount} / {selectedEntry.school.maxStudentsLimit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#EDE7FF] overflow-hidden dark:bg-[#251D4A]">
                          <div
                            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#663CF6]"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (studentUsedCount / Math.max(1, selectedEntry.school.maxStudentsLimit)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#DFE3F5] bg-white p-3 space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>Staff Seat Utilization</span>
                          <span>
                            {staffUsedCount} / {selectedEntry.school.maxStaffLimit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E6F4FE] overflow-hidden dark:bg-[#10243D]">
                          <div
                            className="h-full bg-[#0EA5E9]"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (staffUsedCount / Math.max(1, selectedEntry.school.maxStaffLimit)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plan & Quotas Form */}
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

                  {/* School SaaS Subscription Invoices History */}
                  <div className="space-y-2.5 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      SaaS Subscription Invoices ({schoolData?.saasInvoices?.length ?? 0})
                    </p>
                    <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                          <tr>
                            <th className="px-3 py-2">Invoice #</th>
                            <th className="px-3 py-2">Plan &amp; Cycle</th>
                            <th className="px-3 py-2">Period</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                          {!schoolData?.saasInvoices || schoolData.saasInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-5 text-center text-[#76799C] dark:text-[#9DA6CC]">
                                No SaaS subscription invoices issued for this school yet.
                              </td>
                            </tr>
                          ) : (
                            schoolData.saasInvoices.map((inv) => (
                              <tr key={inv.id}>
                                <td className="px-3 py-2 font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="px-3 py-2">
                                  {SAAS_PLAN_CATALOG[inv.plan]?.name} · {inv.billingCycle}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {formatDateShort(inv.periodStart)} – {formatDateShort(inv.periodEnd)}
                                </td>
                                <td className="px-3 py-2 text-right font-bold">
                                  {formatInrFromPaise(inv.amountPaise)}
                                </td>
                                <td className="px-3 py-2 font-bold">{inv.status}</td>
                                <td className="px-3 py-2 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                  {inv.paymentMode || "—"} {inv.paidAt ? `(${formatDateShort(inv.paidAt)})` : ""}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: ALL USERS DETAILS & SESSIONS */}
              {subTab === "users" && (
                <div className="space-y-4">
                  {/* Role Summary Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] p-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Admins / Principals</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.admins}</p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] p-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Teachers / Staff</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.staff}</p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] p-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Parents</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.parents}</p>
                    </div>
                    <div className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] p-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                      <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Student Logins</p>
                      <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">{userBreakdown.students}</p>
                    </div>
                  </div>

                  {/* Add User Form */}
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

                  {/* Search + Role Filter + Export */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: "ALL", label: `All (${schoolUsers.length})` },
                          { id: "ADMIN", label: "Admins" },
                          { id: "STAFF", label: "Staff" },
                          { id: "PARENT", label: "Parents" },
                          { id: "STUDENT", label: "Students" },
                        ] as const
                      ).map((rf) => (
                        <button
                          key={rf.id}
                          type="button"
                          onClick={() => setUserRoleFilter(rf.id)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold cursor-pointer ${
                            userRoleFilter === rf.id
                              ? "bg-[#663CF6] text-white"
                              : "border border-[#D6DBF0] bg-white text-[#4D5072] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                          }`}
                        >
                          {rf.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="search"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Filter users..."
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          exportRowsToCsv(
                            `${selectedEntry.school.slug}-users.csv`,
                            ["Name", "Email", "Phone", "Role", "Status", "Email Verified", "Phone Verified", "Joined"],
                            filteredUsers.map((u) => [
                              u.name,
                              u.email || "",
                              u.phone || "",
                              u.role,
                              u.status,
                              u.emailVerified ? "Yes" : "No",
                              u.phoneVerified ? "Yes" : "No",
                              formatDateShort(u.createdAt),
                            ]),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CAD0EB] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  {loadingUsers ? (
                    <div className="py-6 text-center text-xs text-[#76799C]">Loading users...</div>
                  ) : (
                    <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                          <tr>
                            <th className="px-3 py-2">User &amp; Contact</th>
                            <th className="px-3 py-2">Verification</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-center">Sessions</th>
                            <th className="px-3 py-2">Joined</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                          {filteredUsers.map((u) => (
                            <tr key={u.id}>
                              <td className="px-3 py-2">
                                <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{u.name}</p>
                                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                  {u.email || "—"} · {u.phone || "—"}
                                </p>
                              </td>
                              <td className="px-3 py-2 text-[10px] font-bold whitespace-nowrap">
                                <span
                                  className={
                                    u.emailVerified && u.phoneVerified
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-amber-600 dark:text-amber-400"
                                  }
                                >
                                  {u.emailVerified ? "Email ✓" : "Email Pending"} ·{" "}
                                  {u.phoneVerified ? "Phone ✓" : "Phone Pending"}
                                </span>
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
                              <td className="px-3 py-2 whitespace-nowrap text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                {formatDateShort(u.createdAt)}
                              </td>
                              <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
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

              {/* SUB-TAB 4: STUDENTS & PARENTS DIRECTORY / STUDENT DETAILS DOSSIER */}
              {subTab === "students" && (
                activeStudentId ? (
                  (() => {
                    const matchedSuiteStu = studentSuiteData?.snapshot.students.find(
                      (s) => s.id === activeStudentId || s.applicationId === activeStudentId,
                    );
                    if (studentSuiteData && matchedSuiteStu) {
                      return (
                        <div className="space-y-4">
                          <div className="rounded-[18px] border border-[#DDD6FE] bg-[#FAF8FE]/70 p-4 sm:p-5 dark:border-[#2E2A5C] dark:bg-[#10142C]/80">
                            <StudentManagementWorkspace
                              mode="platform"
                              schoolId={selectedEntry.school.id}
                              initialSnapshot={studentSuiteData.snapshot}
                              initialAnalytics={studentSuiteData.analytics}
                              initialSection="profile"
                              initialStudentId={matchedSuiteStu.id}
                              onSelectedStudentUrlChange={(sec, stuId) => {
                                if (sec === "profile" && stuId) {
                                  setActiveStudentId(stuId);
                                } else if (sec !== "profile") {
                                  setActiveStudentId(null);
                                }
                              }}
                              permissions={{
                                canCreate: true,
                                canEdit: true,
                                canPromote: true,
                                canTransfer: true,
                                canExport: true,
                                canManageSettings: true,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStudentId(null)}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-extrabold text-[#08093B] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Students List</span>
                      </button>

                      {selectedStudentRecord && (
                        <button
                          type="button"
                          onClick={() => {
                            const payload = {
                              exportedAtIso: new Date().toISOString(),
                              schoolId: selectedEntry.school.id,
                              schoolName: selectedEntry.school.name,
                              student: selectedStudentRecord,
                              feeLedger: selectedStudentLedger,
                              feeReceipts: selectedStudentReceipts,
                              linkedPortalUsers: selectedStudentPortalUsers,
                            };
                            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `${selectedEntry.school.slug}-${selectedStudentRecord.applicationCode}-student.json`;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                        >
                          <FileJson className="h-3.5 w-3.5" />
                          <span>Download Student Dossier (JSON)</span>
                        </button>
                      )}
                    </div>

                    {loadingData && !selectedStudentRecord ? (
                      <div className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                        Loading complete student &amp; parent profile...
                      </div>
                    ) : !selectedStudentRecord ? (
                      <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-8 text-center space-y-2 dark:border-[#272B4D] dark:bg-[#10142C]">
                        <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                          Student record not found
                        </p>
                        <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                          No admission or student profile matched &ldquo;{activeStudentId}&rdquo; in {selectedEntry.school.name}.
                        </p>
                      </div>
                    ) : (
                      (() => {
                        const st = selectedStudentRecord;
                        const sd = (st.studentDetails || {}) as Record<string, unknown>;
                        const sAddr = (sd.address || {}) as Record<string, unknown>;
                        const gd = (st.guardianDetails || {}) as Record<string, unknown>;
                        const gPrimary = (gd.primary || {}) as Record<string, unknown>;
                        const gSecondary = (gd.secondary || {}) as Record<string, unknown>;
                        const gAddr = (gd.address || {}) as Record<string, unknown>;
                        const ad = (st.academicDetails || {}) as Record<string, unknown>;
                        const prevRows = Array.isArray(ad.previousAcademics)
                          ? (ad.previousAcademics as Array<Record<string, unknown>>)
                          : [];
                        return (
                          <div className="space-y-4">
                            {/* Student Identity Hero */}
                            <div className="rounded-[16px] border border-[#DDD6FE] bg-gradient-to-br from-[#F7F3FF] via-white to-[#EDF6FF] p-4 sm:p-5 dark:border-[#342B63] dark:from-[#1B1740] dark:via-[#141731] dark:to-[#112038]">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#4F27E8] text-white">
                                      <GraduationCap className="h-4 w-4" />
                                    </span>
                                    <h4 className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                                      {st.studentName}
                                    </h4>
                                    <span className="rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                                      {st.status}
                                    </span>
                                    <span className="rounded-full border border-[#D6DBF0] bg-white px-2.5 py-0.5 text-[10px] font-bold dark:border-[#343B6B] dark:bg-[#10142C]">
                                      {st.enrollmentStatus}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                                    <span className="font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                                      {st.admissionNumber || st.applicationCode}
                                    </span>
                                    {st.admissionNumber ? ` · App ${st.applicationCode}` : ""}
                                    {st.studentIdNumber ? ` · Student ID ${st.studentIdNumber}` : ""}
                                    {` · ${st.gradeApplied} · AY ${st.academicYear}`}
                                    {st.admissionType ? ` · ${st.admissionType}` : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    aria-label={`Update status for ${st.studentName}`}
                                    value={st.status}
                                    onChange={(e) =>
                                      void handleTenantDataMutation(
                                        {
                                          action: "update_application_status",
                                          applicationId: st.id,
                                          status: e.target.value,
                                        },
                                        `Updated ${st.studentName} status to ${e.target.value}.`,
                                      )
                                    }
                                    className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
                                  >
                                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                                    <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
                                    <option value="SHORTLISTED">SHORTLISTED</option>
                                    <option value="ADMITTED">ADMITTED</option>
                                    <option value="REJECTED">REJECTED</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Personal & Contact + Guardian/Parent Details */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                                <h5 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                                  Student Personal &amp; Contact Details
                                </h5>
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Gender</p>
                                    <p className="font-bold">{st.gender || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Date of Birth</p>
                                    <p className="font-bold">{st.dateOfBirth || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Blood Group</p>
                                    <p className="font-bold">{st.bloodGroup || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Nationality</p>
                                    <p className="font-bold">{st.nationality || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Student Email</p>
                                    <p className="font-semibold break-all">{String(sd.email || "—")}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Student Phone</p>
                                    <p className="font-semibold">{String(sd.phone || "—")}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Residential Address</p>
                                    <p className="font-semibold">
                                      {[
                                        sAddr.addressLine1,
                                        sAddr.addressLine2,
                                        sAddr.city,
                                        sAddr.state,
                                        sAddr.postalCode,
                                      ]
                                        .filter(Boolean)
                                        .join(", ") || "Not provided"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Applied On</p>
                                    <p className="font-semibold">{formatDateShort(st.appliedAt)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Admitted / Verified</p>
                                    <p className="font-semibold">
                                      {st.admittedAt ? formatDateShort(st.admittedAt) : st.verificationStatus}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                                <h5 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                                  Parent, Guardian &amp; Emergency Details
                                </h5>
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Primary Guardian</p>
                                    <p className="font-bold">
                                      {String(gPrimary.fullName || st.guardianName)} (
                                      {String(gPrimary.relationship || st.guardianRelation || "Parent")})
                                    </p>
                                    <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                      {String(gPrimary.phone || st.guardianPhone)}
                                      {gPrimary.email || st.guardianEmail
                                        ? ` · ${String(gPrimary.email || st.guardianEmail)}`
                                        : ""}
                                    </p>
                                    {Boolean(gPrimary.occupation || gPrimary.annualIncome) && (
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                        {[gPrimary.occupation, gPrimary.annualIncome]
                                          .filter(Boolean)
                                          .map(String)
                                          .join(" · ")}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Secondary Guardian</p>
                                    {Boolean(gSecondary.fullName) ? (
                                      <>
                                        <p className="font-bold">
                                          {String(gSecondary.fullName)} ({String(gSecondary.relationship || "Guardian")})
                                        </p>
                                        <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                          {[gSecondary.phone, gSecondary.email]
                                            .filter(Boolean)
                                            .map(String)
                                            .join(" · ") || "—"}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="font-semibold">
                                        {st.motherName
                                          ? `Mother: ${st.motherName} (${st.motherPhone || "—"})`
                                          : st.fatherName
                                            ? `Father: ${st.fatherName} (${st.fatherPhone || "—"})`
                                            : "Not provided"}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Emergency Contact</p>
                                    <p className="font-bold">
                                      {String(gd.emergencyContactNumber || st.guardianPhone || "—")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Preferred Contact Mode</p>
                                    <p className="font-bold">{String(gd.preferredCommunicationMode || "Phone")}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Guardian Address</p>
                                    <p className="font-semibold">
                                      {gd.sameAsStudentAddress
                                        ? "Same as student residential address"
                                        : [
                                            gAddr.addressLine1,
                                            gAddr.addressLine2,
                                            gAddr.city,
                                            gAddr.state,
                                            gAddr.postalCode,
                                          ]
                                            .filter(Boolean)
                                            .join(", ") || "Same / Not specified"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Academic History + Fee Ledger & Receipts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                                <h5 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                                  Previous School &amp; Academic History
                                </h5>
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Previous School</p>
                                    <p className="font-bold">{String(ad.previousSchoolName || st.previousSchool || "—")}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Board / Curriculum</p>
                                    <p className="font-bold">{String(ad.boardCurriculum || "—")}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Last Standard Studied</p>
                                    <p className="font-bold">
                                      {String(ad.lastStandardStudied || "—")}
                                      {Boolean(ad.yearOfCompletion) ? ` (${String(ad.yearOfCompletion)})` : ""}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Marks / Percentage</p>
                                    <p className="font-bold">
                                      {ad.percentage !== undefined && ad.percentage !== null
                                        ? `${String(ad.percentage)}%`
                                        : Boolean(ad.marksObtained && ad.totalMarks)
                                          ? `${String(ad.marksObtained)} / ${String(ad.totalMarks)}`
                                          : "—"}
                                    </p>
                                  </div>
                                </div>
                                {prevRows.length > 0 && (
                                  <div className="overflow-x-auto rounded-lg border border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#141731]">
                                    <table className="w-full text-left text-[11px]">
                                      <thead className="bg-[#F6F5FD] text-[10px] uppercase dark:bg-[#1B1F3F]">
                                        <tr>
                                          <th className="px-2.5 py-1.5">Year</th>
                                          <th className="px-2.5 py-1.5">Class</th>
                                          <th className="px-2.5 py-1.5 text-right">Marks</th>
                                          <th className="px-2.5 py-1.5 text-right">%</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                                        {prevRows.map((pr, idx) => (
                                          <tr key={String(pr.id || idx)}>
                                            <td className="px-2.5 py-1.5">{String(pr.academicYear || "—")}</td>
                                            <td className="px-2.5 py-1.5">{String(pr.standard || "—")}</td>
                                            <td className="px-2.5 py-1.5 text-right">
                                              {String(pr.marksObtained ?? 0)} / {String(pr.totalMarks ?? 0)}
                                            </td>
                                            <td className="px-2.5 py-1.5 text-right font-bold">{String(pr.percentage ?? 0)}%</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                                <h5 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                                  Student Fee Ledger &amp; Payment Receipts
                                </h5>
                                {selectedStudentLedger ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="rounded-lg border border-[#DFE3F5] bg-white p-2 dark:border-[#272B4D] dark:bg-[#141731]">
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Total Fee</p>
                                      <p className="font-black">{formatInrFromPaise(selectedStudentLedger.totalFeePaise)}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#DFE3F5] bg-white p-2 dark:border-[#272B4D] dark:bg-[#141731]">
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Concession</p>
                                      <p className="font-black">{formatInrFromPaise(selectedStudentLedger.concessionPaise)}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#DFE3F5] bg-white p-2 dark:border-[#272B4D] dark:bg-[#141731]">
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Paid</p>
                                      <p className="font-black text-emerald-600 dark:text-emerald-300">
                                        {formatInrFromPaise(selectedStudentLedger.paidPaise)}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-[#DFE3F5] bg-white p-2 dark:border-[#272B4D] dark:bg-[#141731]">
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Outstanding</p>
                                      <p className="font-black text-amber-600 dark:text-amber-300">
                                        {formatInrFromPaise(selectedStudentLedger.outstandingPaise)}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                    No fee ledger created for this student yet.
                                  </p>
                                )}

                                {selectedStudentReceipts.length > 0 && (
                                  <div className="space-y-1.5">
                                    {selectedStudentReceipts.map((p) => (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between rounded-lg border border-[#DFE3F5] bg-white px-3 py-1.5 text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                                      >
                                        <span>
                                          <strong className="font-mono text-[#663CF6] dark:text-[#C4B5FD]">
                                            {p.receiptNumber}
                                          </strong>{" "}
                                          · {p.feeHead} ({p.paymentMode}) · {formatDateShort(p.paymentDate)}
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-300">
                                          {formatInrFromPaise(p.amountPaise)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Documents & Linked Portal Accounts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                                <h5 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                                  Documents Verification ({st.verificationStatus})
                                </h5>
                                {st.verificationNotes && (
                                  <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                    Notes: {st.verificationNotes}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1.5">
                                  {(st.documentsChecklist ?? []).length === 0 ? (
                                    <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                      No document checklist items recorded.
                                    </span>
                                  ) : (
                                    (st.documentsChecklist ?? []).map((doc) => (
                                      <span
                                        key={doc.key}
                                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                          doc.verified
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                            : doc.submitted
                                              ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                                              : "border-[#DFE3F5] bg-white text-[#76799C] dark:border-[#272B4D] dark:bg-[#141731]"
                                        }`}
                                      >
                                        {doc.label}: {doc.verified ? "Verified" : doc.submitted ? "Submitted" : "Pending"}
                                      </span>
                                    ))
                                  )}
                                </div>
                                {(st.uploadedDocuments ?? []).length > 0 && (
                                  <div className="space-y-1 pt-1">
                                    {(st.uploadedDocuments ?? []).map((uDoc) => (
                                      <div
                                        key={uDoc.key}
                                        className="flex items-center justify-between rounded-lg border border-[#DFE3F5] bg-white px-2.5 py-1 text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                                      >
                                        <span className="font-semibold truncate">
                                          {uDoc.label} · {uDoc.fileName}
                                        </span>
                                        <span className="text-[10px] text-[#76799C]">
                                          {Math.round((uDoc.sizeBytes || 0) / 1024)} KB
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
                                <h5 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                                  Linked Portal Accounts ({selectedStudentPortalUsers.length})
                                </h5>
                                {selectedStudentPortalUsers.length === 0 ? (
                                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                                    No portal login account matched this student/guardian email or phone yet.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {selectedStudentPortalUsers.map((pu) => (
                                      <div
                                        key={pu.id}
                                        className="flex items-center justify-between rounded-lg border border-[#DFE3F5] bg-white px-3 py-1.5 text-[11px] dark:border-[#272B4D] dark:bg-[#141731]"
                                      >
                                        <div>
                                          <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                            {pu.name} ({pu.role})
                                          </p>
                                          <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                            {pu.email || "—"} · {pu.phone || "—"}
                                          </p>
                                        </div>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-300">
                                          {pu.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                    );
                  })()
                ) : (
                  <div className="space-y-6">
                    {studentSuiteData && (
                      <div className="rounded-[18px] border border-[#DDD6FE] bg-[#FAF8FE]/70 p-4 sm:p-5 dark:border-[#2E2A5C] dark:bg-[#10142C]/80">
                        <StudentManagementWorkspace
                          mode="platform"
                          schoolId={selectedEntry.school.id}
                          initialSnapshot={studentSuiteData.snapshot}
                          initialAnalytics={studentSuiteData.analytics}
                          initialSection="dashboard"
                          onSelectedStudentUrlChange={(sec, stuId) => {
                            if (sec === "profile" && stuId) {
                              setActiveStudentId(stuId);
                            }
                          }}
                          permissions={{
                            canCreate: true,
                            canEdit: true,
                            canPromote: true,
                            canTransfer: true,
                            canExport: true,
                            canManageSettings: true,
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: "ALL", label: `All Students (${schoolData?.applications.length ?? 0})` },
                            { id: "ADMITTED", label: "Admitted Only" },
                            { id: "IN_PROGRESS", label: "Pending / Review" },
                          ] as const
                        ).map((sf) => (
                          <button
                            key={sf.id}
                            type="button"
                            onClick={() => setStudentFilter(sf.id)}
                            className={`rounded-full px-3 py-1 text-[11px] font-extrabold cursor-pointer ${
                              studentFilter === sf.id
                                ? "bg-[#663CF6] text-white"
                                : "border border-[#D6DBF0] bg-white text-[#4D5072] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                            }`}
                          >
                            {sf.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="search"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search student, parent, phone, class..."
                          className="rounded-lg border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            exportRowsToCsv(
                              `${selectedEntry.school.slug}-students-parents.csv`,
                              [
                                "Admission No",
                                "App Code",
                                "Student Name",
                                "Class",
                                "Academic Year",
                                "Gender",
                                "DOB",
                                "Guardian",
                                "Relation",
                                "Guardian Phone",
                                "Guardian Email",
                                "Father",
                                "Mother",
                                "Status",
                                "Paid (INR)",
                                "Outstanding (INR)",
                              ],
                              filteredStudentsAndParents.map((a) => {
                                const ledger = ledgerByApplicationId.get(a.id);
                                return [
                                  a.admissionNumber || "",
                                  a.applicationCode,
                                  a.studentName,
                                  a.gradeApplied,
                                  a.academicYear,
                                  a.gender || "",
                                  a.dateOfBirth || "",
                                  a.guardianName,
                                  a.guardianRelation || "Parent",
                                  a.guardianPhone,
                                  a.guardianEmail || "",
                                  a.fatherName ? `${a.fatherName} (${a.fatherPhone || ""})` : "",
                                  a.motherName ? `${a.motherName} (${a.motherPhone || ""})` : "",
                                  a.status,
                                  ((ledger?.paidPaise ?? 0) / 100).toFixed(2),
                                  ((ledger?.outstandingPaise ?? 0) / 100).toFixed(2),
                                ];
                              }),
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CAD0EB] px-2.5 py-1.5 text-[11px] font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {loadingData ? (
                      <div className="py-6 text-center text-xs text-[#76799C]">
                        Loading student &amp; parent records...
                      </div>
                    ) : filteredStudentsAndParents.length === 0 ? (
                      <p className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                        No student or guardian records found for this filter.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                            <tr>
                              <th className="px-3 py-2.5">Student Details</th>
                              <th className="px-3 py-2.5">Class &amp; Session</th>
                              <th className="px-3 py-2.5">Parent / Guardian Details</th>
                              <th className="px-3 py-2.5">Status</th>
                              <th className="px-3 py-2.5 text-right">Fee Summary</th>
                              <th className="px-3 py-2.5 text-right">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                            {filteredStudentsAndParents.map((a) => {
                              const ledger = ledgerByApplicationId.get(a.id);
                              return (
                                <tr key={a.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B1F3F]/50">
                                  <td className="px-3 py-2.5">
                                    <button
                                      type="button"
                                      onClick={() => setActiveStudentId(a.id)}
                                      className="text-left font-extrabold text-[#08093B] hover:text-[#663CF6] cursor-pointer dark:text-[#F3F5FF] dark:hover:text-[#C4B5FD]"
                                    >
                                      {a.studentName}
                                    </button>
                                    <p className="font-mono text-[10px] text-[#663CF6] dark:text-[#C4B5FD]">
                                      {a.admissionNumber || a.applicationCode}
                                    </p>
                                    {(a.gender || a.dateOfBirth || a.bloodGroup) && (
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                        {[a.gender, a.dateOfBirth, a.bloodGroup].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <p className="font-bold">{a.gradeApplied}</p>
                                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                      AY {a.academicYear}
                                    </p>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                      {a.guardianName}{" "}
                                      <span className="font-normal text-[#76799C] dark:text-[#9DA6CC]">
                                        ({a.guardianRelation || "Parent"})
                                      </span>
                                    </p>
                                    <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                      {a.guardianPhone}
                                      {a.guardianEmail ? ` · ${a.guardianEmail}` : ""}
                                    </p>
                                    {(a.fatherName || a.motherName) && (
                                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                        {a.fatherName ? `F: ${a.fatherName}` : ""}
                                        {a.fatherName && a.motherName ? " · " : ""}
                                        {a.motherName ? `M: ${a.motherName}` : ""}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>{a.status}</span>
                                    </span>
                                    <p className="mt-0.5 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                      {a.enrollmentStatus}
                                    </p>
                                  </td>
                                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                    {ledger ? (
                                      <div>
                                        <p className="font-bold text-emerald-600 dark:text-emerald-300">
                                          Paid: {formatInrFromPaise(ledger.paidPaise)}
                                        </p>
                                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                                          Due: {formatInrFromPaise(ledger.outstandingPaise)}
                                        </p>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                        No ledger
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => setActiveStudentId(a.id)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#663CF6] px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-[#4F27E8] cursor-pointer"
                                    >
                                      <span>View Details</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    </div>
                  </div>
                )
              )}

              {/* SUB-TAB 5: ADMISSIONS & SETTINGS DATA EXPLORER */}
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

              {/* SUB-TAB 6: STUDENT FEE LEDGERS & RECEIPTS */}
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

              {/* SUB-TAB 7: SCHOOL AUDIT TRAIL & SUPPORT TICKETS */}
              {subTab === "audit" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>Audit Trail</span>
                    </p>
                    {loadingAudit ? (
                      <div className="py-6 text-center text-xs text-[#76799C]">Loading audit trail...</div>
                    ) : schoolAuditLogs.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[#76799C]">
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

                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
                      <Headphones className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>School Support Tickets ({schoolData?.supportTickets?.length ?? 0})</span>
                    </p>
                    {!schoolData?.supportTickets || schoolData.supportTickets.length === 0 ? (
                      <p className="py-4 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                        No support tickets opened by this school.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {schoolData.supportTickets.map((t) => (
                          <div
                            key={t.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] px-3.5 py-2.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                          >
                            <div>
                              <p className="font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                                {t.referenceCode} · {t.subject}
                              </p>
                              <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                                {t.senderName} ({t.priority}) · {formatDateShort(t.createdAt)}
                              </p>
                            </div>
                            <span className="rounded-full border border-[#D6DBF0] bg-white px-2.5 py-0.5 text-[10px] font-bold dark:border-[#343B6B] dark:bg-[#141731]">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </section>
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
