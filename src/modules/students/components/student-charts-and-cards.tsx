"use client";

import React from "react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Filter,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type {
  StudentFilterParams,
  StudentSliceDatum,
} from "@/modules/students/types";

export const STUDENT_CARD_SURFACE =
  "rounded-[18px] border border-white/85 bg-white/85 backdrop-blur-md shadow-[0_8px_24px_rgba(79,39,232,0.06)] dark:border-[#272B4D] dark:bg-[#141731]/95 dark:shadow-[0_10px_28px_rgba(3,5,18,0.45)]";

export function StudentKpiCard({
  label,
  value,
  deltaPct,
  icon,
  tone = "violet",
  subtitle = "vs. previous period",
}: {
  label: string;
  value: number | string;
  deltaPct?: number;
  icon: React.ReactNode;
  tone?: "violet" | "emerald" | "sky" | "amber" | "pink";
  subtitle?: string;
}) {
  const iconToneMap: Record<string, string> = {
    violet: "bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300",
  };
  const positive = (deltaPct ?? 0) >= 0;

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-4 flex items-start gap-3`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconToneMap[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-[#4D5072] truncate dark:text-[#9DA6CC]">
          {label}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </span>
          {deltaPct !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                positive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {positive ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              <span>{`${positive ? "+" : ""}${deltaPct}%`}</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] font-medium text-[#76799C] dark:text-[#9DA6CC]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function StudentEnrolmentTrendChart({
  points,
  granularityLabel = "By Month",
}: {
  points: Array<{ label: string; count: number }>;
  granularityLabel?: string;
}) {
  const safePoints = points.length > 0 ? points : [{ label: "Current", count: 0 }];
  const w = 520;
  const h = 190;
  const padX = 36;
  const padTop = 24;
  const padBottom = 26;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBottom;
  const maxVal = Math.max(1, ...safePoints.map((p) => p.count));
  const minVal = Math.min(...safePoints.map((p) => p.count));
  const range = Math.max(1, maxVal - minVal);

  const coords = safePoints.map((p, idx) => {
    const x =
      safePoints.length === 1
        ? padX + plotW / 2
        : padX + (idx / (safePoints.length - 1)) * plotW;
    const norm = range > 0 ? (p.count - minVal) / range : 0.5;
    const y = padTop + plotH - norm * (plotH * 0.78) - plotH * 0.1;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1]!.x},${padTop + plotH} L${coords[0]!.x},${padTop + plotH} Z`
      : "";

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          Student Enrolment Trend
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#D6DBF0] bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#4D5072] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#B4BDD9]">
          <span>{granularityLabel}</span>
          <ChevronDown className="h-3 w-3" />
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full min-w-[320px] h-44"
          role="img"
          aria-label="Student enrolment trend line chart"
        >
          <defs>
            <linearGradient id="snxStuTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + plotH * (1 - t);
            return (
              <line
                key={t}
                x1={padX}
                y1={y}
                x2={w - padX}
                y2={y}
                stroke="currentColor"
                strokeDasharray="3 4"
                className="text-[#E3E7F7] dark:text-[#232746]"
              />
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#snxStuTrendGrad)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#663CF6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {coords.map((c, idx) => (
            <g key={`${c.label}-${idx}`}>
              <circle
                cx={c.x}
                cy={c.y}
                r="3.5"
                className="fill-[#663CF6] stroke-white dark:stroke-[#141731]"
                strokeWidth="1.5"
              />
              <text
                x={c.x}
                y={Math.max(12, c.y - 8)}
                textAnchor="middle"
                className="fill-[#08093B] text-[9px] font-bold dark:fill-[#DCE1F9]"
              >
                {c.count.toLocaleString("en-IN")}
              </text>
              <text
                x={c.x}
                y={h - 6}
                textAnchor="middle"
                className="fill-[#76799C] text-[9px] font-semibold dark:fill-[#9DA6CC]"
              >
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function StudentDonutChart({
  title,
  centerTotal,
  centerLabel = "Students",
  slices,
}: {
  title: string;
  centerTotal: number;
  centerLabel?: string;
  slices: StudentSliceDatum[];
}) {
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;
  const total = Math.max(
    0,
    slices.reduce((acc, s) => acc + s.count, 0),
  );

  let offset = 0;
  const segments = slices.map((s) => {
    const frac = total > 0 ? s.count / total : 0;
    const len = frac * circ;
    const seg = { ...s, len, offset };
    offset += len;
    return seg;
  });

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 flex flex-col justify-between gap-3`}>
      <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">{title}</h3>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={title}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth="16"
              className="stroke-[#ECEFFA] dark:stroke-[#232746]"
            />
            {total > 0 &&
              segments.map((seg) =>
                seg.count > 0 ? (
                  <circle
                    key={seg.label}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={`${seg.len} ${circ}`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="butt"
                  />
                ) : null,
              )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
              {centerTotal.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              {centerLabel}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-semibold text-[#4D5072] truncate dark:text-[#B4BDD9]">
                  {s.label}
                </span>
              </span>
              <span className="flex items-center gap-2.5 shrink-0 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                <span>{s.count.toLocaleString("en-IN")}</span>
                <span className="w-11 text-right text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                  {s.percentage}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentGradeBarChart({
  title = "Students by Grade",
  bars,
  onViewDetails,
}: {
  title?: string;
  bars: Array<{ grade: string; count: number; percentage: number }>;
  onViewDetails?: () => void;
}) {
  const displayBars = bars.slice(0, 8);
  const max = Math.max(1, ...displayBars.map((b) => b.count));

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">{title}</h3>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
          >
            <span>View Details</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {displayBars.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
          No grade distribution recorded yet.
        </div>
      ) : (
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-5 border-b border-[#DFE3F5] pb-2 dark:border-[#272B4D]">
          {displayBars.map((bar) => {
            const pct = Math.max(10, Math.round((bar.count / max) * 100));
            return (
              <div
                key={bar.grade}
                className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1.5"
              >
                <span className="text-[10px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {bar.count}
                </span>
                <div className="w-full max-w-[44px] flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#5B35F5] via-[#7C5CFC] to-[#A78BFA] shadow-2xs transition-all"
                    style={{ height: `${pct}%` }}
                    title={`${bar.grade}: ${bar.count} (${bar.percentage}%)`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#4D5072] truncate max-w-full dark:text-[#9DA6CC]">
                  {bar.grade.replace(/^Class\s+/i, "")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StudentFilterStrip({
  filters,
  onChange,
  academicYears,
  grades,
  sections,
}: {
  filters: StudentFilterParams;
  onChange: (next: Partial<StudentFilterParams>) => void;
  academicYears: string[];
  grades: string[];
  sections: string[];
}) {
  const selectCls =
    "rounded-[11px] border border-[#CAD0EB] bg-white/95 px-3 py-1.5 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]";

  return (
    <div className={`${STUDENT_CARD_SURFACE} px-3.5 py-2.5 flex flex-wrap items-center gap-2`}>
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">
        <Filter className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Filters:</span>
      </span>

      <select
        aria-label="Filter by academic year"
        value={filters.academicYear || "ALL"}
        onChange={(e) => onChange({ academicYear: e.target.value, page: 1 })}
        className={selectCls}
      >
        <option value="ALL">Academic Year: All</option>
        {academicYears.map((y) => (
          <option key={y} value={y}>
            AY {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by grade"
        value={filters.grade || "ALL"}
        onChange={(e) => onChange({ grade: e.target.value, page: 1 })}
        className={selectCls}
      >
        <option value="ALL">Grade: All Grades</option>
        {grades.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by section"
        value={filters.section || "ALL"}
        onChange={(e) => onChange({ section: e.target.value, page: 1 })}
        className={selectCls}
      >
        <option value="ALL">Section: All Sections</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            Section {s}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by student status"
        value={filters.status || "ALL"}
        onChange={(e) =>
          onChange({
            status: e.target.value as StudentFilterParams["status"],
            page: 1,
          })
        }
        className={selectCls}
      >
        <option value="ALL">Status: All Students</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="TRANSFERRED">Transferred</option>
        <option value="ALUMNI">Alumni</option>
        <option value="WITHDRAWN">Withdrawn</option>
      </select>

      <select
        aria-label="Filter by gender"
        value={filters.gender || "ALL"}
        onChange={(e) =>
          onChange({
            gender: e.target.value as StudentFilterParams["gender"],
            page: 1,
          })
        }
        className={selectCls}
      >
        <option value="ALL">Gender: All</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>

      <label className="inline-flex items-center gap-1.5 rounded-[11px] border border-[#CAD0EB] bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#4D5072] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#9DA6CC]">
        <Calendar className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
        <input
          type="date"
          aria-label="Admission date from"
          value={filters.fromDate || ""}
          onChange={(e) => onChange({ fromDate: e.target.value || undefined, page: 1 })}
          className="bg-transparent text-xs text-[#08093B] focus:outline-none dark:text-[#F3F5FF]"
        />
      </label>

      <div className="relative flex-1 min-w-[190px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C] dark:text-[#9DA6CC]" />
        <input
          type="search"
          aria-label="Search student name, admission number, guardian, or phone"
          value={filters.search || ""}
          onChange={(e) => onChange({ search: e.target.value || undefined, page: 1 })}
          placeholder="Search student name, admission no., parent..."
          className="w-full rounded-[11px] border border-[#CAD0EB] bg-white/95 pl-8 pr-3 py-1.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
        />
      </div>
    </div>
  );
}
