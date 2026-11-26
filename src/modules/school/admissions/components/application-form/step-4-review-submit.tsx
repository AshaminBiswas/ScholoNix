"use client";

import React from "react";
import {
  FileText,
  User,
  Users,
  GraduationCap,
  Calendar,
  MapPin,
  Pencil,
  Info,
  Eye,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import type { AdmissionUploadedDocument } from "@/modules/school/admissions/types";
import {
  buildDocumentViewUrl,
  computeAgeFromDob,
  computePercentageString,
  formatFileSize,
  type ApplicationWizardFormState,
} from "./wizard-types";

interface Step4ReviewSubmitProps {
  schoolSlug: string;
  state: ApplicationWizardFormState;
  onJumpToStep: (step: 1 | 2 | 3) => void;
  onChange: (patch: Partial<ApplicationWizardFormState>) => void;
  onPreviewDoc: (doc: AdmissionUploadedDocument) => void;
}

export function Step4ReviewSubmit({
  schoolSlug,
  state,
  onJumpToStep,
  onChange,
  onPreviewDoc,
}: Step4ReviewSubmitProps) {
  const ageLabel = computeAgeFromDob(state.dateOfBirth);
  const formattedDob = state.dateOfBirth
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${state.dateOfBirth}T00:00:00Z`))
    : "—";

  const studentAddressText = [
    state.studentAddressLine1,
    state.studentAddressLine2,
    state.studentCity,
    state.studentState,
    state.studentPostalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const docEntries = Object.values(state.uploadedDocuments).filter(
    (doc): doc is AdmissionUploadedDocument => Boolean(doc && doc.docType !== "student_photo"),
  );

  const photoUrl = state.studentPhotoKey
    ? buildDocumentViewUrl(schoolSlug, state.studentPhotoKey)
    : null;

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#D6DBF0] bg-white shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-[#663CF6] via-[#7C5CFF] to-[#93C5FD] px-5 py-3.5 text-white dark:from-[#4F27E8] dark:via-[#663CF6] dark:to-[#3B82F6]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/15">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-white">Review &amp; Submit Application</h3>
            <p className="text-[11px] text-white/90">
              Please review all the information below before submitting your application.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Top Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 text-xs dark:border-[#272B4D] dark:bg-[#10142C]">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 shrink-0 text-[#663CF6] dark:text-[#A78BFA]" />
            <div>
              <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                Student Name
              </p>
              <p className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {state.studentName || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-4 w-4 shrink-0 text-[#663CF6] dark:text-[#A78BFA]" />
            <div>
              <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                Admission Type
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {state.admissionType === "FRESH" ? "Fresh Admission" : "Transfer Admission"}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {state.admissionType === "FRESH" ? "New Student" : "Transfer"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-4 w-4 shrink-0 text-[#663CF6] dark:text-[#A78BFA]" />
            <div>
              <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                Grade Applying For
              </p>
              <p className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {state.gradeApplied || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-[#663CF6] dark:text-[#A78BFA]" />
            <div>
              <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                Academic Year
              </p>
              <p className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {state.academicYear}
              </p>
            </div>
          </div>
        </div>

        {/* Review Card 1: Student Details */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-white p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-2.5 dark:border-[#232746]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Student Details
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:text-[#A78BFA]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 text-xs">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] flex items-center justify-center dark:border-[#272B4D] dark:bg-[#141731]">
              {photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoUrl}
                  alt={state.studentName || "Student photograph"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-[#9DA6CC]" />
              )}
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 flex-1">
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-[#76799C] dark:text-[#9DA6CC]">Full Name:</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {state.studentName || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-[#76799C] dark:text-[#9DA6CC]">Date of Birth:</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {formattedDob}
                  {ageLabel ? ` (Age: ${ageLabel})` : ""}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-[#76799C] dark:text-[#9DA6CC]">Gender:</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {state.gender || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-[#76799C] dark:text-[#9DA6CC]">
                  Grade Applying For:
                </dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {state.gradeApplied || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-[#76799C] dark:text-[#9DA6CC]">Nationality:</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {state.nationality || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-[#76799C] dark:text-[#9DA6CC]">Blood Group:</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {state.bloodGroup || "Optional (Not specified)"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Review Card 2: Parent / Guardian Information */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-white p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-2.5 dark:border-[#232746]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Parent / Guardian Information
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:text-[#A78BFA]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 space-y-1 dark:border-[#272B4D] dark:bg-[#141731]">
              <span className="inline-block rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#663CF6] mb-1 dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                Primary Guardian ({state.primaryRelationship})
              </span>
              <p>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Name:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {state.primaryName || "—"}
                </strong>
              </p>
              <p>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Occupation:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {state.primaryOccupation || "—"}
                </strong>
              </p>
              <p>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Annual Income:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {state.primaryAnnualIncome || "—"}
                </strong>
              </p>
              <p>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Email:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {state.primaryEmail || "—"}
                </strong>
              </p>
              <p>
                <span className="text-[#76799C] dark:text-[#9DA6CC]">Phone:</span>{" "}
                <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                  {state.primaryPhone || "—"}
                </strong>
              </p>
            </div>

            <div className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 space-y-1 dark:border-[#272B4D] dark:bg-[#141731]">
              <span className="inline-block rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#663CF6] mb-1 dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                Secondary Guardian ({state.secondaryRelationship})
              </span>
              {state.secondaryName ? (
                <>
                  <p>
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">Name:</span>{" "}
                    <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                      {state.secondaryName}
                    </strong>
                  </p>
                  <p>
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">Occupation:</span>{" "}
                    <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                      {state.secondaryOccupation || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">Annual Income:</span>{" "}
                    <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                      {state.secondaryAnnualIncome || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">Email:</span>{" "}
                    <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                      {state.secondaryEmail || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-[#76799C] dark:text-[#9DA6CC]">Phone:</span>{" "}
                    <strong className="text-[#08093B] dark:text-[#F3F5FF]">
                      {state.secondaryPhone || "—"}
                    </strong>
                  </p>
                </>
              ) : (
                <p className="text-[#76799C] dark:text-[#9DA6CC]">Not provided</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-[10px] border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#141731]">
            <MapPin className="h-4 w-4 shrink-0 text-[#663CF6] mt-0.5 dark:text-[#A78BFA]" />
            <div>
              <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">Address:</span>{" "}
              <span className="text-[#4D5072] dark:text-[#C5CCF0]">
                {studentAddressText || "—"}
              </span>
              <span className="ml-3 text-[#76799C] dark:text-[#9DA6CC]">
                · Emergency: <strong>{state.emergencyContactNumber || "—"}</strong> (
                {state.preferredCommunicationMode})
              </span>
            </div>
          </div>
        </div>

        {/* Review Card 3: Academic Details */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-white p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-2.5 dark:border-[#232746]">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Academic Details{" "}
                <span className="font-medium text-[#76799C] dark:text-[#9DA6CC]">
                  ({state.admissionType === "FRESH" ? "Fresh Admission" : "Transfer Admission"})
                </span>
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onJumpToStep(3)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:text-[#A78BFA]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>

          {state.admissionType === "FRESH" ? (
            <div className="flex items-center gap-2 rounded-[10px] border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200">
              <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>As this is a Fresh Admission, previous academic records are not required.</span>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Previous School:</span>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {state.previousSchoolName || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Board:</span>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {state.boardCurriculum || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Last Standard:</span>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {state.lastStandardStudied || "—"} ({state.yearOfCompletion || "—"})
                  </p>
                </div>
                <div>
                  <span className="text-[#76799C] dark:text-[#9DA6CC]">Last Marks:</span>
                  <p className="font-bold text-[#663CF6] dark:text-[#A78BFA]">
                    {state.marksObtained || 0} / {state.totalMarks || 0} (
                    {computePercentageString(state.marksObtained, state.totalMarks)})
                  </p>
                </div>
              </div>
              {state.previousAcademics.length > 0 && (
                <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                  Additional prior years recorded: {state.previousAcademics.length}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Review Card 4: Uploaded Documents */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-white p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-2.5 dark:border-[#232746]">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
              <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Uploaded Documents ({docEntries.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onJumpToStep(3)}
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:text-[#A78BFA]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          </div>

          {docEntries.length === 0 ? (
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No supporting documents uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {docEntries.map((doc) => (
                <div
                  key={doc.key}
                  className="relative rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 text-center space-y-1.5 dark:border-[#272B4D] dark:bg-[#141731]"
                >
                  <CheckCircle2
                    className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    {doc.label}
                  </p>
                  <p className="truncate text-[11px] text-[#4D5072] dark:text-[#C5CCF0]">
                    {doc.fileName}
                  </p>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                    ({formatFileSize(doc.sizeBytes)})
                  </p>
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(doc)}
                    aria-label={`Preview ${doc.label}`}
                    className="inline-flex items-center justify-center rounded-[8px] border border-[#D6DBF0] bg-white px-3 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#A78BFA]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Declaration */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2 dark:border-[#272B4D] dark:bg-[#10142C]">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
            <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Declaration <span className="text-rose-500">*</span>
            </h4>
          </div>
          <label className="flex items-start gap-2.5 text-xs text-[#1B1D45] cursor-pointer dark:text-[#DCE1F9]">
            <input
              id="wiz-declaration-checkbox"
              type="checkbox"
              checked={state.declarationAccepted}
              onChange={(e) => onChange({ declarationAccepted: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-[#663CF6] shrink-0"
            />
            <span>
              I hereby declare that all the information provided in this application is true, complete and correct to the best of my knowledge. I understand that any false information may lead to cancellation of the admission.
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
