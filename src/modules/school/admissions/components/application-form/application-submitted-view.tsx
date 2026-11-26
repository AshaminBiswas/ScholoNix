"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  FileText,
  Headphones,
  Home,
  Info,
  Mail,
  Phone,
  Printer,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import {
  ADMISSION_STATUS_META,
  type AdmissionApplicationRecord,
} from "@/modules/school/admissions/types";
import { buildSchoolRoute } from "@/modules/school/utils/shell-props";

interface ApplicationSubmittedViewProps {
  schoolName: string;
  schoolSlug: string;
  schoolContactEmail?: string | null;
  schoolContactPhone?: string | null;
  application: AdmissionApplicationRecord;
  onViewApplications: () => void;
  onSubmitAnother: () => void;
}

function formatSubmittedTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

export function ApplicationSubmittedView({
  schoolName,
  schoolSlug,
  schoolContactEmail,
  schoolContactPhone,
  application,
  onViewApplications,
  onSubmitAnother,
}: ApplicationSubmittedViewProps) {
  const [copiedField, setCopiedField] = useState<"appId" | "studentId" | null>(null);

  const statusMeta = ADMISSION_STATUS_META[application.status] ?? ADMISSION_STATUS_META.UNDER_REVIEW;
  const dashboardHref = buildSchoolRoute(schoolSlug);
  const helpHref = buildSchoolRoute(schoolSlug, "help");
  const admissionTypeLabel =
    application.admissionType === "TRANSFER" ? "Admission (Transfer)" : "Fresh Admission";

  const handleCopy = async (field: "appId" | "studentId", value: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownloadApplication = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header matching mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight dark:text-[#F3F5FF]">
            Application Submitted!
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#9DA6CC]">
            Your admission application has been successfully submitted.
          </p>
        </div>

        <button
          type="button"
          onClick={onSubmitAnother}
          className="inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] shadow-2xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>New Form Entry</span>
        </button>
      </div>

      {/* Main Confirmation Card */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0] bg-gradient-to-b from-white via-[#FAF9FF] to-[#F3F0FF]/80 p-6 sm:p-8 shadow-sm dark:border-[#272B4D] dark:from-[#141731] dark:via-[#161938] dark:to-[#1B1840]">
        {/* Celebratory Icon + Confetti accents */}
        <div className="relative mx-auto flex max-w-md flex-col items-center text-center pt-2">
          <div className="relative mb-4 flex items-center justify-center" aria-hidden="true">
            <span className="absolute -left-16 -top-1 h-2 w-4 -rotate-12 rounded-full bg-rose-400/80" />
            <span className="absolute -left-24 top-6 h-2 w-3 rotate-45 rounded-full bg-sky-400/80" />
            <span className="absolute -left-12 bottom-0 h-2.5 w-2.5 rotate-12 rounded-sm bg-amber-400/85" />
            <span className="absolute -right-16 -top-2 h-2 w-4 rotate-12 rounded-full bg-amber-400/85" />
            <span className="absolute -right-24 top-5 h-2 w-3 -rotate-45 rounded-full bg-violet-400/80" />
            <span className="absolute -right-12 bottom-1 h-2.5 w-2.5 -rotate-12 rounded-sm bg-emerald-400/80" />

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-100 dark:ring-emerald-950/60">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Application Submitted Successfully!
          </h3>
          <p className="mt-2 text-xs sm:text-sm font-bold text-[#1B1D45] dark:text-[#E2E8F0]">
            Thank you for applying to {schoolName}.
          </p>
          <p className="mt-1 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Your application has been received and is under review by our admissions team.
          </p>
        </div>

        {/* Inner Application Details Card */}
        <div className="mx-auto mt-6 max-w-4xl rounded-[20px] border border-[#DFE3F5] bg-white/95 p-5 shadow-xs dark:border-[#2E345B] dark:bg-[#10142C]/90">
          <div className="flex items-center gap-2 border-b border-[#EDEFF8] pb-3 mb-4 dark:border-[#232746]">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Application Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
            {/* Left column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Application ID
                </span>
                <div className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#EDE7FF] px-2.5 py-1 font-mono font-extrabold text-[#4F27E8] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  <span>{application.applicationCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("appId", application.applicationCode)}
                    aria-label="Copy Application ID"
                    className="rounded p-0.5 text-[#663CF6] hover:bg-white/70 cursor-pointer dark:text-[#CBB8FF] dark:hover:bg-[#141731]"
                  >
                    {copiedField === "appId" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {application.studentIdNumber && (
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                    Student ID
                  </span>
                  <div className="inline-flex items-center gap-1.5 rounded-[9px] bg-emerald-50 px-2.5 py-1 font-mono font-extrabold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70">
                    <span>{application.studentIdNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("studentId", application.studentIdNumber!)}
                      aria-label="Copy Student ID"
                      className="rounded p-0.5 text-emerald-700 hover:bg-white/70 cursor-pointer dark:text-emerald-300 dark:hover:bg-[#141731]"
                    >
                      {copiedField === "studentId" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Student Name
                </span>
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  : &nbsp;{application.studentName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Grade Applying For
                </span>
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  : &nbsp;{application.gradeApplied}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Admission Type
                </span>
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  : &nbsp;{admissionTypeLabel}
                </span>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Application Date
                </span>
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {formatSubmittedTimestamp(application.appliedAt)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Academic Year
                </span>
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {application.academicYear}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[#4D5072] dark:text-[#9DA6CC]">
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                  <span>{statusMeta.label}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next Info Box */}
        <div className="mx-auto mt-4 max-w-4xl rounded-[16px] border border-[#DDD6FE] bg-[#F5F2FF]/80 px-4 py-3.5 flex items-start gap-3 dark:border-[#372D6B] dark:bg-[#19163C]">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#663CF6] text-white">
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="text-xs">
            <p className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              What Happens Next?
            </p>
            <p className="mt-0.5 text-[#4D5072] leading-relaxed dark:text-[#B4BDD9]">
              Our admissions team will review your application and documents. You will receive an
              email notification about the next steps within 3–5 working days.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Go to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handleDownloadApplication}
            className="inline-flex items-center gap-2 rounded-[12px] border border-[#B9C1E8] bg-white px-5 py-2.5 text-xs font-bold text-[#4F27E8] shadow-2xs transition hover:border-[#663CF6] hover:bg-[#FAF8FE] cursor-pointer dark:border-[#3A4173] dark:bg-[#10142C] dark:text-[#C4B5FD] dark:hover:border-[#8B5CF6]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Download Application</span>
          </button>

          <button
            type="button"
            onClick={onViewApplications}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2.5 text-xs font-bold text-[#4D5072] transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#C5CCF0]"
          >
            <span>View All Applications</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Bottom Support / Need Further Assistance Card */}
      <section className="overflow-hidden rounded-[22px] border border-[#D6DBF0] bg-gradient-to-r from-[#F6F3FF] via-white to-[#EEF4FF] px-6 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-[#272B4D] dark:from-[#171836] dark:via-[#141731] dark:to-[#131C3A]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Headphones className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Need Further Assistance?
              </h4>
              <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
                Our support team is here to help you.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
            {schoolContactEmail && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>{schoolContactEmail}</span>
              </span>
            )}
            {schoolContactPhone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>{schoolContactPhone}</span>
              </span>
            )}
            <Link
              href={helpHref}
              className="inline-flex items-center gap-1 text-[#663CF6] font-bold hover:underline dark:text-[#C4B5FD]"
            >
              <span>Visit Help Center</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Decorative mini campus illustration */}
        <svg
          className="hidden md:block h-20 w-44 shrink-0"
          viewBox="0 0 180 80"
          fill="none"
          aria-hidden="true"
        >
          <rect x="20" y="34" width="140" height="42" rx="6" className="fill-[#EDE7FF] dark:fill-[#251D4A]" />
          <rect x="65" y="18" width="50" height="58" rx="4" className="fill-[#DDD6FE] dark:fill-[#322761]" />
          <polygon points="90,4 58,20 122,20" className="fill-[#7C3AED] dark:fill-[#8B5CF6]" />
          <rect x="82" y="52" width="16" height="24" rx="2" className="fill-[#663CF6] dark:fill-[#A78BFA]" />
          <rect x="34" y="46" width="10" height="10" rx="2" className="fill-white/80 dark:fill-[#141731]" />
          <rect x="48" y="46" width="10" height="10" rx="2" className="fill-white/80 dark:fill-[#141731]" />
          <rect x="122" y="46" width="10" height="10" rx="2" className="fill-white/80 dark:fill-[#141731]" />
          <rect x="136" y="46" width="10" height="10" rx="2" className="fill-white/80 dark:fill-[#141731]" />
          <rect x="10" y="74" width="160" height="4" rx="2" className="fill-[#C4B5FD] dark:fill-[#4C3B94]" />
        </svg>
      </section>
    </div>
  );
}
