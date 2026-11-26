"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2, FileCheck2, UserPlus } from "lucide-react";
import {
  ADMISSION_STATUS_META,
  DOCUMENT_VERIFICATION_META,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type AdmissionDocumentChecklistItem,
  type DocumentVerificationStatusType,
} from "@/modules/school/admissions/types";

function useNativeDialogSync(
  dialogRef: React.RefObject<HTMLDialogElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "true");
      }
    } else if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }, [dialogRef, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        onClose();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("pointerup", handlePointerUp);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dialogRef, onClose]);
}

interface NewApplicationModalProps {
  open: boolean;
  onClose: () => void;
  grades: string[];
  defaultAcademicYear: string;
  academicYears: string[];
  onSubmit: (payload: {
    studentName: string;
    gender: "Male" | "Female" | "Other" | "";
    dateOfBirth: string;
    gradeApplied: string;
    academicYear: string;
    guardianName: string;
    guardianRelation: string;
    guardianPhone: string;
    guardianEmail: string;
    previousSchool: string;
    status: "UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED";
    notes: string;
  }) => Promise<unknown>;
}

export function NewApplicationModal({
  open,
  onClose,
  grades,
  defaultAcademicYear,
  academicYears,
  onSubmit,
}: NewApplicationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useNativeDialogSync(dialogRef, open, onClose);

  const [studentName, setStudentName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gradeApplied, setGradeApplied] = useState(grades[0] || "Class I");
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("Parent");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [status, setStatus] = useState<"UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED">(
    "UNDER_REVIEW",
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setAcademicYear(defaultAcademicYear);
      if (grades.length > 0 && !grades.includes(gradeApplied)) {
        setGradeApplied(grades[0]!);
      }
    }
  }, [open, defaultAcademicYear, grades, gradeApplied]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onSubmit({
        studentName,
        gender,
        dateOfBirth,
        gradeApplied,
        academicYear,
        guardianName,
        guardianRelation,
        guardianPhone,
        guardianEmail,
        previousSchool,
        status,
        notes,
      });
      setStudentName("");
      setGuardianName("");
      setGuardianPhone("");
      setGuardianEmail("");
      setPreviousSchool("");
      setDateOfBirth("");
      setNotes("");
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-application-dialog-title"
      className="m-auto w-[min(95vw,600px)] rounded-[22px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
    >
      <div className="flex items-center justify-between border-b border-[#DFE3F5] px-6 py-4 dark:border-[#232746]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h1 id="new-application-dialog-title" className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              New Admission Application
            </h1>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Creates a real tenant-scoped admission record and generates an Application ID.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close application modal"
          className="rounded-full p-1.5 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245] dark:hover:text-[#F3F5FF]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-[12px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="app-student-name" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Student Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="app-student-name"
              type="text"
              required
              minLength={2}
              autoFocus
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Full student name"
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
            />
          </div>

          <div>
            <label htmlFor="app-grade" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Admission Grade <span className="text-rose-500">*</span>
            </label>
            <select
              id="app-grade"
              value={gradeApplied}
              onChange={(e) => setGradeApplied(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="app-ay" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Academic Year <span className="text-rose-500">*</span>
            </label>
            <select
              id="app-ay"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              {academicYears.map((ay) => (
                <option key={ay} value={ay}>
                  {ay}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="app-status" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Initial Stage
            </label>
            <select
              id="app-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED")
              }
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_PENDING">Documents Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
            </select>
          </div>

          <div>
            <label htmlFor="app-guardian-name" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Guardian Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="app-guardian-name"
              type="text"
              required
              minLength={2}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Parent or guardian name"
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
            />
          </div>

          <div>
            <label htmlFor="app-guardian-phone" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Guardian Phone <span className="text-rose-500">*</span>
            </label>
            <input
              id="app-guardian-phone"
              type="tel"
              required
              minLength={7}
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
            />
          </div>

          <div>
            <label htmlFor="app-guardian-email" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Guardian Email
            </label>
            <input
              id="app-guardian-email"
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              placeholder="Optional email address"
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
            />
          </div>

          <div>
            <label htmlFor="app-guardian-relation" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Relation
            </label>
            <select
              id="app-guardian-relation"
              value={guardianRelation}
              onChange={(e) => setGuardianRelation(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="Parent">Parent</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Legal Guardian</option>
            </select>
          </div>

          <div>
            <label htmlFor="app-gender" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Gender
            </label>
            <select
              id="app-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other" | "")}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="app-dob" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Date of Birth
            </label>
            <input
              id="app-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="app-prev-school" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
            Previous School
          </label>
          <input
            id="app-prev-school"
            type="text"
            value={previousSchool}
            onChange={(e) => setPreviousSchool(e.target.value)}
            placeholder="Optional previous school name"
            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
          />
        </div>

        <div>
          <label htmlFor="app-notes" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
            Review Notes
          </label>
          <textarea
            id="app-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any initial verification or admission remarks..."
            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none resize-y dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F8FAFC] cursor-pointer dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <span>{submitting ? "Creating..." : "Create Application"}</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}

interface NewEnquiryModalProps {
  open: boolean;
  onClose: () => void;
  grades: string[];
  defaultAcademicYear: string;
  academicYears: string[];
  onSubmit: (payload: {
    studentName: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    gradeApplied: string;
    academicYear: string;
    source: "Website" | "Walk-In" | "Phone Call" | "Referral" | "Campaign" | "Other";
    notes: string;
  }) => Promise<void>;
}

export function NewEnquiryModal({
  open,
  onClose,
  grades,
  defaultAcademicYear,
  academicYears,
  onSubmit,
}: NewEnquiryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useNativeDialogSync(dialogRef, open, onClose);

  const [studentName, setStudentName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [gradeApplied, setGradeApplied] = useState(grades[0] || "Class I");
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [source, setSource] = useState<
    "Website" | "Walk-In" | "Phone Call" | "Referral" | "Campaign" | "Other"
  >("Walk-In");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onSubmit({
        studentName,
        guardianName,
        guardianPhone,
        guardianEmail,
        gradeApplied,
        academicYear,
        source,
        notes,
      });
      setStudentName("");
      setGuardianName("");
      setGuardianPhone("");
      setGuardianEmail("");
      setNotes("");
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to save enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-enquiry-dialog-title"
      className="m-auto w-[min(95vw,520px)] rounded-[22px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
    >
      <div className="flex items-center justify-between border-b border-[#DFE3F5] px-6 py-4 dark:border-[#232746]">
        <h1 id="new-enquiry-dialog-title" className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
          Log Admission Enquiry
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close enquiry modal"
          className="rounded-full p-1.5 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245] dark:hover:text-[#F3F5FF]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="enq-student-name" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Student Name *
            </label>
            <input
              id="enq-student-name"
              type="text"
              required
              autoFocus
              minLength={2}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>
          <div>
            <label htmlFor="enq-guardian-name" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Guardian Name *
            </label>
            <input
              id="enq-guardian-name"
              type="text"
              required
              minLength={2}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>
          <div>
            <label htmlFor="enq-phone" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Phone *
            </label>
            <input
              id="enq-phone"
              type="tel"
              required
              minLength={7}
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>
          <div>
            <label htmlFor="enq-email" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Email
            </label>
            <input
              id="enq-email"
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
          </div>
          <div>
            <label htmlFor="enq-grade" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Grade *
            </label>
            <select
              id="enq-grade"
              value={gradeApplied}
              onChange={(e) => setGradeApplied(e.target.value)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="enq-source" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Source
            </label>
            <select
              id="enq-source"
              value={source}
              onChange={(e) =>
                setSource(
                  e.target.value as
                    | "Website"
                    | "Walk-In"
                    | "Phone Call"
                    | "Referral"
                    | "Campaign"
                    | "Other",
                )
              }
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="Walk-In">Walk-In</option>
              <option value="Website">Website</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Referral">Referral</option>
              <option value="Campaign">Campaign</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="enq-ay" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
            Academic Year
          </label>
          <select
            id="enq-ay"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          >
            {academicYears.map((ay) => (
              <option key={ay} value={ay}>
                {ay}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="enq-notes" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
            Enquiry Notes
          </label>
          <textarea
            id="enq-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] resize-y dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <span>{submitting ? "Saving..." : "Save Enquiry"}</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}

interface ApplicationDetailModalProps {
  application: AdmissionApplicationRecord | null;
  schoolSlug?: string;
  onClose: () => void;
  canWrite: boolean;
  canVerify: boolean;
  initialMode?: "view" | "edit";
  availableGrades?: string[];
  onSave: (
    applicationId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
      verificationNotes?: string;
      documentsChecklist?: AdmissionDocumentChecklistItem[];
      gradeApplied?: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianEmail?: string;
      previousSchool?: string;
    },
  ) => Promise<unknown>;
}

export function ApplicationDetailModal({
  application,
  schoolSlug,
  onClose,
  canWrite,
  canVerify,
  initialMode = "view",
  availableGrades = [],
  onSave,
}: ApplicationDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useNativeDialogSync(dialogRef, Boolean(application), onClose);

  const [status, setStatus] = useState<AdmissionApplicationStatusType>("UNDER_REVIEW");
  const [verificationStatus, setVerificationStatus] =
    useState<DocumentVerificationStatusType>("PENDING");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [checklist, setChecklist] = useState<AdmissionDocumentChecklistItem[]>([]);
  const [editProfileFields, setEditProfileFields] = useState(initialMode === "edit");
  const [gradeApplied, setGradeApplied] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setVerificationStatus(application.verificationStatus);
      setVerificationNotes(application.verificationNotes || "");
      setChecklist(application.documentsChecklist.map((c) => ({ ...c })));
      setGradeApplied(application.gradeApplied);
      setGuardianName(application.guardianName);
      setGuardianPhone(application.guardianPhone);
      setGuardianEmail(application.guardianEmail || "");
      setPreviousSchool(application.previousSchool || "");
      setEditProfileFields(initialMode === "edit");
      setErrorMsg(null);
    }
  }, [application, initialMode]);

  if (!application) return null;

  const statusMeta = ADMISSION_STATUS_META[status];
  const verMeta = DOCUMENT_VERIFICATION_META[verificationStatus];
  const gradeOptions = Array.from(new Set([application.gradeApplied, ...availableGrades]));

  const handleToggleChecklist = (key: string, field: "submitted" | "verified") => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: !item[field] };
        if (field === "verified" && updated.verified) {
          updated.submitted = true;
        }
        return updated;
      }),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);
    try {
      await onSave(application.id, {
        status,
        verificationStatus,
        verificationNotes,
        documentsChecklist: checklist,
        ...(editProfileFields && canWrite
          ? {
              gradeApplied,
              guardianName,
              guardianPhone,
              guardianEmail,
              previousSchool,
            }
          : {}),
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to update application.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="app-detail-dialog-title"
      className="m-auto w-[min(95vw,640px)] rounded-[22px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
    >
      <div className="flex items-center justify-between border-b border-[#DFE3F5] px-6 py-4 dark:border-[#232746]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <FileCheck2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 id="app-detail-dialog-title" className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {application.studentName} · {application.applicationCode}
            </h1>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              {application.gradeApplied} · {application.academicYear}
              {application.admissionNumber ? ` · Admission No: ${application.admissionNumber}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close application details"
          className="rounded-full p-1.5 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245] dark:hover:text-[#F3F5FF]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        {/* Applicant & Guardian Summary (Editable when Edit mode toggled) */}
        <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#76799C] dark:text-[#9DA6CC]">
              Applicant &amp; Guardian Details
            </span>
            {canWrite && (
              <button
                type="button"
                onClick={() => setEditProfileFields((prev) => !prev)}
                className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
              >
                {editProfileFields ? "Done Editing Fields" : "Edit Contact & Grade"}
              </button>
            )}
          </div>

          {editProfileFields && canWrite ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="detail-grade" className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#B4BDD9]">
                  Grade Applied
                </label>
                <select
                  id="detail-grade"
                  value={gradeApplied}
                  onChange={(e) => setGradeApplied(e.target.value)}
                  className="w-full rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="detail-guardian-name" className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#B4BDD9]">
                  Guardian Name
                </label>
                <input
                  id="detail-guardian-name"
                  type="text"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                />
              </div>
              <div>
                <label htmlFor="detail-guardian-phone" className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#B4BDD9]">
                  Guardian Phone
                </label>
                <input
                  id="detail-guardian-phone"
                  type="tel"
                  required
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                />
              </div>
              <div>
                <label htmlFor="detail-guardian-email" className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#B4BDD9]">
                  Guardian Email
                </label>
                <input
                  id="detail-guardian-email"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="detail-prev-school" className="block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#B4BDD9]">
                  Previous School
                </label>
                <input
                  id="detail-prev-school"
                  type="text"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Guardian:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {application.guardianName} ({application.guardianRelation})
                </strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Phone:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">{application.guardianPhone}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Email:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">{application.guardianEmail || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Previous School:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">{application.previousSchool || "Not provided"}</strong>
              </div>
              {application.admissionType && (
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Admission Type:</span>{" "}
                  <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                    {application.admissionType === "TRANSFER" ? "Transfer" : "Fresh Admission"}
                  </strong>
                </div>
              )}
              {application.guardianDetails?.emergencyContactNumber && (
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Emergency Contact:</span>{" "}
                  <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                    {application.guardianDetails.emergencyContactNumber} (
                    {application.guardianDetails.preferredCommunicationMode})
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Uploaded Documents (when submitted via wizard) */}
        {application.uploadedDocuments && application.uploadedDocuments.length > 0 && schoolSlug && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
              Uploaded Files ({application.uploadedDocuments.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {application.uploadedDocuments.map((doc) => (
                <a
                  key={doc.key}
                  href={`/api/school/admissions/documents/view?schoolSlug=${encodeURIComponent(schoolSlug)}&key=${encodeURIComponent(doc.storageKey)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-[10px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2 text-xs hover:border-[#663CF6] dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <span className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                    {doc.label}
                  </span>
                  <span className="shrink-0 font-bold text-[#663CF6] dark:text-[#A78BFA]">
                    View
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status & Verification Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="detail-status" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
              Application Stage
            </label>
            <select
              id="detail-status"
              disabled={!canWrite}
              value={status}
              onChange={(e) => setStatus(e.target.value as AdmissionApplicationStatusType)}
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_PENDING">Documents Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="ADMITTED">Admitted (Assigns Admission No)</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <span
              className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
            >
              {statusMeta.label}
            </span>
          </div>

          <div>
            <label
              htmlFor="detail-verification"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Document Verification
            </label>
            <select
              id="detail-verification"
              disabled={!canVerify}
              value={verificationStatus}
              onChange={(e) =>
                setVerificationStatus(e.target.value as DocumentVerificationStatusType)
              }
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <span
              className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${verMeta.bgClass} ${verMeta.textClass} ${verMeta.borderClass}`}
            >
              {verMeta.label}
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Document Checklist</p>
          <div className="divide-y divide-[#F1F5F9] rounded-[12px] border border-[#DFE3F5] dark:divide-[#232746] dark:border-[#272B4D]">
            {checklist.map((doc) => (
              <div
                key={doc.key}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
              >
                <span className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">{doc.label}</span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 text-[#4D5072] cursor-pointer dark:text-[#B4BDD9]">
                    <input
                      type="checkbox"
                      disabled={!canVerify}
                      checked={doc.submitted}
                      onChange={() => handleToggleChecklist(doc.key, "submitted")}
                      className="h-3.5 w-3.5 accent-[#663CF6]"
                    />
                    <span>Submitted</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold cursor-pointer dark:text-emerald-400">
                    <input
                      type="checkbox"
                      disabled={!canVerify}
                      checked={doc.verified}
                      onChange={() => handleToggleChecklist(doc.key, "verified")}
                      className="h-3.5 w-3.5 accent-emerald-600"
                    />
                    <span>Verified</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="detail-verification-notes"
            className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
          >
            Verification / Review Remarks
          </label>
          <textarea
            id="detail-verification-notes"
            rows={2}
            disabled={!canVerify && !canWrite}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] resize-y dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] cursor-pointer dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
          >
            Close
          </button>
          {(canWrite || canVerify) && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{saving ? "Saving..." : "Save Updates"}</span>
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
