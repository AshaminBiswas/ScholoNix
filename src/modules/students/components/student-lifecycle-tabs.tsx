"use client";

import React, { useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import type {
  StudentGroupRecord,
  StudentRecord,
  StudentSettingRecord,
} from "@/modules/students/types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

const INPUT_CLS =
  "w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]";

export function StudentPromotionPanel({
  students,
  academicYears,
  grades,
  sections,
  canPromote,
  onPromote,
}: {
  students: StudentRecord[];
  academicYears: string[];
  grades: string[];
  sections: string[];
  canPromote: boolean;
  onPromote: (payload: {
    studentIds: string[];
    targetAcademicYear: string;
    targetGrade: string;
    targetSection: string;
    mode: "PROMOTE" | "RETAIN" | "GRADUATE_ALUMNI";
    remarks?: string;
  }) => Promise<void>;
}) {
  const [sourceGrade, setSourceGrade] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetAcademicYear, setTargetAcademicYear] = useState("2026 – 2027");
  const [targetGrade, setTargetGrade] = useState(grades[1] || grades[0] || "Class II");
  const [targetSection, setTargetSection] = useState(sections[0] || "A");
  const [mode, setMode] = useState<"PROMOTE" | "RETAIN" | "GRADUATE_ALUMNI">("PROMOTE");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const eligible = students.filter(
    (s) =>
      s.status === "ACTIVE" &&
      (sourceGrade === "ALL" || s.currentGrade === sourceGrade),
  );

  const toggleAll = () => {
    if (selectedIds.length === eligible.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligible.map((s) => s.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !canPromote) return;
    setSubmitting(true);
    try {
      await onPromote({
        studentIds: selectedIds,
        targetAcademicYear,
        targetGrade,
        targetSection,
        mode,
        remarks: remarks || undefined,
      });
      setSelectedIds([]);
      setRemarks("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Eligible Active Students ({eligible.length})
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Select students to promote to next class, retain in same grade, or graduate to Alumni.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Source grade filter for promotion"
              value={sourceGrade}
              onChange={(e) => {
                setSourceGrade(e.target.value);
                setSelectedIds([]);
              }}
              className="rounded-xl border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="ALL">All Active Grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-xl border border-[#CAD0EB] px-3 py-1.5 text-xs font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
            >
              {selectedIds.length === eligible.length && eligible.length > 0
                ? "Clear Selection"
                : "Select All"}
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-[#EEF1FA] rounded-xl border border-[#EEF1FA] dark:divide-[#232746] dark:border-[#232746]">
          {eligible.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No active students found in this filter.
            </p>
          ) : (
            eligible.map((s) => {
              const checked = selectedIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs hover:bg-[#FAF8FE] cursor-pointer dark:hover:bg-[#1A1E3D]"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(s.id)}
                      className="rounded border-[#CAD0EB]"
                    />
                    <span className="font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                      {s.admissionNumber}
                    </span>
                    <span className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                      {s.studentName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                    {s.currentGrade} - {s.currentSection} ({s.currentAcademicYear})
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <form onSubmit={handleRun} className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3 h-fit`}>
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Promotion Rules ({selectedIds.length} selected)</span>
        </h3>

        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Action Mode
          </label>
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "PROMOTE" | "RETAIN" | "GRADUATE_ALUMNI")
            }
            className={`mt-1 ${INPUT_CLS}`}
          >
            <option value="PROMOTE">Promote to Next Grade</option>
            <option value="RETAIN">Retain in Target Grade</option>
            <option value="GRADUATE_ALUMNI">Graduate to Alumni</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Target Academic Year
          </label>
          <input
            value={targetAcademicYear}
            onChange={(e) => setTargetAcademicYear(e.target.value)}
            list="snx-promo-years"
            required
            className={`mt-1 ${INPUT_CLS}`}
          />
          <datalist id="snx-promo-years">
            {academicYears.map((ay) => (
              <option key={ay} value={ay} />
            ))}
            <option value="2026 – 2027" />
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Target Grade
            </label>
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              className={`mt-1 ${INPUT_CLS}`}
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Target Section
            </label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className={`mt-1 ${INPUT_CLS}`}
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Remarks
          </label>
          <input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Annual exam promotion batch..."
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || selectedIds.length === 0 || !canPromote}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>Apply to {selectedIds.length} Student(s)</span>
        </button>
      </form>
    </div>
  );
}

export function StudentTransferPanel({
  students,
  preselectedStudentId,
  canTransfer,
  onSubmitTransfer,
  onSelectProfile,
}: {
  students: StudentRecord[];
  preselectedStudentId?: string | null;
  canTransfer: boolean;
  onSubmitTransfer: (payload: {
    studentId: string;
    transferType: "TRANSFER_IN" | "TRANSFER_OUT";
    transferDate: string;
    tcNumber?: string;
    counterpartySchool?: string;
    reason?: string;
    clearanceStatus?: string;
    toGrade?: string;
  }) => Promise<void>;
  onSelectProfile: (studentId: string) => void;
}) {
  const [studentId, setStudentId] = useState(
    preselectedStudentId || students[0]?.id || "",
  );
  const [transferType, setTransferType] = useState<"TRANSFER_IN" | "TRANSFER_OUT">("TRANSFER_OUT");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [tcNumber, setTcNumber] = useState("");
  const [counterpartySchool, setCounterpartySchool] = useState("");
  const [reason, setReason] = useState("");
  const [clearanceStatus, setClearanceStatus] = useState("CLEARED");
  const [submitting, setSubmitting] = useState(false);

  const transferLogs = students
    .flatMap((s) => s.transfers.map((tr) => ({ ...tr, studentName: s.studentName, admissionNumber: s.admissionNumber })))
    .sort((a, b) => b.transferDate.localeCompare(a.transferDate));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !canTransfer) return;
    setSubmitting(true);
    try {
      await onSubmitTransfer({
        studentId,
        transferType,
        transferDate,
        tcNumber: tcNumber || undefined,
        counterpartySchool: counterpartySchool || undefined,
        reason: reason || undefined,
        clearanceStatus,
      });
      setTcNumber("");
      setCounterpartySchool("");
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={handleSubmit} className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3 h-fit`}>
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <ArrowRightLeft className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Process Student Transfer</span>
        </h3>

        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Student
          </label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={`mt-1 ${INPUT_CLS}`}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.admissionNumber} — {s.studentName} ({s.currentGrade})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Transfer Direction
            </label>
            <select
              value={transferType}
              onChange={(e) =>
                setTransferType(e.target.value as "TRANSFER_IN" | "TRANSFER_OUT")
              }
              className={`mt-1 ${INPUT_CLS}`}
            >
              <option value="TRANSFER_OUT">Transfer Out (TC)</option>
              <option value="TRANSFER_IN">Transfer In (Restore Active)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Effective Date
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
              className={`mt-1 ${INPUT_CLS}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              TC Number
            </label>
            <input
              value={tcNumber}
              onChange={(e) => setTcNumber(e.target.value)}
              placeholder="TC-2026-0142"
              className={`mt-1 ${INPUT_CLS}`}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
              Clearance Status
            </label>
            <select
              value={clearanceStatus}
              onChange={(e) => setClearanceStatus(e.target.value)}
              className={`mt-1 ${INPUT_CLS}`}
            >
              <option value="CLEARED">Cleared (TC Issued)</option>
              <option value="PENDING">Pending Dues Check</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Destination / Previous School
          </label>
          <input
            value={counterpartySchool}
            onChange={(e) => setCounterpartySchool(e.target.value)}
            placeholder="Delhi Public Academy"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Family relocation"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !studentId || !canTransfer}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
          <span>Record Transfer</span>
        </button>
      </form>

      <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
        <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          Transfer Certificate & Registry ({transferLogs.length})
        </h3>
        {transferLogs.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
            No student transfers recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">TC #</th>
                  <th className="py-2 pr-3">School / Reason</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2">Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                {transferLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        onClick={() => onSelectProfile(log.studentId)}
                        className="font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                      >
                        {log.studentName}
                      </button>
                      <p className="font-mono text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                        {log.admissionNumber}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                      {log.transferType === "TRANSFER_IN" ? "Transfer In" : "Transfer Out"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{log.tcNumber || "—"}</td>
                    <td className="py-2.5 pr-3 text-[#4D5072] dark:text-[#9DA6CC]">
                      {log.counterpartySchool || log.reason || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-[#4D5072] dark:text-[#9DA6CC]">
                      {log.transferDate.slice(0, 10)}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                        {log.clearanceStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentGroupsPanel({
  groups,
  students,
  canEdit,
  onCreateGroup,
  onAssignGroupToStudents,
}: {
  groups: StudentGroupRecord[];
  students: StudentRecord[];
  canEdit: boolean;
  onCreateGroup: (payload: {
    name: string;
    category: string;
    colorToken: string;
    description?: string;
    memberStudentIds?: string[];
  }) => Promise<void>;
  onAssignGroupToStudents: (groupId: string, studentIds: string[]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("HOUSE");
  const [description, setDescription] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !canEdit) return;
    setCreating(true);
    try {
      await onCreateGroup({
        name: name.trim(),
        category,
        colorToken: "violet",
        description: description || undefined,
        memberStudentIds: selectedStudentIds,
      });
      setName("");
      setDescription("");
      setSelectedStudentIds([]);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={handleCreate} className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3 h-fit`}>
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <Plus className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Create Student Group / Cohort</span>
        </h3>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Group Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Emerald House / Bus Route 4"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`mt-1 ${INPUT_CLS}`}
          >
            <option value="HOUSE">House</option>
            <option value="TRANSPORT">Transport Route</option>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="CLUB">Club / Sports</option>
            <option value="HOSTEL">Hostel Wing</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional cohort description"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Initial Members ({selectedStudentIds.length})
          </label>
          <div className="mt-1 max-h-36 overflow-y-auto rounded-xl border border-[#CAD0EB] p-2 space-y-1 dark:border-[#343B6B]">
            {students.slice(0, 25).map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(s.id)}
                  onChange={() =>
                    setSelectedStudentIds((prev) =>
                      prev.includes(s.id)
                        ? prev.filter((id) => id !== s.id)
                        : [...prev, s.id],
                    )
                  }
                />
                <span className="truncate font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                  {s.studentName} ({s.currentGrade})
                </span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={creating || !canEdit}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
          <span>Create Group</span>
        </button>
      </form>

      <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <Layers className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Active Cohorts & Houses ({groups.length})</span>
        </h3>
        {groups.length === 0 ? (
          <p className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
            No student groups configured yet. Create houses, transport cohorts, or clubs on the left.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-[#E2E6F6] bg-[#FAF8FE]/80 p-3.5 space-y-2 dark:border-[#272B4D] dark:bg-[#10142C]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {g.name}
                  </p>
                  <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    {g.category}
                  </span>
                </div>
                {g.description && (
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    {g.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                    {g.memberStudentIds.length} member(s)
                  </span>
                  {canEdit && selectedStudentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onAssignGroupToStudents(g.id, selectedStudentIds)}
                      className="font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                    >
                      + Assign selected ({selectedStudentIds.length})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentSettingsPanel({
  settings,
  canManageSettings,
  onSaveSettings,
}: {
  settings: StudentSettingRecord;
  canManageSettings: boolean;
  onSaveSettings: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [defaultSectionsText, setDefaultSectionsText] = useState(
    settings.defaultSections.join(", "),
  );
  const [rollNumberMode, setRollNumberMode] = useState<"AUTO_ALPHA" | "MANUAL">(
    settings.rollNumberMode,
  );
  const [requireTcOnTransfer, setRequireTcOnTransfer] = useState(
    settings.requireTcOnTransfer,
  );
  const [finalGradeForAlumni, setFinalGradeForAlumni] = useState(
    settings.promotionConfig.finalGradeForAlumni,
  );
  const [motto, setMotto] = useState(settings.idCardConfig.motto || "");
  const [showBloodGroup, setShowBloodGroup] = useState(
    settings.idCardConfig.showBloodGroup,
  );
  const [showGuardianPhone, setShowGuardianPhone] = useState(
    settings.idCardConfig.showGuardianPhone,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;
    setSaving(true);
    try {
      const defaultSections = defaultSectionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSaveSettings({
        defaultSections: defaultSections.length > 0 ? defaultSections : ["A", "B"],
        rollNumberMode,
        requireTcOnTransfer,
        idCardConfig: {
          showBloodGroup,
          showGuardianPhone,
          showEmergencyContact: settings.idCardConfig.showEmergencyContact,
          motto: motto || undefined,
        },
        promotionConfig: {
          finalGradeForAlumni,
          autoAssignRollNumbers: rollNumberMode === "AUTO_ALPHA",
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className={`${STUDENT_CARD_SURFACE} p-5 max-w-2xl space-y-4`}>
      <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
        <Settings className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
        <span>Student Lifecycle & ID Card Configuration</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Default Sections (comma separated)
          </label>
          <input
            value={defaultSectionsText}
            onChange={(e) => setDefaultSectionsText(e.target.value)}
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Roll Number Assignment
          </label>
          <select
            value={rollNumberMode}
            onChange={(e) =>
              setRollNumberMode(e.target.value as "AUTO_ALPHA" | "MANUAL")
            }
            className={`mt-1 ${INPUT_CLS}`}
          >
            <option value="AUTO_ALPHA">Auto Alphabetical</option>
            <option value="MANUAL">Manual Roll Entry</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Final Grade Before Alumni
          </label>
          <input
            value={finalGradeForAlumni}
            onChange={(e) => setFinalGradeForAlumni(e.target.value)}
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            ID Card Footer Motto
          </label>
          <input
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="Knowledge, Character & Service"
            className={`mt-1 ${INPUT_CLS}`}
          />
        </div>
      </div>

      <div className="space-y-2 text-xs text-[#08093B] dark:text-[#F3F5FF]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requireTcOnTransfer}
            onChange={(e) => setRequireTcOnTransfer(e.target.checked)}
          />
          <span>Require Transfer Certificate (TC) number on Transfer Out</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showBloodGroup}
            onChange={(e) => setShowBloodGroup(e.target.checked)}
          />
          <span>Display student blood group on printable ID cards</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showGuardianPhone}
            onChange={(e) => setShowGuardianPhone(e.target.checked)}
          />
          <span>Display primary guardian phone on printable ID cards</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={saving || !canManageSettings}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>Save Student Settings</span>
      </button>
    </form>
  );
}
