"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  AdmissionApplicationRecord,
  AdmissionUploadedDocument,
} from "@/modules/school/admissions/types";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/modules/school/admissions/schemas";
import { Step1StudentDetails } from "./step-1-student-details";
import { Step2ParentGuardian } from "./step-2-parent-guardian";
import { Step3AcademicDetails } from "./step-3-academic-details";
import { Step4ReviewSubmit } from "./step-4-review-submit";
import {
  buildDocumentViewUrl,
  buildInitialWizardState,
  type ApplicationWizardFormState,
} from "./wizard-types";

interface ApplicationFormWizardProps {
  schoolName: string;
  schoolSlug: string;
  availableGrades: string[];
  availableAcademicYears: string[];
  defaultAcademicYear: string;
  drafts: AdmissionApplicationRecord[];
  canWrite: boolean;
  onViewApplications: () => void;
  onCreateApplication: (payload: CreateApplicationInput) => Promise<AdmissionApplicationRecord>;
  onUpdateApplication: (
    applicationId: string,
    payload: UpdateApplicationInput,
  ) => Promise<AdmissionApplicationRecord>;
}

const WIZARD_STEPS = [
  { step: 1 as const, label: "Student Details" },
  { step: 2 as const, label: "Parent/Guardian Info" },
  { step: 3 as const, label: "Academic Details" },
  { step: 4 as const, label: "Review & Submit" },
];

export function ApplicationFormWizard({
  schoolName,
  schoolSlug,
  availableGrades,
  availableAcademicYears,
  defaultAcademicYear,
  drafts,
  canWrite,
  onViewApplications,
  onCreateApplication,
  onUpdateApplication,
}: ApplicationFormWizardProps) {
  const defaultGrade = availableGrades[0] || "Class I";
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<ApplicationWizardFormState>(() =>
    buildInitialWizardState({ defaultGrade, defaultAcademicYear }),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AdmissionUploadedDocument | null>(null);
  const previewDialogRef = useRef<HTMLDialogElement>(null);

  const progressPct = currentStep * 25;

  const patchState = (patch: Partial<ApplicationWizardFormState>) => {
    setErrorMsg(null);
    setDraftNotice(null);
    setState((prev) => ({ ...prev, ...patch }));
  };

  const handleLoadDraft = (draftId: string) => {
    setErrorMsg(null);
    setDraftNotice(null);
    if (!draftId) {
      setState(buildInitialWizardState({ defaultGrade, defaultAcademicYear }));
      setCurrentStep(1);
      return;
    }
    const found = drafts.find((d) => d.id === draftId);
    if (!found) return;
    setState(buildInitialWizardState({ defaultGrade, defaultAcademicYear, draft: found }));
    const step = found.currentStep;
    setCurrentStep(step === 2 || step === 3 || step === 4 ? step : 1);
  };

  const validateStep = (step: 1 | 2 | 3 | 4): string | null => {
    if (step === 1) {
      if (!state.studentName.trim() || state.studentName.trim().length < 2) {
        return "Please enter the student's full name.";
      }
      if (!state.dateOfBirth) return "Please select Date of Birth.";
      if (!state.gender) return "Please select Gender.";
      if (!state.nationality) return "Please select Nationality.";
      if (!state.gradeApplied) return "Please select Grade Applying For.";
      if (!state.studentAddressLine1.trim()) return "Please enter Address Line 1.";
      if (!state.studentCity.trim()) return "Please enter City.";
      if (!state.studentState.trim()) return "Please select State.";
      if (!state.studentPostalCode.trim()) return "Please enter Postal Code.";
    }
    if (step === 2) {
      if (!state.primaryName.trim() || state.primaryName.trim().length < 2) {
        return "Please enter Primary Parent/Guardian Full Name.";
      }
      if (!state.primaryEmail.trim() || !state.primaryEmail.includes("@")) {
        return "Please enter a valid Primary Parent/Guardian Email Address.";
      }
      if (!state.primaryPhone.trim() || state.primaryPhone.trim().length < 7) {
        return "Please enter a valid Primary Parent/Guardian Phone Number.";
      }
      if (!state.emergencyContactNumber.trim() || state.emergencyContactNumber.trim().length < 7) {
        return "Please enter a valid Emergency Contact Number.";
      }
    }
    if (step === 3) {
      const hasParentAadhaar = Boolean(
        state.uploadedDocuments.father_aadhaar || state.uploadedDocuments.mother_aadhaar,
      );
      if (!hasParentAadhaar) {
        return "Please upload at least one Parent/Guardian Aadhaar Card.";
      }
      if (!state.uploadedDocuments.birth_certificate) {
        return "Please upload the student's Birth Certificate.";
      }
      if (!state.uploadedDocuments.student_aadhaar) {
        return "Please upload the student's Aadhaar Card.";
      }
      if (state.admissionType === "TRANSFER") {
        if (!state.previousSchoolName.trim()) return "Please enter Previous School Name.";
        if (!state.boardCurriculum.trim()) return "Please select Board / Curriculum.";
        if (!state.lastStandardStudied.trim()) return "Please select Last Standard Studied.";
        if (!state.yearOfCompletion.trim()) return "Please select Year of Completion.";
        const total = Number(state.totalMarks);
        const obtained = Number(state.marksObtained);
        if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(obtained) || obtained < 0) {
          return "Please enter valid Total Marks and Marks Obtained.";
        }
        if (obtained > total) {
          return "Marks Obtained cannot exceed Total Marks.";
        }
        if (!state.uploadedDocuments.last_marksheet) {
          return "Please upload the Last Passing Marksheet for Transfer Admission.";
        }
      }
    }
    if (step === 4) {
      if (!state.declarationAccepted) {
        return "Please accept the declaration checkbox before submitting the application.";
      }
    }
    return null;
  };

  const buildPayload = (isDraft: boolean) => {
    const uploadedDocsList = Object.values(state.uploadedDocuments).filter(
      (doc): doc is AdmissionUploadedDocument => Boolean(doc),
    );
    const guardianAddr = state.sameAsStudentAddress
      ? {
          addressLine1: state.studentAddressLine1,
          addressLine2: state.studentAddressLine2,
          city: state.studentCity,
          state: state.studentState,
          postalCode: state.studentPostalCode,
        }
      : {
          addressLine1: state.guardianAddressLine1,
          addressLine2: state.guardianAddressLine2,
          city: state.guardianCity,
          state: state.guardianState,
          postalCode: state.guardianPostalCode,
        };

    const totalNum = state.totalMarks ? Number(state.totalMarks) : null;
    const obtainedNum = state.marksObtained ? Number(state.marksObtained) : null;
    const computedPct =
      totalNum && obtainedNum !== null && totalNum > 0
        ? Math.round((obtainedNum / totalNum) * 1000) / 10
        : null;

    return {
      studentName: state.studentName.trim() || "Draft Student",
      gender: state.gender,
      dateOfBirth: state.dateOfBirth,
      gradeApplied: state.gradeApplied || defaultGrade,
      academicYear: state.academicYear || defaultAcademicYear,
      guardianName: state.primaryName.trim() || "Draft Guardian",
      guardianRelation: state.primaryRelationship || "Father",
      guardianPhone:
        state.primaryPhone.trim().length >= 7 ? state.primaryPhone.trim() : "0000000000",
      guardianEmail: state.primaryEmail.trim(),
      previousSchool:
        state.admissionType === "TRANSFER" ? state.previousSchoolName.trim() : "",
      status: "UNDER_REVIEW" as const,
      notes: "",
      admissionType: state.admissionType,
      isDraft,
      currentStep,
      studentPhotoKey: state.studentPhotoKey,
      nationality: state.nationality,
      bloodGroup: state.bloodGroup,
      studentIdNumber: state.studentIdNumber,
      studentDetails: {
        email: state.studentEmail,
        phone: state.studentPhone,
        address: {
          addressLine1: state.studentAddressLine1,
          addressLine2: state.studentAddressLine2,
          city: state.studentCity,
          state: state.studentState,
          postalCode: state.studentPostalCode,
        },
      },
      guardianDetails: {
        primary: {
          fullName: state.primaryName,
          relationship: state.primaryRelationship,
          occupation: state.primaryOccupation,
          annualIncome: state.primaryAnnualIncome,
          email: state.primaryEmail,
          phone: state.primaryPhone,
        },
        secondary: state.secondaryName.trim()
          ? {
              fullName: state.secondaryName,
              relationship: state.secondaryRelationship,
              occupation: state.secondaryOccupation,
              annualIncome: state.secondaryAnnualIncome,
              email: state.secondaryEmail,
              phone: state.secondaryPhone,
            }
          : null,
        sameAsStudentAddress: state.sameAsStudentAddress,
        address: guardianAddr,
        emergencyContactNumber: state.emergencyContactNumber,
        preferredCommunicationMode: state.preferredCommunicationMode,
      },
      academicDetails:
        state.admissionType === "TRANSFER"
          ? {
              previousSchoolName: state.previousSchoolName,
              boardCurriculum: state.boardCurriculum,
              lastStandardStudied: state.lastStandardStudied,
              yearOfCompletion: state.yearOfCompletion,
              schoolAddress: state.previousSchoolAddress,
              totalMarks: totalNum,
              marksObtained: obtainedNum,
              percentage: computedPct,
              previousAcademics: state.previousAcademics,
            }
          : null,
      uploadedDocuments: uploadedDocsList,
      declarationAccepted: state.declarationAccepted,
    };
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSaveDraft = async () => {
    setErrorMsg(null);
    setDraftNotice(null);
    setSavingDraft(true);
    try {
      const payload = buildPayload(true);
      if (state.draftId) {
        await onUpdateApplication(state.draftId, payload);
        setDraftNotice("Draft updated.");
      } else {
        const created = await onCreateApplication(payload);
        setState((prev) => ({ ...prev, draftId: created.id }));
        setDraftNotice(`Saved as draft (${created.applicationCode}).`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const s of [1, 2, 3, 4] as const) {
      const err = validateStep(s);
      if (err) {
        setCurrentStep(s);
        setErrorMsg(err);
        return;
      }
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const payload = buildPayload(false);
      if (state.draftId) {
        await onUpdateApplication(state.draftId, payload);
      } else {
        await onCreateApplication(payload);
      }
      setState(buildInitialWizardState({ defaultGrade, defaultAcademicYear }));
      setCurrentStep(1);
      onViewApplications();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const openPreview = (doc: AdmissionUploadedDocument) => {
    setPreviewDoc(doc);
    setTimeout(() => {
      previewDialogRef.current?.showModal();
    }, 0);
  };

  const closePreview = () => {
    previewDialogRef.current?.close();
    setPreviewDoc(null);
  };

  const nextButtonLabel = useMemo(() => {
    if (currentStep === 1) return "Next: Parent/Guardian Info";
    if (currentStep === 2) return "Next: Academic Details";
    return "Next: Review & Submit";
  }, [currentStep]);

  const backButtonLabel = useMemo(() => {
    if (currentStep === 2) return "Back: Student Details";
    if (currentStep === 3) return "Back: Parent/Guardian Info";
    return "Back: Academic Details";
  }, [currentStep]);

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-xs space-y-5 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Application Form
            </h2>
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Complete the application form to apply for admission at {schoolName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {drafts.length > 0 && (
              <select
                aria-label="Resume saved draft"
                value={state.draftId || ""}
                onChange={(e) => handleLoadDraft(e.target.value)}
                className="rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="">New Blank Application ({drafts.length} draft{drafts.length === 1 ? "" : "s"})</option>
                {drafts.map((d) => (
                  <option key={d.id} value={d.id}>
                    Resume: {d.studentName} ({d.gradeApplied})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onViewApplications}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            >
              <span>View Applications</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 4-Step Stepper */}
        <nav aria-label="Application form steps" className="pt-1">
          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WIZARD_STEPS.map(({ step, label }) => {
              const isCompleted = currentStep > step;
              const isCurrent = currentStep === step;
              return (
                <li key={step} className="flex flex-col items-center text-center gap-1.5">
                  <button
                    type="button"
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => {
                      if (step <= currentStep) {
                        setErrorMsg(null);
                        setCurrentStep(step);
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition ${
                      isCompleted
                        ? "bg-[#663CF6] text-white shadow-sm cursor-pointer"
                        : isCurrent
                          ? "bg-gradient-to-br from-[#663CF6] to-[#4F27E8] text-white ring-4 ring-[#EDE7FF] dark:ring-[#251D4A]"
                          : "border border-[#CAD0EB] bg-white text-[#76799C] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step}
                  </button>
                  <span
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-[#08093B] dark:text-[#F3F5FF]"
                        : isCompleted
                          ? "text-[#663CF6] dark:text-[#A78BFA]"
                          : "text-[#76799C] dark:text-[#9DA6CC]"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {!canWrite ? (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300">
          Your current role has read-only access and cannot submit new applications.
        </div>
      ) : (
        <form onSubmit={handleSubmitApplication} className="space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}

          {draftNotice && (
            <div
              role="status"
              className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              {draftNotice}
            </div>
          )}

          {currentStep === 1 && (
            <Step1StudentDetails
              schoolSlug={schoolSlug}
              state={state}
              availableGrades={availableGrades}
              onChange={patchState}
            />
          )}

          {currentStep === 2 && <Step2ParentGuardian state={state} onChange={patchState} />}

          {currentStep === 3 && (
            <Step3AcademicDetails
              schoolName={schoolName}
              schoolSlug={schoolSlug}
              state={state}
              availableGrades={availableGrades}
              availableAcademicYears={availableAcademicYears}
              onChange={patchState}
              onPreviewDoc={openPreview}
            />
          )}

          {currentStep === 4 && (
            <Step4ReviewSubmit
              schoolSlug={schoolSlug}
              state={state}
              onJumpToStep={(step) => {
                setErrorMsg(null);
                setCurrentStep(step);
              }}
              onChange={patchState}
              onPreviewDoc={openPreview}
            />
          )}

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-4 py-2.5 text-xs font-bold text-[#08093B] shadow-2xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{backButtonLabel}</span>
                </button>
              )}

              <button
                type="button"
                disabled={savingDraft || submitting}
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-4 py-2.5 text-xs font-bold text-[#4F27E8] shadow-2xs transition hover:border-[#663CF6] disabled:opacity-60 cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C4B5FD]"
              >
                {savingDraft ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{savingDraft ? "Saving Draft..." : "Save as Draft"}</span>
              </button>
            </div>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 cursor-pointer"
              >
                <span>{nextButtonLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || savingDraft}
                className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{submitting ? "Submitting..." : "Submit Application"}</span>
              </button>
            )}
          </div>

          {/* Security Assurance Bar */}
          <div className="flex items-center justify-center gap-2 rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] px-4 py-2.5 text-xs text-[#4D5072] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#C5CCF0]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Your information is secure with us. We follow strict data protection policies.</span>
          </div>

          {/* Application Progress Card */}
          <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-4 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Application Progress
                  </h4>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    Complete {currentStep} of 4 steps
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                {progressPct}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EDE7FF] dark:bg-[#232746]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </form>
      )}

      {/* Document Preview Modal */}
      <dialog
        ref={previewDialogRef}
        onClose={() => setPreviewDoc(null)}
        aria-labelledby="doc-preview-title"
        className="m-auto w-[min(95vw,680px)] rounded-[20px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
      >
        {previewDoc && (
          <div>
            <div className="flex items-center justify-between border-b border-[#DFE3F5] px-5 py-3.5 dark:border-[#232746]">
              <div>
                <h3 id="doc-preview-title" className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {previewDoc.label}
                </h3>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  {previewDoc.fileName}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close document preview"
                className="rounded-full p-1.5 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 bg-[#FAF8FE] dark:bg-[#10142C]">
              {previewDoc.mimeType.startsWith("image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={buildDocumentViewUrl(schoolSlug, previewDoc.storageKey)}
                  alt={previewDoc.label}
                  className="mx-auto max-h-[65vh] rounded-[12px] object-contain"
                />
              ) : (
                <iframe
                  title={previewDoc.label}
                  src={buildDocumentViewUrl(schoolSlug, previewDoc.storageKey)}
                  className="h-[65vh] w-full rounded-[12px] border border-[#DFE3F5] bg-white dark:border-[#272B4D]"
                />
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
