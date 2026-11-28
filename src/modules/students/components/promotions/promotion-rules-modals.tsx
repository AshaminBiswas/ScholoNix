"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  DEFAULT_PROMOTION_GRADE_BANDS,
  type PromotionGradeBand,
  type StudentPromotionDecisionRow,
  type StudentPromotionRuleRecord,
} from "@/modules/students/promotion-types";

export type EditablePromotionRule = Omit<StudentPromotionRuleRecord, "id" | "schoolId"> & {
  id?: string;
};

const INPUT_CLS =
  "h-9 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

export function RuleEditorModal({
  open,
  mode,
  initialRule,
  academicYear,
  grades,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialRule: EditablePromotionRule;
  academicYear: string;
  grades: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (rule: EditablePromotionRule) => Promise<void>;
}) {
  const [draft, setDraft] = useState<EditablePromotionRule>(initialRule);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Add Promotion Rule" : "Edit Promotion Rule"}
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
          <div>
            <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
              {mode === "create" ? "Add Promotion Rule" : "Edit Promotion Rule"}
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Academic Year {academicYear} • Configure class progression, thresholds & conditions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1F244A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Rule Name</span>
            <input
              type="text"
              value={draft.ruleName}
              onChange={(e) => setDraft((d) => ({ ...d, ruleName: e.target.value }))}
              placeholder="e.g., Primary Promotion Rule"
              className={INPUT_CLS}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">From Class</span>
            <input
              type="text"
              list="promo-grades-datalist"
              value={draft.fromGrade}
              onChange={(e) => setDraft((d) => ({ ...d, fromGrade: e.target.value }))}
              className={INPUT_CLS}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">To Class</span>
            <input
              type="text"
              list="promo-grades-datalist"
              value={draft.toGrade}
              onChange={(e) => setDraft((d) => ({ ...d, toGrade: e.target.value }))}
              className={INPUT_CLS}
            />
          </label>

          <datalist id="promo-grades-datalist">
            {grades.map((g) => (
              <option key={g} value={g} />
            ))}
            <option value="Alumni" />
          </datalist>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Section Scope</span>
            <select
              value={draft.defaultSectionMode}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  defaultSectionMode: e.target.value as EditablePromotionRule["defaultSectionMode"],
                }))
              }
              className={INPUT_CLS}
            >
              <option value="KEEP_SAME">All Sections (Keep Same)</option>
              <option value="TARGET_SECTION">Fixed Target Section</option>
              <option value="AUTO_BALANCE">Auto Balance Sections</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Target Section</span>
            <input
              type="text"
              disabled={draft.defaultSectionMode !== "TARGET_SECTION"}
              value={draft.targetSection || ""}
              placeholder="A"
              onChange={(e) => setDraft((d) => ({ ...d, targetSection: e.target.value || null }))}
              className={`${INPUT_CLS} disabled:opacity-45`}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Minimum Result %</span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.minResultPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDraft((d) => ({
                  ...d,
                  minResultPct: val,
                  criteriaSummary: `Min ${Math.round(val)}% in all subjects`,
                }));
              }}
              className={INPUT_CLS}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Minimum Attendance %</span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.minAttendancePct}
              onChange={(e) => setDraft((d) => ({ ...d, minAttendancePct: Number(e.target.value) }))}
              className={INPUT_CLS}
            />
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Criteria Summary</span>
            <input
              type="text"
              value={draft.criteriaSummary}
              onChange={(e) => setDraft((d) => ({ ...d, criteriaSummary: e.target.value }))}
              placeholder="Min 40% in all subjects"
              className={INPUT_CLS}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
          {[
            { key: "isActive" as const, label: "Rule Active" },
            { key: "markAsAlumni" as const, label: "Graduate Cohort as Alumni" },
            { key: "requireAssessmentsCompleted" as const, label: "Require All Assessments Completed" },
            { key: "requireResultPublished" as const, label: "Require Results Published" },
            { key: "requireFeeClearance" as const, label: "Require Pending Fee Clearance" },
          ].map((chk) => (
            <label
              key={chk.key}
              className="flex items-center gap-2 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/80 px-3 py-2 cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
            >
              <input
                type="checkbox"
                checked={Boolean(draft[chk.key])}
                onChange={(e) => setDraft((d) => ({ ...d, [chk.key]: e.target.checked }))}
                className="h-4 w-4 accent-[#663CF6]"
              />
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{chk.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAEEFA] dark:border-[#272B4D]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-[#D9DEF2] px-4 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9] dark:hover:bg-[#1F244A]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !draft.fromGrade.trim() || !draft.toGrade.trim()}
            onClick={() => void onSave(draft)}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : mode === "create" ? "Create Rule" : "Save Rule"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function GradeCriteriaEditorModal({
  open,
  ruleName,
  initialBands,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  ruleName: string;
  initialBands: PromotionGradeBand[];
  saving: boolean;
  onClose: () => void;
  onSave: (bands: PromotionGradeBand[]) => Promise<void>;
}) {
  const [bands, setBands] = useState<PromotionGradeBand[]>(initialBands);

  if (!open) return null;

  const updateBand = (idx: number, patch: Partial<PromotionGradeBand>) => {
    setBands((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Grade Criteria"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
          <div>
            <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
              Set Grade Criteria — {ruleName}
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Configure marks bands, result descriptions, and whether each band qualifies for promotion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1F244A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2 px-3">Grade</th>
                <th className="py-2 px-2">Min %</th>
                <th className="py-2 px-2">Max %</th>
                <th className="py-2 px-3">Result Label</th>
                <th className="py-2 px-3 text-center">Promotion Decision</th>
                <th className="py-2 px-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {bands.map((b, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={b.grade}
                      onChange={(e) => updateBand(idx, { grade: e.target.value })}
                      className={`${INPUT_CLS} h-8 w-16`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={b.minPct}
                      onChange={(e) => updateBand(idx, { minPct: Number(e.target.value) })}
                      className={`${INPUT_CLS} h-8 w-20`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={b.maxPct}
                      onChange={(e) => updateBand(idx, { maxPct: Number(e.target.value) })}
                      className={`${INPUT_CLS} h-8 w-20`}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={b.resultLabel}
                      onChange={(e) => updateBand(idx, { resultLabel: e.target.value })}
                      className={`${INPUT_CLS} h-8 w-36`}
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateBand(idx, { promote: !b.promote })}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer ${
                        b.promote
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}
                    >
                      {b.promote ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{b.promote ? "Promote" : "Do Not Promote"}</span>
                    </button>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      disabled={bands.length <= 1}
                      onClick={() => setBands((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer dark:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAEEFA] dark:border-[#272B4D]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setBands((prev) => [
                  ...prev,
                  { grade: "New", minPct: 0, maxPct: 39, resultLabel: "Review", promote: false },
                ])
              }
              className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#08093B] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:text-[#EEF0FF]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Band</span>
            </button>
            <button
              type="button"
              onClick={() => setBands(DEFAULT_PROMOTION_GRADE_BANDS.map((b) => ({ ...b })))}
              className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-[#D9DEF2] px-4 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave(bands)}
              className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving..." : "Save Grade Criteria"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BulkUpdateRulesModal({
  open,
  targetCount,
  saving,
  onClose,
  onApply,
}: {
  open: boolean;
  targetCount: number;
  saving: boolean;
  onClose: () => void;
  onApply: (patch: {
    statusAction: "NO_CHANGE" | "ACTIVATE" | "DEACTIVATE";
    minResultPct?: number;
    minAttendancePct?: number;
  }) => Promise<void>;
}) {
  const [statusAction, setStatusAction] = useState<"NO_CHANGE" | "ACTIVATE" | "DEACTIVATE">(
    "ACTIVATE",
  );
  const [minResultPct, setMinResultPct] = useState("");
  const [minAttendancePct, setMinAttendancePct] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bulk Update Promotion Rules"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#663CF6]" />
            <span>Bulk Update ({targetCount} rules)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Status Action</span>
            <select
              value={statusAction}
              onChange={(e) =>
                setStatusAction(e.target.value as "NO_CHANGE" | "ACTIVATE" | "DEACTIVATE")
              }
              className={INPUT_CLS}
            >
              <option value="NO_CHANGE">Keep Existing Status</option>
              <option value="ACTIVATE">Set Active</option>
              <option value="DEACTIVATE">Set Inactive</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Override Minimum Result % (Optional)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={minResultPct}
              placeholder="Leave blank to keep existing"
              onChange={(e) => setMinResultPct(e.target.value)}
              className={INPUT_CLS}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Override Minimum Attendance % (Optional)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={minAttendancePct}
              placeholder="Leave blank to keep existing"
              onChange={(e) => setMinAttendancePct(e.target.value)}
              className={INPUT_CLS}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-[#D9DEF2] px-4 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onApply({
                statusAction,
                minResultPct: minResultPct.trim() ? Number(minResultPct) : undefined,
                minAttendancePct: minAttendancePct.trim() ? Number(minAttendancePct) : undefined,
              })
            }
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Updating..." : "Apply to Rules"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function PreviewRuleLogicModal({
  open,
  rule,
  decisions,
  onClose,
}: {
  open: boolean;
  rule: EditablePromotionRule | null;
  decisions: StudentPromotionDecisionRow[];
  onClose: () => void;
}) {
  if (!open || !rule) return null;

  const classCohort = decisions.filter(
    (d) => d.currentGrade.toLowerCase() === rule.fromGrade.toLowerCase(),
  );
  const sample = classCohort.length > 0 ? classCohort : decisions;
  const qualified = sample.filter(
    (d) => d.promotionPct >= rule.minResultPct && d.attendancePct >= rule.minAttendancePct,
  );
  const held = sample.filter(
    (d) => d.promotionPct < rule.minResultPct || d.attendancePct < rule.minAttendancePct,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Preview Rule Logic"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#663CF6]" />
            <span>Rule Logic Simulation — {rule.ruleName}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-[#F5F2FF] px-3.5 py-2.5 text-xs font-bold text-[#4F27E8] dark:bg-[#221A44] dark:text-[#DDD6FE]">
          {rule.fromGrade} → {rule.toGrade} • Cutoff: Marks ≥ {rule.minResultPct}% & Attendance ≥{" "}
          {rule.minAttendancePct}%
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-[#EAEEFA] p-3 dark:border-[#272B4D]">
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              Evaluated
            </p>
            <p className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">{sample.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Would Promote
            </p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {qualified.length}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-900 dark:bg-rose-950/40">
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              Flagged / Hold
            </p>
            <p className="text-xl font-black text-rose-700 dark:text-rose-300">{held.length}</p>
          </div>
        </div>

        {held.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-xl border border-[#EAEEFA] p-3 space-y-1.5 text-xs dark:border-[#272B4D]">
            <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
              Students Below Threshold ({held.length}):
            </p>
            {held.slice(0, 8).map((stu) => (
              <div
                key={stu.studentId}
                className="flex items-center justify-between text-[11px] text-[#4D5072] dark:text-[#B4BDD9]"
              >
                <span>
                  {stu.studentName} ({stu.admissionNumber})
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-300">
                  Marks {stu.promotionPct.toFixed(1)}% • Att {stu.attendancePct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
