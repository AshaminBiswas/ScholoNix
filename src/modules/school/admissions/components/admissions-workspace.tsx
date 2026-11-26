"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Plus,
  Download,
  LayoutGrid,
  FileText,
  MessageSquare,
  UserCheck,
  Settings,
  Calendar,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  SchoolWorkspaceShell,
  buildSchoolRoute,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "@/modules/school/components/school-workspace-shell";
import {
  ENQUIRY_STATUS_META,
  DEFAULT_ADMISSION_GRADES,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type AdmissionDocumentChecklistItem,
  type AdmissionEnquiryStatusType,
  type AdmissionsDatePreset,
  type AdmissionsOverviewData,
  type AdmissionsOverviewFilters,
  type AdmissionsTab,
  type AdmissionsTrendGranularity,
  type DocumentVerificationStatusType,
} from "@/modules/school/admissions/types";
import { AdmissionsKpisAndCharts } from "./admissions-kpis-and-charts";
import { AdmissionsTable } from "./admissions-table";
import { AdmissionsActivityAndNotes } from "./admissions-activity-and-notes";
import {
  ApplicationDetailModal,
  NewApplicationModal,
  NewEnquiryModal,
} from "./admissions-modals";

interface AdmissionsWorkspaceProps {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  initialData: AdmissionsOverviewData;
  initialTab: AdmissionsTab;
}

const TAB_CONFIG: Array<{
  id: AdmissionsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "admitted", label: "Admitted Students", icon: UserCheck },
  { id: "settings", label: "Settings", icon: Settings },
];

function buildFilterQueryString(filters: AdmissionsOverviewFilters, schoolSlug: string): string {
  const sp = new URLSearchParams();
  sp.set("schoolSlug", schoolSlug);
  if (filters.academicYear) sp.set("academicYear", filters.academicYear);
  if (filters.grade) sp.set("grade", filters.grade);
  if (filters.status) sp.set("status", filters.status);
  if (filters.verificationStatus) sp.set("verificationStatus", filters.verificationStatus);
  if (filters.datePreset) sp.set("datePreset", filters.datePreset);
  if (filters.datePreset === "custom") {
    if (filters.from) sp.set("from", filters.from);
    if (filters.to) sp.set("to", filters.to);
  }
  if (filters.granularity) sp.set("granularity", filters.granularity);
  if (filters.search) sp.set("search", filters.search);
  sp.set("page", String(filters.page));
  sp.set("pageSize", String(filters.pageSize));
  return sp.toString();
}

export function AdmissionsWorkspace({
  school,
  user,
  initialData,
  initialTab,
}: AdmissionsWorkspaceProps) {
  const [data, setData] = useState<AdmissionsOverviewData>(initialData);
  const [activeTab, setActiveTab] = useState<AdmissionsTab>(initialTab);
  const [filters, setFilters] = useState<AdmissionsOverviewFilters>(initialData.filters);
  const [searchInput, setSearchInput] = useState(initialData.filters.search);
  const [loading, setLoading] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [newEnqOpen, setNewEnqOpen] = useState(false);
  const [inspectApp, setInspectApp] = useState<AdmissionApplicationRecord | null>(null);

  // Settings form state synced from server data
  const [settingsAcademicYear, setSettingsAcademicYear] = useState(
    initialData.settings.currentAcademicYear,
  );
  const [settingsDeadline, setSettingsDeadline] = useState(
    initialData.settings.applicationDeadline
      ? initialData.settings.applicationDeadline.slice(0, 10)
      : "",
  );
  const [settingsPrefix, setSettingsPrefix] = useState(initialData.settings.applicationPrefix);
  const [settingsGrades, setSettingsGrades] = useState<string[]>(initialData.settings.enabledGrades);
  const [savingSettings, setSavingSettings] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync tab when sidebar links update URL query via initialTab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchOverview = useCallback(
    async (nextFilters: AdmissionsOverviewFilters) => {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(nextFilters, school.slug);
        const res = await fetch(`/api/school/admissions/overview?${qs}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message || "Failed to refresh admissions data.");
        }
        setData(json.data);
        setSettingsAcademicYear(json.data.settings.currentAcademicYear);
        setSettingsDeadline(
          json.data.settings.applicationDeadline
            ? json.data.settings.applicationDeadline.slice(0, 10)
            : "",
        );
        setSettingsPrefix(json.data.settings.applicationPrefix);
        setSettingsGrades(json.data.settings.enabledGrades);
      } catch (err: unknown) {
        setFeedbackBanner({
          type: "error",
          text: err instanceof Error ? err.message : "Unable to load admissions data.",
        });
      } finally {
        setLoading(false);
      }
    },
    [school.slug],
  );

  const applyFilterUpdate = useCallback(
    (patch: Partial<AdmissionsOverviewFilters>) => {
      setFilters((prev) => {
        const next: AdmissionsOverviewFilters = {
          ...prev,
          ...patch,
          page: patch.page !== undefined ? patch.page : 1,
        };
        void fetchOverview(next);
        return next;
      });
    },
    [fetchOverview],
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applyFilterUpdate({ search: value, page: 1 });
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedbackBanner({ type, text });
  };

  const handleTabSelect = useCallback((tab: AdmissionsTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleDownloadReport = () => {
    const qs = buildFilterQueryString(filters, school.slug);
    window.location.assign(`/api/school/admissions/export?${qs}`);
  };

  const handleCreateApplication = async (payload: {
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
  }) => {
    const res = await fetch(
      `/api/school/admissions/applications?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || "Unable to create application.");
    }
    showToast(
      "success",
      `Application ${json.application.applicationCode} created for ${json.application.studentName}.`,
    );
    await fetchOverview(filters);
  };

  const handleQuickUpdateApplication = async (
    applicationId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
      verificationNotes?: string;
      documentsChecklist?: AdmissionDocumentChecklistItem[];
    },
  ) => {
    const res = await fetch(
      `/api/school/admissions/applications/${encodeURIComponent(applicationId)}?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg = json?.error?.message || "Unable to update application.";
      showToast("error", msg);
      throw new Error(msg);
    }
    showToast("success", `Updated ${json.application.studentName} (${json.application.applicationCode}).`);
    await fetchOverview(filters);
  };

  const handleCreateEnquiry = async (payload: {
    studentName: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    gradeApplied: string;
    academicYear: string;
    source: "Website" | "Walk-In" | "Phone Call" | "Referral" | "Campaign" | "Other";
    notes: string;
  }) => {
    const res = await fetch(
      `/api/school/admissions/enquiries?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || "Unable to save enquiry.");
    }
    showToast("success", `Logged enquiry ${json.enquiry.enquiryCode} for ${json.enquiry.studentName}.`);
    await fetchOverview(filters);
  };

  const handleEnquiryAction = async (
    enquiryId: string,
    payload: { action: "update" | "convert"; status?: AdmissionEnquiryStatusType },
  ) => {
    const res = await fetch(
      `/api/school/admissions/enquiries/${encodeURIComponent(enquiryId)}?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      showToast("error", json?.error?.message || "Enquiry action failed.");
      return;
    }
    if (json.application) {
      showToast(
        "success",
        `Converted enquiry to application ${json.application.applicationCode} for ${json.application.studentName}.`,
      );
    } else {
      showToast("success", `Enquiry ${json.enquiry.enquiryCode} updated.`);
    }
    await fetchOverview(filters);
  };

  const handleCreateReminder = async (input: {
    title: string;
    academicYear?: string;
    priority: "INFO" | "WARNING";
  }) => {
    const res = await fetch(
      `/api/school/admissions/reminders?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      showToast("error", json?.error?.message || "Unable to add reminder.");
      return;
    }
    await fetchOverview(filters);
  };

  const handleToggleReminder = async (reminderId: string, isCompleted: boolean) => {
    const res = await fetch(
      `/api/school/admissions/reminders/${encodeURIComponent(reminderId)}?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      },
    );
    if (res.ok) await fetchOverview(filters);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const res = await fetch(
      `/api/school/admissions/reminders/${encodeURIComponent(reminderId)}?schoolSlug=${encodeURIComponent(school.slug)}`,
      { method: "DELETE" },
    );
    if (res.ok) await fetchOverview(filters);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(
        `/api/school/admissions/settings?schoolSlug=${encodeURIComponent(school.slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentAcademicYear: settingsAcademicYear,
            applicationDeadline: settingsDeadline || null,
            applicationPrefix: settingsPrefix,
            enabledGrades: settingsGrades,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Unable to update settings.");
      }
      showToast("success", "Admission settings saved.");
      await fetchOverview(filters);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleSettingGrade = (grade: string) => {
    setSettingsGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const activeTabLabel = useMemo(
    () => TAB_CONFIG.find((t) => t.id === activeTab)?.label || "Overview",
    [activeTab],
  );

  return (
    <SchoolWorkspaceShell
      school={school}
      user={user}
      activeNav="admissions"
      activeAdmissionsTab={activeTab}
      onSelectAdmissionsTab={handleTabSelect}
      noticeCount={data.reminders.length}
      onOpenSearch={() => {
        handleTabSelect("applications");
      }}
    >
      {/* Breadcrumb & Page Header */}
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#76799C]">
          <Link
            href={buildSchoolRoute(school.slug)}
            className="inline-flex items-center gap-1 hover:text-[#663CF6] font-medium"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <button
            type="button"
            onClick={() => handleTabSelect("overview")}
            className="font-semibold text-[#663CF6] hover:underline cursor-pointer"
          >
            Admissions
          </button>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-semibold text-[#08093B]" aria-current="page">
            {activeTabLabel}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight">
              Admissions
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#4D5072]">
              Manage enquiries, applications, document verification, and student admissions in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {data.permissions.canWrite && (
              <button
                id="admissions-new-application-btn"
                type="button"
                onClick={() => setNewAppOpen(true)}
                className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>New Application</span>
              </button>
            )}

            {data.permissions.canExport && (
              <button
                id="admissions-download-report-btn"
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2.5 text-xs font-bold text-[#08093B] shadow-xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#663CF6]" aria-hidden="true" />
                <span>Download Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Toast / Alert */}
      {feedbackBanner && (
        <div
          role={feedbackBanner.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-xs font-semibold ${
            feedbackBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-[11px] font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          SUB-NAVIGATION TAB BAR (Single non-wrapping horizontal strip)
          ===================================================================== */}
      <div className="rounded-[18px] border border-[#D6DBF0] bg-white/80 p-1.5 shadow-xs">
        <div
          role="tablist"
          aria-label="Admissions workspace sections"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        >
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admissions-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabSelect(tab.id)}
                className={`relative flex-none inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] ${
                  selected
                    ? "bg-[#663CF6] text-white shadow-sm"
                    : "text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-white/80"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          FILTER CONTROL BAR (Shared across Overview / Applications / Admitted)
          ===================================================================== */}
      {activeTab !== "settings" && (
        <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-3.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Academic Year Filter */}
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs">
              <span className="font-semibold text-[#76799C]">Academic Year:</span>
              <select
                aria-label="Filter by academic year"
                value={filters.academicYear}
                onChange={(e) => applyFilterUpdate({ academicYear: e.target.value })}
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer"
              >
                <option value="all">All Years</option>
                {data.availableAcademicYears.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay}
                  </option>
                ))}
              </select>
            </label>

            {/* Admission Grade Filter */}
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs">
              <span className="font-semibold text-[#76799C]">Admission Grade:</span>
              <select
                aria-label="Filter by admission grade"
                value={filters.grade}
                onChange={(e) => applyFilterUpdate({ grade: e.target.value })}
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer"
              >
                <option value="all">All Grades</option>
                {data.availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            {/* Status Filter */}
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs">
              <span className="font-semibold text-[#76799C]">Status:</span>
              <select
                aria-label="Filter by status"
                value={filters.status}
                onChange={(e) =>
                  applyFilterUpdate({
                    status: e.target.value as AdmissionApplicationStatusType | "all",
                  })
                }
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="DOCUMENTS_PENDING">Documents Pending</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="ADMITTED">Admitted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>

            {/* Date Range Filter */}
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-[#663CF6]" aria-hidden="true" />
              <select
                aria-label="Filter by date range"
                value={filters.datePreset}
                onChange={(e) =>
                  applyFilterUpdate({ datePreset: e.target.value as AdmissionsDatePreset })
                }
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="year">Selected Academic Year</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </label>

            {filters.datePreset === "custom" && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  aria-label="From date"
                  value={filters.from}
                  onChange={(e) => applyFilterUpdate({ from: e.target.value })}
                  className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B]"
                />
                <span className="text-[#76799C]">–</span>
                <input
                  type="date"
                  aria-label="To date"
                  value={filters.to}
                  onChange={(e) => applyFilterUpdate({ to: e.target.value })}
                  className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B]"
                />
              </div>
            )}

            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#663CF6] ml-auto">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Syncing...</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB PANELS
          ===================================================================== */}
      {activeTab === "overview" && (
        <div role="tabpanel" aria-labelledby="admissions-tab-overview" className="space-y-6">
          <AdmissionsKpisAndCharts
            data={data}
            granularity={filters.granularity}
            onGranularityChange={(g: AdmissionsTrendGranularity) =>
              applyFilterUpdate({ granularity: g, page: filters.page })
            }
            onViewGradeDetails={() => handleTabSelect("applications")}
          />

          <AdmissionsTable
            applications={data.applications}
            pagination={data.pagination}
            searchQuery={searchInput}
            onSearchChange={handleSearchChange}
            verificationFilter={filters.verificationStatus}
            onVerificationFilterChange={(verificationStatus) =>
              applyFilterUpdate({ verificationStatus })
            }
            onPageChange={(page) => applyFilterUpdate({ page })}
            onPageSizeChange={(pageSize) => applyFilterUpdate({ pageSize, page: 1 })}
            onInspectApplication={(app) => setInspectApp(app)}
            onQuickUpdateApplication={handleQuickUpdateApplication}
            onOpenNewApplication={() => setNewAppOpen(true)}
            canWrite={data.permissions.canWrite}
            canVerify={data.permissions.canVerify}
          />

          <AdmissionsActivityAndNotes
            activities={data.activities}
            reminders={data.reminders}
            academicYear={filters.academicYear}
            canWrite={data.permissions.canWrite}
            onCreateReminder={handleCreateReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
          />
        </div>
      )}

      {activeTab === "applications" && (
        <div role="tabpanel" aria-labelledby="admissions-tab-applications" className="space-y-4">
          <AdmissionsTable
            applications={data.applications}
            pagination={data.pagination}
            searchQuery={searchInput}
            onSearchChange={handleSearchChange}
            verificationFilter={filters.verificationStatus}
            onVerificationFilterChange={(verificationStatus) =>
              applyFilterUpdate({ verificationStatus })
            }
            onPageChange={(page) => applyFilterUpdate({ page })}
            onPageSizeChange={(pageSize) => applyFilterUpdate({ pageSize, page: 1 })}
            onInspectApplication={(app) => setInspectApp(app)}
            onQuickUpdateApplication={handleQuickUpdateApplication}
            onOpenNewApplication={() => setNewAppOpen(true)}
            canWrite={data.permissions.canWrite}
            canVerify={data.permissions.canVerify}
            title="All Applications"
          />
        </div>
      )}

      {activeTab === "enquiries" && (
        <div role="tabpanel" aria-labelledby="admissions-tab-enquiries" className="space-y-4">
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#08093B]">
                  Admission Enquiries ({data.enquiries.length})
                </h2>
                <p className="text-xs text-[#76799C]">
                  Track parent enquiries and convert qualified leads directly into formal applications.
                </p>
              </div>
              {data.permissions.canWrite && (
                <button
                  type="button"
                  onClick={() => setNewEnqOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4F27E8] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>New Enquiry</span>
                </button>
              )}
            </div>

            {data.enquiries.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center">
                <p className="text-sm font-bold text-[#08093B]">No enquiries recorded yet</p>
                <p className="mt-1 text-xs text-[#76799C]">
                  Log walk-in, phone, or website admission enquiries for {school.name}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto school-menu-scrollbar rounded-[14px] border border-[#DFE3F5]">
                <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                  <thead className="bg-[#F6F5FD] text-[11px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5]">
                    <tr>
                      <th scope="col" className="px-3 py-3">Enquiry ID</th>
                      <th scope="col" className="px-3 py-3">Student</th>
                      <th scope="col" className="px-3 py-3">Guardian Contact</th>
                      <th scope="col" className="px-3 py-3">Grade</th>
                      <th scope="col" className="px-3 py-3">Source</th>
                      <th scope="col" className="px-3 py-3">Status</th>
                      <th scope="col" className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {data.enquiries.map((enq) => {
                      const meta = ENQUIRY_STATUS_META[enq.status];
                      return (
                        <tr key={enq.id} className="hover:bg-[#FAF8FE]">
                          <td className="px-3 py-3 font-bold text-[#663CF6]">{enq.enquiryCode}</td>
                          <td className="px-3 py-3 font-bold text-[#08093B]">{enq.studentName}</td>
                          <td className="px-3 py-3 text-[#4D5072]">
                            <div>{enq.guardianName}</div>
                            <div className="text-[11px] text-[#76799C]">{enq.guardianPhone}</div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-[#4D5072]">{enq.gradeApplied}</td>
                          <td className="px-3 py-3 text-[#4D5072]">{enq.source}</td>
                          <td className="px-3 py-3">
                            {data.permissions.canWrite && enq.status !== "CONVERTED" ? (
                              <select
                                aria-label={`Status for enquiry ${enq.enquiryCode}`}
                                value={enq.status}
                                onChange={(e) =>
                                  handleEnquiryAction(enq.id, {
                                    action: "update",
                                    status: e.target.value as AdmissionEnquiryStatusType,
                                  })
                                }
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.bgClass} ${meta.textClass} ${meta.borderClass} cursor-pointer`}
                              >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                                <option value="CLOSED">Closed</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                              >
                                {meta.label}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {enq.status === "CONVERTED" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Converted</span>
                              </span>
                            ) : data.permissions.canWrite ? (
                              <button
                                type="button"
                                onClick={() => handleEnquiryAction(enq.id, { action: "convert" })}
                                className="inline-flex items-center gap-1 rounded-[8px] border border-[#DDD6FE] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:bg-[#663CF6] hover:text-white transition cursor-pointer"
                              >
                                <span>Convert to Application</span>
                                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "admitted" && (
        <div role="tabpanel" aria-labelledby="admissions-tab-admitted" className="space-y-4">
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#08093B]">
                  Admitted Students ({data.admittedStudents.length})
                </h2>
                <p className="text-xs text-[#76799C]">
                  Applicants who completed admission and received a tenant Admission Number.
                </p>
              </div>
            </div>

            {data.admittedStudents.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center">
                <p className="text-sm font-bold text-[#08093B]">No admitted students yet</p>
                <p className="mt-1 text-xs text-[#76799C]">
                  Once an application stage is updated to Admitted, the student and generated Admission Number appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto school-menu-scrollbar rounded-[14px] border border-[#DFE3F5]">
                <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                  <thead className="bg-[#F6F5FD] text-[11px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5]">
                    <tr>
                      <th scope="col" className="px-3 py-3">Admission No</th>
                      <th scope="col" className="px-3 py-3">Application ID</th>
                      <th scope="col" className="px-3 py-3">Student Name</th>
                      <th scope="col" className="px-3 py-3">Grade</th>
                      <th scope="col" className="px-3 py-3">Guardian Contact</th>
                      <th scope="col" className="px-3 py-3">Admitted On</th>
                      <th scope="col" className="px-3 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {data.admittedStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-[#FAF8FE]">
                        <td className="px-3 py-3 font-extrabold text-emerald-700">
                          {stu.admissionNumber || "Assigned"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#663CF6]">
                          {stu.applicationCode}
                        </td>
                        <td className="px-3 py-3 font-bold text-[#08093B]">{stu.studentName}</td>
                        <td className="px-3 py-3 text-[#4D5072]">{stu.gradeApplied}</td>
                        <td className="px-3 py-3 text-[#4D5072]">
                          {stu.guardianName} · {stu.guardianPhone}
                        </td>
                        <td className="px-3 py-3 text-[#4D5072]">
                          {stu.admittedAt
                            ? new Intl.DateTimeFormat("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "Asia/Kolkata",
                              }).format(new Date(stu.admittedAt))
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectApp(stu)}
                            className="rounded-[8px] border border-[#D6DBF0] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:bg-[#FAF8FE] cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "settings" && (
        <div role="tabpanel" aria-labelledby="admissions-tab-settings" className="space-y-4">
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xs max-w-3xl">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#08093B]">Admission Settings</h2>
                <p className="text-xs text-[#76799C]">
                  Configure active admission cycle, last date reminder, code prefix, and open grades for {school.name}.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="settings-ay"
                    className="block text-xs font-bold text-[#08093B] mb-1"
                  >
                    Current Academic Year
                  </label>
                  <input
                    id="settings-ay"
                    type="text"
                    required
                    disabled={!data.permissions.canManageSettings}
                    value={settingsAcademicYear}
                    onChange={(e) => setSettingsAcademicYear(e.target.value)}
                    placeholder="2026 – 2027"
                    className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs font-semibold text-[#08093B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-deadline"
                    className="block text-xs font-bold text-[#08093B] mb-1"
                  >
                    Application Last Date
                  </label>
                  <input
                    id="settings-deadline"
                    type="date"
                    disabled={!data.permissions.canManageSettings}
                    value={settingsDeadline}
                    onChange={(e) => setSettingsDeadline(e.target.value)}
                    className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs font-semibold text-[#08093B]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-prefix"
                    className="block text-xs font-bold text-[#08093B] mb-1"
                  >
                    Application ID Prefix
                  </label>
                  <input
                    id="settings-prefix"
                    type="text"
                    required
                    disabled={!data.permissions.canManageSettings}
                    value={settingsPrefix}
                    onChange={(e) => setSettingsPrefix(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs font-semibold text-[#08093B]"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#08093B] mb-2">
                  Grades Open for Admission
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {DEFAULT_ADMISSION_GRADES.map((grade) => {
                    const checked = settingsGrades.includes(grade);
                    return (
                      <label
                        key={grade}
                        className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs font-semibold cursor-pointer transition ${
                          checked
                            ? "border-[#663CF6] bg-[#FAF8FE] text-[#663CF6]"
                            : "border-[#DFE3F5] bg-white text-[#4D5072]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!data.permissions.canManageSettings}
                          checked={checked}
                          onChange={() => toggleSettingGrade(grade)}
                          className="h-3.5 w-3.5 accent-[#663CF6]"
                        />
                        <span>{grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {data.permissions.canManageSettings && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings || settingsGrades.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
                  >
                    {savingSettings && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    )}
                    <span>{savingSettings ? "Saving..." : "Save Settings"}</span>
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      )}

      {/* Modals */}
      <NewApplicationModal
        open={newAppOpen}
        onClose={() => setNewAppOpen(false)}
        grades={data.availableGrades}
        defaultAcademicYear={data.settings.currentAcademicYear}
        academicYears={data.availableAcademicYears}
        onSubmit={handleCreateApplication}
      />

      <NewEnquiryModal
        open={newEnqOpen}
        onClose={() => setNewEnqOpen(false)}
        grades={data.availableGrades}
        defaultAcademicYear={data.settings.currentAcademicYear}
        academicYears={data.availableAcademicYears}
        onSubmit={handleCreateEnquiry}
      />

      <ApplicationDetailModal
        application={inspectApp}
        onClose={() => setInspectApp(null)}
        canWrite={data.permissions.canWrite}
        canVerify={data.permissions.canVerify}
        onSave={handleQuickUpdateApplication}
      />
    </SchoolWorkspaceShell>
  );
}
