"use client";

import React, { useState } from "react";
import { Loader2, Printer, Upload, X } from "lucide-react";
import type { StudentRecord, StudentSettingRecord } from "@/modules/students/types";

export function AddEditStudentModal({
  open,
  mode,
  initialStudent,
  academicYears,
  grades,
  sections,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialStudent?: StudentRecord | null;
  academicYears: string[];
  grades: string[];
  sections: string[];
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [studentName, setStudentName] = useState(initialStudent?.studentName || "");
  const [admissionNumber, setAdmissionNumber] = useState(initialStudent?.admissionNumber || "");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">(
    (initialStudent?.gender as "Male" | "Female" | "Other") || "Male",
  );
  const [dateOfBirth, setDateOfBirth] = useState(initialStudent?.dateOfBirth || "");
  const [bloodGroup, setBloodGroup] = useState(initialStudent?.bloodGroup || "");
  const [academicYear, setAcademicYear] = useState(
    initialStudent?.currentAcademicYear || academicYears[0] || "2025 – 2026",
  );
  const [grade, setGrade] = useState(initialStudent?.currentGrade || grades[0] || "Class I");
  const [section, setSection] = useState(initialStudent?.currentSection || sections[0] || "A");
  const [rollNumber, setRollNumber] = useState(initialStudent?.currentRollNumber || "");
  const [admissionDate, setAdmissionDate] = useState(
    initialStudent?.admissionDate
      ? initialStudent.admissionDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [guardianName, setGuardianName] = useState(initialStudent?.guardianName || "");
  const [guardianRelation, setGuardianRelation] = useState(
    initialStudent?.guardianRelation || "Parent",
  );
  const [guardianPhone, setGuardianPhone] = useState(initialStudent?.guardianPhone || "");
  const [guardianEmail, setGuardianEmail] = useState(initialStudent?.guardianEmail || "");
  const [email, setEmail] = useState(initialStudent?.email || "");
  const [phone, setPhone] = useState(initialStudent?.phone || "");
  const [previousSchool, setPreviousSchool] = useState(initialStudent?.previousSchool || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const inputCls =
    "w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await onSubmit({
        ...(mode === "edit" && initialStudent ? { studentId: initialStudent.id } : {}),
        studentName,
        ...(mode === "create" && admissionNumber.trim() ? { admissionNumber } : {}),
        gender,
        dateOfBirth: dateOfBirth || null,
        bloodGroup: bloodGroup || null,
        academicYear,
        grade,
        section,
        rollNumber: rollNumber || null,
        ...(mode === "create" ? { admissionDate } : {}),
        guardianName,
        guardianRelation,
        guardianPhone,
        guardianEmail: guardianEmail || null,
        email: email || null,
        phone: phone || null,
        previousSchool: previousSchool || null,
      });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Unable to save student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Add New Student" : "Edit Student Profile"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-2xl space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EEF1FA] pb-3 dark:border-[#232746]">
          <div>
            <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
              {mode === "create" ? "Add New Student" : `Edit ${initialStudent?.studentName}`}
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Manage student profile, class section placement, and primary guardian details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student modal"
            className="rounded-lg p-1.5 text-[#4D5072] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#C5CCF0] dark:hover:bg-[#1B1F3F]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            {err}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold mb-1">Student Full Name *</label>
              <input
                required
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Admission No.</label>
              <input
                type="text"
                disabled={mode === "edit"}
                placeholder="Auto-generated if blank"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other")}
                className={inputCls}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Blood Group</label>
              <input
                type="text"
                placeholder="e.g. O+"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">Academic Year *</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className={inputCls}
              >
                {academicYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Grade / Class *</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className={inputCls}
              >
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Section *</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className={inputCls}
              >
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">Roll Number</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Admission Date</label>
              <input
                type="date"
                disabled={mode === "edit"}
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Previous School</label>
              <input
                type="text"
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">Guardian Name *</label>
              <input
                required
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Relationship</label>
              <input
                type="text"
                value={guardianRelation}
                onChange={(e) => setGuardianRelation(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Guardian Phone *</label>
              <input
                required
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">Guardian Email</label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Student Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Student Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EEF1FA] dark:border-[#232746]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-[#D6DBF0] px-4 py-2 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#343B6B] dark:text-[#C5CCF0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#8B5CF6] to-[#663CF6] px-4 py-2 text-xs font-extrabold text-white cursor-pointer disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{mode === "create" ? "Add Student" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ImportStudentsModal({
  open,
  academicYear,
  onClose,
  onImport,
}: {
  open: boolean;
  academicYear: string;
  onClose: () => void;
  onImport: (rows: Array<Record<string, unknown>>) => Promise<void>;
}) {
  const [csvText, setCsvText] = useState(
    "studentName,grade,section,gender,guardianName,guardianPhone,admissionNumber\n",
  );
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const parseAndImport = async () => {
    setErr(null);
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setErr("Include header row plus at least one student data row.");
      return;
    }
    const headers = lines[0]!.split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: Record<string, unknown> = { academicYear };
      headers.forEach((h, i) => {
        if (vals[i]) obj[h] = vals[i];
      });
      if (!obj.section) obj.section = "A";
      return obj;
    });

    setImporting(true);
    try {
      await onImport(rows);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "CSV import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import Students CSV"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-xl rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-2xl space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
            Bulk Import Students (CSV)
          </h3>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        {err && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {err}
          </div>
        )}
        <textarea
          rows={7}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] p-3 font-mono text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#D6DBF0] px-3 py-1.5 text-xs font-bold cursor-pointer dark:border-[#343B6B]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={parseAndImport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#663CF6] px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            <span>Import Students</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentIdCardsModal({
  students,
  schoolName,
  settings,
  onClose,
}: {
  students: StudentRecord[] | null;
  schoolName: string;
  settings: StudentSettingRecord;
  onClose: () => void;
}) {
  if (!students) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Student ID Cards"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-2xl space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#EEF1FA] pb-3 dark:border-[#232746] print:hidden">
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
            Printable Student ID Cards ({students.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Cards</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-[#DDD6FE] bg-gradient-to-br from-[#F7F3FF] via-white to-[#EDF6FF] p-4 space-y-2.5 shadow-xs dark:border-[#342B63] dark:from-[#1B1740] dark:via-[#141731] dark:to-[#112038]"
            >
              <div className="flex items-center justify-between border-b border-[#E5DDFD] pb-2 dark:border-[#2E2759]">
                <span className="text-[11px] font-black text-[#663CF6] truncate dark:text-[#CBB8FF]">
                  {schoolName}
                </span>
                <span className="rounded bg-[#EDE7FF] px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  {s.currentAcademicYear}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#4F27E8] text-sm font-black text-white">
                  {s.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                    {s.studentName}
                  </p>
                  <p className="font-mono text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                    {s.admissionNumber}
                  </p>
                  <p className="text-[10px] font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                    {s.currentGrade} - Sec {s.currentSection}
                    {s.currentRollNumber ? ` · Roll ${s.currentRollNumber}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-[10px] space-y-0.5 text-[#4D5072] dark:text-[#9DA6CC]">
                {settings.idCardConfig.showBloodGroup && (
                  <p>
                    <strong>Blood Group:</strong> {s.bloodGroup || "—"}
                  </p>
                )}
                {settings.idCardConfig.showGuardianPhone && (
                  <p>
                    <strong>Guardian:</strong> {s.guardianName} ({s.guardianPhone})
                  </p>
                )}
                {settings.idCardConfig.motto && (
                  <p className="pt-1 text-[9px] italic text-[#76799C] dark:text-[#9DA6CC]">
                    {settings.idCardConfig.motto}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
