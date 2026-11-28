"use client";

import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Layers,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import type {
  PromotionSettingsConfig,
  PromotionSettingsSuiteConfig,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

const INPUT_CLS =
  "h-9 w-full rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

export function SettingsAcademicDefaultsTab({
  data,
  academicYear,
  settings,
  academicDefaults,
  canManageSettings,
  saving,
  onSettingsChange,
  onAcademicChange,
  onReset,
  onSave,
}: {
  data: StudentPromotionOverviewData;
  academicYear: string;
  settings: PromotionSettingsConfig;
  academicDefaults: PromotionSettingsSuiteConfig["academicDefaults"];
  canManageSettings: boolean;
  saving: boolean;
  onSettingsChange: (patch: Partial<PromotionSettingsConfig>) => void;
  onAcademicChange: (patch: Partial<PromotionSettingsSuiteConfig["academicDefaults"]>) => void;
  onReset: () => void;
  onSave: () => Promise<void>;
}) {
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [newRemarkText, setNewRemarkText] = useState("");
  const [newRemarkCategory, setNewRemarkCategory] = useState<"Promotion" | "Not Promotion">(
    "Promotion",
  );

  return (
    <div className="space-y-4">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StudentKpiCard
          label="Total Classes"
          value={data.grades.length}
          icon={<Layers className="h-5 w-5" />}
          tone="violet"
          subtitle="Active class levels"
        />
        <StudentKpiCard
          label="Total Sections"
          value={Math.max(data.sections.length, data.grades.length * data.sections.length)}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="sky"
          subtitle="Across classes"
        />
        <StudentKpiCard
          label="Configured Subjects"
          value={academicDefaults.subjects.length}
          icon={<BookOpen className="h-5 w-5" />}
          tone="emerald"
          subtitle={academicDefaults.selectedSubjectGrade}
        />
        <StudentKpiCard
          label="Academic Year"
          value={academicYear}
          icon={<Calendar className="h-5 w-5" />}
          tone="amber"
          subtitle="Default cycle"
        />
      </div>

      {/* Default Academic Configuration + Default Passing & Promotion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            Default Academic Configuration
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Academic Year</span>
              <input type="text" readOnly value={academicYear} className={`${INPUT_CLS} opacity-80`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Default Curriculum
              </span>
              <select
                disabled={!canManageSettings}
                value={academicDefaults.curriculum}
                onChange={(e) => onAcademicChange({ curriculum: e.target.value })}
                className={INPUT_CLS}
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
                <option value="IB / IGCSE">IB / IGCSE</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Default Grading System
              </span>
              <input
                type="text"
                disabled={!canManageSettings}
                value={academicDefaults.gradingSystem}
                onChange={(e) => onAcademicChange({ gradingSystem: e.target.value })}
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Exam Type</span>
              <select
                disabled={!canManageSettings}
                value={academicDefaults.examType}
                onChange={(e) => onAcademicChange({ examType: e.target.value })}
                className={INPUT_CLS}
              >
                <option value="Term Based">Term Based</option>
                <option value="Annual Exam">Annual Exam</option>
                <option value="Semester System">Semester System</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">Number of Terms</span>
              <input
                type="number"
                min={1}
                max={6}
                disabled={!canManageSettings}
                value={academicDefaults.numberOfTerms}
                onChange={(e) => onAcademicChange({ numberOfTerms: Number(e.target.value) })}
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Result Calculation
              </span>
              <select
                disabled={!canManageSettings}
                value={academicDefaults.resultCalculation}
                onChange={(e) => onAcademicChange({ resultCalculation: e.target.value })}
                className={INPUT_CLS}
              >
                <option value="Percentage (Overall)">Percentage (Overall)</option>
                <option value="CGPA Weighted">CGPA Weighted</option>
                <option value="Term Average">Term Average</option>
              </select>
            </label>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2 border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <Award className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Default Passing &amp; Promotion</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Min Passing Marks (Subject %)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canManageSettings}
                value={settings.minResultPct}
                onChange={(e) => onSettingsChange({ minResultPct: Number(e.target.value) })}
                className={INPUT_CLS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Minimum Attendance (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canManageSettings}
                value={settings.minAttendancePct}
                onChange={(e) => onSettingsChange({ minAttendancePct: Number(e.target.value) })}
                className={INPUT_CLS}
              />
            </label>
          </div>

          <div className="space-y-2 text-xs pt-1">
            {[
              {
                key: "applySameCriteriaToAllClasses" as const,
                label: "Apply Same Criteria to All Classes",
              },
              {
                key: "considerBestOfTerm" as const,
                label: "Consider Best of Term (if multiple)",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/80 px-3 py-2 cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
              >
                <span className="font-bold text-[#08093B] dark:text-[#EEF0FF]">{item.label}</span>
                <input
                  type="checkbox"
                  disabled={!canManageSettings}
                  checked={academicDefaults[item.key]}
                  onChange={(e) => onAcademicChange({ [item.key]: e.target.checked })}
                  className="h-4 w-4 accent-[#663CF6]"
                />
              </label>
            ))}

            <label className="flex flex-col gap-1 pt-1">
              <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                Calculate Attendance From
              </span>
              <select
                disabled={!canManageSettings}
                value={academicDefaults.attendanceSource}
                onChange={(e) =>
                  onAcademicChange({
                    attendanceSource: e.target.value as
                      | "ENTIRE_YEAR"
                      | "CURRENT_TERM"
                      | "LAST_90_DAYS",
                  })
                }
                className={INPUT_CLS}
              >
                <option value="ENTIRE_YEAR">Entire Academic Year</option>
                <option value="CURRENT_TERM">Current Term Only</option>
                <option value="LAST_90_DAYS">Last 90 Working Days</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Default Subjects + Term Structure & Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-6 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAEEFA] pb-2.5 dark:border-[#272B4D]">
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Default Subjects (Class-wise)
            </h4>
            <select
              value={academicDefaults.selectedSubjectGrade}
              onChange={(e) => onAcademicChange({ selectedSubjectGrade: e.target.value })}
              className="h-8 rounded-lg border border-[#D9DEF2] bg-white px-2.5 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
            >
              {data.grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 px-2">Subject Name</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2 text-right">Max / Pass</th>
                  <th className="py-2 pl-2 text-center">Included</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {academicDefaults.subjects.map((sub, idx) => (
                  <tr key={`${sub.name}-${idx}`}>
                    <td className="py-1.5 pr-2 text-[#76799C]">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {sub.name}
                    </td>
                    <td className="py-1.5 px-2 text-[#4D5072] dark:text-[#B4BDD9]">{sub.type}</td>
                    <td className="py-1.5 px-2 text-right font-semibold">
                      {sub.maxMarks} / {sub.passMarks}
                    </td>
                    <td className="py-1.5 pl-2 text-center">
                      <button
                        type="button"
                        disabled={!canManageSettings}
                        onClick={() =>
                          onAcademicChange({
                            subjects: academicDefaults.subjects.map((s, i) =>
                              i === idx ? { ...s, included: !s.included } : s,
                            ),
                          })
                        }
                        className="cursor-pointer"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            sub.included ? "text-emerald-600" : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManageSettings && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Add subject (e.g. Computer Science)"
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newSubjectName.trim()) return;
                  onAcademicChange({
                    subjects: [
                      ...academicDefaults.subjects,
                      {
                        name: newSubjectName.trim(),
                        type: "Compulsory",
                        maxMarks: 100,
                        passMarks: 33,
                        included: true,
                      },
                    ],
                  });
                  setNewSubjectName("");
                }}
                className="h-9 shrink-0 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#C4B5FD]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Default Term Structure
            </h4>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-1.5 pr-2">Term</th>
                  <th className="py-1.5 px-2 text-right">Weightage %</th>
                  <th className="py-1.5 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {academicDefaults.terms.map((t, idx) => (
                  <tr key={t.term}>
                    <td className="py-2 pr-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {t.term}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={!canManageSettings}
                        value={t.weightagePct}
                        onChange={(e) =>
                          onAcademicChange({
                            terms: academicDefaults.terms.map((item, i) =>
                              i === idx ? { ...item, weightagePct: Number(e.target.value) } : item,
                            ),
                          })
                        }
                        className="h-7 w-16 rounded-lg border border-[#D9DEF2] bg-white px-2 text-right text-xs font-bold dark:border-[#2E345E] dark:bg-[#10132A]"
                      />
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {t.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Default Assessment Types
            </h4>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-1.5 pr-2">Assessment Type</th>
                  <th className="py-1.5 px-2 text-right">Weightage %</th>
                  <th className="py-1.5 pl-2">Applicable To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {academicDefaults.assessments.map((a, idx) => (
                  <tr key={`${a.name}-${idx}`}>
                    <td className="py-1.5 pr-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {a.name}
                    </td>
                    <td className="py-1.5 px-2 text-right font-semibold">{a.weightagePct}%</td>
                    <td className="py-1.5 pl-2 text-[#4D5072] dark:text-[#B4BDD9]">
                      {a.applicableTo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canManageSettings && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAssessmentName}
                  onChange={(e) => setNewAssessmentName(e.target.value)}
                  placeholder="Add assessment (e.g. Lab Practical)"
                  className={INPUT_CLS}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAssessmentName.trim()) return;
                    onAcademicChange({
                      assessments: [
                        ...academicDefaults.assessments,
                        {
                          name: newAssessmentName.trim(),
                          weightagePct: 10,
                          applicableTo: "All Subjects",
                        },
                      ],
                    });
                    setNewAssessmentName("");
                  }}
                  className="h-9 shrink-0 rounded-xl border border-[#D9DEF2] px-3 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
                >
                  + Add Type
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Default Remark Templates */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Default Remark Templates</span>
          </h4>
        </div>
        <div className="space-y-1.5 text-xs">
          {academicDefaults.remarkTemplates.map((tpl, idx) => (
            <div
              key={`${tpl.text}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#EAEEFA] bg-[#FAF8FE]/80 px-3 py-2 dark:border-[#272B4D] dark:bg-[#10132A]"
            >
              <span className="font-semibold text-[#08093B] dark:text-[#EEF0FF]">
                {idx + 1}. {tpl.text}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    tpl.category === "Promotion"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {tpl.category}
                </span>
                {canManageSettings && (
                  <button
                    type="button"
                    onClick={() =>
                      onAcademicChange({
                        remarkTemplates: academicDefaults.remarkTemplates.filter(
                          (_, i) => i !== idx,
                        ),
                      })
                    }
                    className="text-rose-600 hover:opacity-80 cursor-pointer dark:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canManageSettings && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="text"
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              placeholder="Add custom promotion remark template..."
              className={`${INPUT_CLS} flex-1 min-w-[200px]`}
            />
            <select
              value={newRemarkCategory}
              onChange={(e) =>
                setNewRemarkCategory(e.target.value as "Promotion" | "Not Promotion")
              }
              className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
            >
              <option value="Promotion">Promotion</option>
              <option value="Not Promotion">Not Promotion</option>
            </select>
            <button
              type="button"
              onClick={() => {
                if (!newRemarkText.trim()) return;
                onAcademicChange({
                  remarkTemplates: [
                    ...academicDefaults.remarkTemplates,
                    { text: newRemarkText.trim(), category: newRemarkCategory },
                  ],
                });
                setNewRemarkText("");
              }}
              className="h-9 rounded-xl border border-[#D9DEF2] px-3.5 text-xs font-bold text-[#4F27E8] cursor-pointer dark:border-[#2E345E] dark:text-[#C4B5FD]"
            >
              + Add Template
            </button>
          </div>
        )}
      </div>

      {/* Bottom 7-column Summary Strip */}
      <div className={`${STUDENT_CARD_SURFACE} p-4`}>
        <h4 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF] mb-3">
          Academic Defaults Summary
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          {[
            { label: "Curriculum", val: academicDefaults.curriculum, icon: <BookOpen className="h-3.5 w-3.5" /> },
            { label: "Grading", val: "A+ to E", icon: <Award className="h-3.5 w-3.5" /> },
            { label: "Exam Type", val: academicDefaults.examType, icon: <ClipboardList className="h-3.5 w-3.5" /> },
            { label: "Terms", val: String(academicDefaults.numberOfTerms), icon: <Calendar className="h-3.5 w-3.5" /> },
            { label: "Promotion Pass %", val: `${settings.minResultPct}%`, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
            { label: "Min Attendance", val: `${settings.minAttendancePct}%`, icon: <Users className="h-3.5 w-3.5" /> },
            { label: `Subjects (${academicDefaults.selectedSubjectGrade})`, val: String(academicDefaults.subjects.length), icon: <Layers className="h-3.5 w-3.5" /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#EAEEFA] bg-[#FAF8FE] p-2.5 dark:border-[#272B4D] dark:bg-[#10132A]"
            >
              <div className="flex justify-center text-[#663CF6] dark:text-[#C4B5FD] mb-1">
                {stat.icon}
              </div>
              <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                {stat.label}
              </p>
              <p className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF] truncate">
                {stat.val}
              </p>
            </div>
          ))}
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
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
