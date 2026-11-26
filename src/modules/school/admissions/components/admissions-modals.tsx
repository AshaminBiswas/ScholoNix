"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  FileCheck2,
  UserPlus,
  Download,
  Pencil,
  ExternalLink,
  User,
  Users,
  GraduationCap,
  FileText,
} from "lucide-react";
import {
  ADMISSION_STATUS_META,
  DOCUMENT_VERIFICATION_META,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type AdmissionUploadedDocument,
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
  onEditApplication?: (application: AdmissionApplicationRecord) => void;
  canWrite: boolean;
  canVerify: boolean;
  onSave: (
    applicationId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
      verificationNotes?: string;
    },
  ) => Promise<unknown>;
}

function formatDocSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDetailAddress(addr?: {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
} | null): string {
  if (!addr) return "Not provided";
  const parts = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  return parts.length > 0 ? parts.join(", ") : "Not provided";
}

export function ApplicationDetailModal({
  application,
  schoolSlug,
  onClose,
  onEditApplication,
  canWrite,
  canVerify,
  onSave,
}: ApplicationDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useNativeDialogSync(dialogRef, Boolean(application), onClose);

  const [status, setStatus] = useState<AdmissionApplicationStatusType>("UNDER_REVIEW");
  const [verificationStatus, setVerificationStatus] =
    useState<DocumentVerificationStatusType>("PENDING");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setVerificationStatus(application.verificationStatus);
      setVerificationNotes(application.verificationNotes || "");
      setErrorMsg(null);
    }
  }, [application]);

  if (!application) return null;

  const statusMeta = ADMISSION_STATUS_META[status];
  const verMeta = DOCUMENT_VERIFICATION_META[verificationStatus];
  const sd = application.studentDetails;
  const gd = application.guardianDetails;
  const ad = application.academicDetails;

  const studentPhotoUrl =
    schoolSlug && application.studentPhotoKey
      ? `/api/school/admissions/documents/view?schoolSlug=${encodeURIComponent(schoolSlug)}&key=${encodeURIComponent(application.studentPhotoKey)}`
      : null;

  const uploadedDocs: AdmissionUploadedDocument[] = (() => {
    const docs = [...(application.uploadedDocuments ?? [])];
    if (
      application.studentPhotoKey &&
      !docs.some(
        (d) =>
          d.docType === "student_photo" || d.storageKey === application.studentPhotoKey,
      )
    ) {
      docs.unshift({
        key: "student_photo",
        docType: "student_photo",
        label: "Student Photograph",
        fileName: "student-photo.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 0,
        storageKey: application.studentPhotoKey,
        uploadedAt: application.appliedAt,
      });
    }
    return docs;
  })();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);
    try {
      await onSave(application.id, {
        status,
        verificationStatus,
        verificationNotes,
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
      className="m-auto w-[min(96vw,840px)] max-h-[92vh] overflow-y-auto school-menu-scrollbar rounded-[22px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#DFE3F5] bg-white px-6 py-4 dark:border-[#232746] dark:bg-[#141731]">
        <div className="flex items-center gap-3 min-w-0">
          {studentPhotoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={studentPhotoUrl}
              alt={application.studentName}
              className="h-11 w-11 shrink-0 rounded-[12px] border border-[#D6DBF0] object-cover dark:border-[#2E345B]"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id="app-detail-dialog-title"
                className="text-base font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]"
              >
                {application.studentName} · {application.applicationCode}
              </h1>
              {application.studentIdNumber && (
                <span className="rounded-md bg-[#EDE7FF] px-2 py-0.5 text-[11px] font-mono font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  Student ID: {application.studentIdNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              {application.gradeApplied} · {application.academicYear} ·{" "}
              {application.admissionType === "TRANSFER" ? "Transfer Admission" : "Fresh Admission"}
              {application.admissionNumber ? ` · Admission No: ${application.admissionNumber}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canWrite && onEditApplication && (
            <button
              type="button"
              onClick={() => onEditApplication(application)}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Application</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close application details"
            className="rounded-full p-1.5 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245] dark:hover:text-[#F3F5FF]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-5">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        {/* Section 1: Complete Student Details & Residential Address */}
        <section className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 text-xs dark:border-[#272B4D] dark:bg-[#10142C] space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
              1. Student Details &amp; Residential Address
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2.5">
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Full Name:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">{application.studentName}</strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Date of Birth:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {application.dateOfBirth || "Not provided"}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Gender:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {application.gender || "Not provided"}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Nationality:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {application.nationality || "Not provided"}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Grade Applying For:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">{application.gradeApplied}</strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Blood Group:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {application.bloodGroup || "Not provided"}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Student ID:</span>{" "}
              <strong className="font-mono text-[#663CF6] dark:text-[#C4B5FD]">
                {application.studentIdNumber || "Pending"}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Student Email:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {sd?.email || "Not provided"}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Student Phone:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {sd?.phone || "Not provided"}
              </strong>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Residential Address:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {formatDetailAddress(sd?.address)}
              </strong>
            </div>
          </div>
        </section>

        {/* Section 2: Complete Parent / Guardian Information */}
        <section className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 text-xs dark:border-[#272B4D] dark:bg-[#10142C] space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
              2. Parent / Guardian Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-[12px] border border-[#DFE3F5] bg-white p-3 space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]">
              <p className="text-[11px] font-extrabold text-[#663CF6] dark:text-[#CBB8FF]">
                Primary Parent / Guardian
              </p>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Name:</span>{" "}
                <strong>{gd?.primary?.fullName || application.guardianName}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Relationship:</span>{" "}
                <strong>{gd?.primary?.relationship || application.guardianRelation}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Occupation:</span>{" "}
                <strong>{gd?.primary?.occupation || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Annual Income:</span>{" "}
                <strong>{gd?.primary?.annualIncome || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Email:</span>{" "}
                <strong>{gd?.primary?.email || application.guardianEmail || "Not provided"}</strong>
              </div>
              <div>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Phone:</span>{" "}
                <strong>{gd?.primary?.phone || application.guardianPhone}</strong>
              </div>
            </div>

            {gd?.secondary?.fullName ? (
              <div className="rounded-[12px] border border-[#DFE3F5] bg-white p-3 space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]">
                <p className="text-[11px] font-extrabold text-[#663CF6] dark:text-[#CBB8FF]">
                  Secondary Parent / Guardian
                </p>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Name:</span>{" "}
                  <strong>{gd.secondary.fullName}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Relationship:</span>{" "}
                  <strong>{gd.secondary.relationship || "Mother"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Occupation:</span>{" "}
                  <strong>{gd.secondary.occupation || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Annual Income:</span>{" "}
                  <strong>{gd.secondary.annualIncome || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Email:</span>{" "}
                  <strong>{gd.secondary.email || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Phone:</span>{" "}
                  <strong>{gd.secondary.phone || "Not provided"}</strong>
                </div>
              </div>
            ) : (
              <div className="rounded-[12px] border border-dashed border-[#DFE3F5] bg-white/70 p-3 flex items-center justify-center text-center text-[#76799C] dark:border-[#272B4D] dark:bg-[#141731]/60 dark:text-[#9DA6CC]">
                No secondary parent/guardian details added.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Emergency Contact:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {gd?.emergencyContactNumber || application.guardianPhone}
              </strong>
            </div>
            <div>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Preferred Communication:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {gd?.preferredCommunicationMode || "Phone"}
              </strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#76799C] dark:text-[#9DA6CC]">Guardian Address:</span>{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                {gd?.sameAsStudentAddress
                  ? `${formatDetailAddress(sd?.address)} (Same as Student Address)`
                  : formatDetailAddress(gd?.address)}
              </strong>
            </div>
          </div>
        </section>

        {/* Section 3: Academic Details & Previous Performance */}
        <section className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 text-xs dark:border-[#272B4D] dark:bg-[#10142C] space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
              3. Academic Details (
              {application.admissionType === "TRANSFER" ? "Transfer Admission" : "Fresh Admission"})
            </h2>
          </div>

          {application.admissionType === "TRANSFER" && ad ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2.5">
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Previous School:</span>{" "}
                  <strong>{ad.previousSchoolName || application.previousSchool || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Board / Curriculum:</span>{" "}
                  <strong>{ad.boardCurriculum || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Last Standard Studied:</span>{" "}
                  <strong>{ad.lastStandardStudied || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Year of Completion:</span>{" "}
                  <strong>{ad.yearOfCompletion || "Not provided"}</strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Last Standard Marks:</span>{" "}
                  <strong>
                    {ad.marksObtained != null
                      ? `${ad.marksObtained} / ${ad.totalMarks ?? "—"}`
                      : "Not provided"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Percentage:</span>{" "}
                  <strong className="text-[#663CF6] dark:text-[#C4B5FD]">
                    {ad.percentage != null ? `${ad.percentage.toFixed(1)}%` : "Not provided"}
                  </strong>
                </div>
                {ad.schoolAddress && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">Previous School Address:</span>{" "}
                    <strong>{ad.schoolAddress}</strong>
                  </div>
                )}
              </div>

              {ad.previousAcademics && ad.previousAcademics.length > 0 && (
                <div className="overflow-x-auto rounded-[10px] border border-[#DFE3F5] bg-white dark:border-[#272B4D] dark:bg-[#141731]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase tracking-wider text-[#4D5072] dark:bg-[#1B1F3F] dark:text-[#B4BDD9]">
                      <tr>
                        <th className="px-3 py-2">Academic Year</th>
                        <th className="px-3 py-2">Standard / Class</th>
                        <th className="px-3 py-2">Marks Obtained</th>
                        <th className="px-3 py-2">Total Marks</th>
                        <th className="px-3 py-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                      {ad.previousAcademics.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 font-semibold">{row.academicYear}</td>
                          <td className="px-3 py-2">{row.standard}</td>
                          <td className="px-3 py-2 tabular-nums">{row.marksObtained}</td>
                          <td className="px-3 py-2 tabular-nums">{row.totalMarks}</td>
                          <td className="px-3 py-2 font-bold text-[#663CF6] tabular-nums dark:text-[#C4B5FD]">
                            {row.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#4D5072] dark:text-[#9DA6CC]">
              Fresh Admission — prior academic mark sheets are not required.
              {application.previousSchool ? ` Previous School: ${application.previousSchool}` : ""}
            </p>
          )}
        </section>

        {/* Section 4: Uploaded Documents ONLY */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h2 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Uploaded Documents ({uploadedDocs.length})
            </h2>
          </div>

          {uploadedDocs.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#DFE3F5] bg-[#FAF8FE]/70 px-4 py-4 text-xs text-[#76799C] dark:border-[#272B4D] dark:bg-[#10142C]/60 dark:text-[#9DA6CC]">
              No documents have been uploaded for this application.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {uploadedDocs.map((doc) => {
                const viewHref = schoolSlug
                  ? `/api/school/admissions/documents/view?schoolSlug=${encodeURIComponent(schoolSlug)}&key=${encodeURIComponent(doc.storageKey)}`
                  : null;
                return (
                  <div
                    key={`${doc.key}-${doc.storageKey}`}
                    className="flex items-center justify-between gap-2 rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {doc.label}
                      </p>
                      <p className="text-[11px] text-[#76799C] truncate dark:text-[#9DA6CC]">
                        {doc.fileName}
                        {doc.sizeBytes > 0 ? ` · ${formatDocSize(doc.sizeBytes)}` : ""}
                      </p>
                    </div>
                    {viewHref && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={viewHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C4B5FD]"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          <span>View</span>
                        </a>
                        <a
                          href={viewHref}
                          download={doc.fileName}
                          aria-label={`Download ${doc.label}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#CAD0EB] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C5CCF0]"
                        >
                          <Download className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Status & Verification Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#DFE3F5] dark:border-[#232746]">
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
          <div className="flex flex-wrap items-center gap-2">
            {schoolSlug && !application.isDraft && (
              <a
                href={`/api/school/admissions/applications/${encodeURIComponent(application.id)}/pdf?schoolSlug=${encodeURIComponent(schoolSlug)}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#B9C1E8] bg-[#FAF8FE] px-3.5 py-2 text-xs font-bold text-[#4F27E8] hover:border-[#663CF6] dark:border-[#3A4173] dark:bg-[#10142C] dark:text-[#C4B5FD]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download A4 PDF</span>
              </a>
            )}
            {canWrite && onEditApplication && (
              <button
                type="button"
                onClick={() => onEditApplication(application)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#30365C] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit Full Form</span>
              </button>
            )}
          </div>
          <div className="flex justify-end gap-2">
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
        </div>
      </form>
    </dialog>
  );
}
