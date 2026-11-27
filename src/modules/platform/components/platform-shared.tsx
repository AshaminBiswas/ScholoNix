"use client";

import React from "react";

export function formatInrFromPaise(paise: number): string {
  const rupees = (Math.round(Number(paise) || 0) || 0) / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateShort(iso?: string | Date | null): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string | Date | null): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportRowsToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): void {
  const escape = (val: string | number | boolean | null | undefined) => {
    const str = val === null || val === undefined ? "" : String(val);
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\r\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function SchoolStatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const cls =
    upper === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70"
      : upper === "TRIAL"
        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70"
        : upper === "SUSPENDED"
          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70"
          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide ${cls}`}
    >
      {upper}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const upper = plan.toUpperCase();
  const cls =
    upper === "ENTERPRISE"
      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70"
      : upper === "PROFESSIONAL"
        ? "bg-[#EDE7FF] text-[#5B21B6] border-[#DDD6FE] dark:bg-[#251D4A] dark:text-[#CBB8FF] dark:border-[#4D3B94]"
        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${cls}`}
    >
      {upper}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const cls =
    upper === "RESOLVED" || upper === "CLOSED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70"
      : upper === "IN_PROGRESS"
        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70"
        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${cls}`}
    >
      {upper.replace("_", " ")}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const cls =
    upper === "PAID"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70"
      : upper === "OVERDUE"
        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70"
        : upper === "VOID"
          ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${cls}`}
    >
      {upper}
    </span>
  );
}

export function PlatformKpiCard({
  icon,
  label,
  value,
  sublabel,
  accentClass = "bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel: string;
  accentClass?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-4 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#08093B] truncate dark:text-[#F3F5FF]">
            {value}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#4D5072] truncate dark:text-[#9DA6CC]">
            {sublabel}
          </p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${accentClass}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}
