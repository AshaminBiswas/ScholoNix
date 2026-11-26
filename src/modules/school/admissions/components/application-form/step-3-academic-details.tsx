"use client";

import React from "react";
import {
  GraduationCap,
  Info,
  Droplet,
  FileText,
  School,
  ClipboardCheck,
  BarChart3,
  Plus,
  Trash2,
  Users,
  Award,
  CreditCard,
} from "lucide-react";
import type {
  AdmissionDocumentType,
  AdmissionPreviousAcademicRow,
  AdmissionUploadedDocument,
} from "@/modules/school/admissions/types";
import { DocumentUploadBox } from "./document-upload-box";
import {
  BLOOD_GROUP_OPTIONS,
  BOARD_CURRICULUM_OPTIONS,
  computePercentageString,
  type ApplicationWizardFormState,
} from "./wizard-types";

interface Step3AcademicDetailsProps {
  schoolName: string;
  schoolSlug: string;
  state: ApplicationWizardFormState;
  availableGrades: string[];
  availableAcademicYears: string[];
  onChange: (patch: Partial<ApplicationWizardFormState>) => void;
  onPreviewDoc: (doc: AdmissionUploadedDocument) => void;
}

export function Step3AcademicDetails({
  schoolName,
  schoolSlug,
  state,
  availableGrades,
  availableAcademicYears,
  onChange,
  onPreviewDoc,
}: Step3AcademicDetailsProps) {
  const inputClass =
    "w-full rounded-[11px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-medium text-[#08093B] placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#EDE7FF] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD] dark:focus:border-[#8B5CF6]";

  const setDoc = (docType: AdmissionDocumentType, doc: AdmissionUploadedDocument) => {
    onChange({
      uploadedDocuments: {
        ...state.uploadedDocuments,
        [docType]: doc,
      },
    });
  };

  const removeDoc = (docType: AdmissionDocumentType) => {
    const nextDocs = { ...state.uploadedDocuments };
    delete nextDocs[docType];
    onChange({ uploadedDocuments: nextDocs });
  };

  const handleAddPreviousYear = () => {
    const newRow: AdmissionPreviousAcademicRow = {
      id: `prev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      academicYear: availableAcademicYears[0] || "2024 – 2025",
      standard: availableGrades[0] || "Class IV",
      marksObtained: 0,
      totalMarks: 500,
      percentage: 0,
    };
    onChange({
      previousAcademics: [...state.previousAcademics, newRow],
    });
  };

  const handleUpdatePreviousRow = (
    rowId: string,
    patch: Partial<AdmissionPreviousAcademicRow>,
  ) => {
    onChange({
      previousAcademics: state.previousAcademics.map((row) => {
        if (row.id !== rowId) return row;
        const merged = { ...row, ...patch };
        const pct =
          merged.totalMarks > 0
            ? Math.round((merged.marksObtained / merged.totalMarks) * 1000) / 10
            : 0;
        return { ...merged, percentage: pct };
      }),
    });
  };

  const handleDeletePreviousRow = (rowId: string) => {
    onChange({
      previousAcademics: state.previousAcademics.filter((row) => row.id !== rowId),
    });
  };

  const lastStandardPercentage = computePercentageString(state.marksObtained, state.totalMarks);
  const currentYear = new Date().getFullYear();
  const completionYears = Array.from({ length: 10 }, (_, idx) => String(currentYear - idx));

  return (
    <div className="space-y-4">
      {/* Admission Type Selector */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
          <div>
            <h3 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Admission Type <span className="text-rose-500">*</span>
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Select the type of admission for this application.
            </p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Admission Type" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            role="radio"
            aria-checked={state.admissionType === "FRESH"}
            onClick={() => onChange({ admissionType: "FRESH" })}
            className={`flex items-start gap-3 rounded-[14px] border p-3.5 text-left transition cursor-pointer ${
              state.admissionType === "FRESH"
                ? "border-[#663CF6] bg-[#FAF8FE] ring-2 ring-[#EDE7FF] dark:border-[#8B5CF6] dark:bg-[#1D1840] dark:ring-[#8B5CF6]/25"
                : "border-[#DFE3F5] bg-white hover:border-[#9B76FF] dark:border-[#2A2F58] dark:bg-[#10142C]"
            }`}
          >
            <span
              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                state.admissionType === "FRESH"
                  ? "border-[#663CF6] bg-[#663CF6]"
                  : "border-[#CAD0EB] dark:border-[#343B6B]"
              }`}
            >
              {state.admissionType === "FRESH" && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <span className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Fresh Admission
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  New Student
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                First-time admission to {schoolName}.
              </p>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={state.admissionType === "TRANSFER"}
            onClick={() => onChange({ admissionType: "TRANSFER" })}
            className={`flex items-start gap-3 rounded-[14px] border p-3.5 text-left transition cursor-pointer ${
              state.admissionType === "TRANSFER"
                ? "border-[#663CF6] bg-[#FAF8FE] ring-2 ring-[#EDE7FF] dark:border-[#8B5CF6] dark:bg-[#1D1840] dark:ring-[#8B5CF6]/25"
                : "border-[#DFE3F5] bg-white hover:border-[#9B76FF] dark:border-[#2A2F58] dark:bg-[#10142C]"
            }`}
          >
            <span
              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                state.admissionType === "TRANSFER"
                  ? "border-[#663CF6] bg-[#663CF6]"
                  : "border-[#CAD0EB] dark:border-[#343B6B]"
              }`}
            >
              {state.admissionType === "TRANSFER" && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <School className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <span className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Admission (Transfer)
                </span>
                <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  From Another School
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                Admission from another school (with transfer certificate).
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Conditional Content */}
      {state.admissionType === "FRESH" ? (
        <section className="overflow-hidden rounded-[20px] border border-[#D6DBF0] bg-white shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="bg-gradient-to-r from-[#663CF6] via-[#7C5CFF] to-[#93C5FD] px-5 py-3.5 text-white dark:from-[#4F27E8] dark:via-[#663CF6] dark:to-[#3B82F6]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/15">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Required Documents &amp; Basic Information
                </h3>
                <p className="text-[11px] text-white/90">
                  For Fresh Admission, please provide the essential identity documents of the student.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 rounded-[12px] border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200">
              <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Note:</strong> Academic details (previous school, marks, etc.) are not required for Fresh Admission.
              </span>
            </div>

            {/* Student Identity Information (Blood Group) */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Student Identity Information
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Provide the student&apos;s essential identity details.
                  </p>
                </div>
              </div>

              <div className="max-w-xs">
                <label
                  htmlFor="wiz-blood-group"
                  className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                >
                  Blood Group <span className="font-medium text-[#76799C]">(Optional)</span>
                </label>
                <select
                  id="wiz-blood-group"
                  value={state.bloodGroup}
                  onChange={(e) => onChange({ bloodGroup: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUP_OPTIONS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Identity & Essential Documents */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Identity &amp; Essential Documents
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Upload the following mandatory documents for verification.
                  </p>
                </div>
              </div>

              {/* Parent Aadhaar Card(s) */}
              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Parent Aadhaar Card(s) <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Upload Aadhaar card(s) of at least one parent/guardian (both parents, if available).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="father_aadhaar"
                    label="Father's Aadhaar Card"
                    compactTitle="Father's Aadhaar"
                    value={state.uploadedDocuments.father_aadhaar}
                    onUploaded={(doc) => setDoc("father_aadhaar", doc)}
                    onRemoved={() => removeDoc("father_aadhaar")}
                    onPreview={onPreviewDoc}
                  />
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="mother_aadhaar"
                    label="Mother's Aadhaar Card"
                    compactTitle="Mother's Aadhaar"
                    value={state.uploadedDocuments.mother_aadhaar}
                    onUploaded={(doc) => setDoc("mother_aadhaar", doc)}
                    onRemoved={() => removeDoc("mother_aadhaar")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>

              {/* Birth Certificate */}
              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-6 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Birth Certificate <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Student&apos;s birth certificate (issued by the competent authority).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="birth_certificate"
                    label="Birth Certificate"
                    value={state.uploadedDocuments.birth_certificate}
                    onUploaded={(doc) => setDoc("birth_certificate", doc)}
                    onRemoved={() => removeDoc("birth_certificate")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>

              {/* Student Aadhaar Card */}
              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-6 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Aadhaar Card <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Student&apos;s Aadhaar Card (front side or both sides in a single file).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="student_aadhaar"
                    label="Student's Aadhaar Card"
                    value={state.uploadedDocuments.student_aadhaar}
                    onUploaded={(doc) => setDoc("student_aadhaar", doc)}
                    onRemoved={() => removeDoc("student_aadhaar")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[20px] border border-[#D6DBF0] bg-white shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="bg-gradient-to-r from-[#663CF6] via-[#7C5CFF] to-[#93C5FD] px-5 py-3.5 text-white dark:from-[#4F27E8] dark:via-[#663CF6] dark:to-[#3B82F6]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/15">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Academic Details – Transfer Admission
                </h3>
                <p className="text-[11px] text-white/90">
                  Provide the student&apos;s previous academic information, last standard marks and required documents.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Previous Academic Details */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Previous Academic Details
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Enter details of the school last attended.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="wiz-prev-school" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Previous School Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="wiz-prev-school"
                    type="text"
                    value={state.previousSchoolName}
                    onChange={(e) => onChange({ previousSchoolName: e.target.value })}
                    placeholder="Enter previous school name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wiz-prev-board" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Board / Curriculum <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="wiz-prev-board"
                    value={state.boardCurriculum}
                    onChange={(e) => onChange({ boardCurriculum: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select board / curriculum</option>
                    {BOARD_CURRICULUM_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wiz-last-std" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Last Standard Studied <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="wiz-last-std"
                    value={state.lastStandardStudied}
                    onChange={(e) => onChange({ lastStandardStudied: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select last standard</option>
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wiz-year-comp" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Year of Completion <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="wiz-year-comp"
                    value={state.yearOfCompletion}
                    onChange={(e) => onChange({ yearOfCompletion: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select year</option>
                    {completionYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wiz-prev-addr" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    School Address <span className="font-medium text-[#76799C]">(Optional)</span>
                  </label>
                  <input
                    id="wiz-prev-addr"
                    type="text"
                    value={state.previousSchoolAddress}
                    onChange={(e) => onChange({ previousSchoolAddress: e.target.value })}
                    placeholder="Enter previous school address"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Last Standard Marks */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Last Standard Marks
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Enter the final examination marks/percentage of the last completed standard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="wiz-total-marks" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Total Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="wiz-total-marks"
                    type="number"
                    min="1"
                    step="0.01"
                    value={state.totalMarks}
                    onChange={(e) => onChange({ totalMarks: e.target.value })}
                    placeholder="Enter total marks"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wiz-marks-obtained" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Marks Obtained <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="wiz-marks-obtained"
                    type="number"
                    min="0"
                    step="0.01"
                    value={state.marksObtained}
                    onChange={(e) => onChange({ marksObtained: e.target.value })}
                    placeholder="Enter marks obtained"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wiz-percentage" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Percentage <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="wiz-percentage"
                    type="text"
                    readOnly
                    value={lastStandardPercentage}
                    className="w-full rounded-[11px] border border-[#CAD0EB] bg-[#EDE7FF]/60 px-3 py-2 text-xs font-extrabold text-[#4F27E8] dark:border-[#343B6B] dark:bg-[#1E1A40] dark:text-[#CBB8FF]"
                  />
                </div>
              </div>
            </div>

            {/* Previous Academics (2-3 Years) */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Previous Academics{" "}
                      <span className="font-medium text-[#76799C]">(Previous 2–3 Years)</span>
                    </h4>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Provide academic performance details of the last attended school (optional).
                    </p>
                  </div>
                </div>
              </div>

              {state.previousAcademics.length > 0 && (
                <div className="overflow-x-auto school-menu-scrollbar rounded-[12px] border border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#141731]">
                  <table className="w-full min-w-[560px] text-left text-xs border-collapse">
                    <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                      <tr>
                        <th className="px-3 py-2">Academic Year</th>
                        <th className="px-3 py-2">Standard / Class</th>
                        <th className="px-3 py-2">Marks Obtained</th>
                        <th className="px-3 py-2">Total Marks</th>
                        <th className="px-3 py-2">Percentage</th>
                        <th className="px-2 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                      {state.previousAcademics.map((row) => (
                        <tr key={row.id}>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              aria-label="Previous academic year"
                              value={row.academicYear}
                              onChange={(e) =>
                                handleUpdatePreviousRow(row.id, { academicYear: e.target.value })
                              }
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              aria-label="Previous standard"
                              value={row.standard}
                              onChange={(e) =>
                                handleUpdatePreviousRow(row.id, { standard: e.target.value })
                              }
                              className={inputClass}
                            >
                              {availableGrades.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              aria-label="Previous marks obtained"
                              value={row.marksObtained}
                              onChange={(e) =>
                                handleUpdatePreviousRow(row.id, {
                                  marksObtained: Number(e.target.value) || 0,
                                })
                              }
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="1"
                              aria-label="Previous total marks"
                              value={row.totalMarks}
                              onChange={(e) =>
                                handleUpdatePreviousRow(row.id, {
                                  totalMarks: Number(e.target.value) || 0,
                                })
                              }
                              className={inputClass}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <span className="inline-block rounded-[8px] bg-[#EDE7FF] px-2.5 py-1.5 font-extrabold text-[#4F27E8] tabular-nums dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                              {row.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              aria-label="Delete previous academic row"
                              onClick={() => handleDeletePreviousRow(row.id)}
                              className="rounded-[8px] p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddPreviousYear}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#A78BFA]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Previous Year</span>
              </button>
            </div>

            {/* Identity & Mandatory Documents */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Identity &amp; Mandatory Documents
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Upload the following documents for verification.
                  </p>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-6 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Aadhaar Card (Student) <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Student&apos;s Aadhaar Card (front side or both sides in a single file).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="student_aadhaar"
                    label="Student's Aadhaar Card"
                    value={state.uploadedDocuments.student_aadhaar}
                    onUploaded={(doc) => setDoc("student_aadhaar", doc)}
                    onRemoved={() => removeDoc("student_aadhaar")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>

              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-6 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <Award className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Last Passing Marksheet <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Marksheet of the last completed standard (issued by the previous school).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="last_marksheet"
                    label="Last Passing Marksheet"
                    value={state.uploadedDocuments.last_marksheet}
                    onUploaded={(doc) => setDoc("last_marksheet", doc)}
                    onRemoved={() => removeDoc("last_marksheet")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>

              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-6 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Birth Certificate (Date of Birth) <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Student&apos;s birth certificate (issued by the competent authority).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="birth_certificate"
                    label="Birth Certificate"
                    value={state.uploadedDocuments.birth_certificate}
                    onUploaded={(doc) => setDoc("birth_certificate", doc)}
                    onRemoved={() => removeDoc("birth_certificate")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>

              <div className="rounded-[14px] border border-[#DFE3F5] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="md:col-span-5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Parent/Guardian Aadhaar Card(s) <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      Upload Aadhaar card(s) of at least one parent/guardian (both parents, if available).
                    </p>
                  </div>
                </div>
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="father_aadhaar"
                    label="Father's Aadhaar Card"
                    compactTitle="Father's Aadhaar"
                    value={state.uploadedDocuments.father_aadhaar}
                    onUploaded={(doc) => setDoc("father_aadhaar", doc)}
                    onRemoved={() => removeDoc("father_aadhaar")}
                    onPreview={onPreviewDoc}
                  />
                  <DocumentUploadBox
                    schoolSlug={schoolSlug}
                    docType="mother_aadhaar"
                    label="Mother's Aadhaar Card"
                    compactTitle="Mother's Aadhaar"
                    value={state.uploadedDocuments.mother_aadhaar}
                    onUploaded={(doc) => setDoc("mother_aadhaar", doc)}
                    onRemoved={() => removeDoc("mother_aadhaar")}
                    onPreview={onPreviewDoc}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
