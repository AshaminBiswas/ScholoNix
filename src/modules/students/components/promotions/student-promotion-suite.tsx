"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  History,
  LayoutGrid,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type {
  PromotionGradeBand,
  PromotionSettingsConfig,
  PromotionSettingsSuiteConfig,
  PromotionSuiteTab,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";
import { PromotionOverviewTab } from "@/modules/students/components/promotions/promotion-overview-tab";
import { PromotionListTab } from "@/modules/students/components/promotions/promotion-list-tab";
import {
  PromotionResultCriteriaTab,
  PromotionRulesTab,
} from "@/modules/students/components/promotions/promotion-rules-criteria-tabs";
import { PromotionHistoryTab } from "@/modules/students/components/promotions/promotion-history-tab";
import { PromotionSettingsSuite } from "@/modules/students/components/promotions/settings/promotion-settings-suite";

export interface StudentPromotionSuiteProps {
  mode: "school" | "platform";
  schoolId: string;
  grades: string[];
  academicYears: string[];
  sections: string[];
  canPromote: boolean;
  canManageSettings: boolean;
  onOpenStudentProfile: (studentId: string) => void;
  onPromoted?: () => void;
}

const SUITE_TABS: Array<{ id: PromotionSuiteTab; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: "list", label: "Promotion List", icon: <ClipboardList className="h-3.5 w-3.5" /> },
  { id: "rules", label: "Promotion Rules", icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
  { id: "criteria", label: "Result Criteria", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
];

export function StudentPromotionSuite({
  mode,
  schoolId,
  grades,
  academicYears,
  sections,
  canPromote,
  canManageSettings,
  onOpenStudentProfile,
  onPromoted,
}: StudentPromotionSuiteProps) {
  const [activeTab, setActiveTab] = useState<PromotionSuiteTab>("overview");
  const [academicYear, setAcademicYear] = useState(academicYears[0] || "2025-2026");
  const [fromGrade, setFromGrade] = useState("ALL");
  const [toGrade, setToGrade] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [data, setData] = useState<StudentPromotionOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  // Batch Execution / Dry-Run Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudentIds, setModalStudentIds] = useState<string[]>([]);
  const [modalFromGrade, setModalFromGrade] = useState("ALL");
  const [modalToAcademicYear, setModalToAcademicYear] = useState("2026-2027");
  const [modalToGrade, setModalToGrade] = useState(grades[1] || grades[0] || "Class II");
  const [modalToSection, setModalToSection] = useState(sections[0] || "A");
  const [modalDecision, setModalDecision] = useState<"PROMOTE" | "RETAIN" | "ALUMNI">("PROMOTE");
  const [modalRemarks, setModalRemarks] = useState("");
  const [dryRunResult, setDryRunResult] = useState<{
    processedCount: number;
    promotedCount: number;
    retainedCount: number;
    alumniCount: number;
  } | null>(null);

  const baseOverviewUrl =
    mode === "platform"
      ? `/api/platform/schools/${schoolId}/promotions`
      : `/api/school/students/promotions/overview`;

  const executeUrl =
    mode === "platform"
      ? `/api/platform/schools/${schoolId}/promotions`
      : `/api/school/students/promotions/execute`;

  const rulesUrl =
    mode === "platform"
      ? `/api/platform/schools/${schoolId}/promotions`
      : `/api/school/students/promotions/rules`;

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (academicYear) qs.set("academicYear", academicYear);
      if (fromGrade !== "ALL") qs.set("fromGrade", fromGrade);
      if (toGrade !== "ALL") qs.set("toGrade", toGrade);
      if (sectionFilter !== "ALL") qs.set("section", sectionFilter);
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      if (searchQuery.trim()) qs.set("search", searchQuery.trim());

      const res = await fetch(`${baseOverviewUrl}?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load student promotion overview");
      }
      setData(json.overview);
    } catch (err) {
      setFeedback({
        type: "err",
        message: err instanceof Error ? err.message : "Failed to load promotions",
      });
    } finally {
      setLoading(false);
    }
  }, [baseOverviewUrl, academicYear, fromGrade, toGrade, sectionFilter, statusFilter, searchQuery]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleOpenModal = (opts?: {
    studentIds?: string[];
    decision?: "PROMOTE" | "RETAIN" | "ALUMNI";
    defaultFromGrade?: string;
    defaultToGrade?: string;
    dryRunFirst?: boolean;
  }) => {
    const sourceFrom = opts?.defaultFromGrade || (fromGrade !== "ALL" ? fromGrade : data?.grades[0] || "ALL");
    const explicitIds =
      opts?.studentIds && opts.studentIds.length > 0
        ? opts.studentIds
        : (data?.decisions || [])
            .filter((d) => sourceFrom === "ALL" || d.currentGrade === sourceFrom)
            .filter((d) => d.status === "PENDING")
            .map((d) => d.studentId);

    setModalFromGrade(sourceFrom);
    setModalStudentIds(explicitIds);
    setModalDecision(opts?.decision || "PROMOTE");
    setModalToGrade(
      opts?.defaultToGrade ||
        data?.rules.find((r) => r.fromGrade === sourceFrom)?.toGrade ||
        data?.grades[1] ||
        grades[0] ||
        "Class II",
    );
    setDryRunResult(null);
    setModalOpen(true);

    if (opts?.dryRunFirst && explicitIds.length > 0) {
      void runBatchRequest({
        studentIds: explicitIds,
        decision: opts.decision || "PROMOTE",
        toGrade: opts.defaultToGrade || modalToGrade,
        dryRun: true,
      });
    }
  };

  const runBatchRequest = async (override?: {
    studentIds: string[];
    decision: "PROMOTE" | "RETAIN" | "ALUMNI";
    toGrade: string;
    dryRun: boolean;
  }) => {
    const targetIds = override?.studentIds ?? modalStudentIds;
    if (targetIds.length === 0) {
      setFeedback({ type: "err", message: "Select at least one eligible student." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(executeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: targetIds,
          academicYear,
          toAcademicYear: modalToAcademicYear,
          toGrade: override?.toGrade ?? modalToGrade,
          toSection: modalToSection,
          decision: override?.decision ?? modalDecision,
          dryRun: override?.dryRun ?? false,
          remarks: modalRemarks.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Promotion batch execution failed");
      }

      if (override?.dryRun) {
        setDryRunResult(json.result);
      } else {
        setModalOpen(false);
        setDryRunResult(null);
        setFeedback({
          type: "ok",
          message: `Completed promotion batch (${json.result.processedCount} students processed).`,
        });
        await loadOverview();
        onPromoted?.();
      }
    } catch (err) {
      setFeedback({
        type: "err",
        message: err instanceof Error ? err.message : "Failed to run batch",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRulesAndSettings = async (payload: {
    academicYear: string;
    rules?: Array<{
      ruleName?: string;
      fromGrade: string;
      toGrade: string;
      markAsAlumni: boolean;
      defaultSectionMode: "KEEP_SAME" | "TARGET_SECTION" | "AUTO_BALANCE";
      targetSection: string | null;
      minResultPct: number;
      minAttendancePct: number;
      maxFailedSubjects: number;
      criteriaSummary?: string;
      requireAssessmentsCompleted?: boolean;
      requireResultPublished?: boolean;
      requireFeeClearance?: boolean;
      gradeCriteria?: PromotionGradeBand[];
      isActive: boolean;
    }>;
    settings?: PromotionSettingsConfig;
    settingsSuite?: PromotionSettingsSuiteConfig;
  }) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(rulesUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save promotion configuration");
      }
      setFeedback({ type: "ok", message: "Promotion rules & settings saved." });
      await loadOverview();
    } catch (err) {
      setFeedback({
        type: "err",
        message: err instanceof Error ? err.message : "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    if (mode === "school") {
      const qs = new URLSearchParams();
      if (academicYear) qs.set("academicYear", academicYear);
      if (fromGrade !== "ALL") qs.set("fromGrade", fromGrade);
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      window.open(`/api/school/students/promotions/export?${qs.toString()}`, "_blank");
      return;
    }

    if (!data) return;
    const header = "Admission No,Student Name,From Class,Section,To Class,Result %,Status\n";
    const body = data.decisions
      .map(
        (d) =>
          `"${d.admissionNumber}","${d.studentName}","${d.currentGrade}","${d.currentSection}","${d.nextGrade}",${d.promotionPct.toFixed(1)},"${d.status}"`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotions-${schoolId}-${academicYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* 6 Horizontal Sub-Tabs */}
      <nav
        aria-label="Student promotion sections"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/85 bg-white/75 p-1.5 backdrop-blur-md shadow-[0_6px_18px_rgba(79,39,232,0.05)] dark:border-[#272B4D] dark:bg-[#141731]/90"
      >
        {SUITE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 inline-flex items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-[0_6px_14px_rgba(79,39,232,0.25)]"
                  : "text-[#4D5072] hover:bg-[#F1EFFD] hover:text-[#4F27E8] dark:text-[#B4BDD9] dark:hover:bg-[#1F244A] dark:hover:text-[#EEF0FF]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-bold ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Loading Skeleton or Content */}
      {loading && !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-[18px] bg-white/70 dark:bg-[#141731]/70"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-[18px] bg-white/70 dark:bg-[#141731]/70" />
        </div>
      ) : !data ? (
        <div className={`${STUDENT_CARD_SURFACE} p-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]`}>
          Unable to load promotion data right now.
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <PromotionOverviewTab
              data={data}
              academicYear={academicYear}
              fromGrade={fromGrade}
              toGrade={toGrade}
              statusFilter={statusFilter}
              onFilterChange={(patch) => {
                if (patch.academicYear !== undefined) setAcademicYear(patch.academicYear);
                if (patch.fromGrade !== undefined) setFromGrade(patch.fromGrade);
                if (patch.toGrade !== undefined) setToGrade(patch.toGrade);
                if (patch.status !== undefined) setStatusFilter(patch.status);
              }}
              onResetFilters={() => {
                setFromGrade("ALL");
                setToGrade("ALL");
                setSectionFilter("ALL");
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              onSwitchTab={setActiveTab}
              onOpenClassList={(grade) => {
                setFromGrade(grade);
                setActiveTab("list");
              }}
              onOpenBatchModal={(defaultFrom) =>
                handleOpenModal({ defaultFromGrade: defaultFrom })
              }
              onOpenStudentProfile={onOpenStudentProfile}
              onDownloadReport={handleDownloadReport}
            />
          )}

          {activeTab === "list" && (
            <PromotionListTab
              data={data}
              academicYear={academicYear}
              fromGrade={fromGrade}
              toGrade={toGrade}
              sectionFilter={sectionFilter}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              canPromote={canPromote}
              onFilterChange={(patch) => {
                if (patch.academicYear !== undefined) setAcademicYear(patch.academicYear);
                if (patch.fromGrade !== undefined) setFromGrade(patch.fromGrade);
                if (patch.toGrade !== undefined) setToGrade(patch.toGrade);
                if (patch.section !== undefined) setSectionFilter(patch.section);
                if (patch.status !== undefined) setStatusFilter(patch.status);
                if (patch.search !== undefined) setSearchQuery(patch.search);
              }}
              onOpenStudentProfile={onOpenStudentProfile}
              onTriggerBatchAction={(params) =>
                handleOpenModal({
                  studentIds: params.studentIds,
                  decision: params.decision,
                  defaultToGrade: params.defaultToGrade,
                  dryRunFirst: params.dryRun,
                })
              }
            />
          )}

          {activeTab === "rules" && (
            <PromotionRulesTab
              data={data}
              academicYear={academicYear}
              canManageSettings={canManageSettings}
              saving={saving}
              onSaveRulesAndSettings={handleSaveRulesAndSettings}
            />
          )}

          {activeTab === "criteria" && (
            <PromotionResultCriteriaTab
              data={data}
              academicYear={academicYear}
              canManageSettings={canManageSettings}
              saving={saving}
              onSaveRulesAndSettings={handleSaveRulesAndSettings}
            />
          )}

          {activeTab === "history" && (
            <PromotionHistoryTab
              data={data}
              onSwitchTab={setActiveTab}
              onSelectYearAndOpenList={(ay, grade) => {
                setAcademicYear(ay);
                if (grade) setFromGrade(grade);
                setActiveTab("list");
              }}
              onDownloadReport={handleDownloadReport}
            />
          )}

          {activeTab === "settings" && (
            <PromotionSettingsSuite
              mode={mode}
              schoolId={schoolId}
              data={data}
              academicYear={academicYear}
              canManageSettings={canManageSettings}
              saving={saving}
              onSaveAll={(payload) => handleSaveRulesAndSettings(payload)}
              onSwitchSuiteTab={setActiveTab}
              onReloadOverview={async () => {
                await loadOverview();
                onPromoted?.();
              }}
              onDownloadReport={handleDownloadReport}
              onNotifyFeedback={setFeedback}
            />
          )}
        </>
      )}

      {/* Batch Execute / Dry-Run Preview Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Execute student promotion batch"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
                Execute Promotion Batch
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1F244A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#F5F2FF] px-3.5 py-2.5 text-xs font-bold text-[#4F27E8] dark:bg-[#221A44] dark:text-[#DDD6FE]">
              Target Batch Cohort: {modalStudentIds.length} students (From: {modalFromGrade})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Decision</span>
                <select
                  value={modalDecision}
                  onChange={(e) =>
                    setModalDecision(e.target.value as "PROMOTE" | "RETAIN" | "ALUMNI")
                  }
                  className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 font-semibold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                >
                  <option value="PROMOTE">Promote to Next Class</option>
                  <option value="RETAIN">Retain (Not Promoted)</option>
                  <option value="ALUMNI">Graduate as Alumni</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                  To Academic Year
                </span>
                <input
                  type="text"
                  value={modalToAcademicYear}
                  onChange={(e) => setModalToAcademicYear(e.target.value)}
                  className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 font-semibold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Target Class</span>
                <input
                  type="text"
                  value={modalToGrade}
                  onChange={(e) => setModalToGrade(e.target.value)}
                  className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 font-semibold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Target Section</span>
                <input
                  type="text"
                  value={modalToSection}
                  onChange={(e) => setModalToSection(e.target.value)}
                  className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 font-semibold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Audit Remarks (Optional)
              </span>
              <input
                type="text"
                value={modalRemarks}
                onChange={(e) => setModalRemarks(e.target.value)}
                placeholder="e.g., Annual academic progression approved by Principal"
                className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              />
            </label>

            {dryRunResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1 dark:border-emerald-900 dark:bg-emerald-950/60">
                <p className="font-black text-emerald-800 dark:text-emerald-200">
                  Dry-Run Impact Preview (Zero DB writes performed)
                </p>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Eligible: {dryRunResult.processedCount} | Promote: {dryRunResult.promotedCount} |
                  Retain: {dryRunResult.retainedCount} | Alumni: {dryRunResult.alumniCount}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  runBatchRequest({
                    studentIds: modalStudentIds,
                    decision: modalDecision,
                    toGrade: modalToGrade,
                    dryRun: true,
                  })
                }
                className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#C4B5FD] bg-white px-3.5 text-xs font-bold text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:border-[#4C3D99] dark:bg-[#10132A] dark:text-[#DDD6FE]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Dry-Run Preview</span>
              </button>
              <button
                type="button"
                disabled={saving || modalStudentIds.length === 0}
                onClick={() =>
                  runBatchRequest({
                    studentIds: modalStudentIds,
                    decision: modalDecision,
                    toGrade: modalToGrade,
                    dryRun: false,
                  })
                }
                className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{saving ? "Processing..." : "Confirm & Execute Batch"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
