"use client";

import React from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionFeeLedgerRecord,
  AdmissionTypeValue,
  AdmittedEnrollmentStatusValue,
  AdmittedFeeHeadValue,
  AdmittedFeePaymentStatusValue,
  AdmittedPaymentModeValue,
} from "@/modules/school/admissions/types";

export const ADMISSION_TYPE_META: Record<
  AdmissionTypeValue,
  { label: string; color: string; pillClass: string }
> = {
  FRESH: {
    label: "New Admission",
    color: "#7C3AED",
    pillClass:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60",
  },
  TRANSFER: {
    label: "Transfer",
    color: "#0EA5E9",
    pillClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
  },
  RE_ADMISSION: {
    label: "Re-Admission",
    color: "#22C55E",
    pillClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  },
  OTHER: {
    label: "Others",
    color: "#EC4899",
    pillClass:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800/60",
  },
};

export const ENROLLMENT_STATUS_META: Record<
  AdmittedEnrollmentStatusValue,
  { label: string; badgeClass: string }
> = {
  ACTIVE: {
    label: "Active",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  },
  TRANSFERRED: {
    label: "Transferred",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
  },
};

export const FEE_PAYMENT_STATUS_META: Record<
  AdmittedFeePaymentStatusValue,
  { label: string; badgeClass: string; color: string }
> = {
  PAID: {
    label: "Paid",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    color: "#22C55E",
  },
  PARTIAL: {
    label: "Partial",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
    color: "#F59E0B",
  },
  PENDING: {
    label: "Pending",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    color: "#EC4899",
  },
};

export const FEE_HEAD_OPTIONS: AdmittedFeeHeadValue[] = [
  "Admission Fee",
  "Tuition Fee",
  "Annual Charges",
  "Transport Fee",
  "Hostel Fee",
];

export const PAYMENT_MODE_OPTIONS: AdmittedPaymentModeValue[] = [
  "UPI",
  "Net Banking",
  "Card",
  "Cash",
  "Cheque",
];

export function formatInrFromPaise(paise: number): string {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function getStudentDocumentProgress(student: AdmissionApplicationRecord): {
  submitted: number;
  verified: number;
  total: number;
  status: "COMPLETE" | "PENDING" | "VERIFICATION_PENDING";
} {
  const checklist = student.documentsChecklist ?? [];
  const total = Math.max(1, checklist.length);
  const submitted = checklist.filter((d) => d.submitted).length;
  const verified = checklist.filter((d) => d.verified).length;

  if (submitted === checklist.length && verified === checklist.length && checklist.length > 0) {
    return { submitted, verified, total: checklist.length, status: "COMPLETE" };
  }
  if (submitted >= checklist.length && verified < checklist.length && checklist.length > 0) {
    return { submitted, verified, total: checklist.length, status: "VERIFICATION_PENDING" };
  }
  return { submitted, verified, total: checklist.length || total, status: "PENDING" };
}

export function buildLedgerLookup(
  ledgers: AdmissionFeeLedgerRecord[],
): Map<string, AdmissionFeeLedgerRecord> {
  return new Map(ledgers.map((l) => [l.applicationId, l]));
}

export function SeatUtilizationGauge({
  admitted,
  totalSeats,
}: {
  admitted: number;
  totalSeats: number;
}) {
  const safeTotal = Math.max(1, totalSeats);
  const pct = Math.min(100, Math.round((admitted / safeTotal) * 1000) / 10);
  const available = Math.max(0, totalSeats - admitted);
  const radius = 56;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-44 h-28 flex items-end justify-center shrink-0">
        <svg viewBox="0 0 140 80" className="w-full h-full overflow-visible">
          <path
            d="M 14 70 A 56 56 0 0 1 126 70"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            className="stroke-[#E6EAF8] dark:stroke-[#232746]"
          />
          <path
            d="M 14 70 A 56 56 0 0 1 126 70"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute bottom-2 text-center pointer-events-none">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {totalSeats > 0 ? `${pct.toFixed(1)}%` : "0.0%"}
          </p>
          <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Seats Filled
          </p>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2 text-xs">
        <div className="flex items-center justify-between rounded-xl bg-[#FAF8FE] px-3 py-2 dark:bg-[#1A1F3D]">
          <span className="font-semibold text-[#4D5072] dark:text-[#9DA6CC]">Total Seats</span>
          <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {totalSeats}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3 py-2 dark:bg-emerald-950/30">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Admitted</span>
          <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {admitted}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-[#F5F7FD] px-3 py-2 dark:bg-[#191D3D]">
          <span className="font-semibold text-[#4D5072] dark:text-[#9DA6CC]">Available</span>
          <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {available}
          </span>
        </div>
      </div>
    </div>
  );
}
