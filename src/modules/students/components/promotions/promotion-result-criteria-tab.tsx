"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Filter,
  Layers,
  PauseCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import {
  DEFAULT_PROMOTION_GRADE_BANDS,
  type PromotionGradeBand,
  type PromotionSettingsConfig,
  type PromotionSettingsSuiteConfig,
  type StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";
import {
  type EditablePromotionRule,
  GradeCriteriaEditorModal,
  PreviewRuleLogicModal,
} from "@/modules/students/components/promotions/promotion-rules-modals";

const INPUT_CLS =
  "h-9 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

interface CriteriaItem {
  id?: string;
  rule: EditablePromotionRule;
  criteriaName: string;
  evaluationType: "Grade" | "Marks";
  minSubjectPassPct: number;
  includeCoScholastic: boolean;
  subjects: Array<{ subject: string; maxMarks: number; passMarks: number }>;
}

function buildCriteriaList(data: StudentPromotionOverviewData): CriteriaItem[] {
  if (data.rules.length === 0) return [];
  const defaultSubjects = (data.settingsSuite?.academicDefaults.subjects ?? []).map((s) => ({
    subject: s.name,
    maxMarks: s.maxMarks,
    passMarks: s.passMarks,
  }));
  const overrides = data.settingsSuite?.resultCriteriaByGrade ?? {};

  return data.rules.map((r) => {
    const ov = overrides[r.fromGrade];
    return {
      id: r.id,
      rule: {
        id: r.id,
        academicYear: r.academicYear,
        ruleName: r.ruleName || `${r.fromGrade} Promotion Rule`,
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
      },
      criteriaName: ov?.criteriaName || `${r.fromGrade} Result Criteria`,
      evaluationType: ov?.evaluationType || "Grade",
      minSubjectPassPct: ov?.minSubjectPassPct ?? 33,
      includeCoScholastic: ov?.includeCoScholastic ?? false,
      subjects:
        ov?.subjects && ov.subjects.length > 0
          ? ov.subjects
          : defaultSubjects.length > 0
            ? defaultSubjects
            : [
                { subject: "English", maxMarks: 100, passMarks: 33 },
                { subject: "Mathematics", maxMarks: 100, passMarks: 33 },
                { subject: "Science", maxMarks: 100, passMarks: 33 },
              ],
    };
  });
}

function CriteriaEditorModal({
  open,
  mode,
  initial,
  grades,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: CriteriaItem;
  grades: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (item: CriteriaItem) => Promise<void>;
}) {
  const [draft, setDraft] = useState<CriteriaItem>(initial);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Add Result Criteria" : "Edit Result Criteria"}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
            {mode === "create" ? "Add Result Criteria" : "Edit Result Criteria"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Criteria Name</span>
            <input
              type="text"
              value={draft.criteriaName}
              onChange={(e) => setDraft((d) => ({ ...d, criteriaName: e.target.value }))}
              className={INPUT_CLS}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Class</span>
            <input
              type="text"
              list="rc-grades-list"
              value={draft.rule.fromGrade}
              onChange={(e) =>
                setDraft((d) => ({ ...d, rule: { ...d.rule, fromGrade: e.target.value } }))
              }
              className={INPUT_CLS}
            />
            <datalist id="rc-grades-list">
              {grades.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Evaluation Type</span>
            <select
              value={draft.evaluationType}
              onChange={(e) =>
                setDraft((d) => ({ ...d, evaluationType: e.target.value as "Grade" | "Marks" }))
              }
              className={INPUT_CLS}
            >
              <option value="Grade">Grade Based</option>
              <option value="Marks">Marks Based</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Overall Passing %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.rule.minResultPct}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  rule: { ...d.rule, minResultPct: Number(e.target.value) },
                }))
              }
              className={INPUT_CLS}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Min Subject Pass %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.minSubjectPassPct}
              onChange={(e) => setDraft((d) => ({ ...d, minSubjectPassPct: Number(e.target.value) }))}
              className={INPUT_CLS}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Min Attendance %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.rule.minAttendancePct}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  rule: { ...d.rule, minAttendancePct: Number(e.target.value) },
                }))
              }
              className={INPUT_CLS}
            />
          </label>
          <label className="flex items-center gap-2 pt-5 cursor-pointer font-bold">
            <input
              type="checkbox"
              checked={draft.rule.isActive}
              onChange={(e) =>
                setDraft((d) => ({ ...d, rule: { ...d.rule, isActive: e.target.checked } }))
              }
              className="h-4 w-4 accent-[#663CF6]"
            />
            <span>Active Criteria</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#EAEEFA] dark:border-[#272B4D]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-[#D9DEF2] px-4 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !draft.criteriaName.trim()}
            onClick={() => void onSave(draft)}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : mode === "create" ? "Create Criteria" : "Save Criteria"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromotionResultCriteriaTab({
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
    rules?: EditablePromotionRule[];
    settings?: PromotionSettingsConfig;
    settingsSuite?: PromotionSettingsSuiteConfig;
  }) => Promise<void>;
}) {
  const [items, setItems] = useState<CriteriaItem[]>(() => buildCriteriaList(data));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [classFilter, setClassFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [criteriaModal, setCriteriaModal] = useState<{
    mode: "create" | "edit";
    targetIdx: number;
    item: CriteriaItem;
  } | null>(null);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubMax, setNewSubMax] = useState(100);
  const [newSubPass, setNewSubPass] = useState(33);

  useEffect(() => {
    setItems(buildCriteriaList(data));
  }, [data]);

  const filtered = useMemo(
    () =>
      items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          if (classFilter !== "ALL" && item.rule.fromGrade !== classFilter) return false;
          if (statusFilter === "ACTIVE" && !item.rule.isActive) return false;
          if (statusFilter === "INACTIVE" && item.rule.isActive) return false;
          const q = searchQuery.trim().toLowerCase();
          if (
            q &&
            !item.criteriaName.toLowerCase().includes(q) &&
            !item.rule.fromGrade.toLowerCase().includes(q)
          ) {
            return false;
          }
          return true;
        }),
    [items, classFilter, statusFilter, searchQuery],
  );

  const activeCount = items.filter((i) => i.rule.isActive).length;
  const inactiveCount = items.length - activeCount;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedItem = items[selectedIdx] ?? items[0] ?? null;

  const persistAllItems = async (nextItems: CriteriaItem[]) => {
    setItems(nextItems);
    const nextMap: NonNullable<PromotionSettingsSuiteConfig["resultCriteriaByGrade"]> = {};
    for (const it of nextItems) {
      nextMap[it.rule.fromGrade] = {
        criteriaName: it.criteriaName,
        evaluationType: it.evaluationType,
        minSubjectPassPct: it.minSubjectPassPct,
        includeCoScholastic: it.includeCoScholastic,
        subjects: it.subjects,
      };
    }
    await onSaveRulesAndSettings({
      academicYear,
      rules: nextItems.map((it) => it.rule),
      settingsSuite: {
        ...(data.settingsSuite ?? {}),
        resultCriteriaByGrade: nextMap,
      } as PromotionSettingsSuiteConfig,
    });
  };

  const openAddCriteria = () => {
    const fallbackGrade = data.grades[0] || "Class I";
    setCriteriaModal({
      mode: "create",
      targetIdx: items.length,
      item: {
        criteriaName: `${fallbackGrade} Custom Result Criteria`,
        evaluationType: "Grade",
        minSubjectPassPct: 33,
        includeCoScholastic: false,
        subjects: selectedItem?.subjects ?? [
          { subject: "English", maxMarks: 100, passMarks: 33 },
          { subject: "Mathematics", maxMarks: 100, passMarks: 33 },
        ],
        rule: {
          academicYear,
          ruleName: `${fallbackGrade} Promotion Rule`,
          fromGrade: fallbackGrade,
          toGrade: data.grades[1] || "Alumni",
          markAsAlumni: false,
          defaultSectionMode: "KEEP_SAME",
          targetSection: null,
          minResultPct: 45,
          minAttendancePct: 75,
          maxFailedSubjects: 0,
          criteriaSummary: "Min 45% overall",
          requireAssessmentsCompleted: true,
          requireResultPublished: true,
          requireFeeClearance: false,
          gradeCriteria: DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })),
          isActive: true,
        },
      },
    });
  };

  const totalMaxMarks = selectedItem
    ? selectedItem.subjects.reduce((acc, s) => acc + s.maxMarks, 0)
    : 0;
  const overallRequiredMarks = selectedItem
    ? Math.round((totalMaxMarks * selectedItem.rule.minResultPct) / 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">Result Criteria</h3>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Set subject-wise passing marks, grading structure and overall promotion criteria for each class.
          </p>
        </div>

        {canManageSettings && (
          <button
            type="button"
            onClick={openAddCriteria}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Criteria</span>
          </button>
        )}
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StudentKpiCard
          label="Total Criteria"
          value={items.length}
          icon={<Layers className="h-5 w-5" />}
          tone="violet"
          subtitle="Class criteria plans"
        />
        <StudentKpiCard
          label="Active Criteria"
          value={activeCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle="Enforced this cycle"
        />
        <StudentKpiCard
          label="Inactive Criteria"
          value={inactiveCount}
          icon={<PauseCircle className="h-5 w-5" />}
          tone="amber"
          subtitle="Draft / paused"
        />
        <StudentKpiCard
          label="Academic Year"
          value={academicYear}
          icon={<Calendar className="h-5 w-5" />}
          tone="sky"
          subtitle="Active cycle"
        />
      </div>

      {/* Filter Strip matching screenshot */}
      <div className={`${STUDENT_CARD_SURFACE} p-3.5 sm:p-4 flex flex-wrap items-end gap-3`}>
        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
            Academic Year
          </span>
          <input type="text" readOnly value={academicYear} className={`${INPUT_CLS} opacity-80`} />
        </label>
        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
            Class
          </span>
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className={INPUT_CLS}
          >
            <option value="ALL">All Classes</option>
            {data.grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
            Section
          </span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="ALL">All Sections</option>
            {data.sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE");
              setPage(1);
            }}
            className={INPUT_CLS}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setPage(1)}
          className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
        </button>
      </div>

      {/* Result Criteria List (N) */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Result Criteria List ({filtered.length})</span>
          </h4>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#76799C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by class or criteria name..."
                className="h-8 w-60 rounded-xl border border-[#D9DEF2] bg-white/95 pl-8 pr-3 text-xs text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) =>
                  prev === "ALL" ? "ACTIVE" : prev === "ACTIVE" ? "INACTIVE" : "ALL",
                )
              }
              className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 pl-4 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      pagedRows.length > 0 &&
                      pagedRows.every((r) => selectedRows.includes(r.idx))
                    }
                    onChange={() => {
                      const idxs = pagedRows.map((r) => r.idx);
                      const all = idxs.every((i) => selectedRows.includes(i));
                      setSelectedRows((prev) =>
                        all ? prev.filter((k) => !idxs.includes(k)) : Array.from(new Set([...prev, ...idxs])),
                      );
                    }}
                    aria-label="Select criteria rows"
                    className="h-3.5 w-3.5 accent-[#663CF6]"
                  />
                </th>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-3">Criteria Name</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Pass %</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                  >
                    {items.length === 0
                      ? 'No result criteria configured yet. Click "+ Add Criteria" to create one.'
                      : "No result criteria match your filters."}
                  </td>
                </tr>
              ) : (
                pagedRows.map(({ item, idx }) => (
                <tr
                  key={`${item.rule.fromGrade}-${idx}`}
                  onClick={() => setSelectedIdx(idx)}
                  className={`cursor-pointer transition-colors ${
                    idx === selectedIdx
                      ? "bg-[#EDE7FF]/55 dark:bg-[#221A44]/70"
                      : "hover:bg-[#F6F5FF]/70 dark:hover:bg-[#1B1F3F]/60"
                  }`}
                >
                  <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(idx)}
                      onChange={() =>
                        setSelectedRows((prev) =>
                          prev.includes(idx) ? prev.filter((k) => k !== idx) : [...prev, idx],
                        )
                      }
                      aria-label={`Select ${item.criteriaName}`}
                      className="h-3.5 w-3.5 accent-[#663CF6]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-[#76799C]">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {item.criteriaName}
                  </td>
                  <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                    {item.rule.fromGrade}
                  </td>
                  <td className="py-2.5 px-3">{item.evaluationType}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{item.rule.minResultPct}%</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.rule.isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {item.rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        title={`Inspect ${item.criteriaName}`}
                        className="p-1.5 rounded-lg text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {canManageSettings && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCriteriaModal({ mode: "edit", targetIdx: idx, item })
                            }
                            title={`Edit ${item.criteriaName}`}
                            className="p-1.5 rounded-lg text-[#4D5072] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#B4BDD9] dark:hover:bg-[#251D4A]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = items.filter((_, i) => i !== idx);
                              setSelectedIdx(0);
                              void persistAllItems(next);
                            }}
                            title={`Delete ${item.criteriaName}`}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#76799C] dark:border-[#272B4D]">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} –{" "}
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} criteria
          </span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-lg border border-[#D9DEF2] bg-white px-2 text-[11px] font-bold dark:border-[#2E345E] dark:bg-[#10132A]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 font-bold text-[#08093B] dark:text-[#EEF0FF]">
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

      {/* 2-Column Selected Criteria Details + Grading Structure */}
      {selectedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3`}>
            <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
              <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>Selected Criteria Details</span>
              </h4>
              {canManageSettings && (
                <button
                  type="button"
                  onClick={() =>
                    setCriteriaModal({ mode: "edit", targetIdx: selectedIdx, item: selectedItem })
                  }
                  className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                >
                  <Pencil className="h-3 w-3 text-[#663CF6]" />
                  <span>Edit Criteria</span>
                </button>
              )}
            </div>

            <dl className="space-y-2 text-xs">
              {[
                { label: "Criteria Name", val: selectedItem.criteriaName },
                { label: "Academic Year", val: selectedItem.rule.academicYear },
                {
                  label: "Class / Section",
                  val: `${selectedItem.rule.fromGrade} / ${sectionFilter === "ALL" ? "All Sections" : `Section ${sectionFilter}`}`,
                },
                {
                  label: "Evaluation Type",
                  val: selectedItem.evaluationType === "Grade" ? "Grade Based" : "Marks Based",
                },
                {
                  label: "Passing Percentage",
                  val: `${Math.round(selectedItem.rule.minResultPct)}% (Overall)`,
                },
                {
                  label: "Promotion Decision",
                  val: `Promote if overall ≥ ${Math.round(selectedItem.rule.minResultPct)}% and no subject below ${selectedItem.minSubjectPassPct}%`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 py-1 border-b border-[#F2F4FC] dark:border-[#232746]"
                >
                  <dt className="text-[#76799C] dark:text-[#9DA6CC] font-semibold shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-right font-bold text-[#08093B] dark:text-[#EEF0FF]">
                    {row.val}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <dt className="text-[#76799C] dark:text-[#9DA6CC] font-semibold">Rule Status</dt>
                <dd>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      selectedItem.rule.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {selectedItem.rule.isActive ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
            <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
              <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                Grading Structure
              </h4>
              {canManageSettings && (
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(true)}
                  className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                >
                  <Pencil className="h-3 w-3 text-[#663CF6]" />
                  <span>Configure</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">Marks Range (%)</th>
                    <th className="py-2 px-3 text-center">Grade Point</th>
                    <th className="py-2 px-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                  {selectedItem.rule.gradeCriteria.map((b, i) => (
                    <tr key={`${b.grade}-${i}`}>
                      <td className="py-2 px-3 font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {b.grade}
                      </td>
                      <td className="py-2 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                        {b.minPct} – {b.maxPct}
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        {b.promote ? Math.max(4, 10 - i) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            b.promote
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {b.resultLabel}
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

      {/* 2-Column Subject-wise Criteria + Promotion Conditions */}
      {selectedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Subject-wise Criteria ({selectedItem.rule.fromGrade})</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Subject</th>
                    <th className="py-2 px-2 text-right">Max Marks</th>
                    <th className="py-2 px-2 text-right">Pass Marks</th>
                    <th className="py-2 px-2 text-right">Pass %</th>
                    {canManageSettings && <th className="py-2 px-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                  {selectedItem.subjects.map((sub, sIdx) => (
                    <tr key={`${sub.subject}-${sIdx}`}>
                      <td className="py-2 px-2 text-[#76799C]">{sIdx + 1}</td>
                      <td className="py-2 px-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {sub.subject}
                      </td>
                      <td className="py-2 px-2 text-right">{sub.maxMarks}</td>
                      <td className="py-2 px-2 text-right">{sub.passMarks}</td>
                      <td className="py-2 px-2 text-right font-semibold">
                        {sub.maxMarks > 0 ? Math.round((sub.passMarks / sub.maxMarks) * 100) : 0}%
                      </td>
                      {canManageSettings && (
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setItems((prev) =>
                                prev.map((it, i) =>
                                  i === selectedIdx
                                    ? {
                                        ...it,
                                        subjects: it.subjects.filter((_, idx) => idx !== sIdx),
                                      }
                                    : it,
                                ),
                              )
                            }
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer dark:text-rose-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-[#EDE7FF]/55 font-black text-[#08093B] dark:bg-[#221A44]/70 dark:text-[#F3F5FF]">
                    <td className="py-2 px-2" />
                    <td className="py-2 px-2">Overall</td>
                    <td className="py-2 px-2 text-right">{totalMaxMarks}</td>
                    <td className="py-2 px-2 text-right">{overallRequiredMarks}</td>
                    <td className="py-2 px-2 text-right">
                      {Math.round(selectedItem.rule.minResultPct)}%
                    </td>
                    {canManageSettings && <td />}
                  </tr>
                </tbody>
              </table>
            </div>

            {canManageSettings && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Subject name..."
                  className={`${INPUT_CLS} flex-1 min-w-[130px]`}
                />
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={newSubMax}
                  onChange={(e) => setNewSubMax(Number(e.target.value))}
                  aria-label="Max marks"
                  className={`${INPUT_CLS} w-20`}
                />
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={newSubPass}
                  onChange={(e) => setNewSubPass(Number(e.target.value))}
                  aria-label="Pass marks"
                  className={`${INPUT_CLS} w-20`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubName.trim()) return;
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === selectedIdx
                          ? {
                              ...it,
                              subjects: [
                                ...it.subjects,
                                {
                                  subject: newSubName.trim(),
                                  maxMarks: newSubMax,
                                  passMarks: newSubPass,
                                },
                              ],
                            }
                          : it,
                      ),
                    );
                    setNewSubName("");
                  }}
                  className="h-9 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
                >
                  + Add Subject
                </button>
              </div>
            )}
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3 text-xs`}>
            <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
              <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>Promotion Conditions</span>
              </h4>
              {canManageSettings && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void persistAllItems(items)}
                  className="h-8 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-3.5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? "Saving..." : "Save Criteria"}</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {[
                {
                  checked: true,
                  disabled: true,
                  label: `Overall percentage must be ≥ ${Math.round(selectedItem.rule.minResultPct)}%.`,
                  onChange: () => {},
                },
                {
                  checked: selectedItem.minSubjectPassPct > 0,
                  disabled: !canManageSettings,
                  label: `Minimum ${selectedItem.minSubjectPassPct}% marks in each subject.`,
                  onChange: (chk: boolean) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === selectedIdx ? { ...it, minSubjectPassPct: chk ? 33 : 0 } : it,
                      ),
                    ),
                },
                {
                  checked: selectedItem.rule.minAttendancePct > 0,
                  disabled: !canManageSettings,
                  label: `Attendance must be ≥ ${Math.round(selectedItem.rule.minAttendancePct)}%.`,
                  onChange: (chk: boolean) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === selectedIdx
                          ? { ...it, rule: { ...it.rule, minAttendancePct: chk ? 75 : 0 } }
                          : it,
                      ),
                    ),
                },
                {
                  checked: selectedItem.rule.requireFeeClearance,
                  disabled: !canManageSettings,
                  label: "All fee dues must be cleared.",
                  onChange: (chk: boolean) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === selectedIdx
                          ? { ...it, rule: { ...it.rule, requireFeeClearance: chk } }
                          : it,
                      ),
                    ),
                },
                {
                  checked: selectedItem.rule.requireAssessmentsCompleted,
                  disabled: !canManageSettings,
                  label: "All assessments (FA/SA) must be completed.",
                  onChange: (chk: boolean) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === selectedIdx
                          ? { ...it, rule: { ...it.rule, requireAssessmentsCompleted: chk } }
                          : it,
                      ),
                    ),
                },
                {
                  checked: selectedItem.includeCoScholastic,
                  disabled: !canManageSettings,
                  label: "Include co-scholastic evaluation (e.g., Discipline, Participation).",
                  onChange: (chk: boolean) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === selectedIdx ? { ...it, includeCoScholastic: chk } : it,
                      ),
                    ),
                },
              ].map((cond) => (
                <label
                  key={cond.label}
                  className="flex items-center gap-2.5 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/80 px-3 py-2 cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
                >
                  <input
                    type="checkbox"
                    disabled={cond.disabled}
                    checked={cond.checked}
                    onChange={(e) => cond.onChange(e.target.checked)}
                    className="h-4 w-4 accent-[#663CF6]"
                  />
                  <span className="font-semibold text-[#08093B] dark:text-[#EEF0FF]">
                    {cond.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions 4-Card Bar */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
        <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Quick Actions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Add Criteria",
              sub: "Create result criteria for a class",
              icon: <Plus className="h-4 w-4" />,
              disabled: !canManageSettings,
              onClick: openAddCriteria,
            },
            {
              label: "Copy Criteria",
              sub: "Duplicate criteria to another class",
              icon: <Copy className="h-4 w-4" />,
              disabled: !canManageSettings || !selectedItem,
              onClick: () => {
                if (!selectedItem) return;
                const copy: CriteriaItem = {
                  ...selectedItem,
                  criteriaName: `${selectedItem.criteriaName} (Copy)`,
                  rule: {
                    ...selectedItem.rule,
                    id: undefined,
                    fromGrade: `${selectedItem.rule.fromGrade} Alt`,
                  },
                };
                const next = [...items, copy];
                setSelectedIdx(next.length - 1);
                void persistAllItems(next);
              },
            },
            {
              label: "Set Grading",
              sub: "Configure grade ranges and grade points",
              icon: <Settings className="h-4 w-4" />,
              disabled: !canManageSettings || !selectedItem,
              onClick: () => setGradingModalOpen(true),
            },
            {
              label: "Preview",
              sub: "Test result & promotion logic",
              icon: <BarChart3 className="h-4 w-4" />,
              disabled: !selectedItem,
              onClick: () => setPreviewModalOpen(true),
            },
          ].map((act) => (
            <button
              key={act.label}
              type="button"
              disabled={act.disabled}
              onClick={act.onClick}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#E5E8F8] bg-white/85 px-3 py-3 text-center hover:border-[#663CF6] hover:bg-[#F6F5FF] disabled:opacity-45 cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
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

      {criteriaModal && (
        <CriteriaEditorModal
          open
          mode={criteriaModal.mode}
          initial={criteriaModal.item}
          grades={data.grades}
          saving={saving}
          onClose={() => setCriteriaModal(null)}
          onSave={async (savedItem) => {
            const next =
              criteriaModal.mode === "create"
                ? [...items, savedItem]
                : items.map((it, i) => (i === criteriaModal.targetIdx ? savedItem : it));
            setSelectedIdx(
              criteriaModal.mode === "create" ? next.length - 1 : criteriaModal.targetIdx,
            );
            await persistAllItems(next);
            setCriteriaModal(null);
          }}
        />
      )}

      {gradingModalOpen && selectedItem && (
        <GradeCriteriaEditorModal
          open
          ruleName={selectedItem.criteriaName}
          initialBands={selectedItem.rule.gradeCriteria}
          saving={saving}
          onClose={() => setGradingModalOpen(false)}
          onSave={async (bands: PromotionGradeBand[]) => {
            const next = items.map((it, i) =>
              i === selectedIdx ? { ...it, rule: { ...it.rule, gradeCriteria: bands } } : it,
            );
            await persistAllItems(next);
            setGradingModalOpen(false);
          }}
        />
      )}

      <PreviewRuleLogicModal
        open={previewModalOpen}
        rule={selectedItem?.rule ?? null}
        decisions={data.decisions}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  );
}
