"use client";

import React, { useRef, useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Upload,
  Loader2,
  GraduationCap,
  Trash2,
} from "lucide-react";
import type { AdmissionUploadedDocument } from "@/modules/school/admissions/types";
import {
  INDIAN_STATES,
  NATIONALITY_OPTIONS,
  buildDocumentViewUrl,
  type ApplicationWizardFormState,
} from "./wizard-types";

interface Step1StudentDetailsProps {
  schoolSlug: string;
  state: ApplicationWizardFormState;
  availableGrades: string[];
  onChange: (patch: Partial<ApplicationWizardFormState>) => void;
}

export function Step1StudentDetails({
  schoolSlug,
  state,
  availableGrades,
  onChange,
}: Step1StudentDetailsProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const photoDoc = state.uploadedDocuments.student_photo;
  const photoPreviewUrl = state.studentPhotoKey
    ? buildDocumentViewUrl(schoolSlug, state.studentPhotoKey)
    : null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", "student_photo");
      formData.append("label", "Student Photograph");

      const res = await fetch(
        `/api/school/admissions/documents?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        { method: "POST", body: formData },
      );
      const json = await res.json();
      if (!res.ok || !json.success || !json.document) {
        throw new Error(json?.error?.message || "Failed to upload photo.");
      }
      const doc = json.document as AdmissionUploadedDocument;
      onChange({
        studentPhotoKey: doc.storageKey,
        uploadedDocuments: {
          ...state.uploadedDocuments,
          student_photo: doc,
        },
      });
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    const nextDocs = { ...state.uploadedDocuments };
    delete nextDocs.student_photo;
    onChange({
      studentPhotoKey: null,
      uploadedDocuments: nextDocs,
    });
  };

  const inputClass =
    "w-full rounded-[11px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-medium text-[#08093B] placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#EDE7FF] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD] dark:focus:border-[#8B5CF6] dark:focus:ring-[#8B5CF6]/25";

  return (
    <div className="space-y-4">
      {/* Main Gradient Card: Student Details */}
      <section className="overflow-hidden rounded-[20px] border border-[#D6DBF0] bg-white shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="bg-gradient-to-r from-[#663CF6] via-[#7C5CFF] to-[#93C5FD] px-5 py-3.5 text-white dark:from-[#4F27E8] dark:via-[#663CF6] dark:to-[#3B82F6]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/15">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">Student Details</h3>
              <p className="text-[11px] text-white/90">
                Enter the student&apos;s personal information
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Photo Box */}
          <div className="md:col-span-4 rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 flex flex-col items-center justify-center text-center dark:border-[#2A2F58] dark:bg-[#10142C]">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoSelect}
              className="sr-only"
              aria-label="Upload student photo"
            />
            {photoPreviewUrl ? (
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-md dark:border-[#272B4D]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreviewUrl}
                  alt={state.studentName || "Student photograph"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#EDE7FF] to-[#DBEAFE] text-[#663CF6] dark:from-[#251D4A] dark:to-[#172554] dark:text-[#C4B5FD]">
                <GraduationCap className="h-12 w-12" aria-hidden="true" />
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#08093B] shadow-2xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
              >
                {photoUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                )}
                <span>{photoDoc ? "Change Photo" : "Upload Photo"}</span>
              </button>
              {photoDoc && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label="Remove student photo"
                  className="rounded-[10px] border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer dark:border-rose-800/70 dark:bg-[#141731] dark:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
              JPG, PNG (Max 2MB)
            </p>
            {photoError && (
              <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {photoError}
              </p>
            )}
          </div>

          {/* Right Form Fields */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="wiz-student-name"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="wiz-student-name"
                type="text"
                required
                value={state.studentName}
                onChange={(e) => onChange({ studentName: e.target.value })}
                placeholder="Enter student's full name"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="wiz-student-dob"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
                <input
                  id="wiz-student-dob"
                  type="date"
                  required
                  value={state.dateOfBirth}
                  onChange={(e) => onChange({ dateOfBirth: e.target.value })}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="wiz-student-gender"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                id="wiz-student-gender"
                value={state.gender}
                onChange={(e) =>
                  onChange({ gender: e.target.value as "" | "Male" | "Female" | "Other" })
                }
                className={inputClass}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="wiz-student-nationality"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Nationality <span className="text-rose-500">*</span>
              </label>
              <select
                id="wiz-student-nationality"
                value={state.nationality}
                onChange={(e) => onChange({ nationality: e.target.value })}
                className={inputClass}
              >
                <option value="">Select Nationality</option>
                {NATIONALITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="wiz-student-grade"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Grade Applying For <span className="text-rose-500">*</span>
              </label>
              <select
                id="wiz-student-grade"
                value={state.gradeApplied}
                onChange={(e) => onChange({ gradeApplied: e.target.value })}
                className={inputClass}
              >
                <option value="">Select Grade</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="wiz-student-id"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Student ID (if any)
              </label>
              <input
                id="wiz-student-id"
                type="text"
                value={state.studentIdNumber}
                onChange={(e) => onChange({ studentIdNumber: e.target.value })}
                placeholder="Enter Student ID"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <Phone className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Contact Information
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Enter contact details for the student
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="wiz-student-email"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
              <input
                id="wiz-student-email"
                type="email"
                value={state.studentEmail}
                onChange={(e) => onChange({ studentEmail: e.target.value })}
                placeholder="Enter email address"
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="wiz-student-phone"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
              <input
                id="wiz-student-phone"
                type="tel"
                value={state.studentPhone}
                onChange={(e) => onChange({ studentPhone: e.target.value })}
                placeholder="Enter phone number"
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Address Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Address</h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Enter the student&apos;s residential address
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="wiz-student-addr1"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Address Line 1 <span className="text-rose-500">*</span>
            </label>
            <input
              id="wiz-student-addr1"
              type="text"
              required
              value={state.studentAddressLine1}
              onChange={(e) => onChange({ studentAddressLine1: e.target.value })}
              placeholder="Enter address line 1"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="wiz-student-addr2"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Address Line 2
            </label>
            <input
              id="wiz-student-addr2"
              type="text"
              value={state.studentAddressLine2}
              onChange={(e) => onChange({ studentAddressLine2: e.target.value })}
              placeholder="Enter address line 2"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="wiz-student-city"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              City <span className="text-rose-500">*</span>
            </label>
            <input
              id="wiz-student-city"
              type="text"
              required
              value={state.studentCity}
              onChange={(e) => onChange({ studentCity: e.target.value })}
              placeholder="Enter city"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="wiz-student-state"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              State <span className="text-rose-500">*</span>
            </label>
            <select
              id="wiz-student-state"
              value={state.studentState}
              onChange={(e) => onChange({ studentState: e.target.value })}
              className={inputClass}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="wiz-student-postal"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Postal Code <span className="text-rose-500">*</span>
            </label>
            <input
              id="wiz-student-postal"
              type="text"
              required
              value={state.studentPostalCode}
              onChange={(e) => onChange({ studentPostalCode: e.target.value })}
              placeholder="Enter postal code"
              className={inputClass}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
