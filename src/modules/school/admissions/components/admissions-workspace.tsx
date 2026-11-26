"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Download,
  Calendar,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  SchoolWorkspaceShell,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "@/modules/school/components/school-workspace-shell";
import {
  ENQUIRY_STATUS_META,
  DEFAULT_ADMISSION_GRADES,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
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
import { ApplicationsManagementView } from "./applications-management-view";
import {
  ApplicationDetailModal,
  NewEnquiryModal,
} from "./admissions-modals";

interface AdmissionsWorkspaceProps {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  initialData: AdmissionsOverviewData;
  initialTab: AdmissionsTab;
}

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
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [newEnqOpen, setNewEnqOpen] = useState(false);
  const [inspectApp, setInspectApp] = useState<AdmissionApplicationRecord | null>(null);
  const [inspectAppMode, setInspectAppMode] = useState<"view" | "edit">("view");
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);

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
  const filtersRef = useRef<AdmissionsOverviewFilters>(initialData.filters);
  const clientQueryCacheRef = useRef<Map<string, AdmissionsOverviewData>>(new Map());
  const activeFetchAbortRef = useRef<AbortController | null>(null);

  const applyOverviewSnapshot = useCallback((nextData: AdmissionsOverviewData) => {
    setData(nextData);
    setSettingsAcademicYear(nextData.settings.currentAcademicYear);
    setSettingsDeadline(
      nextData.settings.applicationDeadline
        ? nextData.settings.applicationDeadline.slice(0, 10)
        : "",
    );
    setSettingsPrefix(nextData.settings.applicationPrefix);
    setSettingsGrades(nextData.settings.enabledGrades);
  }, []);

  // Seed client query cache with initial server-rendered data
  useEffect(() => {
    const initialQs = buildFilterQueryString(initialData.filters, school.slug);
    clientQueryCacheRef.current.set(initialQs, initialData);
  }, [initialData, school.slug]);

  // Sync tab when sidebar links update URL query via initialTab or browser Back/Forward
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handlePopState = () => {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (
        tabParam === "overview" ||
        tabParam === "applications" ||
        tabParam === "enquiries" ||
        tabParam === "admitted" ||
        tabParam === "settings"
      ) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const fetchOverview = useCallback(
    async (
      nextFilters: AdmissionsOverviewFilters,
      options?: { bypassClientCache?: boolean },
    ) => {
      const qs = buildFilterQueryString(nextFilters, school.slug);

      if (options?.bypassClientCache) {
        clientQueryCacheRef.current.clear();
      } else {
        const cached = clientQueryCacheRef.current.get(qs);
        if (cached) {
          activeFetchAbortRef.current?.abort();
          activeFetchAbortRef.current = null;
          applyOverviewSnapshot(cached);
          return;
        }
      }

      activeFetchAbortRef.current?.abort();
      const controller = new AbortController();
      activeFetchAbortRef.current = controller;

      try {
        const res = await fetch(`/api/school/admissions/overview?${qs}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message || "Failed to refresh admissions data.");
        }
        if (clientQueryCacheRef.current.size >= 60) {
          const oldestKey = clientQueryCacheRef.current.keys().next().value;
          if (oldestKey) clientQueryCacheRef.current.delete(oldestKey);
        }
        clientQueryCacheRef.current.set(qs, json.data);
        applyOverviewSnapshot(json.data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setFeedbackBanner({
          type: "error",
          text: err instanceof Error ? err.message : "Unable to load admissions data.",
        });
      } finally {
        if (activeFetchAbortRef.current === controller) {
          activeFetchAbortRef.current = null;
        }
      }
    },
    [school.slug, applyOverviewSnapshot],
  );

  const applyFilterUpdate = useCallback(
    (patch: Partial<AdmissionsOverviewFilters>) => {
      const prev = filtersRef.current;
      const next: AdmissionsOverviewFilters = {
        ...prev,
        ...patch,
        page: patch.page !== undefined ? patch.page : 1,
      };
      filtersRef.current = next;
      setFilters(next);
      if (patch.datePreset === "custom" && !next.from && !next.to) {
        if (prev.datePreset !== "all" && prev.datePreset !== "custom") {
          void fetchOverview({ ...next, datePreset: "all" });
        }
        return;
      }
      void fetchOverview(next);
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

  const handleSearchSubmit = useCallback(
    (value: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setSearchInput(value);
      applyFilterUpdate({ search: value, page: 1 });
    },
    [applyFilterUpdate],
  );

  const handleResetFilters = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput("");
    const resetFilters: AdmissionsOverviewFilters = {
      academicYear: data.settings.currentAcademicYear || "all",
      grade: "all",
      status: "all",
      verificationStatus: "all",
      datePreset: "all",
      from: "",
      to: "",
      granularity: filtersRef.current.granularity,
      search: "",
      page: 1,
      pageSize: filtersRef.current.pageSize,
    };
    filtersRef.current = resetFilters;
    setFilters(resetFilters);
    void fetchOverview(resetFilters);
  }, [data.settings.currentAcademicYear, fetchOverview]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      activeFetchAbortRef.current?.abort();
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
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, []);

  const handleOpenGlobalSearch = useCallback(() => {
    handleTabSelect("applications");
    setSearchFocusNonce((n) => n + 1);
  }, [handleTabSelect]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleOpenGlobalSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenGlobalSearch]);

  const handleDownloadReport = () => {
    const qs = buildFilterQueryString(filters, school.slug);
    window.location.assign(`/api/school/admissions/export?${qs}`);
  };

  const handleDownloadImportTemplate = () => {
    const templateCsv = [
      "Student Name,Grade Applied,Academic Year,Guardian Name,Guardian Phone,Guardian Email,Gender,Date of Birth,Previous School,Status",
      `Synthetic Applicant,Class I,${data.settings.currentAcademicYear || "2026 – 2027"},Synthetic Guardian,+919000000001,guardian@example.com,Male,2019-05-12,Example Prep School,UNDER_REVIEW`,
    ].join("\n");
    const blob = new Blob([templateCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admissions-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpdateApplications = async (
    applicationIds: string[],
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => {
    const res = await fetch(
      `/api/school/admissions/applications/bulk?schoolSlug=${encodeURIComponent(school.slug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds, ...payload }),
      },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg = json?.error?.message || "Unable to bulk update applications.";
      showToast("error", msg);
      throw new Error(msg);
    }
    showToast(
      "success",
      `Updated ${json.updatedCount} selected application${json.updatedCount === 1 ? "" : "s"}.`,
    );
    await fetchOverview(filters, { bypassClientCache: true });
  };

  const handleCreateApplication = async (
    payload: Record<string, unknown>,
  ): Promise<AdmissionApplicationRecord> => {
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
      json.application?.isDraft
        ? `Draft ${json.application.applicationCode} saved for ${json.application.studentName}.`
        : `Application ${json.application.applicationCode} submitted for ${json.application.studentName}${json.application.studentIdNumber ? ` · Student ID: ${json.application.studentIdNumber}` : ""}.`,
    );
    await fetchOverview(filters, { bypassClientCache: true });
    return json.application as AdmissionApplicationRecord;
  };

  const handleQuickUpdateApplication = async (
    applicationId: string,
    payload: Record<string, unknown>,
  ): Promise<AdmissionApplicationRecord> => {
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
    showToast(
      "success",
      json.application?.isDraft
        ? `Updated draft ${json.application.applicationCode}.`
        : `Updated ${json.application.studentName} (${json.application.applicationCode}${json.application.studentIdNumber ? ` · ${json.application.studentIdNumber}` : ""}).`,
    );
    await fetchOverview(filters, { bypassClientCache: true });
    return json.application as AdmissionApplicationRecord;
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
    await fetchOverview(filters, { bypassClientCache: true });
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
    await fetchOverview(filters, { bypassClientCache: true });
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
    await fetchOverview(filters, { bypassClientCache: true });
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
    if (res.ok) await fetchOverview(filters, { bypassClientCache: true });
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const res = await fetch(
      `/api/school/admissions/reminders/${encodeURIComponent(reminderId)}?schoolSlug=${encodeURIComponent(school.slug)}`,
      { method: "DELETE" },
    );
    if (res.ok) await fetchOverview(filters, { bypassClientCache: true });
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
      await fetchOverview(filters, { bypassClientCache: true });
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

  return (
    <SchoolWorkspaceShell
      school={school}
      user={user}
      activeNav="admissions"
      activeAdmissionsTab={activeTab}
      onSelectAdmissionsTab={handleTabSelect}
      noticeCount={data.reminders.length}
      onOpenSearch={handleOpenGlobalSearch}
    >
      {/* Page Header (Overview, Enquiries, Admitted, Settings — Applications renders custom Application Management header) */}
      {activeTab !== "applications" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight dark:text-[#F3F5FF]">
              Admissions
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#9DA6CC]">
              Manage enquiries, applications, document verification, and student admissions in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {data.permissions.canExport && (
              <button
                id="admissions-download-report-btn"
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2.5 text-xs font-bold text-[#08093B] shadow-xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6] dark:hover:text-[#C4B5FD]"
              >
                <Download className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>Download Report</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Toast / Alert */}
      {feedbackBanner && (
        <div
          role={feedbackBanner.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-xs font-semibold ${
            feedbackBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
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
          FILTER CONTROL BAR (Overview / Enquiries / Admitted)
          ===================================================================== */}
      {activeTab !== "settings" && activeTab !== "applications" && (
        <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-3.5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Academic Year Filter */}
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]">
              <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Academic Year:</span>
              <select
                aria-label="Filter by academic year"
                value={filters.academicYear}
                onChange={(e) => applyFilterUpdate({ academicYear: e.target.value })}
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
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
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]">
              <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Admission Grade:</span>
              <select
                aria-label="Filter by admission grade"
                value={filters.grade}
                onChange={(e) => applyFilterUpdate({ grade: e.target.value })}
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
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
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]">
              <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Status:</span>
              <select
                aria-label="Filter by status"
                value={filters.status}
                onChange={(e) =>
                  applyFilterUpdate({
                    status: e.target.value as AdmissionApplicationStatusType | "all",
                  })
                }
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
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
            <label className="flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]">
              <Calendar className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
              <select
                aria-label="Filter by date range"
                value={filters.datePreset}
                onChange={(e) =>
                  applyFilterUpdate({ datePreset: e.target.value as AdmissionsDatePreset })
                }
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
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
                  className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
                <span className="text-[#76799C] dark:text-[#9DA6CC]">–</span>
                <input
                  type="date"
                  aria-label="To date"
                  value={filters.to}
                  onChange={(e) => applyFilterUpdate({ to: e.target.value })}
                  className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMISSIONS SECTION PANELS
          ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <AdmissionsKpisAndCharts
            data={data}
            granularity={filters.granularity}
            onGranularityChange={(g: AdmissionsTrendGranularity) =>
              applyFilterUpdate({ granularity: g, page: filters.page })
            }
            onViewGradeDetails={() => handleTabSelect("applications")}
          />

          <AdmissionsTable
            schoolSlug={school.slug}
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
            onInspectApplication={(app) => {
              setInspectAppMode("view");
              setInspectApp(app);
            }}
            onEditApplication={(app) => {
              setInspectAppMode("edit");
              setInspectApp(app);
            }}
            onQuickUpdateApplication={handleQuickUpdateApplication}
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
        <ApplicationsManagementView
          schoolName={school.name}
          schoolSlug={school.slug}
          schoolContactEmail={school.contactEmail}
          schoolContactPhone={school.contactPhone}
          data={data}
          filters={filters}
          searchInput={searchInput}
          searchFocusNonce={searchFocusNonce}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onApplyFilterUpdate={applyFilterUpdate}
          onResetFilters={handleResetFilters}
          onInspectApplication={(app, mode = "view") => {
            setInspectAppMode(mode);
            setInspectApp(app);
          }}
          onQuickUpdateApplication={handleQuickUpdateApplication}
          onBulkUpdateApplications={handleBulkUpdateApplications}
          onCreateApplication={handleCreateApplication}
          onUpdateApplication={handleQuickUpdateApplication}
          onDownloadReport={handleDownloadReport}
          onDownloadImportTemplate={handleDownloadImportTemplate}
        />
      )}

      {activeTab === "enquiries" && (
        <div className="space-y-4">
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Admission Enquiries ({data.enquiries.length})
                </h2>
                <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
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
              <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
                <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">No enquiries recorded yet</p>
                <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  Log walk-in, phone, or website admission enquiries for {school.name}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto school-menu-scrollbar rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
                <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                  <thead className="bg-[#F6F5FD] text-[11px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
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
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                    {data.enquiries.map((enq) => {
                      const meta = ENQUIRY_STATUS_META[enq.status];
                      return (
                        <tr key={enq.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]">
                          <td className="px-3 py-3 font-bold text-[#663CF6] dark:text-[#A78BFA]">{enq.enquiryCode}</td>
                          <td className="px-3 py-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">{enq.studentName}</td>
                          <td className="px-3 py-3 text-[#4D5072] dark:text-[#C5CCF0]">
                            <div>{enq.guardianName}</div>
                            <div className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{enq.guardianPhone}</div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-[#4D5072] dark:text-[#C5CCF0]">{enq.gradeApplied}</td>
                          <td className="px-3 py-3 text-[#4D5072] dark:text-[#C5CCF0]">{enq.source}</td>
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
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Converted</span>
                              </span>
                            ) : data.permissions.canWrite ? (
                              <button
                                type="button"
                                onClick={() => handleEnquiryAction(enq.id, { action: "convert" })}
                                className="inline-flex items-center gap-1 rounded-[8px] border border-[#DDD6FE] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:bg-[#663CF6] hover:text-white transition cursor-pointer dark:border-[#3D3170] dark:bg-[#1E1A40] dark:text-[#CBB8FF] dark:hover:bg-[#7C5CFF] dark:hover:text-white"
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
        <div className="space-y-4">
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Admitted Students ({data.admittedStudents.length})
                </h2>
                <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  Applicants who completed admission and received a tenant Admission Number.
                </p>
              </div>
            </div>

            {data.admittedStudents.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
                <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">No admitted students yet</p>
                <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  Once an application stage is updated to Admitted, the student and generated Admission Number appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto school-menu-scrollbar rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
                <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                  <thead className="bg-[#F6F5FD] text-[11px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
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
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                    {data.admittedStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]">
                        <td className="px-3 py-3 font-extrabold text-emerald-700 dark:text-emerald-400">
                          {stu.admissionNumber || "Assigned"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#663CF6] dark:text-[#A78BFA]">
                          {stu.applicationCode}
                        </td>
                        <td className="px-3 py-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">{stu.studentName}</td>
                        <td className="px-3 py-3 text-[#4D5072] dark:text-[#C5CCF0]">{stu.gradeApplied}</td>
                        <td className="px-3 py-3 text-[#4D5072] dark:text-[#C5CCF0]">
                          {stu.guardianName} · {stu.guardianPhone}
                        </td>
                        <td className="px-3 py-3 text-[#4D5072] dark:text-[#9DA6CC]">
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
                            className="rounded-[8px] border border-[#D6DBF0] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:bg-[#FAF8FE] cursor-pointer dark:border-[#30365C] dark:text-[#C4B5FD] dark:hover:bg-[#1F2447]"
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
        <div className="space-y-4">
          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xs max-w-3xl dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Admission Settings</h2>
                <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  Configure active admission cycle, last date reminder, code prefix, and open grades for {school.name}.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="settings-ay"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
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
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-deadline"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                  >
                    Application Last Date
                  </label>
                  <input
                    id="settings-deadline"
                    type="date"
                    disabled={!data.permissions.canManageSettings}
                    value={settingsDeadline}
                    onChange={(e) => setSettingsDeadline(e.target.value)}
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-prefix"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
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
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#08093B] mb-2 dark:text-[#F3F5FF]">
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
                            ? "border-[#663CF6] bg-[#FAF8FE] text-[#663CF6] dark:border-[#8B5CF6] dark:bg-[#231D4B] dark:text-[#D9CEFF]"
                            : "border-[#DFE3F5] bg-white text-[#4D5072] dark:border-[#2A2F58] dark:bg-[#10142C] dark:text-[#9DA6CC]"
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
        schoolSlug={school.slug}
        onClose={() => setInspectApp(null)}
        canWrite={data.permissions.canWrite}
        canVerify={data.permissions.canVerify}
        initialMode={inspectAppMode}
        availableGrades={data.availableGrades}
        onSave={handleQuickUpdateApplication}
      />
    </SchoolWorkspaceShell>
  );
}
