"use client";

import React, { useState } from "react";
import type {
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
  AdmissionEnquiryStatusType,
  SchoolStaffOption,
} from "@/modules/school/admissions/types";
import {
  ENQUIRY_TYPE_OPTIONS,
  FOLLOW_UP_TIME_SLOTS,
  INDIAN_STATES,
  RELATION_OPTIONS,
} from "./enquiry-shared";

interface EnquiryFormPageProps {
  mode: "create" | "edit";
  initialEnquiry?: AdmissionEnquiryRecord | null;
  sources: AdmissionEnquirySourceRecord[];
  availableGrades: string[];
  availableAcademicYears: string[];
  currentAcademicYear: string;
  staffOptions: SchoolStaffOption[];
  onCancel: () => void;
  onSubmit: (payload: {
    mode: "create" | "edit";
    enquiryId?: string;
    data: Record<string, unknown>;
  }) => Promise<void>;
}

export function EnquiryFormPage({
  mode,
  initialEnquiry,
  sources,
  availableGrades,
  availableAcademicYears,
  currentAcademicYear,
  staffOptions,
  onCancel,
  onSubmit,
}: EnquiryFormPageProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [enquiryDate, setEnquiryDate] = useState(
    initialEnquiry?.enquiryDate ? initialEnquiry.enquiryDate.slice(0, 10) : todayStr,
  );
  const [academicYear, setAcademicYear] = useState(
    initialEnquiry?.academicYear || currentAcademicYear,
  );
  const [source, setSource] = useState(
    initialEnquiry?.source || sources.find((s) => s.isActive)?.name || "Walk-In",
  );
  const [enquiryType, setEnquiryType] = useState(
    initialEnquiry?.enquiryType || "Admission Enquiry",
  );
  const [status, setStatus] = useState<AdmissionEnquiryStatusType>(
    initialEnquiry?.status || "NEW",
  );

  const [studentName, setStudentName] = useState(initialEnquiry?.studentName || "");
  const [studentDob, setStudentDob] = useState(initialEnquiry?.studentDob || "");
  const [studentGender, setStudentGender] = useState<"Male" | "Female" | "Other">(
    (initialEnquiry?.studentGender as "Male" | "Female" | "Other") || "Male",
  );
  const [gradeApplied, setGradeApplied] = useState(
    initialEnquiry?.gradeApplied || availableGrades[0] || "",
  );

  const [guardianName, setGuardianName] = useState(initialEnquiry?.guardianName || "");
  const [guardianRelation, setGuardianRelation] = useState(
    initialEnquiry?.guardianRelation || "Father",
  );
  const [guardianPhone, setGuardianPhone] = useState(initialEnquiry?.guardianPhone || "");
  const [guardianEmail, setGuardianEmail] = useState(initialEnquiry?.guardianEmail || "");

  const [addressLine1, setAddressLine1] = useState(initialEnquiry?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(initialEnquiry?.addressLine2 || "");
  const [city, setCity] = useState(initialEnquiry?.city || "");
  const [state, setState] = useState(initialEnquiry?.state || "");
  const [pinCode, setPinCode] = useState(initialEnquiry?.pinCode || "");

  const [notes, setNotes] = useState(initialEnquiry?.notes || "");

  const [scheduleFollowUp, setScheduleFollowUp] = useState(mode === "create");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:30");
  const [assignToId, setAssignToId] = useState(initialEnquiry?.assignedToUserId || "");

  const [hasSiblings, setHasSiblings] = useState(
    Boolean(initialEnquiry?.hasSiblingsInSchool),
  );
  const [interestedTransport, setInterestedTransport] = useState(
    Boolean(initialEnquiry?.interestedInTransport),
  );
  const [interestedHostel, setInterestedHostel] = useState(
    Boolean(initialEnquiry?.interestedInHostel),
  );
  const [specialSupport, setSpecialSupport] = useState(
    Boolean(initialEnquiry?.requiresSpecialSupport),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    setStudentName("");
    setStudentDob("");
    setGuardianName("");
    setGuardianPhone("");
    setGuardianEmail("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPinCode("");
    setNotes("");
    setFollowUpDate("");
    setHasSiblings(false);
    setInterestedTransport(false);
    setInterestedHostel(false);
    setSpecialSupport(false);
    setError(null);
  };

  async function submitForm(isDraft: boolean) {
    setError(null);
    if (!studentName.trim() || !guardianName.trim() || !guardianPhone.trim() || !gradeApplied) {
      setError(
        "Please complete required fields: Student Name, Grade Interested, Parent/Enquirer Name, and Phone Number.",
      );
      return;
    }

    const assignedStaff = staffOptions.find((s) => s.id === assignToId);
    const initialFollowUp =
      mode === "create" && scheduleFollowUp && followUpDate
        ? {
            followUpType: "Phone Call",
            scheduledAt: new Date(`${followUpDate}T${followUpTime}:00+05:30`).toISOString(),
            assignedToUserId: assignedStaff?.id || null,
            assignedToName: assignedStaff?.name || null,
            notes: notes.trim() || "Initial follow-up scheduled.",
          }
        : undefined;

    setSubmitting(true);
    try {
      await onSubmit({
        mode,
        enquiryId: initialEnquiry?.id,
        data: {
          enquiryDate,
          academicYear,
          source,
          enquiryType,
          status,
          studentName: studentName.trim(),
          studentDob,
          studentGender,
          gradeApplied,
          guardianName: guardianName.trim(),
          guardianRelation,
          guardianPhone: guardianPhone.trim(),
          guardianEmail: guardianEmail.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state,
          pinCode: pinCode.trim(),
          assignedToUserId: assignedStaff?.id || null,
          assignedToName: assignedStaff?.name || null,
          hasSiblingsInSchool: hasSiblings,
          interestedInTransport: interestedTransport,
          interestedInHostel: interestedHostel,
          requiresSpecialSupport: specialSupport,
          isDraft,
          notes: notes.trim(),
          ...(initialFollowUp ? { initialFollowUp } : {}),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeSources = sources.filter((s) => s.isActive || s.name === source);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            {mode === "edit" ? `Edit Enquiry (${initialEnquiry?.enquiryCode})` : "Create Enquiry"}
          </h2>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Add a new admission enquiry and capture prospect details.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#1B1D45] hover:bg-[#F5F7FD] dark:border-[#313761] dark:bg-[#171B36] dark:text-[#DCE1F9]"
        >
          &larr; Back to Enquiry List
        </button>
      </div>

      <div className="rounded-[18px] bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] p-5 text-white shadow-sm">
        <h3 className="text-base font-extrabold">
          {mode === "edit" ? "Update Enquiry Profile" : "New Enquiry"}
        </h3>
        <p className="text-xs text-violet-100 mt-0.5">
          Capture details of a prospective student and their admission interest.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[14px] border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* Row 1: Enquiry Information + Enquiry Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Enquiry Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Enquiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={enquiryDate}
                onChange={(e) => setEnquiryDate(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                {availableAcademicYears.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Source <span className="text-rose-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                {activeSources.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Enquiry Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={enquiryType}
                onChange={(e) => setEnquiryType(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                {ENQUIRY_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Enquiry Status
          </h4>
          <div>
            <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdmissionEnquiryStatusType)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="NEW">Open</option>
              <option value="CONTACTED">Contacted</option>
              <option value="FOLLOW_UP">Follow-up Due</option>
              <option value="CONVERTED">Converted</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="rounded-xl border border-[#E5E9F8] bg-[#F5F7FD] p-3 text-[11px] text-[#4D5072] dark:border-[#272B4D] dark:bg-[#191D3D] dark:text-[#9DA6CC]">
            You can update the status and schedule follow-ups after creating the enquiry.
          </div>
        </section>
      </div>

      {/* Row 2: Student Details */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
          Student Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
              Student Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name"
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={studentDob}
              onChange={(e) => setStudentDob(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1.5">
              Gender <span className="text-rose-500">*</span>
            </span>
            <div className="flex items-center gap-5 py-1.5">
              {(["Male", "Female", "Other"] as const).map((g) => (
                <label
                  key={g}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#1B1D45] dark:text-[#DCE1F9] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="enquiry-gender"
                    value={g}
                    checked={studentGender === g}
                    onChange={() => setStudentGender(g)}
                    className="accent-[#7C3AED]"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
              Grade Interested <span className="text-rose-500">*</span>
            </label>
            <select
              value={gradeApplied}
              onChange={(e) => setGradeApplied(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="">Select grade</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Row 3: Parent/Enquirer + Address */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Parent / Enquirer Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Parent / Enquirer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Enter parent / enquirer name"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Relation with Student <span className="text-rose-500">*</span>
              </label>
              <select
                value={guardianRelation}
                onChange={(e) => setGuardianRelation(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                {RELATION_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Address</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Enter house / street / area"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Enter landmark (optional)"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Enter PIN code"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Row 4: Enquiry Details + Follow-up Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2 dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Enquiry Details
          </h4>
          <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9]">
            Enquiry / Requirements
          </label>
          <textarea
            rows={4}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter enquiry details, questions, or specific requirements (e.g., admission process, fees, transport, facilities, etc.)"
            className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
          />
          <div className="text-right text-[10px] text-[#76799C] dark:text-[#8A94B8]">
            {notes.length} / 500
          </div>
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Follow-up Plan &amp; Assignment
          </h4>
          {mode === "create" && (
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B1D45] dark:text-[#DCE1F9] cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleFollowUp}
                onChange={(e) => setScheduleFollowUp(e.target.checked)}
                className="accent-[#7C3AED]"
              />
              Schedule a follow-up for this enquiry
            </label>
          )}
          {scheduleFollowUp && mode === "create" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Follow-up Time
                </label>
                <select
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                >
                  {FOLLOW_UP_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
              Assign To
            </label>
            <select
              value={assignToId}
              onChange={(e) => setAssignToId(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="">Select staff member</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>

      {/* Additional Information (Optional) */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
          Additional Information <span className="font-medium text-xs text-[#76799C]">(Optional)</span>
        </h4>
        <div className="flex flex-wrap items-center gap-6">
          {[
            { label: "Siblings in School", checked: hasSiblings, toggle: setHasSiblings },
            {
              label: "Interested in Transport",
              checked: interestedTransport,
              toggle: setInterestedTransport,
            },
            {
              label: "Interested in Hostel",
              checked: interestedHostel,
              toggle: setInterestedHostel,
            },
            {
              label: "Requires Special Support",
              checked: specialSupport,
              toggle: setSpecialSupport,
            },
          ].map((opt) => (
            <label
              key={opt.label}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#1B1D45] dark:text-[#DCE1F9] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={opt.checked}
                onChange={(e) => opt.toggle(e.target.checked)}
                className="h-4 w-4 rounded accent-[#7C3AED]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {/* Footer Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-[#D6DBF0] bg-white px-5 py-2.5 text-xs font-bold text-[#1B1D45] hover:bg-[#F5F7FD] dark:border-[#313761] dark:bg-[#171B36] dark:text-[#DCE1F9]"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submitForm(true)}
          className="rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-5 py-2.5 text-xs font-bold text-[#1B1D45] hover:bg-[#EAEFF9] disabled:opacity-50 dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
        >
          Save as Draft
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submitForm(false)}
          className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : "+ Create Enquiry"}
        </button>
      </div>
    </div>
  );
}
