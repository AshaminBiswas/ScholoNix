"use client";

import React, { useState } from "react";
import {
  resolveClassFeePaiseForGrade,
  type AdmissionApplicationRecord,
  type AdmissionExtendedSettings,
  type AdmissionFeeLedgerRecord,
  type AdmissionFeePaymentRecord,
  type AdmissionTypeValue,
} from "@/modules/school/admissions/types";
import { formatDateTimeIst, formatShortDate } from "../enquiries/enquiry-shared";
import { ADMISSION_TYPE_META, formatInrFromPaise } from "./admitted-shared";

export function DirectAdmitModal({
  open,
  availableGrades,
  academicYear,
  extendedConfig,
  onClose,
  onSubmit,
}: {
  open: boolean;
  availableGrades: string[];
  academicYear: string;
  extendedConfig?: AdmissionExtendedSettings;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const initialGrade = availableGrades[0] || "Class I";
  const initialConfiguredPaise = resolveClassFeePaiseForGrade(extendedConfig, initialGrade);
  const [studentName, setStudentName] = useState("");
  const [gradeApplied, setGradeApplied] = useState(initialGrade);
  const [admissionType, setAdmissionType] = useState<AdmissionTypeValue>("FRESH");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [totalFeeRupees, setTotalFeeRupees] = useState(
    initialConfiguredPaise > 0 ? String(initialConfiguredPaise / 100) : "",
  );
  const [feeManuallyEdited, setFeeManuallyEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const configuredGradeFeePaise = resolveClassFeePaiseForGrade(extendedConfig, gradeApplied);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admit Student"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            + Admit Student Directly
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#76799C] hover:text-[#08093B] dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (!studentName.trim() || !guardianName.trim() || !guardianPhone.trim()) {
              setError("Student Name, Guardian Name, and Phone Number are required.");
              return;
            }
            setSubmitting(true);
            try {
              await onSubmit({
                studentName: studentName.trim(),
                gradeApplied,
                academicYear,
                admissionType,
                guardianName: guardianName.trim(),
                guardianPhone: guardianPhone.trim(),
                guardianEmail: guardianEmail.trim(),
                ...(totalFeeRupees ? { totalFeeRupees: Number(totalFeeRupees) } : {}),
              });
              setStudentName("");
              setGuardianName("");
              setGuardianPhone("");
              setGuardianEmail("");
              setTotalFeeRupees("");
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to admit student.");
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">Student Name *</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Grade *</label>
              <select
                value={gradeApplied}
                onChange={(e) => {
                  const nextGrade = e.target.value;
                  setGradeApplied(nextGrade);
                  if (!feeManuallyEdited) {
                    const nextPaise = resolveClassFeePaiseForGrade(extendedConfig, nextGrade);
                    setTotalFeeRupees(nextPaise > 0 ? String(nextPaise / 100) : "");
                  }
                }}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Admission Type *</label>
              <select
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value as AdmissionTypeValue)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                <option value="FRESH">New Admission</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RE_ADMISSION">Re-Admission</option>
                <option value="OTHER">Others</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-[11px] font-bold">Total Annual Fee (&#8377;)</label>
                {configuredGradeFeePaise > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTotalFeeRupees(String(configuredGradeFeePaise / 100));
                      setFeeManuallyEdited(false);
                    }}
                    className="text-[10px] font-bold text-[#663CF6] hover:underline dark:text-[#C4B5FD]"
                  >
                    Use {gradeApplied} Fee ({formatInrFromPaise(configuredGradeFeePaise)})
                  </button>
                )}
              </div>
              <input
                type="number"
                min={0}
                value={totalFeeRupees}
                onChange={(e) => {
                  setTotalFeeRupees(e.target.value);
                  setFeeManuallyEdited(true);
                }}
                placeholder="Optional e.g. 50000"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Guardian Name *</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Guardian Phone *</label>
              <input
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold dark:border-[#313761]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Admitting..." : "Confirm Admission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ImportAdmittedModal({
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
    "studentName,gradeApplied,guardianName,guardianPhone,admissionType\nAarav Sample,Class I,Rajesh Sample,+919876543210,FRESH",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import Admitted List"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-xl rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Import Admitted Students CSV
          </h3>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#76799C]">
            Close
          </button>
        </div>

        <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
          Paste comma-separated rows (`studentName, gradeApplied, guardianName, guardianPhone, admissionType`) for Academic Year {academicYear}. Up to 100 rows per import.
        </p>

        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] p-3 font-mono text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
        />

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold dark:border-[#313761]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setError(null);
              const lines = csvText
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
              if (lines.length < 2) {
                setError("Include header row plus at least one data row.");
                return;
              }
              const parsedRows = lines.slice(1).map((line) => {
                const [studentName, gradeApplied, guardianName, guardianPhone, admissionType] =
                  line.split(",").map((c) => c.trim());
                return {
                  studentName: studentName || "",
                  gradeApplied: gradeApplied || "Class I",
                  guardianName: guardianName || "",
                  guardianPhone: guardianPhone || "",
                  admissionType:
                    admissionType === "TRANSFER" ||
                    admissionType === "RE_ADMISSION" ||
                    admissionType === "OTHER"
                      ? admissionType
                      : "FRESH",
                  academicYear,
                };
              });
              setSubmitting(true);
              try {
                await onImport(parsedRows);
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to import students.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Importing..." : "Import Students"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function IdCardsModal({
  schoolName,
  students,
  onClose,
}: {
  schoolName: string;
  students: AdmissionApplicationRecord[] | null;
  onClose: () => void;
}) {
  if (!students) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Student ID Cards Preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Student ID Cards ({students.length})
            </h3>
            <p className="text-xs text-[#76799C]">Ready to print or save as PDF.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-bold text-white"
            >
              Print ID Cards
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold dark:border-[#313761]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map((stu) => (
            <div
              key={stu.id}
              className="rounded-[16px] border border-[#D6DBF0] bg-gradient-to-br from-[#F7F3FF] to-white p-4 space-y-2.5 dark:border-[#313761] dark:from-[#1B173D] dark:to-[#141731]"
            >
              <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-2 dark:border-[#232746]">
                <span className="text-xs font-extrabold text-[#6D28D9] dark:text-violet-300">
                  {schoolName}
                </span>
                <span className="rounded bg-[#6D28D9] px-2 py-0.5 text-[10px] font-bold text-white">
                  {stu.academicYear}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white flex items-center justify-center font-extrabold text-sm">
                  {stu.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    {stu.studentName}
                  </p>
                  <p className="text-xs font-bold text-[#6D28D9] dark:text-violet-300">
                    {stu.admissionNumber || stu.applicationCode} · {stu.gradeApplied}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                <span>DOB: {stu.dateOfBirth ? formatShortDate(stu.dateOfBirth) : "—"}</span>
                <span>Type: {ADMISSION_TYPE_META[stu.admissionType || "FRESH"].label}</span>
                <span>Guardian: {stu.guardianName}</span>
                <span>Phone: {stu.guardianPhone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SetFeeLedgerModal({
  student,
  existingLedger,
  students,
  extendedConfig,
  onClose,
  onSave,
}: {
  student: AdmissionApplicationRecord | null;
  existingLedger?: AdmissionFeeLedgerRecord;
  students: AdmissionApplicationRecord[];
  extendedConfig?: AdmissionExtendedSettings;
  onClose: () => void;
  onSave: (payload: {
    applicationId: string;
    totalFeeRupees: number;
    concessionRupees: number;
    concessionReason: string;
  }) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState(student?.id || students[0]?.id || "");
  const activeStudent = students.find((s) => s.id === selectedId) ?? student;
  const configuredClassFeePaise = activeStudent
    ? resolveClassFeePaiseForGrade(extendedConfig, activeStudent.gradeApplied)
    : 0;
  const [totalFee, setTotalFee] = useState(
    existingLedger
      ? String(existingLedger.totalFeePaise / 100)
      : configuredClassFeePaise > 0
        ? String(configuredClassFeePaise / 100)
        : "50000",
  );
  const [concession, setConcession] = useState(
    existingLedger ? String(existingLedger.concessionPaise / 100) : "0",
  );
  const [reason, setReason] = useState(existingLedger?.concessionReason || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set Student Fee and Concession"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-4">
        <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
          Set Fee Assessment &amp; Concession
        </h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            try {
              await onSave({
                applicationId: selectedId || student.id,
                totalFeeRupees: Number(totalFee),
                concessionRupees: Number(concession || 0),
                concessionReason: reason.trim(),
              });
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save fee assessment.");
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[11px] font-bold mb-1">Student</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentName} ({s.admissionNumber || s.applicationCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-[11px] font-bold">Total Fee (&#8377;) *</label>
              {activeStudent && configuredClassFeePaise > 0 && (
                <button
                  type="button"
                  onClick={() => setTotalFee(String(configuredClassFeePaise / 100))}
                  className="text-[10px] font-bold text-[#663CF6] hover:underline dark:text-[#C4B5FD]"
                >
                  Apply {activeStudent.gradeApplied} Plan ({formatInrFromPaise(configuredClassFeePaise)})
                </button>
              )}
            </div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={totalFee}
              onChange={(e) => setTotalFee(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold mb-1">Concession / Scholarship (&#8377;)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={concession}
              onChange={(e) => setConcession(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold mb-1">Concession Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Merit Scholarship / Sibling Concession"
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            />
          </div>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold dark:border-[#313761]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white"
            >
              {busy ? "Saving..." : "Save Fee Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FeeReceiptModal({
  schoolName,
  payment,
  onClose,
}: {
  schoolName: string;
  payment: AdmissionFeePaymentRecord | null;
  onClose: () => void;
}) {
  if (!payment) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fee Receipt"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-4">
        <div className="border-b border-[#DFE3F5] pb-3 dark:border-[#232746]">
          <p className="text-xs font-bold text-[#6D28D9] dark:text-violet-300">{schoolName}</p>
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Official Fee Receipt &ndash; {payment.receiptNumber}
          </h3>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#76799C]">Student</span>
            <span className="font-bold">{payment.studentName || "Student"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#76799C]">Admission No.</span>
            <span className="font-bold">{payment.admissionNumber || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#76799C]">Fee Head</span>
            <span className="font-bold">{payment.feeHead}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#76799C]">Payment Mode</span>
            <span className="font-bold">{payment.paymentMode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#76799C]">Reference</span>
            <span className="font-bold">{payment.referenceNo || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#76799C]">Date</span>
            <span className="font-bold">{formatDateTimeIst(payment.paymentDate)}</span>
          </div>
          <div className="flex justify-between border-t border-[#DFE3F5] pt-2 text-sm dark:border-[#232746]">
            <span className="font-bold">Amount Paid</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatInrFromPaise(payment.amountPaise)}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-[#F0EBFE] px-4 py-2 text-xs font-bold text-[#6D28D9] dark:bg-violet-950/60 dark:text-violet-300"
          >
            Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-bold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
