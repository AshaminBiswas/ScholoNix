"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  IndianRupee,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  computeClassFeeTotalsPaise,
  computeFeeItemAnnualPaise,
  type AdmissionClassFeeComponentItem,
  type AdmissionClassFeeStructureItem,
  type AdmissionClassSubjectItem,
  type AdmissionClassSubjectStructureItem,
  type AdmissionExtendedSettings,
  type AdmissionFeeBillingCycleValue,
  type AdmissionFeeFrequencyValue,
  type AdmissionSubjectCategoryValue,
} from "@/modules/school/admissions/types";

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatRupeesFromPaise(paise: number): string {
  const rupees = (Math.round(paise) || 0) / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseRupeesToPaise(raw: string): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(1_000_000_000, Math.round(num * 100));
}

const FEE_HEAD_SUGGESTIONS = [
  "Admission Fee",
  "Registration Fee",
  "Tuition Fee",
  "Annual / Development Charges",
  "Exam & Assessment Fee",
  "Computer & Lab Fee",
  "Library & Sports Fee",
  "Transport Fee",
  "Hostel Fee",
];

const SUBJECT_CATEGORY_LABELS: Record<AdmissionSubjectCategoryValue, string> = {
  CORE: "Core",
  LANGUAGE: "Language",
  ELECTIVE: "Elective",
  CO_CURRICULAR: "Co-Curricular",
  SKILL: "Skill / Lab",
};

const FEE_FREQUENCY_LABELS: Record<AdmissionFeeFrequencyValue, string> = {
  ONE_TIME: "One-Time",
  ANNUAL: "Annual",
  QUARTERLY: "Quarterly (×4)",
  MONTHLY: "Monthly (×12)",
};

function buildStarterFeeItems(grade: string): AdmissionClassFeeComponentItem[] {
  const lower = grade.toLowerCase();
  const isSenior = lower.includes("xi") || lower.includes("xii");
  const isPrimary =
    lower.includes("nursery") ||
    lower.includes("lkg") ||
    lower.includes("ukg") ||
    /\b(i|ii|iii|iv|v)\b/.test(lower);

  const tuitionMonthly = isSenior ? 5500 : isPrimary ? 3200 : 4200;
  const admissionOneTime = isSenior ? 15000 : isPrimary ? 8000 : 10000;
  const annualCharges = isSenior ? 7500 : isPrimary ? 4500 : 6000;

  return [
    {
      id: makeId("fee"),
      name: "Admission Fee",
      amountPaise: admissionOneTime * 100,
      frequency: "ONE_TIME",
      mandatory: true,
    },
    {
      id: makeId("fee"),
      name: "Tuition Fee",
      amountPaise: tuitionMonthly * 100,
      frequency: "MONTHLY",
      mandatory: true,
    },
    {
      id: makeId("fee"),
      name: "Annual / Development Charges",
      amountPaise: annualCharges * 100,
      frequency: "ANNUAL",
      mandatory: true,
    },
    {
      id: makeId("fee"),
      name: "Transport Fee",
      amountPaise: 1500 * 100,
      frequency: "MONTHLY",
      mandatory: false,
    },
  ];
}

function buildStarterSubjects(grade: string): {
  streams: string[];
  maxElectivesAllowed: number;
  subjects: AdmissionClassSubjectItem[];
} {
  const lower = grade.toLowerCase();
  if (lower.includes("nursery") || lower.includes("lkg") || lower.includes("ukg") || lower.includes("play")) {
    return {
      streams: ["Common"],
      maxElectivesAllowed: 0,
      subjects: [
        { id: makeId("sub"), name: "English Readiness", code: "ENG-EY", stream: "Common", category: "LANGUAGE", isCompulsory: true, maxMarks: 50, weeklyPeriods: 6 },
        { id: makeId("sub"), name: "Early Numeracy", code: "NUM-EY", stream: "Common", category: "CORE", isCompulsory: true, maxMarks: 50, weeklyPeriods: 6 },
        { id: makeId("sub"), name: "General Awareness", code: "GA-EY", stream: "Common", category: "CORE", isCompulsory: true, maxMarks: 50, weeklyPeriods: 4 },
        { id: makeId("sub"), name: "Art, Craft & Motor Skills", code: "ART-EY", stream: "Common", category: "CO_CURRICULAR", isCompulsory: true, maxMarks: 50, weeklyPeriods: 4 },
      ],
    };
  }

  if (lower.includes("xi") || lower.includes("xii")) {
    return {
      streams: ["Common", "Science", "Commerce", "Humanities"],
      maxElectivesAllowed: 1,
      subjects: [
        { id: makeId("sub"), name: "English Core", code: "ENG-301", stream: "Common", category: "LANGUAGE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 6 },
        { id: makeId("sub"), name: "Physics", code: "PHY-042", stream: "Science", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 7 },
        { id: makeId("sub"), name: "Chemistry", code: "CHE-043", stream: "Science", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 7 },
        { id: makeId("sub"), name: "Mathematics", code: "MAT-041", stream: "Science", category: "ELECTIVE", isCompulsory: false, maxMarks: 100, weeklyPeriods: 7 },
        { id: makeId("sub"), name: "Accountancy", code: "ACC-055", stream: "Commerce", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 7 },
        { id: makeId("sub"), name: "Business Studies", code: "BST-054", stream: "Commerce", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 6 },
        { id: makeId("sub"), name: "Economics", code: "ECO-030", stream: "Humanities", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 6 },
        { id: makeId("sub"), name: "Computer Science", code: "CS-083", stream: "Common", category: "SKILL", isCompulsory: false, maxMarks: 100, weeklyPeriods: 5 },
      ],
    };
  }

  return {
    streams: ["Common"],
    maxElectivesAllowed: 1,
    subjects: [
      { id: makeId("sub"), name: "English", code: "ENG", stream: "Common", category: "LANGUAGE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 6 },
      { id: makeId("sub"), name: "Second Language (Hindi)", code: "HIN", stream: "Common", category: "LANGUAGE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 5 },
      { id: makeId("sub"), name: "Mathematics", code: "MATH", stream: "Common", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 7 },
      { id: makeId("sub"), name: "Science", code: "SCI", stream: "Common", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 6 },
      { id: makeId("sub"), name: "Social Studies", code: "SST", stream: "Common", category: "CORE", isCompulsory: true, maxMarks: 100, weeklyPeriods: 5 },
      { id: makeId("sub"), name: "Computer & Coding", code: "COMP", stream: "Common", category: "SKILL", isCompulsory: false, maxMarks: 50, weeklyPeriods: 3 },
    ],
  };
}

interface ClasswiseSectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  viewMode: "editor" | "matrix";
  onChangeViewMode: (next: "editor" | "matrix") => void;
  configuredCount: number;
  totalGrades: number;
}

function ClasswiseSectionHeader({
  icon,
  title,
  subtitle,
  viewMode,
  onChangeViewMode,
  configuredCount,
  totalGrades,
}: ClasswiseSectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF1FA] pb-3.5 dark:border-[#232746]">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">{title}</h3>
            <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              {configuredCount}/{totalGrades} Classes Configured
            </span>
          </div>
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{subtitle}</p>
        </div>
      </div>

      <div
        role="group"
        aria-label={`${title} view mode`}
        className="inline-flex shrink-0 items-center rounded-[11px] border border-[#CAD0EB] bg-[#FAF8FE] p-0.5 dark:border-[#343B6B] dark:bg-[#10142C]"
      >
        <button
          type="button"
          onClick={() => onChangeViewMode("editor")}
          className={`rounded-[9px] px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
            viewMode === "editor"
              ? "bg-[#663CF6] text-white shadow-2xs"
              : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC] dark:hover:text-[#F3F5FF]"
          }`}
        >
          Class Editor
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode("matrix")}
          className={`rounded-[9px] px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
            viewMode === "matrix"
              ? "bg-[#663CF6] text-white shadow-2xs"
              : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC] dark:hover:text-[#F3F5FF]"
          }`}
        >
          All Classes Matrix
        </button>
      </div>
    </div>
  );
}

interface CopyToClassesPickerProps {
  sourceGrade: string;
  targetNoun: string;
  gradeOptions: string[];
  copyTargets: string[];
  onChangeTargets: (next: string[]) => void;
  onCancel: () => void;
  onApply: () => void;
}

function CopyToClassesPicker({
  sourceGrade,
  targetNoun,
  gradeOptions,
  copyTargets,
  onChangeTargets,
  onCancel,
  onApply,
}: CopyToClassesPickerProps) {
  const candidates = gradeOptions.filter((g) => g !== sourceGrade);
  return (
    <div className="rounded-[14px] border border-[#D6DBF0] bg-[#FAF8FE] p-3.5 space-y-2.5 dark:border-[#343B6B] dark:bg-[#10142C]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
          Copy {sourceGrade} {targetNoun} to selected classes:
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeTargets(candidates)}
            className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onChangeTargets([])}
            className="text-[11px] font-semibold text-[#76799C] hover:underline cursor-pointer dark:text-[#9DA6CC]"
          >
            None
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((g) => {
          const checked = copyTargets.includes(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() =>
                onChangeTargets(
                  checked ? copyTargets.filter((x) => x !== g) : [...copyTargets, g],
                )
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                checked
                  ? "border-[#663CF6] bg-[#EDE7FF] text-[#663CF6] dark:border-[#8B5CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                  : "border-[#CAD0EB] bg-white text-[#4D5072] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#9DA6CC]"
              }`}
            >
              {checked && <Check className="h-3 w-3" aria-hidden="true" />}
              <span>{g}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#CAD0EB] px-3 py-1 text-[11px] font-bold text-[#4D5072] cursor-pointer dark:border-[#343B6B] dark:text-[#C5CCF0]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={copyTargets.length === 0}
          onClick={onApply}
          className="rounded-lg bg-[#663CF6] px-3.5 py-1 text-[11px] font-bold text-white disabled:opacity-50 cursor-pointer"
        >
          Apply to {copyTargets.length} Class{copyTargets.length === 1 ? "" : "es"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * 1. CLASSWISE FEE STRUCTURE MANAGER
 * ========================================================================== */
export function AdmissionClasswiseFeeCard({
  gradeOptions,
  enabledGrades,
  ext,
  canManageSettings,
  onPatchExt,
}: {
  gradeOptions: string[];
  enabledGrades: string[];
  ext: AdmissionExtendedSettings;
  canManageSettings: boolean;
  onPatchExt: (patch: Partial<AdmissionExtendedSettings>) => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState<string>(
    enabledGrades[0] || gradeOptions[0] || "Class I",
  );
  const [viewMode, setViewMode] = useState<"editor" | "matrix">("editor");
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<string[]>([]);

  const activeGrade = gradeOptions.includes(selectedGrade)
    ? selectedGrade
    : enabledGrades[0] || gradeOptions[0] || "Class I";

  const structureByGrade = useMemo(() => {
    const map = new Map<string, AdmissionClassFeeStructureItem>();
    for (const s of ext.classFeeStructures) {
      map.set(s.grade, s);
    }
    return map;
  }, [ext.classFeeStructures]);

  const activeStructure: AdmissionClassFeeStructureItem = useMemo(() => {
    return (
      structureByGrade.get(activeGrade) ?? {
        id: `cf_${activeGrade.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        grade: activeGrade,
        billingCycle: "QUARTERLY",
        feeItems: [],
        notes: "",
      }
    );
  }, [structureByGrade, activeGrade]);

  const totals = useMemo(
    () => computeClassFeeTotalsPaise(activeStructure),
    [activeStructure],
  );

  const upsertClassFee = (nextStruct: AdmissionClassFeeStructureItem) => {
    const without = ext.classFeeStructures.filter((s) => s.grade !== nextStruct.grade);
    const shouldKeep =
      nextStruct.feeItems.length > 0 || Boolean(nextStruct.notes?.trim());
    onPatchExt({
      classFeeStructures: shouldKeep ? [...without, nextStruct] : without,
    });
  };

  const handleAddFeeHead = () => {
    upsertClassFee({
      ...activeStructure,
      feeItems: [
        ...activeStructure.feeItems,
        {
          id: makeId("fee"),
          name: "Custom Fee Head",
          amountPaise: 0,
          frequency: "ANNUAL",
          mandatory: true,
        },
      ],
    });
  };

  const handleUpdateFeeItem = (
    itemId: string,
    patch: Partial<AdmissionClassFeeComponentItem>,
  ) => {
    upsertClassFee({
      ...activeStructure,
      feeItems: activeStructure.feeItems.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  };

  const handleRemoveFeeItem = (itemId: string) => {
    upsertClassFee({
      ...activeStructure,
      feeItems: activeStructure.feeItems.filter((item) => item.id !== itemId),
    });
  };

  const handleLoadStarter = () => {
    upsertClassFee({
      ...activeStructure,
      billingCycle: "QUARTERLY",
      feeItems: buildStarterFeeItems(activeGrade),
    });
  };

  const handleClearClass = () => {
    onPatchExt({
      classFeeStructures: ext.classFeeStructures.filter((s) => s.grade !== activeGrade),
    });
  };

  const handleCopyToTargets = () => {
    if (copyTargets.length === 0) return;
    const nextMap = new Map<string, AdmissionClassFeeStructureItem>();
    for (const s of ext.classFeeStructures) {
      nextMap.set(s.grade, s);
    }
    for (const target of copyTargets) {
      if (target === activeGrade) continue;
      nextMap.set(target, {
        id: makeId("cf"),
        grade: target,
        billingCycle: activeStructure.billingCycle,
        notes: activeStructure.notes || "",
        feeItems: activeStructure.feeItems.map((item) => ({
          ...item,
          id: makeId("fee"),
        })),
      });
    }
    onPatchExt({ classFeeStructures: Array.from(nextMap.values()) });
    setCopyTargets([]);
    setCopyMenuOpen(false);
  };

  return (
    <section
      aria-label="Classwise Fee Structure"
      className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]"
    >
      <ClasswiseSectionHeader
        icon={<IndianRupee className="h-4 w-4" aria-hidden="true" />}
        title="Classwise Fee Structure"
        subtitle="Customize tuition, admission, exam, and optional fee heads individually for each class."
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        configuredCount={ext.classFeeStructures.filter((c) => c.feeItems.length > 0).length}
        totalGrades={gradeOptions.length}
      />

      {/* Auto-apply option */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE]/80 px-3.5 py-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
        <div>
          <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Auto-Apply Compulsory Class Fee on Admission
          </p>
          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Automatically initializes an admitted student&apos;s fee ledger from their class&apos;s compulsory annual total unless overridden.
          </p>
        </div>
        <button
          id="settings-auto-apply-class-fee"
          type="button"
          role="switch"
          aria-checked={ext.autoApplyClassFeeOnAdmit}
          aria-label="Auto-Apply Compulsory Class Fee on Admission"
          disabled={!canManageSettings}
          onClick={() => onPatchExt({ autoApplyClassFeeOnAdmit: !ext.autoApplyClassFeeOnAdmit })}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer disabled:opacity-50 ${
            ext.autoApplyClassFeeOnAdmit
              ? "border-[#663CF6] bg-[#663CF6] dark:border-[#8B5CF6] dark:bg-[#7C3AED]"
              : "border-[#CAD0EB] bg-[#E2E8F0] dark:border-[#343B6B] dark:bg-[#232746]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
              ext.autoApplyClassFeeOnAdmit ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {viewMode === "matrix" ? (
        <div className="overflow-x-auto rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F6F5FD] text-[11px] font-bold text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">Class</th>
                <th scope="col" className="px-3.5 py-2.5">Billing Cycle</th>
                <th scope="col" className="px-3.5 py-2.5 text-center">Fee Heads</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Compulsory / Yr</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Optional / Yr</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Max Total / Yr</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
              {gradeOptions.map((grade) => {
                const st = structureByGrade.get(grade);
                const t = computeClassFeeTotalsPaise(st);
                const isOpen = enabledGrades.includes(grade);
                return (
                  <tr key={grade} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]">
                    <td className="px-3.5 py-2.5 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      <div className="flex items-center gap-1.5">
                        <span>{grade}</span>
                        {!isOpen && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Closed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-[#4D5072] dark:text-[#9DA6CC]">
                      {st ? st.billingCycle.replace("_", "-") : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                      {st ? st.feeItems.length : 0}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">
                      {st ? formatRupeesFromPaise(t.compulsoryAnnualPaise) : "Not set"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-[#4D5072] dark:text-[#9DA6CC]">
                      {st ? formatRupeesFromPaise(t.optionalAnnualPaise) : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {st ? formatRupeesFromPaise(t.totalAnnualPaise) : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGrade(grade);
                          setViewMode("editor");
                        }}
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                      >
                        Customize
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Class Selector Strip */}
          <div>
            <p className="text-[11px] font-bold text-[#4D5072] mb-2 dark:text-[#9DA6CC]">
              Select Class to Customize Fee Structure:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gradeOptions.map((grade) => {
                const st = structureByGrade.get(grade);
                const selected = grade === activeGrade;
                const t = computeClassFeeTotalsPaise(st);
                const hasItems = Boolean(st && st.feeItems.length > 0);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(grade);
                      setCopyMenuOpen(false);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      selected
                        ? "border-[#663CF6] bg-[#663CF6] text-white shadow-xs dark:border-[#8B5CF6] dark:bg-[#7C3AED]"
                        : hasItems
                          ? "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:border-[#663CF6] dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-[#DFE3F5] bg-[#FAF8FE] text-[#4D5072] hover:border-[#663CF6] dark:border-[#2A2F58] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                    }`}
                  >
                    <span>{grade}</span>
                    {hasItems && (
                      <span
                        className={`text-[10px] font-semibold ${
                          selected ? "text-white/90" : "text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        · {formatRupeesFromPaise(t.compulsoryAnnualPaise)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Class Configuration Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div className="md:col-span-3">
              <label
                htmlFor="fee-billing-cycle"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Billing Cycle ({activeGrade})
              </label>
              <select
                id="fee-billing-cycle"
                disabled={!canManageSettings}
                value={activeStructure.billingCycle}
                onChange={(e) =>
                  upsertClassFee({
                    ...activeStructure,
                    billingCycle: e.target.value as AdmissionFeeBillingCycleValue,
                  })
                }
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
              >
                <option value="ANNUAL">Annual (Lump Sum)</option>
                <option value="TERM_WISE">Term-Wise (2 Terms)</option>
                <option value="QUARTERLY">Quarterly (4 Installments)</option>
                <option value="MONTHLY">Monthly (12 Installments)</option>
              </select>
            </div>

            <div className="md:col-span-5">
              <label
                htmlFor="fee-class-notes"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Fee Policy / Concession Notes
              </label>
              <input
                id="fee-class-notes"
                type="text"
                disabled={!canManageSettings}
                value={activeStructure.notes || ""}
                onChange={(e) =>
                  upsertClassFee({ ...activeStructure, notes: e.target.value })
                }
                maxLength={300}
                placeholder="e.g., 10% sibling concession on tuition fee"
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
              />
            </div>

            <div className="md:col-span-4 flex flex-wrap items-end justify-start md:justify-end gap-2">
              <div className="rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-right dark:border-[#2E345B] dark:bg-[#141731]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Compulsory / Yr
                </p>
                <p className="text-sm font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">
                  {formatRupeesFromPaise(totals.compulsoryAnnualPaise)}
                </p>
              </div>
              <div className="rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-right dark:border-[#2E345B] dark:bg-[#141731]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  With Optional
                </p>
                <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {formatRupeesFromPaise(totals.totalAnnualPaise)}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Heads Table */}
          <div className="overflow-x-auto rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <datalist id="scholonix-fee-head-suggestions">
              {FEE_HEAD_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[11px] font-bold text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th scope="col" className="px-3 py-2.5 min-w-[180px]">Fee Head Name</th>
                  <th scope="col" className="px-3 py-2.5 w-36">Amount (₹)</th>
                  <th scope="col" className="px-3 py-2.5 w-40">Frequency</th>
                  <th scope="col" className="px-3 py-2.5 text-center w-24">Compulsory</th>
                  <th scope="col" className="px-3 py-2.5 text-right w-32">Annual Total</th>
                  <th scope="col" className="px-3 py-2.5 text-center w-14">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {activeStructure.feeItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                    >
                      No fee heads configured for <strong>{activeGrade}</strong> yet. Add custom fee heads or load a starter template below.
                    </td>
                  </tr>
                ) : (
                  activeStructure.feeItems.map((item) => {
                    const annual = computeFeeItemAnnualPaise(item);
                    const amountRupeesValue =
                      item.amountPaise === 0 ? "0" : String(item.amountPaise / 100);
                    return (
                      <tr key={item.id} className="hover:bg-[#FAF8FE]/60 dark:hover:bg-[#1B2042]">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            list="scholonix-fee-head-suggestions"
                            aria-label={`Fee head name for ${activeGrade}`}
                            disabled={!canManageSettings}
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateFeeItem(item.id, { name: e.target.value })
                            }
                            placeholder="Fee head name"
                            className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
                              ₹
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              aria-label={`${item.name} amount in rupees`}
                              disabled={!canManageSettings}
                              value={amountRupeesValue}
                              onChange={(e) =>
                                handleUpdateFeeItem(item.id, {
                                  amountPaise: parseRupeesToPaise(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-[#CAD0EB] bg-white pl-6 pr-2 py-1.5 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            aria-label={`${item.name} frequency`}
                            disabled={!canManageSettings}
                            value={item.frequency}
                            onChange={(e) =>
                              handleUpdateFeeItem(item.id, {
                                frequency: e.target.value as AdmissionFeeFrequencyValue,
                              })
                            }
                            className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                          >
                            {(Object.keys(FEE_FREQUENCY_LABELS) as AdmissionFeeFrequencyValue[]).map(
                              (freq) => (
                                <option key={freq} value={freq}>
                                  {FEE_FREQUENCY_LABELS[freq]}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${item.name} compulsory`}
                            disabled={!canManageSettings}
                            checked={item.mandatory}
                            onChange={(e) =>
                              handleUpdateFeeItem(item.id, { mandatory: e.target.checked })
                            }
                            className="h-4 w-4 rounded accent-[#663CF6] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                          {formatRupeesFromPaise(annual)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            disabled={!canManageSettings}
                            onClick={() => handleRemoveFeeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#76799C] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Action Toolbar */}
          {canManageSettings && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddFeeHead}
                    className="inline-flex items-center gap-1 rounded-[10px] bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add Fee Head</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadStarter}
                    className="inline-flex items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Load Starter Fee Plan</span>
                  </button>
                  {activeStructure.feeItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCopyMenuOpen((o) => !o)}
                      className="inline-flex items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0]"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy to Other Classes</span>
                    </button>
                  )}
                </div>

                {activeStructure.feeItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearClass}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer dark:text-rose-400"
                  >
                    Clear {activeGrade} Fees
                  </button>
                )}
              </div>

              {copyMenuOpen && (
                <CopyToClassesPicker
                  sourceGrade={activeGrade}
                  targetNoun="fee structure"
                  gradeOptions={gradeOptions}
                  copyTargets={copyTargets}
                  onChangeTargets={setCopyTargets}
                  onCancel={() => setCopyMenuOpen(false)}
                  onApply={handleCopyToTargets}
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================================
 * 2. CLASSWISE SUBJECT STRUCTURE MANAGER
 * ========================================================================== */
export function AdmissionClasswiseSubjectCard({
  gradeOptions,
  enabledGrades,
  ext,
  canManageSettings,
  onPatchExt,
}: {
  gradeOptions: string[];
  enabledGrades: string[];
  ext: AdmissionExtendedSettings;
  canManageSettings: boolean;
  onPatchExt: (patch: Partial<AdmissionExtendedSettings>) => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState<string>(
    enabledGrades[0] || gradeOptions[0] || "Class I",
  );
  const [viewMode, setViewMode] = useState<"editor" | "matrix">("editor");
  const [streamFilter, setStreamFilter] = useState<string>("ALL");
  const [newStreamInput, setNewStreamInput] = useState("");
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<string[]>([]);

  const activeGrade = gradeOptions.includes(selectedGrade)
    ? selectedGrade
    : enabledGrades[0] || gradeOptions[0] || "Class I";

  const structureByGrade = useMemo(() => {
    const map = new Map<string, AdmissionClassSubjectStructureItem>();
    for (const s of ext.classSubjectStructures) {
      map.set(s.grade, s);
    }
    return map;
  }, [ext.classSubjectStructures]);

  const activeStructure: AdmissionClassSubjectStructureItem = useMemo(() => {
    const existing = structureByGrade.get(activeGrade);
    if (existing) {
      return {
        ...existing,
        streams: existing.streams.length > 0 ? existing.streams : ["Common"],
      };
    }
    return {
      id: `cs_${activeGrade.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      grade: activeGrade,
      streams: ["Common"],
      maxElectivesAllowed: 0,
      subjects: [],
      notes: "",
    };
  }, [structureByGrade, activeGrade]);

  const visibleSubjects = useMemo(() => {
    if (streamFilter === "ALL") return activeStructure.subjects;
    return activeStructure.subjects.filter((s) => s.stream === streamFilter);
  }, [activeStructure.subjects, streamFilter]);

  const upsertClassSubjects = (nextStruct: AdmissionClassSubjectStructureItem) => {
    const without = ext.classSubjectStructures.filter((s) => s.grade !== nextStruct.grade);
    const shouldKeep =
      nextStruct.subjects.length > 0 ||
      nextStruct.streams.length > 1 ||
      nextStruct.maxElectivesAllowed > 0 ||
      Boolean(nextStruct.notes?.trim());
    onPatchExt({
      classSubjectStructures: shouldKeep ? [...without, nextStruct] : without,
    });
  };

  const handleAddStream = () => {
    const clean = newStreamInput.trim();
    if (!clean) return;
    if (activeStructure.streams.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setNewStreamInput("");
      return;
    }
    upsertClassSubjects({
      ...activeStructure,
      streams: [...activeStructure.streams, clean],
    });
    setNewStreamInput("");
  };

  const handleRemoveStream = (streamName: string) => {
    if (activeStructure.streams.length <= 1) return;
    const fallback = activeStructure.streams.find((s) => s !== streamName) || "Common";
    upsertClassSubjects({
      ...activeStructure,
      streams: activeStructure.streams.filter((s) => s !== streamName),
      subjects: activeStructure.subjects.map((sub) =>
        sub.stream === streamName ? { ...sub, stream: fallback } : sub,
      ),
    });
    if (streamFilter === streamName) setStreamFilter("ALL");
  };

  const handleAddSubject = () => {
    const defaultStream =
      streamFilter !== "ALL" && activeStructure.streams.includes(streamFilter)
        ? streamFilter
        : activeStructure.streams[0] || "Common";
    upsertClassSubjects({
      ...activeStructure,
      subjects: [
        ...activeStructure.subjects,
        {
          id: makeId("sub"),
          name: "New Subject",
          code: "",
          stream: defaultStream,
          category: "CORE",
          isCompulsory: true,
          maxMarks: 100,
          weeklyPeriods: 5,
        },
      ],
    });
  };

  const handleUpdateSubject = (
    subjectId: string,
    patch: Partial<AdmissionClassSubjectItem>,
  ) => {
    upsertClassSubjects({
      ...activeStructure,
      subjects: activeStructure.subjects.map((s) =>
        s.id === subjectId ? { ...s, ...patch } : s,
      ),
    });
  };

  const handleRemoveSubject = (subjectId: string) => {
    upsertClassSubjects({
      ...activeStructure,
      subjects: activeStructure.subjects.filter((s) => s.id !== subjectId),
    });
  };

  const handleLoadStarter = () => {
    const starter = buildStarterSubjects(activeGrade);
    upsertClassSubjects({
      ...activeStructure,
      streams: starter.streams,
      maxElectivesAllowed: starter.maxElectivesAllowed,
      subjects: starter.subjects,
    });
    setStreamFilter("ALL");
  };

  const handleClearClass = () => {
    onPatchExt({
      classSubjectStructures: ext.classSubjectStructures.filter((s) => s.grade !== activeGrade),
    });
    setStreamFilter("ALL");
  };

  const handleCopyToTargets = () => {
    if (copyTargets.length === 0) return;
    const nextMap = new Map<string, AdmissionClassSubjectStructureItem>();
    for (const s of ext.classSubjectStructures) {
      nextMap.set(s.grade, s);
    }
    for (const target of copyTargets) {
      if (target === activeGrade) continue;
      nextMap.set(target, {
        id: makeId("cs"),
        grade: target,
        streams: [...activeStructure.streams],
        maxElectivesAllowed: activeStructure.maxElectivesAllowed,
        notes: activeStructure.notes || "",
        subjects: activeStructure.subjects.map((sub) => ({
          ...sub,
          id: makeId("sub"),
        })),
      });
    }
    onPatchExt({ classSubjectStructures: Array.from(nextMap.values()) });
    setCopyTargets([]);
    setCopyMenuOpen(false);
  };

  const totalWeeklyPeriods = activeStructure.subjects.reduce(
    (sum, s) => sum + (Number(s.weeklyPeriods) || 0),
    0,
  );
  const compulsoryCount = activeStructure.subjects.filter((s) => s.isCompulsory).length;
  const electiveCount = activeStructure.subjects.length - compulsoryCount;

  return (
    <section
      aria-label="Classwise Subject Structure"
      className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]"
    >
      <ClasswiseSectionHeader
        icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
        title="Classwise Subject Structure"
        subtitle="Define compulsory subjects, optional electives, streams/tracks, max marks, and weekly periods per class."
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        configuredCount={
          ext.classSubjectStructures.filter((c) => c.subjects.length > 0).length
        }
        totalGrades={gradeOptions.length}
      />

      {viewMode === "matrix" ? (
        <div className="overflow-x-auto rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F6F5FD] text-[11px] font-bold text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">Class</th>
                <th scope="col" className="px-3.5 py-2.5">Streams / Tracks</th>
                <th scope="col" className="px-3.5 py-2.5 text-center">Compulsory</th>
                <th scope="col" className="px-3.5 py-2.5 text-center">Electives</th>
                <th scope="col" className="px-3.5 py-2.5 text-center">Max Electives</th>
                <th scope="col" className="px-3.5 py-2.5 text-center">Periods / Wk</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
              {gradeOptions.map((grade) => {
                const st = structureByGrade.get(grade);
                const comp = st ? st.subjects.filter((s) => s.isCompulsory).length : 0;
                const elec = st ? st.subjects.length - comp : 0;
                const periods = st
                  ? st.subjects.reduce((acc, s) => acc + (s.weeklyPeriods || 0), 0)
                  : 0;
                return (
                  <tr key={grade} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]">
                    <td className="px-3.5 py-2.5 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {grade}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#4D5072] dark:text-[#9DA6CC]">
                      {st && st.streams.length > 0 ? st.streams.join(", ") : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {st ? comp : "Not set"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-[#4D5072] dark:text-[#9DA6CC]">
                      {st ? elec : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-[#4D5072] dark:text-[#9DA6CC]">
                      {st ? st.maxElectivesAllowed : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-semibold text-[#663CF6] dark:text-[#C4B5FD]">
                      {st ? periods : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGrade(grade);
                          setStreamFilter("ALL");
                          setViewMode("editor");
                        }}
                        className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                      >
                        Customize
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Class Selector Strip */}
          <div>
            <p className="text-[11px] font-bold text-[#4D5072] mb-2 dark:text-[#9DA6CC]">
              Select Class to Customize Subject Structure:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gradeOptions.map((grade) => {
                const st = structureByGrade.get(grade);
                const selected = grade === activeGrade;
                const count = st?.subjects.length ?? 0;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(grade);
                      setStreamFilter("ALL");
                      setCopyMenuOpen(false);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      selected
                        ? "border-[#663CF6] bg-[#663CF6] text-white shadow-xs dark:border-[#8B5CF6] dark:bg-[#7C3AED]"
                        : count > 0
                          ? "border-[#C4B5FD] bg-[#EDE7FF]/70 text-[#5B21B6] hover:border-[#663CF6] dark:border-[#4D3B94] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                          : "border-[#DFE3F5] bg-[#FAF8FE] text-[#4D5072] hover:border-[#663CF6] dark:border-[#2A2F58] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                    }`}
                  >
                    <span>{grade}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-semibold ${
                          selected ? "text-white/90" : "text-[#663CF6] dark:text-[#CBB8FF]"
                        }`}
                      >
                        · {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Streams, Electives & Summary Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div className="lg:col-span-6 space-y-2">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                Streams / Academic Tracks ({activeGrade})
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeStructure.streams.map((streamName) => (
                  <span
                    key={streamName}
                    className="inline-flex items-center gap-1 rounded-full border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                  >
                    <Layers className="h-3 w-3 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                    <span>{streamName}</span>
                    {canManageSettings && activeStructure.streams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStream(streamName)}
                        aria-label={`Remove stream ${streamName}`}
                        className="ml-0.5 text-[#76799C] hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {canManageSettings && (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newStreamInput}
                      onChange={(e) => setNewStreamInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStream();
                        }
                      }}
                      placeholder="Add stream (e.g., Science)"
                      aria-label="New stream name"
                      className="w-40 rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddStream}
                      className="inline-flex items-center gap-0.5 rounded-lg bg-[#663CF6] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      <span>Add</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="subjects-max-electives"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Max Electives
              </label>
              <input
                id="subjects-max-electives"
                type="number"
                min={0}
                max={20}
                disabled={!canManageSettings}
                value={activeStructure.maxElectivesAllowed}
                onChange={(e) =>
                  upsertClassSubjects({
                    ...activeStructure,
                    maxElectivesAllowed: Math.max(
                      0,
                      Math.min(20, Math.round(Number(e.target.value) || 0)),
                    ),
                  })
                }
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
              />
            </div>

            <div className="lg:col-span-4 flex flex-wrap items-end justify-start lg:justify-end gap-2">
              <div className="rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-center dark:border-[#2E345B] dark:bg-[#141731]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Compulsory
                </p>
                <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {compulsoryCount}
                </p>
              </div>
              <div className="rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-center dark:border-[#2E345B] dark:bg-[#141731]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Electives
                </p>
                <p className="text-sm font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">
                  {electiveCount}
                </p>
              </div>
              <div className="rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-center dark:border-[#2E345B] dark:bg-[#141731]">
                <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Periods / Wk
                </p>
                <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {totalWeeklyPeriods}
                </p>
              </div>
            </div>
          </div>

          {/* Stream Filter Pills when multiple streams configured */}
          {activeStructure.streams.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#76799C] mr-1 dark:text-[#9DA6CC]">
                Filter by Stream:
              </span>
              {["ALL", ...activeStructure.streams].map((stName) => (
                <button
                  key={stName}
                  type="button"
                  onClick={() => setStreamFilter(stName)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition ${
                    streamFilter === stName
                      ? "bg-[#663CF6] text-white"
                      : "bg-[#FAF8FE] text-[#4D5072] border border-[#DFE3F5] dark:bg-[#10142C] dark:text-[#9DA6CC] dark:border-[#2A2F58]"
                  }`}
                >
                  {stName === "ALL" ? "All Streams" : stName}
                </button>
              ))}
            </div>
          )}

          {/* Subjects Table */}
          <div className="overflow-x-auto rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[11px] font-bold text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th scope="col" className="px-3 py-2.5 min-w-[170px]">Subject Name</th>
                  <th scope="col" className="px-3 py-2.5 w-28">Code</th>
                  <th scope="col" className="px-3 py-2.5 w-36">Stream / Track</th>
                  <th scope="col" className="px-3 py-2.5 w-36">Category</th>
                  <th scope="col" className="px-3 py-2.5 text-center w-24">Compulsory</th>
                  <th scope="col" className="px-3 py-2.5 w-24">Max Marks</th>
                  <th scope="col" className="px-3 py-2.5 w-24">Periods/Wk</th>
                  <th scope="col" className="px-3 py-2.5 text-center w-14">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {visibleSubjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                    >
                      No subjects configured for <strong>{activeGrade}</strong>
                      {streamFilter !== "ALL" ? ` (${streamFilter})` : ""} yet. Add custom subjects or load a starter curriculum below.
                    </td>
                  </tr>
                ) : (
                  visibleSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#FAF8FE]/60 dark:hover:bg-[#1B2042]">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          aria-label={`Subject name in ${activeGrade}`}
                          disabled={!canManageSettings}
                          value={sub.name}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, { name: e.target.value })
                          }
                          placeholder="Subject name"
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          aria-label={`${sub.name} subject code`}
                          disabled={!canManageSettings}
                          value={sub.code}
                          maxLength={24}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, {
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="ENG-101"
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`${sub.name} stream`}
                          disabled={!canManageSettings}
                          value={sub.stream}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, { stream: e.target.value })
                          }
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                        >
                          {activeStructure.streams.map((stName) => (
                            <option key={stName} value={stName}>
                              {stName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`${sub.name} category`}
                          disabled={!canManageSettings}
                          value={sub.category}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, {
                              category: e.target.value as AdmissionSubjectCategoryValue,
                            })
                          }
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                        >
                          {(Object.keys(SUBJECT_CATEGORY_LABELS) as AdmissionSubjectCategoryValue[]).map(
                            (cat) => (
                              <option key={cat} value={cat}>
                                {SUBJECT_CATEGORY_LABELS[cat]}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${sub.name} compulsory`}
                          disabled={!canManageSettings}
                          checked={sub.isCompulsory}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, { isCompulsory: e.target.checked })
                          }
                          className="h-4 w-4 rounded accent-[#663CF6] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          aria-label={`${sub.name} max marks`}
                          disabled={!canManageSettings}
                          value={sub.maxMarks}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, {
                              maxMarks: Math.max(0, Math.min(1000, Math.round(Number(e.target.value) || 0))),
                            })
                          }
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          aria-label={`${sub.name} weekly periods`}
                          disabled={!canManageSettings}
                          value={sub.weeklyPeriods}
                          onChange={(e) =>
                            handleUpdateSubject(sub.id, {
                              weeklyPeriods: Math.max(0, Math.min(60, Math.round(Number(e.target.value) || 0))),
                            })
                          }
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          disabled={!canManageSettings}
                          onClick={() => handleRemoveSubject(sub.id)}
                          aria-label={`Remove subject ${sub.name}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#76799C] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Notes + Action Toolbar */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="subjects-class-notes"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Curriculum &amp; Elective Notes ({activeGrade})
              </label>
              <input
                id="subjects-class-notes"
                type="text"
                disabled={!canManageSettings}
                value={activeStructure.notes || ""}
                onChange={(e) =>
                  upsertClassSubjects({ ...activeStructure, notes: e.target.value })
                }
                maxLength={300}
                placeholder="e.g., Students select 1 elective from Skill or Language track during admission"
                className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            {canManageSettings && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="inline-flex items-center gap-1 rounded-[10px] bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add Subject</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadStarter}
                      className="inline-flex items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Load Starter Subjects</span>
                    </button>
                    {activeStructure.subjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCopyMenuOpen((o) => !o)}
                        className="inline-flex items-center gap-1 rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0]"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy to Other Classes</span>
                      </button>
                    )}
                  </div>

                  {activeStructure.subjects.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearClass}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer dark:text-rose-400"
                    >
                      Clear {activeGrade} Subjects
                    </button>
                  )}
                </div>

                {copyMenuOpen && (
                  <CopyToClassesPicker
                    sourceGrade={activeGrade}
                    targetNoun="subject structure"
                    gradeOptions={gradeOptions}
                    copyTargets={copyTargets}
                    onChangeTargets={setCopyTargets}
                    onCancel={() => setCopyMenuOpen(false)}
                    onApply={handleCopyToTargets}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
