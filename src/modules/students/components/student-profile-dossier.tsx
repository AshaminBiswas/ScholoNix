"use client";

import React from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CreditCard,
  Download,
  Edit3,
  HeartPulse,
  Home,
  IdCard,
  Layers,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type {
  StudentActivityRecord,
  StudentGroupRecord,
  StudentRecord,
} from "@/modules/students/types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getStatusBadgeClasses(status: StudentRecord["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60";
    case "INACTIVE":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60";
    case "TRANSFERRED":
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60";
    case "ALUMNI":
      return "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800/60";
    default:
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60";
  }
}

export function StudentProfileDossier({
  student,
  groups,
  activities,
  allStudents,
  canEdit,
  onSelectStudent,
  onBackToList,
  onEditStudent,
  onOpenIdCard,
  onTransferStudent,
}: {
  student: StudentRecord | null;
  groups: StudentGroupRecord[];
  activities: StudentActivityRecord[];
  allStudents: StudentRecord[];
  canEdit: boolean;
  onSelectStudent: (studentId: string) => void;
  onBackToList: () => void;
  onEditStudent: (student: StudentRecord) => void;
  onOpenIdCard: (student: StudentRecord) => void;
  onTransferStudent: (student: StudentRecord) => void;
}) {
  if (!student) {
    return (
      <div className={`${STUDENT_CARD_SURFACE} p-6 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
              Select a Student Profile
            </h2>
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Choose any student below or from the Student List to view their full academic, guardian, and fee dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Student List</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allStudents.slice(0, 12).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStudent(s.id)}
              className="flex items-center gap-3 rounded-2xl border border-[#E2E6F6] bg-[#FAF8FE]/80 p-3 text-left transition hover:border-[#663CF6] cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#5B35F5] text-xs font-black text-white">
                {s.studentName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {s.studentName}
                </p>
                <p className="font-mono text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                  {s.admissionNumber}
                </p>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  {s.currentGrade} - {s.currentSection} • {s.guardianName}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const memberGroups = groups.filter((g) => student.groupIds.includes(g.id));
  const studentActivities = activities.filter(
    (a) => a.studentId === student.id,
  );

  const downloadJsonDossier = () => {
    const blob = new Blob([JSON.stringify(student, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.admissionNumber}-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedAddress = [
    student.address?.addressLine1,
    student.address?.addressLine2,
    student.address?.city,
    student.address?.state,
    student.address?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF1FA] pb-4 dark:border-[#232746]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToList}
              aria-label="Back to Student List"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#CAD0EB] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#9DA6CC]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#4F27E8] text-base font-black text-white shadow-md">
              {student.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {student.studentName}
                </h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusBadgeClasses(
                    student.status,
                  )}`}
                >
                  {student.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                <span className="font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                  {student.admissionNumber}
                </span>
                {student.studentIdNumber ? ` • ID: ${student.studentIdNumber}` : ""} •{" "}
                {student.currentGrade} - Section {student.currentSection}
                {student.currentRollNumber ? ` • Roll #${student.currentRollNumber}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenIdCard(student)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <IdCard className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>ID Card</span>
            </button>
            <button
              type="button"
              onClick={downloadJsonDossier}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Dossier</span>
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onTransferStudent(student)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
                  <span>Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditStudent(student)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Student</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
            <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
              Academic Year
            </p>
            <p className="mt-1 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {student.currentAcademicYear}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
            <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
              Admission Date
            </p>
            <p className="mt-1 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {student.admissionDate.slice(0, 10)}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
            <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
              Gender / Blood Group
            </p>
            <p className="mt-1 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {student.gender || "Unspecified"} • {student.bloodGroup || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
            <p className="text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
              Admission Type
            </p>
            <p className="mt-1 font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {student.admissionType}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Users className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Guardian & Contact</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Primary Guardian</span>
              <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {student.guardianName} ({student.guardianRelation})
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
              <span className="flex items-center gap-1 text-[#76799C] dark:text-[#9DA6CC]">
                <Phone className="h-3 w-3" /> Guardian Phone
              </span>
              <span className="font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {student.guardianPhone}
              </span>
            </div>
            {student.guardianEmail && (
              <div className="flex items-center justify-between gap-2 border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
                <span className="flex items-center gap-1 text-[#76799C] dark:text-[#9DA6CC]">
                  <Mail className="h-3 w-3" /> Guardian Email
                </span>
                <span className="font-semibold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {student.guardianEmail}
                </span>
              </div>
            )}
            {student.email && (
              <div className="flex items-center justify-between gap-2 border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Student Email</span>
                <span className="font-semibold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {student.email}
                </span>
              </div>
            )}
            {formattedAddress && (
              <div className="pt-1">
                <p className="flex items-center gap-1 text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
                  <Home className="h-3 w-3" /> Residential Address
                </p>
                <p className="mt-1 text-xs font-medium text-[#08093B] dark:text-[#DCE1F9]">
                  {formattedAddress}
                </p>
              </div>
            )}
            {student.medicalNotes && (
              <div className="rounded-xl bg-rose-50/70 p-2.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <p className="flex items-center gap-1 font-bold">
                  <HeartPulse className="h-3.5 w-3.5" /> Medical Notes
                </p>
                <p className="mt-0.5">{student.medicalNotes}</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <CreditCard className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Fee Ledger & Groups</span>
          </h3>
          {student.feeSummary ? (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-[#FAF8FE] p-2.5 dark:bg-[#10142C]">
                <p className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">Total</p>
                <p className="mt-0.5 font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {formatInrFromPaise(student.feeSummary.totalFeePaise)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50/70 p-2.5 dark:bg-emerald-950/40">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Paid</p>
                <p className="mt-0.5 font-black text-emerald-700 dark:text-emerald-200">
                  {formatInrFromPaise(student.feeSummary.paidPaise)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50/70 p-2.5 dark:bg-amber-950/40">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Due</p>
                <p className="mt-0.5 font-black text-amber-700 dark:text-amber-200">
                  {formatInrFromPaise(student.feeSummary.outstandingPaise)}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-[#FAF8FE] p-3 text-xs text-[#76799C] dark:bg-[#10142C] dark:text-[#9DA6CC]">
              No linked fee invoice generated for this admission record yet.
            </p>
          )}

          <div className="pt-2 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              <Layers className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Student Groups ({memberGroups.length})</span>
            </p>
            {memberGroups.length === 0 ? (
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Not assigned to any houses, clubs, or transport cohorts.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {memberGroups.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-[#F5F2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#5B35F5] dark:border-[#342B63] dark:bg-[#221A44] dark:text-[#D5C4FF]"
                  >
                    {g.name} ({g.category})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Calendar className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Enrollment & Transfer Timeline</span>
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
            {student.enrollments.map((enr) => (
              <div
                key={enr.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-[#EEF1FA] bg-[#FAF8FE]/70 p-2.5 dark:border-[#232746] dark:bg-[#10142C]"
              >
                <div>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {enr.grade} - Section {enr.section}
                  </p>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    AY {enr.academicYear}
                    {enr.rollNumber ? ` • Roll ${enr.rollNumber}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  {enr.status}
                </span>
              </div>
            ))}

            {student.transfers.map((tr) => (
              <div
                key={tr.id}
                className="rounded-xl border border-sky-200 bg-sky-50/70 p-2.5 dark:border-sky-800/60 dark:bg-sky-950/30"
              >
                <p className="font-bold text-sky-800 dark:text-sky-200">
                  {tr.transferType === "TRANSFER_IN" ? "Transfer In" : "Transfer Out"} •{" "}
                  {tr.transferDate.slice(0, 10)}
                </p>
                <p className="text-[11px] text-sky-700 dark:text-sky-300">
                  {tr.tcNumber ? `TC: ${tr.tcNumber} • ` : ""}
                  {tr.counterpartySchool || tr.reason || tr.clearanceStatus}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <UserCheck className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Student Activity Audit Trail</span>
        </h3>
        {studentActivities.length === 0 ? (
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            No lifecycle events recorded for this student yet.
          </p>
        ) : (
          <div className="space-y-2">
            {studentActivities.slice(0, 10).map((act) => (
              <div
                key={act.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EEF1FA] px-3 py-2 text-xs dark:border-[#232746]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#663CF6] dark:text-[#C4B5FD]" />
                  <span className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                    {act.summary}
                  </span>
                </div>
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  {act.actorName} • {new Date(act.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
