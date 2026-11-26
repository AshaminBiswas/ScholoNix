"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  AdmissionEnquiryStatusType,
  EnquiryCommunicationChannelValue,
  EnquiryFollowUpStatusValue,
  EnquiryFollowUpTypeValue,
} from "@/modules/school/admissions/types";

export const ENQUIRY_STATUS_UI_META: Record<
  AdmissionEnquiryStatusType,
  { label: string; badgeClass: string; dotColor: string }
> = {
  NEW: {
    label: "Open",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
    dotColor: "#0EA5E9",
  },
  CONTACTED: {
    label: "Contacted",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60",
    dotColor: "#6366F1",
  },
  FOLLOW_UP: {
    label: "Follow-up Due",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    dotColor: "#F59E0B",
  },
  CONVERTED: {
    label: "Converted",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    dotColor: "#10B981",
  },
  CLOSED: {
    label: "Closed",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
    dotColor: "#F43F5E",
  },
};

export const FOLLOW_UP_STATUS_META: Record<
  EnquiryFollowUpStatusValue,
  { label: string; badgeClass: string; color: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
    color: "#7C3AED",
  },
  DUE_TODAY: {
    label: "Due Today",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    color: "#F59E0B",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    color: "#22C55E",
  },
  OVERDUE: {
    label: "Overdue",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
    color: "#EF4444",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700",
    color: "#94A3B8",
  },
};

export const SOURCE_COLOR_HEX: Record<string, { hex: string; pillClass: string }> = {
  violet: {
    hex: "#7C3AED",
    pillClass:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60",
  },
  sky: {
    hex: "#0EA5E9",
    pillClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700",
  },
  cyan: {
    hex: "#06B6D4",
    pillClass:
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/60",
  },
  emerald: {
    hex: "#10B981",
    pillClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  },
  amber: {
    hex: "#F59E0B",
    pillClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  },
  indigo: {
    hex: "#6366F1",
    pillClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60",
  },
  rose: {
    hex: "#EC4899",
    pillClass:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800/60",
  },
};

export function getSourceColorMeta(
  sourceName: string,
  colorToken?: string,
): { hex: string; pillClass: string } {
  const fallback = {
    hex: "#EC4899",
    pillClass:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800/60",
  };
  if (colorToken && SOURCE_COLOR_HEX[colorToken]) {
    return SOURCE_COLOR_HEX[colorToken] ?? fallback;
  }
  const lower = sourceName.toLowerCase();
  if (lower.includes("web")) return SOURCE_COLOR_HEX.violet ?? fallback;
  if (lower.includes("walk")) return SOURCE_COLOR_HEX.sky ?? fallback;
  if (lower.includes("refer")) return SOURCE_COLOR_HEX.emerald ?? fallback;
  if (lower.includes("social")) return SOURCE_COLOR_HEX.cyan ?? fallback;
  if (lower.includes("event") || lower.includes("camp")) return SOURCE_COLOR_HEX.amber ?? fallback;
  if (lower.includes("phone")) return SOURCE_COLOR_HEX.indigo ?? fallback;
  return SOURCE_COLOR_HEX.rose ?? fallback;
}

export const ENQUIRY_TYPE_OPTIONS = [
  "Admission Enquiry",
  "Campus Visit",
  "Transfer Enquiry",
  "Fee Structure",
  "Scholarship",
  "General",
] as const;

export const FOLLOW_UP_TYPE_OPTIONS: EnquiryFollowUpTypeValue[] = [
  "Phone Call",
  "Email",
  "WhatsApp",
  "Meeting",
  "Campus Visit",
];

export const COMMUNICATION_CHANNEL_OPTIONS: EnquiryCommunicationChannelValue[] = [
  "Email",
  "SMS",
  "WhatsApp",
  "Phone Call",
];

export const RELATION_OPTIONS = ["Father", "Mother", "Guardian", "Sibling", "Other"] as const;

export const FOLLOW_UP_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other",
] as const;

export const COMMUNICATION_TEMPLATES: ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  subject: string;
  body: string;
}> = [
  {
    id: "admission-info",
    title: "Admission Information",
    description: "General information about the admission process.",
    subject: "Admission Information & Next Steps",
    body: "Dear Parent,\n\nThank you for your enquiry regarding admission. Our admissions team would be happy to guide you through our curriculum, campus facilities, and admission guidelines.\n\nWarm regards,\nAdmissions Office",
  },
  {
    id: "fee-structure",
    title: "Fee Structure",
    description: "Details of fee structure and payment options.",
    subject: "Fee Structure & Payment Schedule",
    body: "Dear Parent,\n\nPlease find the tuition and admission fee details for the upcoming academic year. Feel free to reach out if you would like to schedule an interactive fee counselling session.\n\nWarm regards,\nAdmissions Office",
  },
  {
    id: "required-docs",
    title: "Required Documents",
    description: "List of documents needed for admission.",
    subject: "Documents Required for Admission Application",
    body: "Dear Parent,\n\nTo complete your child's admission application, please keep ready: Student Birth Certificate, Student Passport Photograph, Parent/Guardian ID Proof, and Previous School Marksheet / Transfer Certificate.\n\nWarm regards,\nAdmissions Office",
  },
  {
    id: "school-brochure",
    title: "School Brochure",
    description: "Share school highlights and brochure summary.",
    subject: "Welcome to Our School — Prospectus & Campus Visit",
    body: "Dear Parent,\n\nThank you for connecting with us. We invite you to visit our campus for a guided tour and faculty interaction at your earliest convenience.\n\nWarm regards,\nAdmissions Office",
  },
];

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function formatDateTimeIst(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export interface DonutSlice {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export function EnquiriesDonutChart({
  centerValue,
  centerLabel,
  slices,
  emptyLabel = "No records yet",
}: {
  centerValue: string | number;
  centerLabel: string;
  slices: DonutSlice[];
  emptyLabel?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const r = 46;
  const cx = 60;
  const cy = 60;
  const c = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs font-medium text-[#76799C] dark:text-[#8A94B8]">
        {emptyLabel}
      </div>
    );
  }

  let cumulativeOffset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth="16"
            className="stroke-[#EEF1FA] dark:stroke-[#232746]"
          />
          {slices.map((slice) => {
            if (slice.count <= 0) return null;
            const len = (slice.count / total) * c;
            const dashArray = `${Math.max(0, len - 1.5)} ${c}`;
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += len;
            return (
              <circle
                key={slice.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={slice.color}
                strokeWidth="16"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] leading-tight">
            {centerValue}
          </span>
          <span className="text-[11px] font-medium text-[#76799C] dark:text-[#9DA6CC]">
            {centerLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate font-medium text-[#1B1D45] dark:text-[#DCE1F9]">
                {slice.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{slice.count}</span>
              <span className="text-[#76799C] dark:text-[#9DA6CC]">
                ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnquiryTrendChart({
  points,
}: {
  points: Array<{ label: string; count: number }>;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
        No enquiry activity in this range yet
      </div>
    );
  }

  const width = 420;
  const height = 165;
  const padL = 28;
  const padR = 18;
  const padT = 22;
  const padB = 26;
  const maxVal = Math.max(4, ...points.map((p) => p.count));
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1 ? padL + innerW / 2 : padL + (idx / (points.length - 1)) * innerW;
    const y = padT + innerH - (p.count / maxVal) * innerH;
    return { ...p, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1]!.x} ${padT + innerH} L ${coords[0]!.x} ${padT + innerH} Z`
      : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
      <defs>
        <linearGradient id="enquiryTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padT + innerH * (1 - t);
        const tick = Math.round(maxVal * t);
        return (
          <g key={t}>
            <line
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              className="stroke-[#E6EAF8] dark:stroke-[#232746]"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-[#76799C] dark:fill-[#8A94B8] text-[9px]"
            >
              {tick}
            </text>
          </g>
        );
      })}
      {areaPath && <path d={areaPath} fill="url(#enquiryTrendGrad)" />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {coords.map((c) => (
        <g key={c.label}>
          <circle
            cx={c.x}
            cy={c.y}
            r="4"
            className="fill-[#6D28D9] stroke-white dark:stroke-[#141731]"
            strokeWidth="2"
          />
          <text
            x={c.x}
            y={c.y - 8}
            textAnchor="middle"
            className="fill-[#08093B] dark:fill-[#F3F5FF] text-[10px] font-bold"
          >
            {c.count}
          </text>
          <text
            x={c.x}
            y={height - 6}
            textAnchor="middle"
            className="fill-[#4D5072] dark:fill-[#9DA6CC] text-[10px]"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export interface PortalMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function PortalActionMenu({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: PortalMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuW = 188;
      const estimatedH = items.length * 36 + 12;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow >= estimatedH
          ? rect.bottom + 4
          : Math.max(8, rect.top - estimatedH - 4);
      const left = Math.min(window.innerWidth - menuW - 8, Math.max(8, rect.right - menuW));
      setCoords({ top, left });
    };

    updatePosition();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, items.length]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#4D5072] hover:bg-[#F0EBFE] hover:text-[#6D28D9] dark:text-[#9DA6CC] dark:hover:bg-[#252A4E] dark:hover:text-violet-300 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        </svg>
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
            className="w-[188px] rounded-[12px] border border-[#D6DBF0] bg-white p-1.5 shadow-xl dark:border-[#313761] dark:bg-[#171B36]"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors disabled:opacity-40 ${
                  item.danger
                    ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    : "text-[#1B1D45] hover:bg-[#F5F7FD] dark:text-[#E2E6FA] dark:hover:bg-[#23284D]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
