"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  Info,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  DEFAULT_ADMISSION_GRADES,
  createDefaultExtendedSettings,
  mergeExtendedSettings,
  type AdmissionApprovalProcessValue,
  type AdmissionCriteriaTypeValue,
  type AdmissionCustomFieldItem,
  type AdmissionDocumentRequirementItem,
  type AdmissionExtendedSettings,
  type AdmissionModeValue,
  type AdmissionSettingRecord,
} from "@/modules/school/admissions/types";
import {
  AdmissionClasswiseFeeCard,
  AdmissionClasswiseSubjectCard,
} from "./admission-classwise-structures";

export interface AdmissionSettingsSavePayload {
  currentAcademicYear: string;
  applicationDeadline: string | null;
  applicationPrefix: string;
  enabledGrades: string[];
  extendedConfig: AdmissionExtendedSettings;
}

interface AdmissionSettingsPanelProps {
  schoolName: string;
  settings: AdmissionSettingRecord;
  canManageSettings: boolean;
  onSaveSettings: (payload: AdmissionSettingsSavePayload) => Promise<void>;
}

function SettingsToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-xs font-bold text-[#08093B] cursor-pointer dark:text-[#F3F5FF]"
        >
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] disabled:opacity-50 cursor-pointer ${
          checked
            ? "border-[#663CF6] bg-[#663CF6] dark:border-[#8B5CF6] dark:bg-[#7C3AED]"
            : "border-[#CAD0EB] bg-[#E2E8F0] dark:border-[#343B6B] dark:bg-[#232746]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#EEF1FA] pb-3 dark:border-[#232746]">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">{title}</h3>
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

/**
 * Full per-school customizable Admission Settings workbench preserving all existing
 * core configuration fields (academic year, deadline, prefix, grades open) alongside
 * mode, admission window, form toggles, required documents, approval workflow, criteria,
 * dynamic seat quotas, communication templates, and custom fields.
 */
export function AdmissionSettingsPanel({
  schoolName,
  settings,
  canManageSettings,
  onSaveSettings,
}: AdmissionSettingsPanelProps) {
  const [academicYear, setAcademicYear] = useState(settings.currentAcademicYear);
  const [deadline, setDeadline] = useState(
    settings.applicationDeadline ? settings.applicationDeadline.slice(0, 10) : "",
  );
  const [prefix, setPrefix] = useState(settings.applicationPrefix);
  const [enabledGrades, setEnabledGrades] = useState<string[]>(settings.enabledGrades);
  const [ext, setExt] = useState<AdmissionExtendedSettings>(() =>
    mergeExtendedSettings(settings.extendedConfig),
  );

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [manageDocsOpen, setManageDocsOpen] = useState(false);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);
  const [newDocLabel, setNewDocLabel] = useState("");
  const [newDocMandatory, setNewDocMandatory] = useState(true);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<AdmissionCustomFieldItem["type"]>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newCustomGrade, setNewCustomGrade] = useState("");

  const manageDocsDialogRef = useRef<HTMLDialogElement>(null);
  const customFieldsDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setAcademicYear(settings.currentAcademicYear);
    setDeadline(settings.applicationDeadline ? settings.applicationDeadline.slice(0, 10) : "");
    setPrefix(settings.applicationPrefix);
    setEnabledGrades(settings.enabledGrades);
    setExt(mergeExtendedSettings(settings.extendedConfig));
    setValidationError(null);
  }, [settings]);

  useEffect(() => {
    const dialog = manageDocsDialogRef.current;
    if (!dialog) return;
    if (manageDocsOpen) {
      if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
      else dialog.setAttribute("open", "true");
    } else if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }, [manageDocsOpen]);

  useEffect(() => {
    const dialog = customFieldsDialogRef.current;
    if (!dialog) return;
    if (customFieldsOpen) {
      if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
      else dialog.setAttribute("open", "true");
    } else if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }, [customFieldsOpen]);

  const patchExt = (patch: Partial<AdmissionExtendedSettings>) => {
    setValidationError(null);
    setExt((prev) => ({ ...prev, ...patch }));
  };

  const quotaTotalPct = useMemo(
    () => ext.quotas.reduce((sum, q) => sum + (Number.isFinite(q.percentage) ? q.percentage : 0), 0),
    [ext.quotas],
  );

  const gradeOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...DEFAULT_ADMISSION_GRADES,
        ...(ext.customGrades ?? []),
        ...enabledGrades,
        ...ext.classFeeStructures.map((c) => c.grade),
        ...ext.classSubjectStructures.map((c) => c.grade),
      ]),
    );
  }, [enabledGrades, ext.customGrades, ext.classFeeStructures, ext.classSubjectStructures]);

  const handleAddCustomGrade = () => {
    const clean = newCustomGrade.trim();
    if (!clean) return;
    const alreadyExists = gradeOptions.some((g) => g.toLowerCase() === clean.toLowerCase());
    if (!alreadyExists) {
      patchExt({ customGrades: [...(ext.customGrades ?? []), clean] });
    }
    setEnabledGrades((prev) =>
      prev.some((g) => g.toLowerCase() === clean.toLowerCase()) ? prev : [...prev, clean],
    );
    setNewCustomGrade("");
  };

  const handleRemoveCustomGrade = (grade: string) => {
    patchExt({
      customGrades: (ext.customGrades ?? []).filter((g) => g !== grade),
    });
    setEnabledGrades((prev) => prev.filter((g) => g !== grade));
  };

  const handleRangeChange = (from: string, to: string) => {
    patchExt({ gradeRangeFrom: from, gradeRangeTo: to });
    const list = [...DEFAULT_ADMISSION_GRADES] as string[];
    const fromIdx = list.indexOf(from);
    const toIdx = list.indexOf(to);
    if (fromIdx !== -1 && toIdx !== -1) {
      const lo = Math.min(fromIdx, toIdx);
      const hi = Math.max(fromIdx, toIdx);
      setEnabledGrades(list.slice(lo, hi + 1));
    }
  };

  const toggleGrade = (grade: string) => {
    setValidationError(null);
    setEnabledGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const handleToggleDocumentMandatory = (docId: string) => {
    patchExt({
      documentRequirements: ext.documentRequirements.map((doc) =>
        doc.id === docId ? { ...doc, mandatory: !doc.mandatory } : doc,
      ),
    });
  };

  const handleAddDocumentRow = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newDocLabel.trim();
    if (!label) return;
    const item: AdmissionDocumentRequirementItem = {
      id: `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      mandatory: newDocMandatory,
    };
    patchExt({ documentRequirements: [...ext.documentRequirements, item] });
    setNewDocLabel("");
    setNewDocMandatory(true);
  };

  const handleRemoveDocumentRow = (docId: string) => {
    patchExt({
      documentRequirements: ext.documentRequirements.filter((d) => d.id !== docId),
    });
  };

  const handleUpdateQuota = (quotaId: string, patch: { name?: string; percentage?: number }) => {
    patchExt({
      quotas: ext.quotas.map((q) => (q.id === quotaId ? { ...q, ...patch } : q)),
    });
  };

  const handleAddQuota = () => {
    const remaining = Math.max(0, Math.round((100 - quotaTotalPct) * 10) / 10);
    patchExt({
      quotas: [
        ...ext.quotas,
        {
          id: `quota_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          name: "Special Quota",
          percentage: remaining,
        },
      ],
    });
  };

  const handleRemoveQuota = (quotaId: string) => {
    if (ext.quotas.length <= 1) return;
    patchExt({ quotas: ext.quotas.filter((q) => q.id !== quotaId) });
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newFieldLabel.trim();
    if (!label) return;
    patchExt({
      customFields: [
        ...ext.customFields,
        {
          id: `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          label,
          type: newFieldType,
          required: newFieldRequired,
        },
      ],
    });
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
  };

  const handleRemoveCustomField = (fieldId: string) => {
    patchExt({ customFields: ext.customFields.filter((f) => f.id !== fieldId) });
  };

  const handleResetToDefault = () => {
    setValidationError(null);
    setPrefix("APP");
    setDeadline("");
    setEnabledGrades([...DEFAULT_ADMISSION_GRADES]);
    setExt(createDefaultExtendedSettings());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanPrefix = prefix.trim().toUpperCase();
    if (!/^[A-Z]{2,8}$/.test(cleanPrefix)) {
      setValidationError("Application ID Prefix must be 2–8 uppercase letters.");
      return;
    }
    if (enabledGrades.length === 0) {
      setValidationError("Select at least one grade open for admission.");
      return;
    }
    if (quotaTotalPct > 100.01) {
      setValidationError("Total seat quota percentages cannot exceed 100%.");
      return;
    }
    if (ext.maxAgeYears < ext.minAgeYears) {
      setValidationError("Maximum Age must be greater than or equal to Minimum Age.");
      return;
    }

    setSaving(true);
    try {
      await onSaveSettings({
        currentAcademicYear: academicYear.trim(),
        applicationDeadline: deadline || null,
        applicationPrefix: cleanPrefix,
        enabledGrades,
        extendedConfig: {
          ...ext,
          quotas: ext.quotas.map((q) => ({
            ...q,
            name: q.name.trim() || "Quota",
            percentage: Math.max(0, Math.min(100, Number(q.percentage) || 0)),
          })),
        },
      });
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const workflowSteps = useMemo(() => {
    if (ext.approvalProcess === "AUTO_APPROVE") {
      return [
        { num: 1, title: "Submit", actor: "(Applicant)" },
        { num: 2, title: "Auto-Verify", actor: "(System Check)" },
        { num: 3, title: "Provisional", actor: "(Instant Offer)" },
      ];
    }
    if (ext.approvalProcess === "SINGLE_LEVEL") {
      return [
        { num: 1, title: "Submit", actor: "(Applicant)" },
        { num: 2, title: "Approve", actor: "(Admission Lead)" },
      ];
    }
    return [
      { num: 1, title: "Submit", actor: "(Applicant)" },
      { num: 2, title: "Review", actor: "(Admission Team)" },
      { num: 3, title: "Approve", actor: "(Principal)" },
    ];
  }, [ext.approvalProcess]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top Section Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight dark:text-[#F3F5FF]">
            Admission Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#9DA6CC]">
            Configure admission processes, application forms, document requirements, and approval
            workflow for <strong>{schoolName}</strong>.
          </p>
        </div>

        {canManageSettings && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] disabled:opacity-50 cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset to Default</span>
            </button>
            <button
              type="submit"
              disabled={saving || enabledGrades.length === 0}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </div>

      {validationError && (
        <div
          role="alert"
          className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
        >
          {validationError}
        </div>
      )}

      {/* Main 2-Column Configuration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Admission Configuration */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<Sliders className="h-4 w-4" aria-hidden="true" />}
            title="Admission Configuration"
            subtitle="Set the core parameters for managing admissions."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="settings-admission-mode"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Admission Mode
              </label>
              <select
                id="settings-admission-mode"
                disabled={!canManageSettings}
                value={ext.admissionMode}
                onChange={(e) => patchExt({ admissionMode: e.target.value as AdmissionModeValue })}
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="ONLINE_OFFLINE">Online &amp; Offline</option>
                <option value="ONLINE_ONLY">Online Only</option>
                <option value="OFFLINE_ONLY">Offline Only</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-prefix"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Application ID Prefix <span className="text-rose-500">*</span>
              </label>
              <input
                id="settings-prefix"
                type="text"
                required
                disabled={!canManageSettings}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="APP"
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            <div>
              <label
                htmlFor="settings-ay"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Current Academic Year <span className="text-rose-500">*</span>
              </label>
              <input
                id="settings-ay"
                type="text"
                required
                disabled={!canManageSettings}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026 – 2027"
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Admission Grade Range
              </span>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Admission Grade Range From"
                  disabled={!canManageSettings}
                  value={ext.gradeRangeFrom}
                  onChange={(e) => handleRangeChange(e.target.value, ext.gradeRangeTo)}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                  to
                </span>
                <select
                  aria-label="Admission Grade Range To"
                  disabled={!canManageSettings}
                  value={ext.gradeRangeTo}
                  onChange={(e) => handleRangeChange(ext.gradeRangeFrom, e.target.value)}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preserved Existing Grades Open for Admission checkboxes */}
          <div className="pt-1">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                Grades Open for Admission ({enabledGrades.length})
              </p>
              <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                Click to customize open classes
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {gradeOptions.map((grade) => {
                const checked = enabledGrades.includes(grade);
                const isCustomGrade = !(DEFAULT_ADMISSION_GRADES as readonly string[]).includes(
                  grade,
                );
                return (
                  <div
                    key={grade}
                    className={`flex items-center justify-between gap-1 rounded-[9px] border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      checked
                        ? "border-[#663CF6] bg-[#FAF8FE] text-[#663CF6] dark:border-[#8B5CF6] dark:bg-[#231D4B] dark:text-[#D9CEFF]"
                        : "border-[#DFE3F5] bg-white text-[#4D5072] dark:border-[#2A2F58] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                    }`}
                  >
                    <label className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageSettings}
                        checked={checked}
                        onChange={() => toggleGrade(grade)}
                        className="h-3.5 w-3.5 shrink-0 accent-[#663CF6]"
                      />
                      <span className="truncate">{grade}</span>
                    </label>
                    {canManageSettings && isCustomGrade && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomGrade(grade)}
                        aria-label={`Remove custom class ${grade}`}
                        className="text-[10px] font-bold text-[#76799C] hover:text-rose-600 cursor-pointer shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {canManageSettings && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomGrade}
                  onChange={(e) => setNewCustomGrade(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomGrade();
                    }
                  }}
                  placeholder="Add custom class (e.g., Playgroup, Pre-Nursery)"
                  aria-label="Custom class name"
                  className="flex-1 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomGrade}
                  className="inline-flex items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Class</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 2. Admission Period */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
            title="Admission Period"
            subtitle="Define the admission timeline and late admission settings."
          />

          <div className="space-y-3.5">
            <SettingsToggle
              id="settings-admission-enabled"
              label="Enable Admission"
              description="Accept new admission applications for the active cycle"
              checked={ext.admissionEnabled}
              disabled={!canManageSettings}
              onChange={(v) => patchExt({ admissionEnabled: v })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="settings-start-date"
                  className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                >
                  Start Date
                </label>
                <input
                  id="settings-start-date"
                  type="date"
                  disabled={!canManageSettings}
                  value={ext.startDate || ""}
                  onChange={(e) => patchExt({ startDate: e.target.value || null })}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>

              <div>
                <label
                  htmlFor="settings-deadline"
                  className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                >
                  Application Last Date (End Date)
                </label>
                <input
                  id="settings-deadline"
                  type="date"
                  disabled={!canManageSettings}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-[#EEF1FA] space-y-3 dark:border-[#232746]">
              <SettingsToggle
                id="settings-late-admission"
                label="Late Admission"
                description="Allow submissions after End Date with optional late fee"
                checked={ext.lateAdmissionEnabled}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ lateAdmissionEnabled: v })}
              />

              <div>
                <label
                  htmlFor="settings-late-fee"
                  className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                >
                  Late Fee Amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76799C] dark:text-[#9DA6CC]">
                    ₹
                  </span>
                  <input
                    id="settings-late-fee"
                    type="number"
                    min={0}
                    max={500000}
                    disabled={!canManageSettings || !ext.lateAdmissionEnabled}
                    value={ext.lateFeeAmount}
                    onChange={(e) =>
                      patchExt({ lateFeeAmount: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white pl-7 pr-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Application Form Settings */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            title="Application Form Settings"
            subtitle="Configure how the admission form behaves for applicants."
          />

          <div className="space-y-2.5 divide-y divide-[#F1F5F9] dark:divide-[#232746]">
            <SettingsToggle
              id="settings-online-form"
              label="Enable Online Application Form"
              checked={ext.onlineFormEnabled}
              disabled={!canManageSettings}
              onChange={(v) => patchExt({ onlineFormEnabled: v })}
            />
            <div className="pt-2">
              <SettingsToggle
                id="settings-select-grade"
                label="Allow Applicant to Select Grade"
                checked={ext.allowGradeSelection}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ allowGradeSelection: v })}
              />
            </div>
            <div className="pt-2">
              <SettingsToggle
                id="settings-multi-app"
                label="Allow Multiple Applications"
                checked={ext.allowMultipleApplications}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ allowMultipleApplications: v })}
              />
            </div>
            <div className="pt-2 space-y-2.5">
              <SettingsToggle
                id="settings-app-fee-toggle"
                label="Enable Application Fee"
                checked={ext.applicationFeeEnabled}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ applicationFeeEnabled: v })}
              />
              <div>
                <label
                  htmlFor="settings-app-fee-amount"
                  className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                >
                  Application Fee Amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76799C] dark:text-[#9DA6CC]">
                    ₹
                  </span>
                  <input
                    id="settings-app-fee-amount"
                    type="number"
                    min={0}
                    max={500000}
                    disabled={!canManageSettings || !ext.applicationFeeEnabled}
                    value={ext.applicationFeeAmount}
                    onChange={(e) =>
                      patchExt({
                        applicationFeeAmount: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white pl-7 pr-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Document Requirements */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
            title="Document Requirements"
            subtitle="Set the list of documents required during admission."
            action={
              canManageSettings && (
                <button
                  type="button"
                  onClick={() => setManageDocsOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                >
                  <span>Manage Documents</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )
            }
          />

          <div className="overflow-hidden rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[11px] font-bold text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2.5 text-center">
                    #
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Document
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">
                    Mandatory
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {ext.documentRequirements.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]">
                    <td className="px-3 py-2.5 text-center font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                      {doc.label}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${doc.label} mandatory`}
                        disabled={!canManageSettings}
                        checked={doc.mandatory}
                        onChange={() => handleToggleDocumentMandatory(doc.id)}
                        className="h-4 w-4 rounded accent-[#663CF6] cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Admission Approval Workflow */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<GitBranch className="h-4 w-4" aria-hidden="true" />}
            title="Admission Approval Workflow"
            subtitle="Define the approval process for new applications."
          />

          <div>
            <label
              htmlFor="settings-approval-process"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Approval Process
            </label>
            <select
              id="settings-approval-process"
              disabled={!canManageSettings}
              value={ext.approvalProcess}
              onChange={(e) =>
                patchExt({ approvalProcess: e.target.value as AdmissionApprovalProcessValue })
              }
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="MULTI_LEVEL">Multi-Level Approval</option>
              <option value="SINGLE_LEVEL">Single-Level Approval</option>
              <option value="AUTO_APPROVE">Auto-Approve (Provisional)</option>
            </select>
          </div>

          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/80 p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {workflowSteps.map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex-1 min-w-[96px] rounded-[12px] border border-[#D6DBF0] bg-white px-2.5 py-2.5 text-center shadow-2xs dark:border-[#2E345B] dark:bg-[#141731]">
                    <span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#EDE7FF] text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      {step.num}
                    </span>
                    <p className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      {step.num}. {step.title}
                    </p>
                    <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      {step.actor}
                    </p>
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[#663CF6] dark:text-[#A78BFA]"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Admission Criteria */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            title="Admission Criteria"
            subtitle="Set eligibility criteria for admission."
          />

          <SettingsToggle
            id="settings-criteria-enabled"
            label="Apply Admission Criteria"
            checked={ext.criteriaEnabled}
            disabled={!canManageSettings}
            onChange={(v) => patchExt({ criteriaEnabled: v })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="settings-criteria-type"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Criteria Type
              </label>
              <select
                id="settings-criteria-type"
                disabled={!canManageSettings || !ext.criteriaEnabled}
                value={ext.criteriaType}
                onChange={(e) =>
                  patchExt({ criteriaType: e.target.value as AdmissionCriteriaTypeValue })
                }
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="AGE_BASED">Age Based</option>
                <option value="MERIT_BASED">Marks / Merit Based</option>
                <option value="AGE_AND_MERIT">Age &amp; Marks Combined</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-age-cutoff"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Age Cutoff Date
              </label>
              <input
                id="settings-age-cutoff"
                type="date"
                disabled={!canManageSettings || !ext.criteriaEnabled}
                value={ext.ageAsOfDate}
                onChange={(e) => patchExt({ ageAsOfDate: e.target.value })}
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            {(ext.criteriaType === "AGE_BASED" || ext.criteriaType === "AGE_AND_MERIT") && (
              <>
                <div>
                  <label
                    htmlFor="settings-min-age"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                  >
                    Minimum Age (Years)
                  </label>
                  <input
                    id="settings-min-age"
                    type="number"
                    min={0}
                    max={30}
                    disabled={!canManageSettings || !ext.criteriaEnabled}
                    value={ext.minAgeYears}
                    onChange={(e) =>
                      patchExt({ minAgeYears: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-max-age"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                  >
                    Maximum Age (Years)
                  </label>
                  <input
                    id="settings-max-age"
                    type="number"
                    min={1}
                    max={40}
                    disabled={!canManageSettings || !ext.criteriaEnabled}
                    value={ext.maxAgeYears}
                    onChange={(e) =>
                      patchExt({ maxAgeYears: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
              </>
            )}

            {(ext.criteriaType === "MERIT_BASED" || ext.criteriaType === "AGE_AND_MERIT") && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="settings-min-pct"
                  className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                >
                  Minimum Qualifying Marks (%)
                </label>
                <input
                  id="settings-min-pct"
                  type="number"
                  min={0}
                  max={100}
                  disabled={!canManageSettings || !ext.criteriaEnabled}
                  value={ext.minPercentage}
                  onChange={(e) =>
                    patchExt({
                      minPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] disabled:opacity-50 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
            )}
          </div>
        </section>

        {/* 7. Seat & Quota Settings */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            title="Seat & Quota Settings"
            subtitle="Manage total seats and quota-wise allocation."
            action={
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  quotaTotalPct > 100.01
                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    : Math.abs(quotaTotalPct - 100) < 0.1
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                Allocated: {quotaTotalPct}%
              </span>
            }
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label
              htmlFor="settings-total-seats"
              className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]"
            >
              Total Seats (Per Class)
            </label>
            <input
              id="settings-total-seats"
              type="number"
              min={1}
              max={2000}
              disabled={!canManageSettings}
              value={ext.totalSeatsPerClass}
              onChange={(e) =>
                patchExt({ totalSeatsPerClass: Math.max(1, Number(e.target.value) || 1) })
              }
              className="w-full sm:w-44 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] tabular-nums dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
              Seat Allocation (Quota)
            </p>
            <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F6F5FD] text-[11px] font-bold text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Quota Type
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Percentage
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Seats (of {ext.totalSeatsPerClass})
                    </th>
                    <th scope="col" className="w-10 px-2 py-2 text-center">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                  {ext.quotas.map((quota) => {
                    const seatCount = Math.round(
                      (ext.totalSeatsPerClass * quota.percentage) / 100,
                    );
                    return (
                      <tr key={quota.id}>
                        <td className="px-2.5 py-2">
                          <input
                            type="text"
                            aria-label={`Quota name ${quota.name}`}
                            disabled={!canManageSettings}
                            value={quota.name}
                            onChange={(e) =>
                              handleUpdateQuota(quota.id, { name: e.target.value })
                            }
                            className="w-full rounded-[8px] border border-[#DFE3F5] bg-white px-2 py-1 text-xs font-semibold text-[#08093B] dark:border-[#30365C] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                          />
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              aria-label={`${quota.name} percentage`}
                              disabled={!canManageSettings}
                              value={quota.percentage}
                              onChange={(e) =>
                                handleUpdateQuota(quota.id, {
                                  percentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                })
                              }
                              className="w-16 rounded-[8px] border border-[#DFE3F5] bg-white px-2 py-1 text-xs font-bold text-[#08093B] tabular-nums dark:border-[#30365C] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                            />
                            <span className="text-[#76799C] dark:text-[#9DA6CC]">%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                          {seatCount}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            disabled={!canManageSettings || ext.quotas.length <= 1}
                            onClick={() => handleRemoveQuota(quota.id)}
                            aria-label={`Remove ${quota.name} quota`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#76799C] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {canManageSettings && (
              <button
                type="button"
                onClick={handleAddQuota}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Quota</span>
              </button>
            )}
          </div>
        </section>

        {/* 8. Application Status & Communication */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <CardHeader
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            title="Application Status & Communication"
            subtitle="Configure notifications and communication during admission."
          />

          <div className="space-y-2 divide-y divide-[#F1F5F9] dark:divide-[#232746]">
            <SettingsToggle
              id="settings-notify-confirm"
              label="Send Application Confirmation (Email/SMS)"
              checked={ext.sendConfirmationNotification}
              disabled={!canManageSettings}
              onChange={(v) => patchExt({ sendConfirmationNotification: v })}
            />
            <div className="pt-2">
              <SettingsToggle
                id="settings-notify-verification"
                label="Send Document Verification Updates"
                checked={ext.sendVerificationUpdates}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ sendVerificationUpdates: v })}
              />
            </div>
            <div className="pt-2">
              <SettingsToggle
                id="settings-notify-approval"
                label="Notify Admission Approval/Rejection"
                checked={ext.notifyApprovalRejection}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ notifyApprovalRejection: v })}
              />
            </div>
            <div className="pt-2">
              <SettingsToggle
                id="settings-offer-letter"
                label="Enable Admission Offer Letter"
                checked={ext.enableOfferLetter}
                disabled={!canManageSettings}
                onChange={(v) => patchExt({ enableOfferLetter: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="settings-email-tpl"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Email Template
              </label>
              <select
                id="settings-email-tpl"
                disabled={!canManageSettings}
                value={ext.emailTemplate}
                onChange={(e) => patchExt({ emailTemplate: e.target.value })}
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="Admission Confirmation">Admission Confirmation</option>
                <option value="Application Received">Application Received</option>
                <option value="Document Verification Alert">Document Verification Alert</option>
                <option value="Offer Letter Dispatch">Offer Letter Dispatch</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="settings-sms-tpl"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                SMS Template
              </label>
              <select
                id="settings-sms-tpl"
                disabled={!canManageSettings}
                value={ext.smsTemplate}
                onChange={(e) => patchExt({ smsTemplate: e.target.value })}
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="Application Received">Application Received</option>
                <option value="Shortlist Alert">Shortlist Alert</option>
                <option value="Document Pending Alert">Document Pending Alert</option>
                <option value="Admission Confirmed">Admission Confirmed</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* 9. Full-Width Additional Settings Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
        <CardHeader
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          title="Additional Settings"
          subtitle="Additional configurations to enhance the admission process."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center justify-between gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                CRM Integration
              </p>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Sync admission enquiries and applications with CRM.
              </p>
            </div>
            <SettingsToggle
              id="settings-crm-toggle"
              label=""
              checked={ext.crmIntegrationEnabled}
              disabled={!canManageSettings}
              onChange={(v) => patchExt({ crmIntegrationEnabled: v })}
            />
          </div>

          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center justify-between gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Referral Code
              </p>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Allow applicants to use referral codes.
              </p>
            </div>
            <SettingsToggle
              id="settings-referral-toggle"
              label=""
              checked={ext.referralCodeEnabled}
              disabled={!canManageSettings}
              onChange={(v) => patchExt({ referralCodeEnabled: v })}
            />
          </div>

          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-3.5 flex items-center justify-between gap-3 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Custom Fields ({ext.customFields.length})
              </p>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Add additional fields to the admission form.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomFieldsOpen(true)}
              disabled={!canManageSettings}
              className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] disabled:opacity-50 cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C4B5FD]"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. Classwise Fee Structure (Fully Customizable per Class) */}
      <AdmissionClasswiseFeeCard
        gradeOptions={gradeOptions}
        enabledGrades={enabledGrades}
        ext={ext}
        canManageSettings={canManageSettings}
        onPatchExt={patchExt}
      />

      {/* 11. Classwise Subject Structure (Fully Customizable per Class & Stream) */}
      <AdmissionClasswiseSubjectCard
        gradeOptions={gradeOptions}
        enabledGrades={enabledGrades}
        ext={ext}
        canManageSettings={canManageSettings}
        onPatchExt={patchExt}
      />

      {/* Bottom Notice & Action Footer */}
      <div className="rounded-[18px] border border-[#D6DBF0] bg-white px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center gap-2 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
          <Info className="h-4 w-4 shrink-0 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
          <span>
            Changes apply to <strong>{schoolName}</strong> new admissions and applications from the{" "}
            <strong>{academicYear || settings.currentAcademicYear}</strong> academic year.
          </span>
        </div>

        {canManageSettings && (
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={saving}
              className="rounded-[10px] border border-[#CAD0EB] bg-white px-4 py-2 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] disabled:opacity-50 cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0]"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || enabledGrades.length === 0}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Manage Documents Modal */}
      <dialog
        ref={manageDocsDialogRef}
        onClose={() => setManageDocsOpen(false)}
        aria-labelledby="manage-docs-modal-title"
        className="m-auto w-[min(95vw,520px)] rounded-[20px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
      >
        <div className="flex items-center justify-between border-b border-[#DFE3F5] px-5 py-4 dark:border-[#232746]">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h3
              id="manage-docs-modal-title"
              className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]"
            >
              Manage Document Requirements
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setManageDocsOpen(false)}
            aria-label="Close document manager"
            className="rounded-full p-1 text-[#76799C] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#9DA6CC]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto school-menu-scrollbar">
            {ext.documentRequirements.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-[10px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
              >
                <span className="font-semibold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {doc.label}
                </span>
                <div className="flex items-center gap-2.5 shrink-0">
                  <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4D5072] cursor-pointer dark:text-[#9DA6CC]">
                    <input
                      type="checkbox"
                      checked={doc.mandatory}
                      onChange={() => handleToggleDocumentMandatory(doc.id)}
                      className="h-3.5 w-3.5 accent-[#663CF6]"
                    />
                    <span>Mandatory</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocumentRow(doc.id)}
                    aria-label={`Remove ${doc.label}`}
                    className="rounded p-1 text-[#76799C] hover:text-rose-600 cursor-pointer dark:text-[#9DA6CC]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#EEF1FA] dark:border-[#232746]">
            <input
              type="text"
              value={newDocLabel}
              onChange={(e) => setNewDocLabel(e.target.value)}
              placeholder="e.g., Medical Fitness Certificate"
              aria-label="New required document name"
              className="flex-1 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D5072] cursor-pointer dark:text-[#9DA6CC]">
              <input
                type="checkbox"
                checked={newDocMandatory}
                onChange={(e) => setNewDocMandatory(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#663CF6]"
              />
              <span>Mandatory</span>
            </label>
            <button
              type="button"
              onClick={handleAddDocumentRow}
              className="inline-flex items-center justify-center gap-1 rounded-[10px] bg-[#663CF6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </dialog>

      {/* Manage Custom Fields Modal */}
      <dialog
        ref={customFieldsDialogRef}
        onClose={() => setCustomFieldsOpen(false)}
        aria-labelledby="custom-fields-modal-title"
        className="m-auto w-[min(95vw,520px)] rounded-[20px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
      >
        <div className="flex items-center justify-between border-b border-[#DFE3F5] px-5 py-4 dark:border-[#232746]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h3
              id="custom-fields-modal-title"
              className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]"
            >
              Custom Admission Form Fields
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setCustomFieldsOpen(false)}
            aria-label="Close custom fields manager"
            className="rounded-full p-1 text-[#76799C] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#9DA6CC]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {ext.customFields.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-[#DFE3F5] py-5 text-center text-xs text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
              No custom fields configured for {schoolName} yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto school-menu-scrollbar">
              {ext.customFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-2 rounded-[10px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {field.label}
                    </span>{" "}
                    <span className="text-[10px] uppercase text-[#76799C] dark:text-[#9DA6CC]">
                      ({field.type}
                      {field.required ? " · Required" : ""})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(field.id)}
                    aria-label={`Remove custom field ${field.label}`}
                    className="rounded p-1 text-[#76799C] hover:text-rose-600 cursor-pointer dark:text-[#9DA6CC]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#EEF1FA] dark:border-[#232746]">
            <input
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="Field label (e.g., Bus Stop)"
              aria-label="New custom field label"
              className="sm:col-span-2 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
            <select
              aria-label="Custom field type"
              value={newFieldType}
              onChange={(e) =>
                setNewFieldType(e.target.value as AdmissionCustomFieldItem["type"])
              }
              className="rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
            </select>
            <label className="sm:col-span-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D5072] cursor-pointer dark:text-[#9DA6CC]">
              <input
                type="checkbox"
                checked={newFieldRequired}
                onChange={(e) => setNewFieldRequired(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#663CF6]"
              />
              <span>Required on admission form</span>
            </label>
            <button
              type="button"
              onClick={handleAddCustomField}
              className="inline-flex items-center justify-center gap-1 rounded-[10px] bg-[#663CF6] px-3 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Field</span>
            </button>
          </div>
        </div>
      </dialog>
    </form>
  );
}
