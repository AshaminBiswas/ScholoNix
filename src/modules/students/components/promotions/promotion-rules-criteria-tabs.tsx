"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type {
  PromotionSettingsConfig,
  StudentPromotionOverviewData,
  StudentPromotionRuleRecord,
} from "@/modules/students/promotion-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

type EditableRule = Omit<StudentPromotionRuleRecord, "id" | "schoolId">;

function normalizeEditableRules(data: StudentPromotionOverviewData, academicYear: string): EditableRule[] {
  if (data.rules.length > 0) {
    return data.rules.map((r) => ({
      academicYear: r.academicYear,
      fromGrade: r.fromGrade,
      toGrade: r.toGrade,
      markAsAlumni: r.markAsAlumni,
      defaultSectionMode: r.defaultSectionMode,
      targetSection: r.targetSection,
      minResultPct: r.minResultPct,
      minAttendancePct: r.minAttendancePct,
      maxFailedSubjects: r.maxFailedSubjects,
      isActive: r.isActive,
    }));
  }

  return data.grades.map((grade, idx) => {
    const next = data.grades[idx + 1] ?? data.settings.finalGradeForAlumni;
    const isFinal = idx === data.grades.length - 1;
    return {
      academicYear,
      fromGrade: grade,
      toGrade: next,
      markAsAlumni: isFinal,
      defaultSectionMode: "KEEP_SAME",
      targetSection: null,
      minResultPct: data.settings.minResultPct,
      minAttendancePct: data.settings.minAttendancePct,
      maxFailedSubjects: 0,
      isActive: true,
    };
  });
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
    rules: EditableRule[];
  }) => Promise<void>;
}) {
  const [rules, setRules] = useState<EditableRule[]>(() =>
    normalizeEditableRules(data, academicYear),
  );

  const updateRule = (idx: number, patch: Partial<EditableRule>) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRule = () => {
    const fallbackFrom = data.grades[0] || "Class I";
    const fallbackTo = data.grades[1] || "Class II";
    setRules((prev) => [
      ...prev,
      {
        academicYear,
        fromGrade: fallbackFrom,
        toGrade: fallbackTo,
        markAsAlumni: false,
        defaultSectionMode: "KEEP_SAME",
        targetSection: null,
        minResultPct: data.settings.minResultPct,
        minAttendancePct: data.settings.minAttendancePct,
        maxFailedSubjects: 0,
        isActive: true,
      },
    ]);
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const inputCls =
    "h-8 rounded-lg border border-[#D9DEF2] bg-white px-2.5 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

  return (
    <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
      <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
        <div>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Class Progression Mapping Rules ({academicYear})</span>
          </h3>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC] mt-0.5">
            Define deterministic next-class progression, section assignment mode, and graduation cutoff per class.
          </p>
        </div>

        {canManageSettings && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addRule}
              className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Mapping</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSaveRulesAndSettings({ academicYear, rules })}
              className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving..." : "Save Rules"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
              <th className="py-2.5 px-4">From Class</th>
              <th className="py-2.5 px-3">Promote To</th>
              <th className="py-2.5 px-3">Section Assignment</th>
              <th className="py-2.5 px-3">Target Sec.</th>
              <th className="py-2.5 px-3 text-center">Graduate as Alumni</th>
              <th className="py-2.5 px-3 text-center">Active</th>
              {canManageSettings && <th className="py-2.5 px-4 text-right">Remove</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
            {rules.map((rule, idx) => (
              <tr key={`${rule.fromGrade}-${idx}`} className="hover:bg-[#F6F5FF]/60 dark:hover:bg-[#1B1F3F]/50">
                <td className="py-2.5 px-4">
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={rule.fromGrade}
                    onChange={(e) => updateRule(idx, { fromGrade: e.target.value })}
                    className={`${inputCls} w-32`}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={rule.toGrade}
                    onChange={(e) => updateRule(idx, { toGrade: e.target.value })}
                    className={`${inputCls} w-32`}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <select
                    disabled={!canManageSettings}
                    value={rule.defaultSectionMode}
                    onChange={(e) =>
                      updateRule(idx, {
                        defaultSectionMode: e.target.value as EditableRule["defaultSectionMode"],
                      })
                    }
                    className={inputCls}
                  >
                    <option value="KEEP_SAME">Keep Same Section</option>
                    <option value="TARGET_SECTION">Fixed Target Section</option>
                    <option value="AUTO_BALANCE">Auto Balance Sections</option>
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    disabled={!canManageSettings || rule.defaultSectionMode !== "TARGET_SECTION"}
                    value={rule.targetSection || ""}
                    placeholder="A"
                    onChange={(e) => updateRule(idx, { targetSection: e.target.value || null })}
                    className={`${inputCls} w-20 disabled:opacity-40`}
                  />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={rule.markAsAlumni}
                    onChange={(e) => updateRule(idx, { markAsAlumni: e.target.checked })}
                    className="h-4 w-4 accent-[#663CF6]"
                  />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={rule.isActive}
                    onChange={(e) => updateRule(idx, { isActive: e.target.checked })}
                    className="h-4 w-4 accent-[#663CF6]"
                  />
                </td>
                {canManageSettings && (
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-300 dark:hover:bg-rose-950/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
    rules: EditableRule[];
    settings: PromotionSettingsConfig;
  }) => Promise<void>;
}) {
  const [rules, setRules] = useState<EditableRule[]>(() =>
    normalizeEditableRules(data, academicYear),
  );
  const [minGlobalResult, setMinGlobalResult] = useState(data.settings.minResultPct);
  const [minGlobalAttendance, setMinGlobalAttendance] = useState(data.settings.minAttendancePct);

  const qualifyingCount = data.decisions.filter(
    (d) => d.promotionPct >= minGlobalResult && d.attendancePct >= minGlobalAttendance,
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 space-y-2`}>
          <p className="text-xs font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Default Minimum Result %
          </p>
          <input
            type="number"
            min={0}
            max={100}
            disabled={!canManageSettings}
            value={minGlobalResult}
            onChange={(e) => setMinGlobalResult(Number(e.target.value))}
            className="h-10 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-base font-black text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
          />
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Required overall exam percentage for automatic promotion eligibility.
          </p>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 space-y-2`}>
          <p className="text-xs font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Default Minimum Attendance %
          </p>
          <input
            type="number"
            min={0}
            max={100}
            disabled={!canManageSettings}
            value={minGlobalAttendance}
            onChange={(e) => setMinGlobalAttendance(Number(e.target.value))}
            className="h-10 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-base font-black text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
          />
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Students below threshold are flagged for principal review before promotion.
          </p>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 flex flex-col justify-between`}>
          <div>
            <p className="text-xs font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Live Eligibility Simulation
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-300">
              {qualifyingCount} / {data.decisions.length}
            </p>
          </div>
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Students meeting both result and attendance criteria right now.
          </p>
        </div>
      </div>

      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Class-wise Pass & Attendance Thresholds</span>
          </h3>
          {canManageSettings && (
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onSaveRulesAndSettings({
                  academicYear,
                  rules,
                  settings: {
                    ...data.settings,
                    minResultPct: minGlobalResult,
                    minAttendancePct: minGlobalAttendance,
                  },
                })
              }
              className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving..." : "Save Result Criteria"}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-3">Min Result %</th>
                <th className="py-2.5 px-3">Min Attendance %</th>
                <th className="py-2.5 px-3">Max Failed Subjects</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {rules.map((rule, idx) => (
                <tr key={`${rule.fromGrade}-${idx}`}>
                  <td className="py-2.5 px-4 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {rule.fromGrade} → {rule.toGrade}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={!canManageSettings}
                      value={rule.minResultPct}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, minResultPct: Number(e.target.value) } : r,
                          ),
                        )
                      }
                      className="h-8 w-24 rounded-lg border border-[#D9DEF2] bg-white px-2.5 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={!canManageSettings}
                      value={rule.minAttendancePct}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, minAttendancePct: Number(e.target.value) } : r,
                          ),
                        )
                      }
                      className="h-8 w-24 rounded-lg border border-[#D9DEF2] bg-white px-2.5 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      disabled={!canManageSettings}
                      value={rule.maxFailedSubjects}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, maxFailedSubjects: Number(e.target.value) } : r,
                          ),
                        )
                      }
                      className="h-8 w-20 rounded-lg border border-[#D9DEF2] bg-white px-2.5 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
    key: Exclude<keyof PromotionSettingsConfig, "finalGradeForAlumni" | "minResultPct" | "minAttendancePct">,
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
