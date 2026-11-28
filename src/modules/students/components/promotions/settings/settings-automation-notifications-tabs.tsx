"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  History,
  Layers,
  Mail,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings,
  Smartphone,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import type {
  PromotionSettingsSuiteConfig,
  PromotionSuiteTab,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";
import {
  AddAutomationRuleModal,
  RunAutomationWorkflowModal,
} from "@/modules/students/components/promotions/settings/automation-modals";

function AutoToggleSwitch({
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

export function SettingsAutomationTab({
  mode,
  schoolId,
  academicYear,
  data,
  automation,
  canManageSettings,
  saving,
  onAutomationChange,
  onSwitchSuiteTab,
  onAutomationExecuted,
  onDownloadReport,
  onReset,
  onSave,
}: {
  mode: "school" | "platform";
  schoolId: string;
  academicYear: string;
  data: StudentPromotionOverviewData;
  automation: PromotionSettingsSuiteConfig["automation"];
  canManageSettings: boolean;
  saving: boolean;
  onAutomationChange: (patch: Partial<PromotionSettingsSuiteConfig["automation"]>) => void;
  onSwitchSuiteTab: (tab: PromotionSuiteTab) => void;
  onAutomationExecuted: (message: string) => Promise<void>;
  onDownloadReport: () => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const activeWorkflowsCount = automation.automationRules.filter((r) => r.active).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StudentKpiCard
          label="Automation Status"
          value={automation.enabled ? "Enabled" : "Paused"}
          icon={<Zap className="h-5 w-5" />}
          tone={automation.enabled ? "emerald" : "amber"}
          subtitle="Workflow engine"
        />
        <StudentKpiCard
          label="Active Workflows"
          value={activeWorkflowsCount}
          icon={<Layers className="h-5 w-5" />}
          tone="violet"
          subtitle={`of ${automation.automationRules.length} configured`}
        />
        <StudentKpiCard
          label="Automated Promotions"
          value={data.kpis.promotedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="sky"
          subtitle="Current cycle"
        />
        <StudentKpiCard
          label="Next Run"
          value={automation.runDate}
          icon={<Calendar className="h-5 w-5" />}
          tone="amber"
          subtitle={`${automation.runTime} (${automation.runFrequency})`}
        />
      </div>

      {/* 5-Step Workflow w/ vertical connectors + Automation Settings + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex items-center justify-between border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Promotion Automation Workflow</span>
            </h4>
            <AutoToggleSwitch
              checked={automation.enabled}
              disabled={!canManageSettings}
              label="Toggle Promotion Automation Workflow"
              onChange={(v) => onAutomationChange({ enabled: v })}
            />
          </div>
          <div className="space-y-1.5">
            {[
              { title: "Prepare Result Data", desc: "Fetch final marks, grade and attendance from exams." },
              { title: "Check Promotion Criteria", desc: "Apply result criteria, attendance and other conditions." },
              { title: "Determine Promotion Outcome", desc: "Mark students as Promote / Not Promoted / Alumni." },
              { title: "Update Student Class", desc: "Move promoted students into the next class." },
              { title: "Generate & Notify", desc: "Create promotion summary and notify stakeholders." },
            ].map((step, i, arr) => (
              <React.Fragment key={step.title}>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/85 px-3 py-2.5 dark:border-[#272B4D] dark:bg-[#10132A]">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-[#EDE7FF] text-[#663CF6] text-[11px] font-black flex items-center justify-center shrink-0 dark:bg-[#251D4A] dark:text-[#C4B5FD]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {step.title}
                      </p>
                      <p className="text-[10.5px] text-[#76799C] dark:text-[#9DA6CC]">{step.desc}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Auto
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowDown className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
              Automation Settings
            </h4>
            {(
              [
                { key: "enableAutoProcessing", label: "Enable Auto Promotion Processing" },
                { key: "autoClassUpdate", label: "Auto Class Update (after promotion)" },
                { key: "autoGenerateReport", label: "Auto Generate Promotion Report" },
                { key: "autoSendNotifications", label: "Auto Send Notifications (Parents & Teachers)" },
                { key: "autoUpdateAcademicYear", label: "Auto Update Next Academic Year" },
                { key: "autoArchivePreviousYear", label: "Auto Archive Previous Year Data" },
                { key: "runInBackground", label: "Run in Background (No manual intervention)" },
              ] as const
            ).map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between py-1 border-b border-[#F2F4FC] last:border-0 dark:border-[#232746]"
              >
                <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{row.label}</span>
                <AutoToggleSwitch
                  checked={automation[row.key]}
                  disabled={!canManageSettings}
                  label={row.label}
                  onChange={(v) => onAutomationChange({ [row.key]: v })}
                />
              </div>
            ))}
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3 text-xs`}>
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Automation Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Run Frequency *</span>
                <select
                  disabled={!canManageSettings}
                  value={automation.runFrequency}
                  onChange={(e) =>
                    onAutomationChange({
                      runFrequency: e.target.value as "YEARLY" | "TERM" | "MANUAL",
                    })
                  }
                  className={INPUT_CLS}
                >
                  <option value="YEARLY">Yearly</option>
                  <option value="TERM">Term End</option>
                  <option value="MANUAL">Manual Only</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Run Date *</span>
                <input
                  type="date"
                  disabled={!canManageSettings}
                  value={automation.runDate}
                  onChange={(e) => onAutomationChange({ runDate: e.target.value })}
                  className={INPUT_CLS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Run Time *</span>
                <input
                  type="time"
                  disabled={!canManageSettings}
                  value={automation.runTime}
                  onChange={(e) => onAutomationChange({ runTime: e.target.value })}
                  className={INPUT_CLS}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules + Exception Handling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Automation Rules
            </h4>
            {canManageSettings && (
              <button
                type="button"
                onClick={() => setAddRuleOpen(true)}
                className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#4F27E8] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#C4B5FD]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Rule</span>
              </button>
            )}
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 px-2">Rule Name</th>
                <th className="py-2 px-2">Condition</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2 text-right">Status</th>
                {canManageSettings && <th className="py-2 pl-2 text-right" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {automation.automationRules.map((r, idx) => (
                <tr key={`${r.name}-${idx}`}>
                  <td className="py-2 pr-2 text-[#76799C]">{idx + 1}</td>
                  <td className="py-2 px-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {r.name}
                  </td>
                  <td className="py-2 px-2 text-[#4D5072] dark:text-[#B4BDD9]">{r.condition}</td>
                  <td className="py-2 px-2 font-semibold">{r.action}</td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      disabled={!canManageSettings}
                      onClick={() =>
                        onAutomationChange({
                          automationRules: automation.automationRules.map((item, i) =>
                            i === idx ? { ...item, active: !item.active } : item,
                          ),
                        })
                      }
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                        r.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {r.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  {canManageSettings && (
                    <td className="py-2 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onAutomationChange({
                            automationRules: automation.automationRules.filter((_, i) => i !== idx),
                          })
                        }
                        title={`Delete ${r.name}`}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-300 dark:hover:bg-rose-950/50"
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

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2 border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Exception Handling</span>
          </h4>
          {(
            [
              { key: "flagUnqualifiedStudents", label: "Flag Students Not Meeting Criteria" },
              { key: "allowManualOverride", label: "Allow Manual Override (By Authorized Users)" },
              { key: "keepRetainedInSameClass", label: "Keep Students in Same Class (If Not Promoted)" },
              { key: "generateExceptionReport", label: "Generate Exception Report" },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-1.5 border-b border-[#F2F4FC] last:border-0 dark:border-[#232746]"
            >
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{item.label}</span>
              <AutoToggleSwitch
                checked={automation[item.key]}
                disabled={!canManageSettings}
                label={item.label}
                onChange={(v) => onAutomationChange({ [item.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Automation Logs (Recent Runs) + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Automation Logs{" "}
              <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                (Recent Runs)
              </span>
            </h4>
            <button
              type="button"
              onClick={() => onSwitchSuiteTab("history")}
              className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              View All →
            </button>
          </div>
          {data.batches.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No automation runs recorded yet. Click Run Automation Now to preview or execute.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 px-2">Run Date &amp; Time</th>
                    <th className="py-2 px-2">Academic Year</th>
                    <th className="py-2 px-2 text-right">Total</th>
                    <th className="py-2 px-2 text-right">Promoted</th>
                    <th className="py-2 px-2 text-right">Not Promoted</th>
                    <th className="py-2 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                  {data.batches.slice(0, 4).map((b, idx) => (
                    <tr key={b.id}>
                      <td className="py-2 pr-2 text-[#76799C]">{idx + 1}</td>
                      <td className="py-2 px-2 text-[#4D5072] dark:text-[#B4BDD9] whitespace-nowrap">
                        {b.completedAt ? new Date(b.completedAt).toLocaleString("en-IN") : "Recent"}
                      </td>
                      <td className="py-2 px-2 font-bold">{b.academicYear}</td>
                      <td className="py-2 px-2 text-right font-semibold">{b.totalEligible}</td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-700 dark:text-emerald-300">
                        {b.promotedCount + b.alumniCount}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-rose-700 dark:text-rose-300">
                        {b.retainedCount}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {b.status === "COMPLETED" ? "Completed" : b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "Run Automation Now",
                sub: "Execute promotion workflow",
                icon: <Play className="h-4 w-4" />,
                onClick: () => setRunModalOpen(true),
              },
              {
                label: "Configure Workflow",
                sub: "Modify promotion rules",
                icon: <Settings className="h-4 w-4" />,
                onClick: () => onSwitchSuiteTab("rules"),
              },
              {
                label: "View Run History",
                sub: "Check past automation logs",
                icon: <History className="h-4 w-4" />,
                onClick: () => onSwitchSuiteTab("history"),
              },
              {
                label: "Download Log",
                sub: "Export automation details",
                icon: <Download className="h-4 w-4" />,
                onClick: onDownloadReport,
              },
            ].map((act) => (
              <button
                key={act.label}
                type="button"
                onClick={act.onClick}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#E5E8F8] bg-white/85 px-2.5 py-3 text-center hover:border-[#663CF6] hover:bg-[#F6F5FF] cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
              >
                <span className="text-[#663CF6] dark:text-[#C4B5FD]">{act.icon}</span>
                <span className="text-[11px] font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {act.label}
                </span>
                <span className="text-[9.5px] text-[#76799C] dark:text-[#9DA6CC]">{act.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {canManageSettings && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white px-4 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:bg-[#141731] dark:text-[#C5CCF0]"
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
            <span>{saving ? "Saving..." : "Save Automation Settings"}</span>
          </button>
        </div>
      )}

      <RunAutomationWorkflowModal
        open={runModalOpen}
        mode={mode}
        schoolId={schoolId}
        academicYear={academicYear}
        onClose={() => setRunModalOpen(false)}
        onExecuted={onAutomationExecuted}
      />

      <AddAutomationRuleModal
        open={addRuleOpen}
        onClose={() => setAddRuleOpen(false)}
        onAdd={(rule) =>
          onAutomationChange({ automationRules: [...automation.automationRules, rule] })
        }
      />
    </div>
  );
}

export function SettingsNotificationsTab({
  data,
  notifications,
  canManageSettings,
  saving,
  onNotificationsChange,
  onSendTestNotification,
  onReset,
  onSave,
}: {
  data: StudentPromotionOverviewData;
  notifications: PromotionSettingsSuiteConfig["notifications"];
  canManageSettings: boolean;
  saving: boolean;
  onNotificationsChange: (patch: Partial<PromotionSettingsSuiteConfig["notifications"]>) => void;
  onSendTestNotification: (templateName: string, channel: string) => Promise<void>;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    notifications.templates[0]?.id || "tpl-promoted",
  );
  const [previewChannel, setPreviewChannel] = useState<"Email" | "SMS" | "WhatsApp" | "In-App">(
    "Email",
  );
  const [newTplName, setNewTplName] = useState("");

  const activeTemplate =
    notifications.templates.find((t) => t.id === selectedTemplateId) ?? notifications.templates[0];
  const sampleStu = data.decisions[0];
  const renderedBody = (activeTemplate?.body || "")
    .replace(/\{\{studentName\}\}/g, sampleStu?.studentName || "Aarav Sharma")
    .replace(/\{\{admissionNumber\}\}/g, sampleStu?.admissionNumber || "ADM2025-0192")
    .replace(/\{\{currentGrade\}\}/g, sampleStu?.currentGrade || "Class I")
    .replace(/\{\{nextGrade\}\}/g, sampleStu?.nextGrade || "Class II")
    .replace(/\{\{academicYear\}\}/g, data.academicYears[0] || "2025 – 2026");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StudentKpiCard
          label="Configured Templates"
          value={notifications.templates.length}
          icon={<Bell className="h-5 w-5" />}
          tone="violet"
          subtitle="Active alerts"
        />
        <StudentKpiCard
          label="Dispatched"
          value={data.kpis.promotedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle="Eligible notifications"
        />
        <StudentKpiCard
          label="Pending"
          value={data.kpis.pendingCount}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
          subtitle="Awaiting batch run"
        />
        <StudentKpiCard
          label="Failed"
          value={0}
          icon={<XCircle className="h-5 w-5" />}
          tone="pink"
          subtitle="Delivery errors"
        />
        <StudentKpiCard
          label="Schedule Window"
          value={notifications.schedule.timeSlot}
          icon={<Calendar className="h-5 w-5" />}
          tone="sky"
          subtitle={notifications.schedule.repeat}
        />
      </div>

      {/* Preferences + Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            Notification Preferences
          </h4>
          {(
            [
              { key: "notifyParents", label: "Notify Parents / Guardians", sub: "Send updates to primary guardian contact" },
              { key: "notifyTeachers", label: "Notify Class Teachers", sub: "Inform class teachers about batch outcomes" },
              { key: "notifyStudents", label: "Notify Students (In-App)", sub: "Display progression status in student portal" },
              { key: "sendSummaryReport", label: "Send Summary Report", sub: "Email summary digest to administrators" },
              { key: "includeResultDetails", label: "Include Result & Grade Details", sub: "Include overall % and final grade" },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-[#F2F4FC] last:border-0 cursor-pointer dark:border-[#232746]"
            >
              <div>
                <p className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{item.label}</p>
                <p className="text-[10.5px] text-[#76799C] dark:text-[#9DA6CC]">{item.sub}</p>
              </div>
              <input
                type="checkbox"
                disabled={!canManageSettings}
                checked={notifications[item.key]}
                onChange={(e) => onNotificationsChange({ [item.key]: e.target.checked })}
                className="h-4 w-4 accent-[#663CF6]"
              />
            </label>
          ))}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            Notification Channels
          </h4>
          {(
            [
              { key: "email", label: "Email", icon: <Mail className="h-4 w-4 text-[#663CF6]" /> },
              { key: "sms", label: "SMS", icon: <MessageSquare className="h-4 w-4 text-sky-600" /> },
              { key: "inApp", label: "In-App Notification", icon: <Bell className="h-4 w-4 text-amber-500" /> },
              { key: "whatsapp", label: "WhatsApp", icon: <Smartphone className="h-4 w-4 text-emerald-600" /> },
              { key: "desktop", label: "Desktop Push Notification", icon: <Bell className="h-4 w-4 text-slate-500" /> },
            ] as const
          ).map((ch) => (
            <div
              key={ch.key}
              className="flex items-center justify-between rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/80 px-3 py-2.5 dark:border-[#272B4D] dark:bg-[#10132A]"
            >
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManageSettings}
                  checked={notifications.channels[ch.key]}
                  onChange={(e) =>
                    onNotificationsChange({
                      channels: { ...notifications.channels, [ch.key]: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-[#663CF6]"
                />
                {ch.icon}
                <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{ch.label}</span>
              </label>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#4D5072] border border-[#D9DEF2] dark:bg-[#0B0D1F] dark:border-[#2E345E] dark:text-[#B4BDD9]">
                {notifications.channels[ch.key] ? "Enabled" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Templates + Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Notification Templates
          </h4>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 px-2">Template Name</th>
                <th className="py-2 px-2">Audience</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 pl-2 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {notifications.templates.map((tpl, idx) => (
                <tr key={tpl.id}>
                  <td className="py-2 pr-2 text-[#76799C]">{idx + 1}</td>
                  <td className="py-2 px-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {tpl.name}
                  </td>
                  <td className="py-2 px-2 text-[#4D5072] dark:text-[#B4BDD9]">{tpl.audience}</td>
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      disabled={!canManageSettings}
                      onClick={() =>
                        onNotificationsChange({
                          templates: notifications.templates.map((t) =>
                            t.id === tpl.id ? { ...t, active: !t.active } : t,
                          ),
                        })
                      }
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
                        tpl.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {tpl.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className="p-1.5 rounded-lg text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canManageSettings && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="New notification template name..."
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTplName.trim()) return;
                  const id = `tpl-${Date.now()}`;
                  onNotificationsChange({
                    templates: [
                      ...notifications.templates,
                      {
                        id,
                        name: newTplName.trim(),
                        audience: "Parents",
                        channels: ["Email", "In-App"],
                        active: true,
                        subject: `${newTplName.trim()} Notification`,
                        body: "Dear Parent, update for {{studentName}} ({{admissionNumber}}) in {{academicYear}}.",
                      },
                    ],
                  });
                  setSelectedTemplateId(id);
                  setNewTplName("");
                }}
                className="h-9 shrink-0 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Template</span>
              </button>
            </div>
          )}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2 dark:border-[#272B4D]">
            Notification Triggers
          </h4>
          {(
            [
              { key: "onCompleted", label: "When promotion is completed" },
              { key: "onNotPromoted", label: "When a student is not promoted" },
              { key: "onResultsPublished", label: "When promotion results are published" },
              { key: "onClassUpdated", label: "When class is updated (after promotion)" },
              { key: "beforeReminder", label: "Before promotion process (reminder)" },
              { key: "afterReportGenerated", label: "After promotion report is generated" },
            ] as const
          ).map((trg) => (
            <label
              key={trg.key}
              className="flex items-center gap-2.5 py-1.5 border-b border-[#F2F4FC] last:border-0 cursor-pointer dark:border-[#232746]"
            >
              <input
                type="checkbox"
                disabled={!canManageSettings}
                checked={notifications.triggers[trg.key]}
                onChange={(e) =>
                  onNotificationsChange({
                    triggers: { ...notifications.triggers, [trg.key]: e.target.checked },
                  })
                }
                className="h-4 w-4 accent-[#663CF6]"
              />
              <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{trg.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Live Template Preview + Schedule & Test Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Template Preview
            </h4>
            <select
              value={activeTemplate?.id || ""}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-8 rounded-lg border border-[#D9DEF2] bg-white px-2.5 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
            >
              {notifications.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            {(["Email", "SMS", "WhatsApp", "In-App"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setPreviewChannel(ch)}
                className={`h-7 rounded-lg px-3 text-[11px] font-bold cursor-pointer ${
                  previewChannel === ch
                    ? "bg-[#663CF6] text-white"
                    : "bg-[#F3F5FD] text-[#4D5072] dark:bg-[#10132A] dark:text-[#B4BDD9]"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[#EAEEFA] bg-[#FAF8FE] p-3.5 space-y-2 text-xs dark:border-[#272B4D] dark:bg-[#10132A]">
            <p className="font-black text-[#08093B] dark:text-[#F3F5FF]">{data.schoolName}</p>
            <p className="font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
              [{previewChannel}] Subject: {activeTemplate?.subject}
            </p>
            <p className="leading-relaxed text-[#4D5072] dark:text-[#B4BDD9]">{renderedBody}</p>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Notification Schedule &amp; Test Dispatch
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Send On</span>
              <input
                type="text"
                disabled={!canManageSettings}
                value={notifications.schedule.sendOn}
                onChange={(e) =>
                  onNotificationsChange({
                    schedule: { ...notifications.schedule, sendOn: e.target.value },
                  })
                }
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Time Slot</span>
              <input
                type="time"
                disabled={!canManageSettings}
                value={notifications.schedule.timeSlot}
                onChange={(e) =>
                  onNotificationsChange({
                    schedule: { ...notifications.schedule, timeSlot: e.target.value },
                  })
                }
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Repeat</span>
              <select
                disabled={!canManageSettings}
                value={notifications.schedule.repeat}
                onChange={(e) =>
                  onNotificationsChange({
                    schedule: {
                      ...notifications.schedule,
                      repeat: e.target.value as "ONCE" | "DAILY" | "WEEKLY",
                    },
                  })
                }
                className={INPUT_CLS}
              >
                <option value="ONCE">Once</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </label>
          </div>

          {canManageSettings && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void onSendTestNotification(
                    activeTemplate?.name || "Promotion Successful",
                    previewChannel,
                  )
                }
                className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#C4B5FD] bg-white px-4 text-xs font-bold text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:border-[#4C3D99] dark:bg-[#10132A] dark:text-[#DDD6FE]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Test {previewChannel} Notification</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {canManageSettings && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white px-4 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#2E345E] dark:bg-[#141731] dark:text-[#C5CCF0]"
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
            <span>{saving ? "Saving..." : "Save Notification Settings"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
