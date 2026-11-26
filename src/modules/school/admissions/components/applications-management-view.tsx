"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Download,
  ChevronDown,
  FileText,
  ClipboardList,
  FileCheck2,
  Settings2,
  ShieldCheck,
  Users,
  Clock3,
  UserCheck,
  XCircle,
  Filter,
  RotateCcw,
  Calendar,
  Search,
  BarChart3,
  ArrowRight,
  Zap,
  Star,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import {
  DEFAULT_ADMISSION_GRADES,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type AdmissionsDatePreset,
  type AdmissionsOverviewData,
  type AdmissionsOverviewFilters,
  type DocumentVerificationStatusType,
} from "@/modules/school/admissions/types";
import { AdmissionsTable } from "./admissions-table";

export type ApplicationsSubViewMode =
  | "applications"
  | "form"
  | "verification"
  | "shortlisting"
  | "approvals";

interface ApplicationsManagementViewProps {
  data: AdmissionsOverviewData;
  filters: AdmissionsOverviewFilters;
  searchInput: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onApplyFilterUpdate: (patch: Partial<AdmissionsOverviewFilters>) => void;
  onResetFilters: () => void;
  onInspectApplication: (app: AdmissionApplicationRecord, mode?: "view" | "edit") => void;
  onQuickUpdateApplication: (
    applicationId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => Promise<void>;
  onBulkUpdateApplications: (
    applicationIds: string[],
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => Promise<void>;
  onCreateApplication: (payload: {
    studentName: string;
    gender: "Male" | "Female" | "Other" | "";
    dateOfBirth: string;
    gradeApplied: string;
    academicYear: string;
    guardianName: string;
    guardianRelation: string;
    guardianPhone: string;
    guardianEmail: string;
    previousSchool: string;
    status: "UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED";
    notes: string;
  }) => Promise<void>;
  onOpenNewApplicationModal: () => void;
  onDownloadReport: () => void;
  onDownloadImportTemplate: () => void;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function formatDeltaBadge(delta: number | null) {
  if (delta === null) return null;
  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
      )}
      <span>
        {positive ? "+" : ""}
        {delta}%
      </span>
    </span>
  );
}

export function ApplicationsManagementView({
  data,
  filters,
  searchInput,
  onSearchChange,
  onSearchSubmit,
  onApplyFilterUpdate,
  onResetFilters,
  onInspectApplication,
  onQuickUpdateApplication,
  onBulkUpdateApplications,
  onCreateApplication,
  onOpenNewApplicationModal,
  onDownloadReport,
  onDownloadImportTemplate,
}: ApplicationsManagementViewProps) {
  const [subView, setSubView] = useState<ApplicationsSubViewMode>("applications");
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [showAllGrades, setShowAllGrades] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  // Embedded Application Form state
  const [formStudentName, setFormStudentName] = useState("");
  const [formGender, setFormGender] = useState<"" | "Male" | "Female" | "Other">("");
  const [formDob, setFormDob] = useState("");
  const [formGrade, setFormGrade] = useState(data.availableGrades[0] || "Class I");
  const [formAy, setFormAy] = useState(data.settings.currentAcademicYear);
  const [formStatus, setFormStatus] = useState<
    "UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED"
  >("UNDER_REVIEW");
  const [formGuardianName, setFormGuardianName] = useState("");
  const [formGuardianRelation, setFormGuardianRelation] = useState("Parent");
  const [formGuardianPhone, setFormGuardianPhone] = useState("");
  const [formGuardianEmail, setFormGuardianEmail] = useState("");
  const [formPrevSchool, setFormPrevSchool] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    const map = new Map(data.statusBreakdown.map((s) => [s.status, s]));
    const get = (status: AdmissionApplicationStatusType) =>
      map.get(status) ?? { status, label: status, count: 0, percentage: 0, color: "#8B5CF6" };
    return {
      underReview: get("UNDER_REVIEW"),
      docsPending: get("DOCUMENTS_PENDING"),
      shortlisted: get("SHORTLISTED"),
      admitted: get("ADMITTED"),
      rejected: get("REJECTED"),
    };
  }, [data.statusBreakdown]);

  // Grade-wise chart bars: show active populated grades cleanly, or expand all configured grades
  const gradeBars = useMemo(() => {
    if (!showAllGrades) {
      return data.byGrade;
    }
    const existing = new Map(data.byGrade.map((g) => [g.grade, g]));
    const configured = data.settings.enabledGrades.length
      ? data.settings.enabledGrades
      : [...DEFAULT_ADMISSION_GRADES];
    return configured.map(
      (grade) =>
        existing.get(grade) ?? {
          grade,
          shortLabel: grade.replace(/^Class\s+/i, "").trim() || grade,
          count: 0,
        },
    );
  }, [data.byGrade, data.settings.enabledGrades, showAllGrades]);

  const gradeMax = useMemo(() => {
    const maxCount = Math.max(0, ...gradeBars.map((g) => g.count));
    if (maxCount <= 10) return Math.max(5, Math.ceil(maxCount / 2) * 2 || 10);
    return Math.ceil(maxCount / 20) * 20;
  }, [gradeBars]);

  // Donut progress rings matching statusBreakdown
  const donutCircumference = 2 * Math.PI * 38;
  const donutSegments = useMemo(() => {
    const total = data.kpis.totalApplications.value;
    if (total <= 0) return [];
    let runningOffset = 0;
    return data.statusBreakdown
      .filter((slice) => slice.count > 0)
      .map((slice) => {
        const arcLen = (slice.count / total) * donutCircumference;
        const segment = {
          ...slice,
          arcLen,
          offset: runningOffset,
        };
        runningOffset += arcLen;
        return segment;
      });
  }, [data.kpis.totalApplications.value, data.statusBreakdown, donutCircumference]);

  const recentFeed = useMemo(() => {
    const appLookup = new Map(data.applications.map((a) => [a.id, a]));
    const activityItems = data.activities
      .filter((act) => act.action.startsWith("APPLICATION_"))
      .map((act) => ({
        id: act.id,
        summary: act.summary,
        createdAt: act.createdAt,
        app: act.applicationId ? appLookup.get(act.applicationId) ?? null : null,
        tone: act.summary.includes("Admitted")
          ? "admitted"
          : act.summary.includes("pending") || act.summary.includes("PENDING")
            ? "pending"
            : act.summary.includes("Shortlisted") || act.summary.includes("SHORTLISTED")
              ? "shortlisted"
              : "created",
      }));

    if (activityItems.length > 0) {
      return showAllRecent ? activityItems : activityItems.slice(0, 5);
    }

    const fallbackApps = data.applications.map((app) => ({
      id: app.id,
      summary: `New application from ${app.studentName} (${app.gradeApplied})`,
      createdAt: app.appliedAt,
      app,
      tone:
        app.status === "ADMITTED"
          ? "admitted"
          : app.status === "DOCUMENTS_PENDING"
            ? "pending"
            : app.status === "SHORTLISTED"
              ? "shortlisted"
              : "created",
    }));
    return showAllRecent ? fallbackApps : fallbackApps.slice(0, 5);
  }, [data.activities, data.applications, showAllRecent]);

  const handleWorkflowSwitch = (mode: ApplicationsSubViewMode) => {
    setSubView(mode);
    if (mode === "applications") {
      onApplyFilterUpdate({ status: "all", verificationStatus: "all", page: 1 });
    } else if (mode === "verification") {
      onApplyFilterUpdate({ status: "all", verificationStatus: "PENDING", page: 1 });
    } else if (mode === "shortlisting") {
      onApplyFilterUpdate({ status: "SHORTLISTED", verificationStatus: "all", page: 1 });
    } else if (mode === "approvals") {
      onApplyFilterUpdate({ status: "ADMITTED", verificationStatus: "all", page: 1 });
    }
  };

  const handleEmbeddedFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    try {
      await onCreateApplication({
        studentName: formStudentName,
        gender: formGender,
        dateOfBirth: formDob,
        gradeApplied: formGrade,
        academicYear: formAy,
        guardianName: formGuardianName,
        guardianRelation: formGuardianRelation,
        guardianPhone: formGuardianPhone,
        guardianEmail: formGuardianEmail,
        previousSchool: formPrevSchool,
        status: formStatus,
        notes: formNotes,
      });
      setFormStudentName("");
      setFormDob("");
      setFormGuardianName("");
      setFormGuardianPhone("");
      setFormGuardianEmail("");
      setFormPrevSchool("");
      setFormNotes("");
      setSubView("applications");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unable to submit application.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchInput);
  };

  const workflowButtons: Array<{
    key: ApplicationsSubViewMode;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: "applications", label: "Applications", Icon: FileText },
    { key: "form", label: "Application Form", Icon: ClipboardList },
    { key: "verification", label: "Document Verification", Icon: FileCheck2 },
    { key: "shortlisting", label: "Shortlisting", Icon: Settings2 },
    { key: "approvals", label: "Admission Approvals", Icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5">
      {/* =====================================================================
          1. PAGE HEADER (Application Management + Actions)
          ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight dark:text-[#F3F5FF]">
            Application Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#9DA6CC]">
            View, manage and process all student applications in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {data.permissions.canWrite && (
            <button
              id="admissions-new-application-btn"
              type="button"
              onClick={onOpenNewApplicationModal}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New Application</span>
            </button>
          )}

          {data.permissions.canExport && (
            <div className="relative">
              <button
                id="admissions-download-menu-btn"
                type="button"
                onClick={() => setDownloadMenuOpen((prev) => !prev)}
                aria-expanded={downloadMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2.5 text-xs font-bold text-[#08093B] shadow-xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6] dark:hover:text-[#C4B5FD]"
              >
                <Download className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>Download</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </button>

              {downloadMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-30 w-52 rounded-[14px] border border-[#D6DBF0] bg-white p-1.5 shadow-xl dark:border-[#2E345B] dark:bg-[#141731] dark:shadow-black/60"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDownloadMenuOpen(false);
                      onDownloadReport();
                    }}
                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-xs font-semibold text-[#08093B] hover:bg-[#FAF8FE] hover:text-[#663CF6] cursor-pointer dark:text-[#F3F5FF] dark:hover:bg-[#1F2447] dark:hover:text-[#C4B5FD]"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Export CSV Report</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDownloadMenuOpen(false);
                      onDownloadImportTemplate();
                    }}
                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-xs font-semibold text-[#08093B] hover:bg-[#FAF8FE] hover:text-[#663CF6] cursor-pointer dark:text-[#F3F5FF] dark:hover:bg-[#1F2447] dark:hover:text-[#C4B5FD]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>CSV Import Template</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDownloadMenuOpen(false);
                      if (typeof window !== "undefined") window.print();
                    }}
                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-xs font-semibold text-[#08093B] hover:bg-[#FAF8FE] hover:text-[#663CF6] cursor-pointer dark:text-[#F3F5FF] dark:hover:bg-[#1F2447] dark:hover:text-[#C4B5FD]"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Print Application List</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          2. 5 WORKFLOW MODE PILLS
          ===================================================================== */}
      <div
        role="group"
        aria-label="Application management workflows"
        className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar py-1.5 -my-1.5 lg:flex-wrap lg:overflow-visible lg:py-0 lg:my-0"
      >
        {workflowButtons.map(({ key, label, Icon }) => {
          const active = subView === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => handleWorkflowSwitch(key)}
              className={`inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[12px] px-4 py-2 text-xs font-bold transition cursor-pointer ${
                active
                  ? "bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] text-white shadow-md shadow-[#663CF6]/20"
                  : "border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#B4BDD9] dark:hover:border-[#8B5CF6] dark:hover:text-[#D9CEFF]"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          3. APPLICATION FORM SUB-VIEW OR FULL PIPELINE + ANALYTICS
          ===================================================================== */}
      {subView === "form" ? (
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xs space-y-5 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3F5] pb-4 dark:border-[#232746]">
            <div>
              <h2 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Student Application Form
              </h2>
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Enter student and guardian details to register a new admission application.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubView("applications")}
              className="rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0]"
            >
              Back to Applications
            </button>
          </div>

          {!data.permissions.canWrite ? (
            <p className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300">
              Your current role has read-only access and cannot submit new applications.
            </p>
          ) : (
            <form onSubmit={handleEmbeddedFormSubmit} className="space-y-4 max-w-4xl">
              {formError && (
                <div
                  role="alert"
                  className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="inline-app-student" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Student Name *
                  </label>
                  <input
                    id="inline-app-student"
                    type="text"
                    required
                    minLength={2}
                    value={formStudentName}
                    onChange={(e) => setFormStudentName(e.target.value)}
                    placeholder="Full student name"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label htmlFor="inline-app-grade" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Grade Applied *
                  </label>
                  <select
                    id="inline-app-grade"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  >
                    {data.availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inline-app-ay" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Academic Year *
                  </label>
                  <select
                    id="inline-app-ay"
                    value={formAy}
                    onChange={(e) => setFormAy(e.target.value)}
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  >
                    {data.availableAcademicYears.map((ay) => (
                      <option key={ay} value={ay}>
                        {ay}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="inline-app-gender" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Gender
                  </label>
                  <select
                    id="inline-app-gender"
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as "" | "Male" | "Female" | "Other")}
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="inline-app-dob" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Date of Birth
                  </label>
                  <input
                    id="inline-app-dob"
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label htmlFor="inline-app-status" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Initial Stage
                  </label>
                  <select
                    id="inline-app-status"
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(
                        e.target.value as "UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED",
                      )
                    }
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  >
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="DOCUMENTS_PENDING">Documents Pending</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="inline-app-guardian" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Guardian Name *
                  </label>
                  <input
                    id="inline-app-guardian"
                    type="text"
                    required
                    minLength={2}
                    value={formGuardianName}
                    onChange={(e) => setFormGuardianName(e.target.value)}
                    placeholder="Parent / Guardian name"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label htmlFor="inline-app-relation" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Relationship *
                  </label>
                  <input
                    id="inline-app-relation"
                    type="text"
                    required
                    value={formGuardianRelation}
                    onChange={(e) => setFormGuardianRelation(e.target.value)}
                    placeholder="Father / Mother / Guardian"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label htmlFor="inline-app-phone" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Guardian Phone *
                  </label>
                  <input
                    id="inline-app-phone"
                    type="tel"
                    required
                    minLength={7}
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label htmlFor="inline-app-email" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Guardian Email
                  </label>
                  <input
                    id="inline-app-email"
                    type="email"
                    value={formGuardianEmail}
                    onChange={(e) => setFormGuardianEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inline-app-prev-school" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Previous School
                  </label>
                  <input
                    id="inline-app-prev-school"
                    type="text"
                    value={formPrevSchool}
                    onChange={(e) => setFormPrevSchool(e.target.value)}
                    placeholder="Optional previous school name"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label htmlFor="inline-app-notes" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Review Notes
                  </label>
                  <input
                    id="inline-app-notes"
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Initial verification or interview notes"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSubView("applications")}
                  className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F8FAFC] cursor-pointer dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  <span>{formSubmitting ? "Submitting..." : "Submit Application"}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <>
          {/* =================================================================
              5 SUMMARY STAT KPI CARDS
              ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Applications */}
            <div className="flex items-center gap-3.5 rounded-[18px] border border-[#DDD6FE] bg-gradient-to-br from-white via-[#F6F2FF] to-[#EDE7FF]/75 p-4 shadow-xs dark:border-[#372D6B] dark:from-[#161936] dark:via-[#1B183E] dark:to-[#221A4A]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE] dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#B4BDD9]">
                  Total Applications
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                    {data.kpis.totalApplications.value.toLocaleString("en-IN")}
                  </span>
                  {formatDeltaBadge(data.kpis.totalApplications.deltaPercent)}
                </div>
                <p className="text-[10px] font-medium text-[#76799C] dark:text-[#9DA6CC]">
                  {data.kpis.totalApplications.deltaPercent !== null
                    ? "vs. previous period"
                    : "active cohort"}
                </p>
              </div>
            </div>

            {/* Under Review */}
            <div className="flex items-center gap-3.5 rounded-[18px] border border-[#FDE68A] bg-gradient-to-br from-white via-[#FFFBEB] to-[#FEF3C7]/60 p-4 shadow-xs dark:border-[#5D461B] dark:from-[#161936] dark:via-[#241E12] dark:to-[#2E2414]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706] ring-1 ring-[#FDE68A] dark:bg-[#362712] dark:text-[#FBBF24] dark:ring-[#6E4F1A]">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#B4BDD9]">
                  Under Review
                </p>
                <p className="mt-0.5 text-2xl font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                  {statusCounts.underReview.count.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] tabular-nums dark:text-[#9DA6CC]">
                  {statusCounts.underReview.percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Shortlisted */}
            <div className="flex items-center gap-3.5 rounded-[18px] border border-[#BAE6FD] bg-gradient-to-br from-white via-[#F0F9FF] to-[#E0F2FE]/65 p-4 shadow-xs dark:border-[#1E476E] dark:from-[#131934] dark:via-[#11223E] dark:to-[#122949]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7] ring-1 ring-[#BAE6FD] dark:bg-[#133252] dark:text-[#7DD3FC] dark:ring-[#1E547A]">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#B4BDD9]">
                  Shortlisted
                </p>
                <p className="mt-0.5 text-2xl font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                  {statusCounts.shortlisted.count.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] tabular-nums dark:text-[#9DA6CC]">
                  {statusCounts.shortlisted.percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Admitted */}
            <div className="flex items-center gap-3.5 rounded-[18px] border border-[#DDD6FE] bg-gradient-to-br from-white via-[#FAF5FF] to-[#EDE7FF]/70 p-4 shadow-xs dark:border-[#372D6B] dark:from-[#161936] dark:via-[#1B183E] dark:to-[#221A4A]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE] dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#B4BDD9]">
                  Admitted
                </p>
                <p className="mt-0.5 text-2xl font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                  {statusCounts.admitted.count.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] tabular-nums dark:text-[#9DA6CC]">
                  {statusCounts.admitted.percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Rejected */}
            <div className="flex items-center gap-3.5 rounded-[18px] border border-[#FECDD3] bg-gradient-to-br from-white via-[#FFF1F2] to-[#FFE4E6]/65 p-4 shadow-xs dark:border-[#632639] dark:from-[#1A162E] dark:via-[#281523] dark:to-[#331827]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFE4E6] text-[#E11D48] ring-1 ring-[#FECDD3] dark:bg-[#3A1728] dark:text-[#FB7185] dark:ring-[#732A41]">
                <XCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#B4BDD9]">
                  Rejected
                </p>
                <p className="mt-0.5 text-2xl font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                  {statusCounts.rejected.count.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] tabular-nums dark:text-[#9DA6CC]">
                  {statusCounts.rejected.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* =================================================================
              FILTER APPLICATIONS CARD
              ================================================================= */}
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-4 sm:p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Filter Applications
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubView("applications");
                  onResetFilters();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Filters</span>
              </button>
            </div>

            {/* 5 Filter Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label
                  htmlFor="apps-filter-ay"
                  className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#9DA6CC]"
                >
                  Academic Year
                </label>
                <select
                  id="apps-filter-ay"
                  aria-label="Filter by academic year"
                  value={filters.academicYear}
                  onChange={(e) => onApplyFilterUpdate({ academicYear: e.target.value })}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <option value="all">All Years</option>
                  {data.availableAcademicYears.map((ay) => (
                    <option key={ay} value={ay}>
                      {ay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="apps-filter-grade"
                  className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#9DA6CC]"
                >
                  Grade Applied
                </label>
                <select
                  id="apps-filter-grade"
                  aria-label="Filter by admission grade"
                  value={filters.grade}
                  onChange={(e) => onApplyFilterUpdate({ grade: e.target.value })}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <option value="all">All Grades</option>
                  {data.availableGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="apps-filter-status"
                  className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#9DA6CC]"
                >
                  Application Status
                </label>
                <select
                  id="apps-filter-status"
                  aria-label="Filter by status"
                  value={filters.status}
                  onChange={(e) => {
                    setSubView("applications");
                    onApplyFilterUpdate({
                      status: e.target.value as AdmissionApplicationStatusType | "all",
                    });
                  }}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <option value="all">All Status</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="DOCUMENTS_PENDING">Documents Pending</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="ADMITTED">Admitted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="apps-filter-verification"
                  className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#9DA6CC]"
                >
                  Verification Status
                </label>
                <select
                  id="apps-filter-verification"
                  aria-label="Filter by verification status"
                  value={filters.verificationStatus}
                  onChange={(e) => {
                    setSubView("applications");
                    onApplyFilterUpdate({
                      verificationStatus: e.target.value as DocumentVerificationStatusType | "all",
                    });
                  }}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <option value="all">All Verification</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="apps-filter-date"
                  className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#9DA6CC]"
                >
                  Application Date
                </label>
                <div className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-2.5 py-2 dark:border-[#343B6B] dark:bg-[#10142C]">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                  <select
                    id="apps-filter-date"
                    aria-label="Filter by date range"
                    value={filters.datePreset}
                    onChange={(e) =>
                      onApplyFilterUpdate({ datePreset: e.target.value as AdmissionsDatePreset })
                    }
                    className="w-full bg-transparent text-xs font-bold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
                  >
                    <option value="all">All Dates</option>
                    <option value="year">Selected Academic Year</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
            </div>

            {filters.datePreset === "custom" && (
              <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                <input
                  type="date"
                  aria-label="From date"
                  value={filters.from}
                  onChange={(e) => onApplyFilterUpdate({ from: e.target.value })}
                  className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
                <span className="text-[#76799C] dark:text-[#9DA6CC]">–</span>
                <input
                  type="date"
                  aria-label="To date"
                  value={filters.to}
                  onChange={(e) => onApplyFilterUpdate({ to: e.target.value })}
                  className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
            )}

            {/* Full-width Search Bar + Search CTA */}
            <form onSubmit={handleSearchFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C] dark:text-[#9DA6CC]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search by student name, application ID, parent name, or contact number..."
                  aria-label="Search applications by student name, application ID, parent name, or contact number"
                  className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] pl-10 pr-3.5 py-2.5 text-xs text-[#08093B] placeholder:text-[#76799C] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD] dark:focus:border-[#8B5CF6] dark:focus:bg-[#141731]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer shrink-0"
              >
                <span>Search</span>
              </button>
            </form>
          </section>

          {/* =================================================================
              APPLICATIONS DATA TABLE / GRID
              ================================================================= */}
          <AdmissionsTable
            applications={data.applications}
            pagination={data.pagination}
            searchQuery={searchInput}
            onSearchChange={onSearchChange}
            verificationFilter={filters.verificationStatus}
            onVerificationFilterChange={(verificationStatus) =>
              onApplyFilterUpdate({ verificationStatus })
            }
            onPageChange={(page) => onApplyFilterUpdate({ page })}
            onPageSizeChange={(pageSize) => onApplyFilterUpdate({ pageSize, page: 1 })}
            onInspectApplication={(app) => onInspectApplication(app, "view")}
            onEditApplication={(app) => onInspectApplication(app, "edit")}
            onQuickUpdateApplication={onQuickUpdateApplication}
            onBulkUpdateApplications={onBulkUpdateApplications}
            onOpenNewApplication={onOpenNewApplicationModal}
            canWrite={data.permissions.canWrite}
            canVerify={data.permissions.canVerify}
            title="All Applications"
            showEnhancedToolbar
            hideHeaderSearchBar
          />

          {/* =================================================================
              ANALYTICS ROW: APPLICATION PROGRESS DONUT + GRADE-WISE BAR CHART
              ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Application Progress (5 cols) */}
            <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Application Progress
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg
                    className="w-36 h-36 -rotate-90"
                    viewBox="0 0 100 100"
                    role="img"
                    aria-label="Application progress distribution"
                  >
                    <title>Application Progress</title>
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="stroke-[#F1F5F9] dark:stroke-[#232746]"
                      strokeWidth="14"
                      fill="none"
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.status}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={seg.color}
                        strokeWidth="14"
                        strokeDasharray={`${seg.arcLen.toFixed(2)} ${donutCircumference.toFixed(2)}`}
                        strokeDashoffset={`-${seg.offset.toFixed(2)}`}
                        fill="none"
                      />
                    ))}
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xl font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                      {data.kpis.totalApplications.value.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      Applications
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2.5 text-xs">
                  {data.statusBreakdown
                    .filter((s) => s.status !== "DOCUMENTS_PENDING" || s.count > 0)
                    .map((slice) => (
                      <div key={slice.status} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-[#4D5072] truncate dark:text-[#C5CCF0]">
                            {slice.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 tabular-nums">
                          <span className="font-extrabold text-[#08093B] w-10 text-right dark:text-[#F3F5FF]">
                            {slice.count}
                          </span>
                          <span className="font-medium text-[#76799C] w-12 text-right dark:text-[#9DA6CC]">
                            {slice.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* Grade-wise Applications (7 cols) */}
            <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Grade-wise Applications
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllGrades((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
                >
                  <span>{showAllGrades ? "Populated Grades" : "View Details"}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {gradeBars.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
                  <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    No grade distribution yet
                  </p>
                  <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Grade-wise bars appear automatically as student applications are recorded.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto school-menu-scrollbar">
                  <div className="flex gap-2 items-end h-44 min-w-[340px]">
                    {/* Y-Axis Scale */}
                    <div className="flex flex-col justify-between h-[132px] pb-5 pr-1 text-[10px] font-semibold text-[#76799C] tabular-nums dark:text-[#9DA6CC]">
                      <span>{gradeMax}</span>
                      <span>{Math.round(gradeMax * 0.5)}</span>
                      <span>0</span>
                    </div>

                    {/* Bars */}
                    <div className="flex-1 flex items-end justify-around gap-2.5 h-full pt-5 border-l border-b border-[#E2E8F0] pl-2 dark:border-[#272B4D]">
                      {gradeBars.map((item) => {
                        const pctHeight =
                          item.count === 0 ? 4 : Math.max(10, (item.count / gradeMax) * 100);
                        const isSelected = filters.grade === item.grade;
                        return (
                          <button
                            key={item.grade}
                            type="button"
                            onClick={() =>
                              onApplyFilterUpdate({
                                grade: isSelected ? "all" : item.grade,
                                page: 1,
                              })
                            }
                            title={`Filter by ${item.grade}: ${item.count}`}
                            className="flex-1 min-w-[34px] max-w-[52px] flex flex-col items-center justify-end h-full gap-1 cursor-pointer group"
                          >
                            <span className="text-[11px] font-bold text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                              {item.count.toLocaleString("en-IN")}
                            </span>
                            <div
                              className={`w-full rounded-t-[8px] transition-all ${
                                isSelected
                                  ? "bg-gradient-to-t from-[#4F27E8] via-[#663CF6] to-[#38BDF8] ring-2 ring-[#663CF6]/40"
                                  : "bg-gradient-to-t from-[#663CF6] via-[#8B5CF6] to-[#C4B5FD] group-hover:brightness-110"
                              }`}
                              style={{ height: `${pctHeight}%` }}
                            />
                            <span className="text-[10px] font-semibold text-[#4D5072] truncate max-w-full pb-0.5 dark:text-[#9DA6CC]">
                              {item.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* =================================================================
              BOTTOM ROW: RECENTLY ADDED APPLICATIONS + QUICK ACTIONS
              ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recently Added Applications (6 cols) */}
            <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Recently Added Applications
                    </h2>
                  </div>

                  {data.activities.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllRecent((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
                    >
                      <span>{showAllRecent ? "Show Less" : "View All"}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {recentFeed.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-10 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
                    <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      No recent application updates
                    </p>
                    <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      New submissions, document verifications, and shortlisting updates appear here live.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentFeed.map((item) => {
                      const badgeStyle =
                        item.tone === "admitted"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : item.tone === "pending"
                            ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                            : "bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]";
                      return (
                        <li
                          key={item.id}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${badgeStyle}`}
                              aria-hidden="true"
                            >
                              {item.tone === "admitted" ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : item.tone === "pending" ? (
                                <FileText className="h-3.5 w-3.5" />
                              ) : (
                                <ClipboardList className="h-3.5 w-3.5" />
                              )}
                            </span>
                            {item.app ? (
                              <button
                                type="button"
                                onClick={() => onInspectApplication(item.app!, "view")}
                                className="text-left font-medium text-[#1B1D45] hover:text-[#663CF6] leading-relaxed cursor-pointer dark:text-[#DCE1F9] dark:hover:text-[#C4B5FD]"
                              >
                                {item.summary}
                              </button>
                            ) : (
                              <span className="font-medium text-[#1B1D45] leading-relaxed dark:text-[#DCE1F9]">
                                {item.summary}
                              </span>
                            )}
                          </div>
                          <time
                            dateTime={item.createdAt}
                            className="shrink-0 text-[11px] text-[#76799C] whitespace-nowrap dark:text-[#9DA6CC]"
                          >
                            {formatRelativeTime(item.createdAt)}
                          </time>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            {/* Quick Actions (6 cols) */}
            <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={!data.permissions.canWrite}
                  onClick={onOpenNewApplicationModal}
                  className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-4 text-center transition hover:border-[#663CF6] hover:bg-white hover:shadow-xs disabled:opacity-50 cursor-pointer dark:border-[#2A2F56] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
                >
                  <Plus className="h-5 w-5 text-[#4F27E8] dark:text-[#C4B5FD]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    New Application
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWorkflowSwitch("form")}
                  className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-4 text-center transition hover:border-[#663CF6] hover:bg-white hover:shadow-xs cursor-pointer dark:border-[#2A2F56] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
                >
                  <FileText className="h-5 w-5 text-[#4F27E8] dark:text-[#C4B5FD]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    Application Form
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWorkflowSwitch("verification")}
                  className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-4 text-center transition hover:border-[#663CF6] hover:bg-white hover:shadow-xs cursor-pointer dark:border-[#2A2F56] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#4F27E8] dark:text-[#C4B5FD]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    Verify Documents
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWorkflowSwitch("shortlisting")}
                  className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-4 text-center transition hover:border-[#663CF6] hover:bg-white hover:shadow-xs cursor-pointer dark:border-[#2A2F56] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
                >
                  <Star className="h-5 w-5 text-[#4F27E8] dark:text-[#C4B5FD]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    Shortlist Students
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWorkflowSwitch("approvals")}
                  className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-4 text-center transition hover:border-[#663CF6] hover:bg-white hover:shadow-xs cursor-pointer dark:border-[#2A2F56] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
                >
                  <UserCheck className="h-5 w-5 text-[#4F27E8] dark:text-[#C4B5FD]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    Admit Students
                  </span>
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
