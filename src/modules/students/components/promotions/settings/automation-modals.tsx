"use client";

import React, { useState } from "react";
import { CheckCircle2, Play, Plus, Sparkles, X, Zap } from "lucide-react";
import type { PromotionAutomationRuleItem } from "@/modules/students/promotion-types";

const INPUT_CLS =
  "h-9 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

interface AutomationSimulationResult {
  dryRun: boolean;
  evaluatedCount: number;
  promotedCount: number;
  retainedCount: number;
  alumniCount: number;
  flaggedCount: number;
  stepsExecuted: number;
  classBreakdown: Array<{
    fromGrade: string;
    toGrade: string;
    count: number;
    alumniCount: number;
    retainCount: number;
  }>;
}

export function RunAutomationWorkflowModal({
  open,
  mode,
  schoolId,
  academicYear,
  onClose,
  onExecuted,
}: {
  open: boolean;
  mode: "school" | "platform";
  schoolId: string;
  academicYear: string;
  onClose: () => void;
  onExecuted: (message: string) => Promise<void>;
}) {
  const [toAcademicYear, setToAcademicYear] = useState("2026-2027");
  const [running, setRunning] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<AutomationSimulationResult | null>(null);

  if (!open) return null;

  const invokeAutomation = async (dryRun: boolean) => {
    setRunning(true);
    setErrMsg(null);
    try {
      const endpoint =
        mode === "platform"
          ? `/api/platform/schools/${schoolId}/promotions`
          : `/api/school/students/promotions/automation/run`;
      const payload =
        mode === "platform"
          ? { action: "runAutomation", academicYear, toAcademicYear, dryRun }
          : { academicYear, toAcademicYear, dryRun };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Automation workflow failed");
      }

      if (dryRun) {
        setPreview(json.result as AutomationSimulationResult);
      } else {
        const r = json.result as AutomationSimulationResult;
        await onExecuted(
          `Automation workflow completed: ${r.promotedCount} promoted, ${r.alumniCount} alumni, ${r.retainedCount} retained (${r.evaluatedCount} evaluated).`,
        );
        onClose();
      }
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Automation execution error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Run Promotion Automation Workflow"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-3 dark:border-[#272B4D]">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#EDE7FF] text-[#663CF6] flex items-center justify-center dark:bg-[#251D4A] dark:text-[#C4B5FD]">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
                Run Promotion Automation Pipeline
              </h3>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                5-step evaluation across all active class rules, marks &amp; attendance thresholds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#76799C] hover:bg-[#F3F5FD] cursor-pointer dark:text-[#9DA6CC]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Source Academic Year
            </span>
            <input type="text" readOnly value={academicYear} className={`${INPUT_CLS} opacity-80`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Target Academic Year
            </span>
            <input
              type="text"
              value={toAcademicYear}
              onChange={(e) => setToAcademicYear(e.target.value)}
              className={INPUT_CLS}
            />
          </label>
        </div>

        {errMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
            {errMsg}
          </div>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: "Evaluated", val: preview.evaluatedCount, cls: "text-[#08093B] dark:text-[#F3F5FF]" },
                { label: "Will Promote", val: preview.promotedCount, cls: "text-emerald-600 dark:text-emerald-300" },
                { label: "Alumni", val: preview.alumniCount, cls: "text-indigo-600 dark:text-indigo-300" },
                { label: "Held / Retained", val: preview.retainedCount + preview.flaggedCount, cls: "text-amber-600 dark:text-amber-300" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[#EAEEFA] bg-[#FAF8FE] p-2.5 dark:border-[#272B4D] dark:bg-[#10132A]"
                >
                  <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
                    {stat.label}
                  </p>
                  <p className={`text-lg font-black ${stat.cls}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            {preview.classBreakdown.length > 0 && (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-[#EAEEFA] dark:border-[#272B4D]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A]">
                      <th className="py-2 px-3">From Class</th>
                      <th className="py-2 px-3">To Class</th>
                      <th className="py-2 px-3 text-right">Promote</th>
                      <th className="py-2 px-3 text-right">Retain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                    {preview.classBreakdown.map((c) => (
                      <tr key={c.fromGrade}>
                        <td className="py-1.5 px-3 font-bold">{c.fromGrade}</td>
                        <td className="py-1.5 px-3 text-[#4F27E8] dark:text-[#C4B5FD]">
                          {c.toGrade}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
                          {c.count + c.alumniCount}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-rose-700 dark:text-rose-300">
                          {c.retainCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#EAEEFA] dark:border-[#272B4D]">
          <button
            type="button"
            disabled={running}
            onClick={() => void invokeAutomation(true)}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#C4B5FD] bg-white px-3.5 text-xs font-bold text-[#4F27E8] hover:bg-[#EDE7FF] disabled:opacity-50 cursor-pointer dark:border-[#4C3D99] dark:bg-[#10132A] dark:text-[#DDD6FE]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{running ? "Simulating..." : "Simulate Dry-Run"}</span>
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void invokeAutomation(false)}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            {running ? <CheckCircle2 className="h-3.5 w-3.5 animate-pulse" /> : <Play className="h-3.5 w-3.5" />}
            <span>{running ? "Executing..." : "Execute Automation Workflow"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddAutomationRuleModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: PromotionAutomationRuleItem) => void;
}) {
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("Overall ≥ 45%");
  const [action, setAction] = useState("Allow Promotion");
  const [active, setActive] = useState(true);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add Automation Rule"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/85 bg-white p-5 shadow-2xl space-y-4 dark:border-[#2E345E] dark:bg-[#141731]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#663CF6]" />
            <span>Add Automation Rule</span>
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
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Rule Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Library Book Clearance"
              className={INPUT_CLS}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Condition</span>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={INPUT_CLS}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Action</span>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="Promote">Promote</option>
              <option value="Allow Promotion">Allow Promotion</option>
              <option value="Flag Exception">Flag Exception</option>
            </select>
          </label>
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-[#663CF6]"
            />
            <span>Active</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-[#D9DEF2] px-4 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:text-[#B4BDD9]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ name: name.trim(), condition: condition.trim(), action, active });
              onClose();
            }}
            className="h-9 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            Add Rule
          </button>
        </div>
      </div>
    </div>
  );
}
