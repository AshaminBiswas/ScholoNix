"use client";

import React from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  GitBranch,
  Layers,
  Pencil,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type {
  PromotionSettingsConfig,
  PromotionSettingsSuiteConfig,
  PromotionSuiteTab,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

function ToggleSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-45 ${
        checked ? "bg-[#663CF6]" : "bg-[#CBD5E1] dark:bg-[#334155]"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const INPUT_CLS =
  "h-9 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

export function SettingsGeneralTab({
  data,
  academicYear,
  settings,
  general,
  canManageSettings,
  saving,
  onSettingsChange,
  onGeneralChange,
  onSwitchSuiteTab,
  onReset,
  onSave,
}: {
  data: StudentPromotionOverviewData;
  academicYear: string;
  settings: PromotionSettingsConfig;
  general: PromotionSettingsSuiteConfig["general"];
  canManageSettings: boolean;
  saving: boolean;
  onSettingsChange: (patch: Partial<PromotionSettingsConfig>) => void;
  onGeneralChange: (patch: Partial<PromotionSettingsSuiteConfig["general"]>) => void;
  onSwitchSuiteTab: (tab: PromotionSuiteTab) => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  const gradeRows = (data.rules[0]?.gradeCriteria ?? []).map((band, idx) => ({
    ...band,
    gradePoint: band.promote ? Math.max(4, 10 - idx) : null,
  }));

  return (
    <div className="space-y-4">
      {/* Row 1: General Settings + Promotion Scheme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2 border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <Settings className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>General Settings</span>
          </h4>
          <div className="space-y-2.5 text-xs">
            {(
              [
                { key: "moduleEnabled", label: "Promotion Module" },
                { key: "allowClassPromotion", label: "Allow Class Promotion" },
                { key: "allowBulkPromotion", label: "Allow Bulk Promotion" },
                { key: "allowRePromotion", label: "Allow Re-Promotion (Correction)" },
                { key: "requireMandatoryConditions", label: "Require Mandatory Conditions" },
              ] as const
            ).map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between py-1 border-b border-[#F2F4FC] last:border-0 dark:border-[#232746]"
              >
                <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{row.label}</span>
                <ToggleSwitch
                  checked={general[row.key]}
                  disabled={!canManageSettings}
                  label={row.label}
                  onChange={(v) => onGeneralChange({ [row.key]: v })}
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">
                Auto-Assign New Roll Numbers
              </span>
              <ToggleSwitch
                checked={settings.autoAssignRollNumbers}
                disabled={!canManageSettings}
                label="Auto-Assign New Roll Numbers"
                onChange={(v) => onSettingsChange({ autoAssignRollNumbers: v })}
              />
            </div>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2 border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <Layers className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Promotion Scheme</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Academic Year</span>
              <input type="text" readOnly value={academicYear} className={`${INPUT_CLS} opacity-80`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Default Promotion Type
              </span>
              <select
                disabled={!canManageSettings}
                value={general.defaultPromotionType}
                onChange={(e) =>
                  onGeneralChange({
                    defaultPromotionType: e.target.value as
                      | "GRADE_BASED"
                      | "PERCENTAGE_BASED"
                      | "MANUAL",
                  })
                }
                className={INPUT_CLS}
              >
                <option value="GRADE_BASED">Grade Based</option>
                <option value="PERCENTAGE_BASED">Percentage Based</option>
                <option value="MANUAL">Manual Review</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Overall Pass Percentage (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canManageSettings}
                value={general.overallPassPct}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onGeneralChange({ overallPassPct: v });
                  onSettingsChange({ minResultPct: v });
                }}
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Minimum Subject Pass %
              </span>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canManageSettings}
                value={general.minSubjectPassPct}
                onChange={(e) => onGeneralChange({ minSubjectPassPct: Number(e.target.value) })}
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Final Graduating Class (Alumni Transition)
              </span>
              <input
                type="text"
                disabled={!canManageSettings}
                value={settings.finalGradeForAlumni}
                onChange={(e) => onSettingsChange({ finalGradeForAlumni: e.target.value })}
                className={INPUT_CLS}
              />
            </label>
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">
              Consider All Subjects
            </span>
            <ToggleSwitch
              checked={general.considerAllSubjects}
              disabled={!canManageSettings}
              label="Consider All Subjects"
              onChange={(v) => onGeneralChange({ considerAllSubjects: v })}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Grade Configuration + Promotion Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex items-center justify-between gap-2 border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Grade Configuration
            </h4>
            <button
              type="button"
              onClick={() => onSwitchSuiteTab("rules")}
              className="h-7 inline-flex items-center gap-1 rounded-lg border border-[#D9DEF2] px-2.5 text-[11px] font-bold text-[#4F27E8] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
            >
              <Pencil className="h-3 w-3" />
              <span>Manage Grades</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-2">Grade</th>
                  <th className="py-2 px-2">Marks Range (%)</th>
                  <th className="py-2 px-2 text-center">Grade Point</th>
                  <th className="py-2 pl-2 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {gradeRows.map((g, idx) => (
                  <tr key={`${g.grade}-${idx}`}>
                    <td className="py-1.5 pr-2 font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {g.grade}
                    </td>
                    <td className="py-1.5 px-2 text-[#4D5072] dark:text-[#B4BDD9]">
                      {g.minPct} – {g.maxPct}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold">
                      {g.gradePoint ?? "—"}
                    </td>
                    <td className="py-1.5 pl-2 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          g.promote
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {g.resultLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2 border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <ShieldCheck className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Promotion Conditions</span>
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">
                Enforce Attendance Criteria
              </span>
              <ToggleSwitch
                checked={general.enforceAttendance}
                disabled={!canManageSettings}
                label="Enforce Attendance Criteria"
                onChange={(v) => onGeneralChange({ enforceAttendance: v })}
              />
            </div>

            {general.enforceAttendance && (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE] px-3 py-2 dark:border-[#272B4D] dark:bg-[#10132A]">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                  Minimum Attendance (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={!canManageSettings}
                  value={general.minAttendancePct}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onGeneralChange({ minAttendancePct: v });
                    onSettingsChange({ minAttendancePct: v });
                  }}
                  className="h-7 w-20 rounded-lg border border-[#D9DEF2] bg-white px-2 text-right font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#0B0D1F] dark:text-[#EEF0FF]"
                />
              </label>
            )}

            {(
              [
                { key: "enforceFeeClearance", label: "Enforce Fee Clearance" },
                { key: "enforceAssessmentCompletion", label: "Enforce Assessment Completion" },
                { key: "includeCoScholastic", label: "Include Co-scholastic Evaluation" },
                { key: "checkDisciplinaryClearance", label: "Check Disciplinary Clearance" },
              ] as const
            ).map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between py-1 border-b border-[#F2F4FC] last:border-0 dark:border-[#232746]"
              >
                <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{row.label}</span>
                <ToggleSwitch
                  checked={general[row.key]}
                  disabled={!canManageSettings}
                  label={row.label}
                  onChange={(v) => {
                    onGeneralChange({ [row.key]: v });
                    if (row.key === "enforceFeeClearance") {
                      onSettingsChange({ requirePendingFeeClearance: v });
                    }
                  }}
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">
                Lock Batch Records After Completion
              </span>
              <ToggleSwitch
                checked={settings.lockPromotionAfterPublish}
                disabled={!canManageSettings}
                label="Lock Batch Records After Completion"
                onChange={(v) => onSettingsChange({ lockPromotionAfterPublish: v })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Result & Criteria Mapping + Next Class Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Result &amp; Criteria Mapping</span>
            </h4>
            <button
              type="button"
              onClick={() => onSwitchSuiteTab("criteria")}
              className="h-7 inline-flex items-center gap-1 rounded-lg border border-[#D9DEF2] px-2.5 text-[11px] font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit Criteria</span>
            </button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-2">Class</th>
                  <th className="py-2 px-2">Criteria Used</th>
                  <th className="py-2 px-2 text-right">Pass %</th>
                  <th className="py-2 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {data.rules.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {r.fromGrade}
                    </td>
                    <td className="py-1.5 px-2 text-[#4D5072] dark:text-[#B4BDD9]">
                      {r.ruleName}
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold">{r.minResultPct}%</td>
                    <td className="py-1.5 pl-2 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Next Class Mapping</span>
            </h4>
            <button
              type="button"
              onClick={() => onSwitchSuiteTab("rules")}
              className="h-7 inline-flex items-center gap-1 rounded-lg border border-[#D9DEF2] px-2.5 text-[11px] font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit Mapping</span>
            </button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-2">Current Class</th>
                  <th className="py-2 px-2">Next Class</th>
                  <th className="py-2 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {data.rules.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {r.fromGrade}
                    </td>
                    <td className="py-1.5 px-2 font-semibold text-[#4F27E8] dark:text-[#C4B5FD]">
                      {r.toGrade}
                    </td>
                    <td className="py-1.5 pl-2 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Auto Promotion Workflow + Promotion Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Auto Promotion (Workflow)</span>
            </h4>
            <ToggleSwitch
              checked={general.autoPromotionEnabled}
              disabled={!canManageSettings}
              label="Auto Promotion Workflow"
              onChange={(v) => onGeneralChange({ autoPromotionEnabled: v })}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              "Apply Result Criteria",
              "Check Conditions",
              "Calculate Promotion",
              "Update Next Class",
            ].map((step, i) => (
              <div
                key={step}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE] p-2.5 text-center dark:border-[#272B4D] dark:bg-[#10132A]"
              >
                <span className="h-6 w-6 rounded-full bg-[#EDE7FF] text-[#663CF6] text-[11px] font-black flex items-center justify-center dark:bg-[#251D4A] dark:text-[#C4B5FD]">
                  {i + 1}
                </span>
                <span className="text-[10.5px] font-bold text-[#08093B] dark:text-[#EEF0FF]">
                  {step}
                </span>
                {i < 3 && <ArrowRight className="h-3 w-3 text-[#663CF6] sm:hidden" />}
              </div>
            ))}
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Promotion Notifications</span>
            </h4>
            <ToggleSwitch
              checked={settings.notifyParentsOnPromotion}
              disabled={!canManageSettings}
              label="Enable Promotion Notifications"
              onChange={(v) => onSettingsChange({ notifyParentsOnPromotion: v })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(
              [
                { key: "notifyClassTeacher", label: "Notify Class Teacher after promotion" },
                { key: "notifyParents", label: "Notify Parents / Guardians" },
                { key: "notifyStudentInApp", label: "Notify Student (in app)" },
                { key: "sendSummaryReport", label: "Send promotion summary report" },
              ] as const
            ).map((chk) => (
              <label
                key={chk.key}
                className="flex items-center gap-2 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/80 px-3 py-2 cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
              >
                <input
                  type="checkbox"
                  disabled={!canManageSettings}
                  checked={general[chk.key]}
                  onChange={(e) => onGeneralChange({ [chk.key]: e.target.checked })}
                  className="h-3.5 w-3.5 accent-[#663CF6]"
                />
                <span className="font-semibold text-[#08093B] dark:text-[#EEF0FF]">
                  {chk.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {canManageSettings && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onReset}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white px-4 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#141731] dark:text-[#C5CCF0]"
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
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
