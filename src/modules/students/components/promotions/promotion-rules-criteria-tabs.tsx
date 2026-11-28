"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileCheck2,
  Filter,
  IndianRupee,
  Info,
  Layers,
  PauseCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  DEFAULT_PROMOTION_GRADE_BANDS,
  type PromotionGradeBand,
  type PromotionSettingsConfig,
  type StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";
import {
  BulkUpdateRulesModal,
  type EditablePromotionRule,
  GradeCriteriaEditorModal,
  PreviewRuleLogicModal,
  RuleEditorModal,
} from "@/modules/students/components/promotions/promotion-rules-modals";

function normalizeEditableRules(
  data: StudentPromotionOverviewData,
  academicYear: string,
): EditablePromotionRule[] {
  if (data.rules.length > 0) {
    return data.rules.map((r, idx) => ({
      id: r.id,
      academicYear: r.academicYear,
      ruleName:
        r.ruleName || (idx === 0 ? "Primary Promotion Rule" : `${r.fromGrade} Promotion Rule`),
      fromGrade: r.fromGrade,
      toGrade: r.toGrade,
      markAsAlumni: r.markAsAlumni,
      defaultSectionMode: r.defaultSectionMode,
      targetSection: r.targetSection,
      minResultPct: r.minResultPct,
      minAttendancePct: r.minAttendancePct,
      maxFailedSubjects: r.maxFailedSubjects,
      criteriaSummary: r.criteriaSummary || `Min ${Math.round(r.minResultPct)}% in all subjects`,
      requireAssessmentsCompleted: r.requireAssessmentsCompleted ?? true,
      requireResultPublished: r.requireResultPublished ?? true,
      requireFeeClearance: r.requireFeeClearance ?? false,
      gradeCriteria:
        r.gradeCriteria && r.gradeCriteria.length > 0
          ? r.gradeCriteria
          : DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
      isActive: r.isActive,
    }));
  }

  return data.grades.map((grade, idx) => {
    const next = data.grades[idx + 1] ?? data.settings.finalGradeForAlumni;
    const isFinal = idx === data.grades.length - 1;
    const minResultPct = data.settings.minResultPct || 40;
    return {
      academicYear,
      ruleName: idx === 0 ? "Primary Promotion Rule" : `${grade} Promotion Rule`,
      fromGrade: grade,
      toGrade: next,
      markAsAlumni: isFinal,
      defaultSectionMode: "KEEP_SAME",
      targetSection: null,
      minResultPct,
      minAttendancePct: data.settings.minAttendancePct || 75,
      maxFailedSubjects: 0,
      criteriaSummary: `Min ${Math.round(minResultPct)}% in all subjects`,
      requireAssessmentsCompleted: true,
      requireResultPublished: true,
      requireFeeClearance: data.settings.requirePendingFeeClearance,
      gradeCriteria: DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
      isActive: true,
    };
  });
}

function sectionDisplay(rule: EditablePromotionRule): string {
  if (rule.defaultSectionMode === "TARGET_SECTION" && rule.targetSection) {
    return `Section ${rule.targetSection}`;
  }
  if (rule.defaultSectionMode === "AUTO_BALANCE") {
    return "Auto Balance";
  }
  return "All Sections";
}

export function PromotionRulesTab({
  data,
  academicYear,
  canManageSettings,
  saving,
  onSaveRulesAndSettings,
}: {
  data: StudentPromotionOverviewData;
  academicYear: string;
  canManageSettings: boolean;
  saving: boolean;
  onSaveRulesAndSettings: (payload: {
    academicYear: string;
    rules: EditablePromotionRule[];
  }) => Promise<void>;
}) {
  const [rules, setRules] = useState<EditablePromotionRule[]>(() =>
    normalizeEditableRules(data, academicYear),
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [editorModal, setEditorModal] = useState<{
    mode: "create" | "edit";
    targetIdx: number;
    rule: EditablePromotionRule;
  } | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    setRules(normalizeEditableRules(data, academicYear));
  }, [data, academicYear]);

  const indexedRules = useMemo(
    () =>
      rules
        .map((rule, idx) => ({ rule, idx }))
        .filter(({ rule }) => {
          if (statusFilter === "ACTIVE" && !rule.isActive) return false;
          if (statusFilter === "INACTIVE" && rule.isActive) return false;
          const q = searchQuery.trim().toLowerCase();
          if (
            q &&
            !rule.ruleName.toLowerCase().includes(q) &&
            !rule.fromGrade.toLowerCase().includes(q) &&
            !rule.toGrade.toLowerCase().includes(q) &&
            !sectionDisplay(rule).toLowerCase().includes(q)
          ) {
            return false;
          }
          return true;
        }),
    [rules, statusFilter, searchQuery],
  );

  const activeCount = rules.filter((r) => r.isActive).length;
  const inactiveCount = rules.length - activeCount;

  const totalPages = Math.max(1, Math.ceil(indexedRules.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = indexedRules.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedRule = rules[selectedIdx] ?? rules[0] ?? null;

  const persistRules = async (nextRules: EditablePromotionRule[]) => {
    setRules(nextRules);
    await onSaveRulesAndSettings({ academicYear, rules: nextRules });
  };

  const cycleFilter = () => {
    setStatusFilter((prev) =>
      prev === "ALL" ? "ACTIVE" : prev === "ACTIVE" ? "INACTIVE" : "ALL",
    );
    setPage(1);
  };

  const openAddRuleModal = () => {
    const fallbackFrom = data.grades[0] || "Class I";
    const fallbackTo = data.grades[1] || "Class II";
    setEditorModal({
      mode: "create",
      targetIdx: rules.length,
      rule: {
        academicYear,
        ruleName: `${fallbackFrom} Custom Rule`,
        fromGrade: fallbackFrom,
        toGrade: fallbackTo,
        markAsAlumni: false,
        defaultSectionMode: "KEEP_SAME",
        targetSection: null,
        minResultPct: 40,
        minAttendancePct: 75,
        maxFailedSubjects: 0,
        criteriaSummary: "Min 40% in all subjects",
        requireAssessmentsCompleted: true,
        requireResultPublished: true,
        requireFeeClearance: false,
        gradeCriteria: DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
        isActive: true,
      },
    });
  };

  const handleDuplicateSelected = async () => {
    if (!selectedRule || !canManageSettings) return;
    const copy: EditablePromotionRule = {
      ...selectedRule,
      id: undefined,
      ruleName: `${selectedRule.ruleName} (Copy)`,
      fromGrade: `${selectedRule.fromGrade} Alt`,
    };
    const next = [...rules, copy];
    setSelectedIdx(next.length - 1);
    await persistRules(next);
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">Promotion Rules</h3>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Create and manage rules to promote students from one class to the next.
          </p>
        </div>

        {canManageSettings && (
          <button
            type="button"
            onClick={openAddRuleModal}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Rule</span>
          </button>
        )}
      </div>

      {/* 4 KPI Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StudentKpiCard
          label="Total Rules"
          value={rules.length}
          icon={<Layers className="h-5 w-5" />}
          tone="violet"
          subtitle="Configured class transitions"
        />
        <StudentKpiCard
          label="Active Rules"
          value={activeCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle="Enabled for promotion"
        />
        <StudentKpiCard
          label="Inactive Rules"
          value={inactiveCount}
          icon={<PauseCircle className="h-5 w-5" />}
          tone="amber"
          subtitle="Paused / draft rules"
        />
        <StudentKpiCard
          label="Current Academic Year"
          value={academicYear}
          icon={<Calendar className="h-5 w-5" />}
          tone="sky"
          subtitle="Active cycle"
        />
      </div>

      {/* Promotion Rules (N) Table */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Promotion Rules ({indexedRules.length})</span>
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#76799C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by rule name, class or section..."
                className="h-8 w-64 rounded-xl border border-[#D9DEF2] bg-white/95 pl-8 pr-3 text-xs text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              />
            </div>
            <button
              type="button"
              onClick={cycleFilter}
              className="h-8 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white/90 px-3 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#C5CCF0]"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>
                Filter:{" "}
                {statusFilter === "ALL"
                  ? "All"
                  : statusFilter === "ACTIVE"
                    ? "Active"
                    : "Inactive"}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 pl-4 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      pagedRows.length > 0 &&
                      pagedRows.every((row) => selectedRowKeys.includes(row.idx))
                    }
                    onChange={() => {
                      const pageIndices = pagedRows.map((r) => r.idx);
                      const allChecked = pageIndices.every((i) => selectedRowKeys.includes(i));
                      setSelectedRowKeys((prev) =>
                        allChecked
                          ? prev.filter((i) => !pageIndices.includes(i))
                          : Array.from(new Set([...prev, ...pageIndices])),
                      );
                    }}
                    aria-label="Select visible rules"
                    className="h-3.5 w-3.5 accent-[#663CF6]"
                  />
                </th>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-3">Rule Name</th>
                <th className="py-2.5 px-3">From Class</th>
                <th className="py-2.5 px-3">To Class</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Criteria</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                  >
                    No promotion rules match your search/filter.
                  </td>
                </tr>
              ) : (
                pagedRows.map(({ rule, idx }) => {
                  const isFocused = idx === selectedIdx;
                  return (
                    <tr
                      key={`${rule.fromGrade}-${idx}`}
                      onClick={() => setSelectedIdx(idx)}
                      className={`cursor-pointer transition-colors ${
                        isFocused
                          ? "bg-[#EDE7FF]/55 dark:bg-[#221A44]/70"
                          : "hover:bg-[#F6F5FF]/70 dark:hover:bg-[#1B1F3F]/60"
                      }`}
                    >
                      <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRowKeys.includes(idx)}
                          onChange={() =>
                            setSelectedRowKeys((prev) =>
                              prev.includes(idx) ? prev.filter((k) => k !== idx) : [...prev, idx],
                            )
                          }
                          aria-label={`Select ${rule.ruleName}`}
                          className="h-3.5 w-3.5 accent-[#663CF6]"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-[#76799C] dark:text-[#9DA6CC]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {rule.ruleName}
                      </td>
                      <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                        {rule.fromGrade}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#4F27E8] dark:text-[#C4B5FD]">
                        {rule.toGrade}
                      </td>
                      <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                        {sectionDisplay(rule)}
                      </td>
                      <td className="py-2.5 px-3 text-[#08093B] dark:text-[#EEF0FF]">
                        {rule.criteriaSummary}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            rule.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedIdx(idx)}
                            title={`Inspect ${rule.ruleName}`}
                            className="p-1.5 rounded-lg text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canManageSettings && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditorModal({ mode: "edit", targetIdx: idx, rule })
                                }
                                title={`Edit ${rule.ruleName}`}
                                className="p-1.5 rounded-lg text-[#4D5072] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#B4BDD9] dark:hover:bg-[#251D4A]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={rules.length <= 1}
                                onClick={() => {
                                  const next = rules.filter((_, i) => i !== idx);
                                  setSelectedIdx(0);
                                  void persistRules(next);
                                }}
                                title={`Delete ${rule.ruleName}`}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer dark:text-rose-300 dark:hover:bg-rose-950/60"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
          <span>
            Showing {indexedRules.length === 0 ? 0 : (safePage - 1) * pageSize + 1} –{" "}
            {Math.min(safePage * pageSize, indexedRules.length)} of {indexedRules.length} rules
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded-lg border border-[#D9DEF2] bg-white px-2 text-[11px] font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 font-bold text-[#08093B] dark:text-[#EEF0FF]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Rule Details + Grade Criteria (for this Rule) */}
      {selectedRule && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Rule Details */}
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3`}>
            <div className="flex items-center justify-between gap-2 border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
              <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>Rule Details</span>
              </h4>
              {canManageSettings && (
                <button
                  type="button"
                  onClick={() =>
                    setEditorModal({
                      mode: "edit",
                      targetIdx: selectedIdx,
                      rule: selectedRule,
                    })
                  }
                  className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                >
                  <Pencil className="h-3 w-3 text-[#663CF6] dark:text-[#C4B5FD]" />
                  <span>Edit Rule</span>
                </button>
              )}
            </div>

            <dl className="space-y-2 text-xs">
              {[
                { label: "Rule Name", val: selectedRule.ruleName, bold: true },
                { label: "Academic Year", val: selectedRule.academicYear },
                { label: "From Class", val: selectedRule.fromGrade },
                { label: "To Class", val: selectedRule.toGrade },
                { label: "Section", val: sectionDisplay(selectedRule) },
                {
                  label: "Minimum Percentage",
                  val: `${Math.round(selectedRule.minResultPct)}% (in all subjects)`,
                },
                {
                  label: "Overall Requirement",
                  val: `Promotion if overall ≥ ${Math.round(selectedRule.minResultPct)}%`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 py-1 border-b border-[#F2F4FC] dark:border-[#232746]"
                >
                  <dt className="text-[#76799C] dark:text-[#9DA6CC] font-semibold">{item.label}</dt>
                  <dd
                    className={`text-right ${
                      item.bold
                        ? "font-black text-[#08093B] dark:text-[#F3F5FF]"
                        : "font-bold text-[#08093B] dark:text-[#EEF0FF]"
                    }`}
                  >
                    {item.val}
                  </dd>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 py-1 border-b border-[#F2F4FC] dark:border-[#232746]">
                <dt className="text-[#76799C] dark:text-[#9DA6CC] font-semibold">Rule Status</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      selectedRule.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {selectedRule.isActive ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>

              <div className="pt-1">
                <dt className="text-[#76799C] dark:text-[#9DA6CC] font-semibold mb-1">
                  Additional Conditions
                </dt>
                <dd>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-[#4D5072] dark:text-[#B4BDD9]">
                    <li>Must have attendance ≥ {Math.round(selectedRule.minAttendancePct)}%.</li>
                    <li>
                      {selectedRule.requireFeeClearance
                        ? "No pending fee dues required."
                        : "Pending fee dues allowed (warning only)."}
                    </li>
                    <li>
                      {selectedRule.requireAssessmentsCompleted
                        ? "All mandatory assessments completed."
                        : "Optional assessments permitted."}
                    </li>
                  </ul>
                </dd>
              </div>
            </dl>
          </div>

          {/* Right: Grade Criteria (for this Rule) */}
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
            <div className="flex items-center justify-between gap-2 border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
              <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>
                  Grade Criteria{" "}
                  <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                    (for this Rule)
                  </span>
                </span>
              </h4>
              <div className="flex items-center gap-2">
                {canManageSettings && (
                  <button
                    type="button"
                    onClick={() => setGradeModalOpen(true)}
                    className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white px-2.5 text-[11px] font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                  >
                    <Pencil className="h-3 w-3 text-[#663CF6] dark:text-[#C4B5FD]" />
                    <span>Edit Bands</span>
                  </button>
                )}
                <span
                  title="Students achieving passing grades automatically qualify for promotion when attendance & result status conditions are met."
                  className="text-[#76799C] dark:text-[#9DA6CC]"
                >
                  <Info className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">Marks Range (%)</th>
                    <th className="py-2 px-3">Result</th>
                    <th className="py-2 px-3 text-right">Promotion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                  {selectedRule.gradeCriteria.map((band, idx) => (
                    <tr key={`${band.grade}-${idx}`}>
                      <td className="py-2 px-3 font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {band.grade}
                      </td>
                      <td className="py-2 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                        {band.minPct} – {band.maxPct}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[#08093B] dark:text-[#EEF0FF]">
                        {band.resultLabel}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            band.promote
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {band.promote ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{band.promote ? "Promote" : "Do Not Promote"}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Conditions Strip (6 Tiles) matching screenshot */}
      {selectedRule && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Promotion Conditions</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              {
                title: "Minimum Marks",
                sub: `≥ ${Math.round(selectedRule.minResultPct)}% in all subjects`,
                icon: <BarChart3 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />,
                highlight: false,
              },
              {
                title: "Attendance",
                sub: `≥ ${Math.round(selectedRule.minAttendancePct)}%`,
                icon: <CalendarCheck2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />,
                highlight: false,
              },
              {
                title: "Assessments",
                sub: selectedRule.requireAssessmentsCompleted
                  ? "All completed"
                  : "Flexible",
                icon: <Layers className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />,
                highlight: false,
              },
              {
                title: "Fee Dues",
                sub: selectedRule.requireFeeClearance ? "No pending dues" : "Optional clearance",
                icon: <IndianRupee className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />,
                highlight: false,
              },
              {
                title: "Result Status",
                sub: selectedRule.requireResultPublished ? "Published" : "Draft allowed",
                icon: <FileCheck2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />,
                highlight: false,
              },
              {
                title: "Final Decision",
                sub: selectedRule.markAsAlumni
                  ? "Graduate as Alumni"
                  : `Promote to ${selectedRule.toGrade}`,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />,
                highlight: true,
              },
            ].map((cond) => (
              <div
                key={cond.title}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3.5 text-center ${
                  cond.highlight
                    ? "border-emerald-200 bg-emerald-50/75 dark:border-emerald-900 dark:bg-emerald-950/40"
                    : "border-[#E5E8F8] bg-white/80 dark:border-[#272B4D] dark:bg-[#10132A]"
                }`}
              >
                {cond.icon}
                <p
                  className={`text-xs font-bold ${
                    cond.highlight
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-[#08093B] dark:text-[#F3F5FF]"
                  }`}
                >
                  {cond.title}
                </p>
                <p
                  className={`text-[10.5px] font-semibold ${
                    cond.highlight
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-[#76799C] dark:text-[#9DA6CC]"
                  }`}
                >
                  {cond.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions (5 Tiles) matching screenshot */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
        <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Quick Actions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            {
              label: "Add Rule",
              sub: "Create a new promotion rule",
              icon: <Plus className="h-4 w-4" />,
              disabled: !canManageSettings,
              onClick: openAddRuleModal,
            },
            {
              label: "Copy Rule",
              sub: "Duplicate an existing rule",
              icon: <Copy className="h-4 w-4" />,
              disabled: !canManageSettings || !selectedRule,
              onClick: () => void handleDuplicateSelected(),
            },
            {
              label: "Set Grade Criteria",
              sub: "Manage grade ranges & results",
              icon: <Settings2 className="h-4 w-4" />,
              disabled: !canManageSettings || !selectedRule,
              onClick: () => setGradeModalOpen(true),
            },
            {
              label: "Bulk Update",
              sub: "Update multiple rules",
              icon: <SlidersHorizontal className="h-4 w-4" />,
              disabled: !canManageSettings,
              onClick: () => setBulkModalOpen(true),
            },
            {
              label: "Preview Logic",
              sub: "Test promotion outcome",
              icon: <Eye className="h-4 w-4" />,
              disabled: !selectedRule,
              onClick: () => setPreviewModalOpen(true),
            },
          ].map((act) => (
            <button
              key={act.label}
              type="button"
              disabled={act.disabled}
              onClick={act.onClick}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#E5E8F8] bg-white/85 px-3 py-3 text-center hover:border-[#663CF6] hover:bg-[#F6F5FF] disabled:opacity-45 transition-colors cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1B1F3F]"
            >
              <span className="text-[#663CF6] dark:text-[#C4B5FD]">{act.icon}</span>
              <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {act.label}
              </span>
              <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{act.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Modals */}
      {editorModal && (
        <RuleEditorModal
          open
          mode={editorModal.mode}
          initialRule={editorModal.rule}
          academicYear={academicYear}
          grades={data.grades}
          saving={saving}
          onClose={() => setEditorModal(null)}
          onSave={async (updatedRule) => {
            const next =
              editorModal.mode === "create"
                ? [...rules, updatedRule]
                : rules.map((r, i) => (i === editorModal.targetIdx ? updatedRule : r));
            setSelectedIdx(editorModal.mode === "create" ? next.length - 1 : editorModal.targetIdx);
            await persistRules(next);
            setEditorModal(null);
          }}
        />
      )}

      {gradeModalOpen && selectedRule && (
        <GradeCriteriaEditorModal
          open
          ruleName={selectedRule.ruleName}
          initialBands={selectedRule.gradeCriteria}
          saving={saving}
          onClose={() => setGradeModalOpen(false)}
          onSave={async (bands: PromotionGradeBand[]) => {
            const next = rules.map((r, i) =>
              i === selectedIdx ? { ...r, gradeCriteria: bands } : r,
            );
            await persistRules(next);
            setGradeModalOpen(false);
          }}
        />
      )}

      <BulkUpdateRulesModal
        open={bulkModalOpen}
        targetCount={selectedRowKeys.length > 0 ? selectedRowKeys.length : rules.length}
        saving={saving}
        onClose={() => setBulkModalOpen(false)}
        onApply={async ({ statusAction, minResultPct, minAttendancePct }) => {
          const targetSet =
            selectedRowKeys.length > 0
              ? new Set(selectedRowKeys)
              : new Set(rules.map((_, idx) => idx));
          const next = rules.map((r, i) => {
            if (!targetSet.has(i)) return r;
            const nextRes = minResultPct ?? r.minResultPct;
            return {
              ...r,
              isActive:
                statusAction === "ACTIVATE"
                  ? true
                  : statusAction === "DEACTIVATE"
                    ? false
                    : r.isActive,
              minResultPct: nextRes,
              criteriaSummary:
                minResultPct !== undefined
                  ? `Min ${Math.round(nextRes)}% in all subjects`
                  : r.criteriaSummary,
              minAttendancePct: minAttendancePct ?? r.minAttendancePct,
            };
          });
          await persistRules(next);
          setBulkModalOpen(false);
        }}
      />

      <PreviewRuleLogicModal
        open={previewModalOpen}
        rule={selectedRule}
        decisions={data.decisions}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  );
}

export { PromotionResultCriteriaTab } from "@/modules/students/components/promotions/promotion-result-criteria-tab";

export function PromotionSettingsTab({
  data,
  academicYear,
  canManageSettings,
  saving,
  onSaveSettings,
}: {
  data: StudentPromotionOverviewData;
  academicYear: string;
  canManageSettings: boolean;
  saving: boolean;
  onSaveSettings: (settings: PromotionSettingsConfig) => Promise<void>;
}) {
  const [settings, setSettings] = useState<PromotionSettingsConfig>(data.settings);

  const toggleItem = (
    key: Exclude<
      keyof PromotionSettingsConfig,
      "finalGradeForAlumni" | "minResultPct" | "minAttendancePct"
    >,
    title: string,
    desc: string,
  ) => (
    <label
      key={key}
      className="flex items-start justify-between gap-4 rounded-xl border border-[#E5E8F8] bg-white/80 p-3.5 cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
    >
      <div>
        <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">{title}</p>
        <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC] mt-0.5">{desc}</p>
      </div>
      <input
        type="checkbox"
        disabled={!canManageSettings}
        checked={Boolean(settings[key])}
        onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
        className="mt-0.5 h-4 w-4 accent-[#663CF6]"
      />
    </label>
  );

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-5 space-y-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEEFA] pb-4 dark:border-[#272B4D]">
        <div>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Promotion Governance & Workflow Settings ({academicYear})
          </h3>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC] mt-0.5">
            Configure alumni transition cutoff, roll number assignment, fee holds, and parent notifications.
          </p>
        </div>
        {canManageSettings && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onSaveSettings(settings)}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="rounded-xl border border-[#E5E8F8] bg-white/80 p-3.5 space-y-1.5 dark:border-[#272B4D] dark:bg-[#10132A]">
          <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
            Final Graduating Class (Alumni Transition)
          </span>
          <input
            type="text"
            disabled={!canManageSettings}
            value={settings.finalGradeForAlumni}
            onChange={(e) =>
              setSettings((s) => ({ ...s, finalGradeForAlumni: e.target.value }))
            }
            className="h-9 w-full rounded-lg border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#0B0D1F] dark:text-[#EEF0FF]"
          />
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Students promoted from this class automatically transition to Alumni status.
          </p>
        </label>

        {toggleItem(
          "autoAssignRollNumbers",
          "Auto-Assign New Roll Numbers",
          "Re-sequence roll numbers alphabetically after a class batch completes.",
        )}
        {toggleItem(
          "lockPromotionAfterPublish",
          "Lock Batch Records After Completion",
          "Prevent accidental edits once the academic promotion batch is finalized.",
        )}
        {toggleItem(
          "notifyParentsOnPromotion",
          "Notify Guardians on Promotion",
          "Dispatch automated notification to guardians with updated class & section.",
        )}
        {toggleItem(
          "requirePendingFeeClearance",
          "Require Fee Clearance Before Promotion",
          "Hold promotion batches for students carrying overdue fee balances.",
        )}
      </div>
    </div>
  );
}
