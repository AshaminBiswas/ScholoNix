"use client";

import React from "react";
import {
  Users,
  FileCheck2,
  UserCheck,
  Hourglass,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  PieChart,
  Filter,
} from "lucide-react";
import type {
  AdmissionsOverviewData,
  AdmissionsTrendGranularity,
} from "@/modules/school/admissions/types";

interface AdmissionsKpisAndChartsProps {
  data: AdmissionsOverviewData;
  granularity: AdmissionsTrendGranularity;
  onGranularityChange: (g: AdmissionsTrendGranularity) => void;
  onViewGradeDetails: () => void;
}

function formatDeltaBadge(delta: number | null, suffix: string) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        New
      </span>
    );
  }
  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
      )}
      <span>
        {positive ? "+" : ""}
        {delta}
        {suffix}
      </span>
    </span>
  );
}

export function AdmissionsKpisAndCharts({
  data,
  granularity,
  onGranularityChange,
  onViewGradeDetails,
}: AdmissionsKpisAndChartsProps) {
  const { kpis, funnel, trend, byGrade, statusBreakdown } = data;

  const hasPreviousBaseline =
    kpis.totalApplications.deltaPercent !== null ||
    kpis.shortlisted.deltaPercent !== null ||
    kpis.admitted.deltaPercent !== null;

  // Trend chart SVG geometry
  const trendMax = Math.max(4, ...trend.map((p) => p.count));
  const chartW = 540;
  const chartH = 165;
  const padL = 32;
  const padR = 20;
  const padT = 22;
  const padB = 26;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const trendCoords = trend.map((pt, idx) => {
    const x =
      trend.length <= 1 ? padL + plotW / 2 : padL + (idx / (trend.length - 1)) * plotW;
    const y = padT + plotH - (pt.count / trendMax) * plotH;
    return { ...pt, x, y };
  });

  const polylinePoints = trendCoords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    trendCoords.length > 0
      ? `M ${trendCoords[0]!.x.toFixed(1)},${(padT + plotH).toFixed(1)} ` +
        trendCoords.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
        ` L ${trendCoords[trendCoords.length - 1]!.x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`
      : "";

  // Grade chart max
  const gradeMax = Math.max(4, ...byGrade.map((g) => g.count));

  // Status donut math
  const donutCircumference = 2 * Math.PI * 38;
  let runningOffset = 0;

  return (
    <div className="space-y-4">
      {/* =====================================================================
          1. 4 TOP KPI CARDS
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="rounded-[20px] border border-[#DDD6FE] bg-gradient-to-br from-white via-[#F6F2FF] to-[#EDE7FF]/70 p-4 sm:p-5 shadow-xs transition hover:shadow-md dark:border-[#372D6B] dark:from-[#161936] dark:via-[#1B183E] dark:to-[#221A4A]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE] dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            {formatDeltaBadge(kpis.totalApplications.deltaPercent, "%")}
          </div>
          <p className="mt-3 text-xs font-bold text-[#4D5072] dark:text-[#B4BDD9]">Total Applications</p>
          <p className="mt-0.5 text-2xl sm:text-[28px] font-black text-[#08093B] leading-tight dark:text-[#F3F5FF]">
            {kpis.totalApplications.value.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            {hasPreviousBaseline ? "vs. previous period" : "no prior-period baseline"}
          </p>
        </div>

        {/* Shortlisted */}
        <div className="rounded-[20px] border border-[#BAE6FD] bg-gradient-to-br from-white via-[#F0F9FF] to-[#E0F2FE]/70 p-4 sm:p-5 shadow-xs transition hover:shadow-md dark:border-[#1E476E] dark:from-[#131934] dark:via-[#11223E] dark:to-[#122949]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#E0F2FE] text-[#0284C7] ring-1 ring-[#BAE6FD] dark:bg-[#133252] dark:text-[#7DD3FC] dark:ring-[#1E547A]">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            {formatDeltaBadge(kpis.shortlisted.deltaPercent, "%")}
          </div>
          <p className="mt-3 text-xs font-bold text-[#4D5072] dark:text-[#B4BDD9]">Shortlisted</p>
          <p className="mt-0.5 text-2xl sm:text-[28px] font-black text-[#08093B] leading-tight dark:text-[#F3F5FF]">
            {kpis.shortlisted.value.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            {kpis.shortlisted.deltaPercent !== null ? "vs. previous period" : "current shortlist count"}
          </p>
        </div>

        {/* Admitted */}
        <div className="rounded-[20px] border border-[#DDD6FE] bg-gradient-to-br from-white via-[#FAF5FF] to-[#EDE7FF]/70 p-4 sm:p-5 shadow-xs transition hover:shadow-md dark:border-[#372D6B] dark:from-[#161936] dark:via-[#1B183E] dark:to-[#221A4A]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE] dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            {formatDeltaBadge(kpis.admitted.deltaPercent, "%")}
          </div>
          <p className="mt-3 text-xs font-bold text-[#4D5072] dark:text-[#B4BDD9]">Admitted</p>
          <p className="mt-0.5 text-2xl sm:text-[28px] font-black text-[#08093B] leading-tight dark:text-[#F3F5FF]">
            {kpis.admitted.value.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            {kpis.admitted.deltaPercent !== null ? "vs. previous period" : "enrolled this period"}
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-[20px] border border-[#DDD6FE] bg-gradient-to-br from-white via-[#F5F3FF] to-[#EDE7FF]/70 p-4 sm:p-5 shadow-xs transition hover:shadow-md dark:border-[#372D6B] dark:from-[#161936] dark:via-[#1B183E] dark:to-[#221A4A]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE] dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]">
              <Hourglass className="h-5 w-5" aria-hidden="true" />
            </div>
            {formatDeltaBadge(kpis.conversionRate.deltaPercentagePoints, " pp")}
          </div>
          <p className="mt-3 text-xs font-bold text-[#4D5072] dark:text-[#B4BDD9]">Conversion Rate</p>
          <p className="mt-0.5 text-2xl sm:text-[28px] font-black text-[#08093B] leading-tight dark:text-[#F3F5FF]">
            {kpis.conversionRate.rate.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">Applications to Admitted</p>
        </div>
      </div>

      {/* =====================================================================
          2. ANALYTICS ROW 1: APPLICATION FUNNEL + APPLICATIONS TREND
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Application Funnel (5 cols) */}
        <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Filter className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Application Funnel</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Colorful Funnel Stages */}
            <div className="flex-1 w-full space-y-2 flex flex-col items-center">
              {[
                {
                  label: "Enquiries",
                  value: funnel.enquiries,
                  widthClass: "w-full",
                  gradient: "from-[#7C3AED] to-[#663CF6]",
                },
                {
                  label: "Applications",
                  value: funnel.applications,
                  widthClass: "w-[88%]",
                  gradient: "from-[#8B5CF6] to-[#7C3AED]",
                },
                {
                  label: "Shortlisted",
                  value: funnel.shortlistedPipeline,
                  widthClass: "w-[74%]",
                  gradient: "from-[#38BDF8] to-[#0EA5E9]",
                },
                {
                  label: "Admitted",
                  value: funnel.admitted,
                  widthClass: "w-[60%]",
                  gradient: "from-[#22C55E] to-[#16A34A]",
                },
              ].map((tier) => (
                <div
                  key={tier.label}
                  className={`${tier.widthClass} flex items-center justify-between rounded-[10px] bg-gradient-to-r ${tier.gradient} px-3.5 py-2 text-xs font-bold text-white shadow-xs`}
                >
                  <span className="truncate">{tier.label}</span>
                  <span className="ml-2 font-black">{tier.value.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            {/* Right Conversion Summary */}
            <div className="w-full sm:w-40 shrink-0 rounded-[16px] border border-[#EDE7FF] bg-[#FAF8FE] p-3.5 text-center dark:border-[#322961] dark:bg-[#10142C]">
              <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Conversion Rate</p>
              <p className="mt-1 text-2xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                {funnel.conversionRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">(Applications → Admitted)</p>
              <div className="mt-2.5 flex justify-center">
                {funnel.deltaPercentagePoints !== null ? (
                  <span
                    className={`inline-flex flex-col items-center rounded-[10px] px-2.5 py-1 text-[10px] font-bold ${
                      funnel.deltaPercentagePoints >= 0
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    <span>
                      {funnel.deltaPercentagePoints >= 0 ? "+" : ""}
                      {funnel.deltaPercentagePoints} pp
                    </span>
                    <span className="font-medium text-[#76799C] dark:text-[#9DA6CC]">vs. previous period</span>
                  </span>
                ) : (
                  <span className="inline-block rounded-[10px] bg-white px-2.5 py-1 text-[10px] font-medium text-[#76799C] border border-[#E2E8F0] dark:bg-[#181C3B] dark:text-[#B4BDD9] dark:border-[#2E345B]">
                    Live tenant funnel
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applications Trend (7 cols) */}
        <div className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Applications Trend</h2>
            </div>

            <div className="inline-flex rounded-[10px] border border-[#D6DBF0] bg-[#FAF8FE] p-0.5 dark:border-[#2E345B] dark:bg-[#10142C]">
              {(
                [
                  { key: "month", label: "By Month" },
                  { key: "week", label: "By Week" },
                ] as Array<{ key: AdmissionsTrendGranularity; label: string }>
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onGranularityChange(opt.key)}
                  className={`rounded-[8px] px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    granularity === opt.key
                      ? "bg-white text-[#663CF6] shadow-2xs dark:bg-[#231D4B] dark:text-[#E2D9FF]"
                      : "text-[#4D5072] hover:text-[#663CF6] dark:text-[#9DA6CC] dark:hover:text-[#D9CEFF]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {trend.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">No trend data recorded yet</p>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Applications submitted over time will plot automatically here.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto school-menu-scrollbar">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                role="img"
                aria-label="Applications trend line chart"
                className="w-full min-w-[380px] h-44"
              >
                <title>Applications Trend</title>
                <defs>
                  <linearGradient id="admissionsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = padT + plotH - ratio * plotH;
                  const val = Math.round(ratio * trendMax);
                  return (
                    <g key={ratio}>
                      <line
                        x1={padL}
                        x2={chartW - padR}
                        y1={y}
                        y2={y}
                        className="stroke-[#E2E8F0] dark:stroke-[#272B4D]"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padL - 6}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        className="fill-[#76799C] dark:fill-[#9DA6CC]"
                        fontWeight="600"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {areaPath && <path d={areaPath} fill="url(#admissionsTrendGradient)" />}

                {trendCoords.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#7C5CFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                )}

                {trendCoords.map((pt) => (
                  <g key={pt.key}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="fill-white dark:fill-[#141731] stroke-[#7C5CFF]"
                      strokeWidth="2.5"
                    />
                    {pt.count > 0 && (
                      <text
                        x={pt.x}
                        y={pt.y - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        className="fill-[#08093B] dark:fill-[#F3F5FF]"
                      >
                        {pt.count}
                      </text>
                    )}
                    <text
                      x={pt.x}
                      y={chartH - 7}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      className="fill-[#4D5072] dark:fill-[#9DA6CC]"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          3. ANALYTICS ROW 2: APPLICATIONS BY GRADE + APPLICATION STATUS DONUT
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Applications by Grade (6 cols) */}
        <div className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Applications by Grade</h2>
            </div>

            <button
              type="button"
              onClick={onViewGradeDetails}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
            >
              <span>View Details</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {byGrade.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">No grade breakdown yet</p>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Grade-wise application counts will appear once applications arrive.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto school-menu-scrollbar">
              <div className="flex items-end justify-around gap-3 h-44 pt-5 px-2 min-w-[300px]">
                {byGrade.map((item) => {
                  const pctHeight = Math.max(8, (item.count / gradeMax) * 100);
                  return (
                    <div
                      key={item.grade}
                      className="flex-1 min-w-[36px] max-w-[54px] flex flex-col items-center justify-end h-full gap-1.5"
                    >
                      <span className="text-[11px] font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {item.count.toLocaleString("en-IN")}
                      </span>
                      <div
                        className="w-full rounded-t-[8px] bg-gradient-to-t from-[#663CF6] via-[#8B5CF6] to-[#A78BFA] shadow-2xs transition-all"
                        style={{ height: `${pctHeight}%` }}
                        title={`${item.grade}: ${item.count}`}
                      />
                      <span className="text-[10px] font-semibold text-[#4D5072] truncate max-w-full dark:text-[#9DA6CC]">
                        {item.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Application Status Donut (6 cols) */}
        <div className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <PieChart className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Application Status</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* SVG Multi-segment Donut */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg
                className="w-36 h-36 -rotate-90"
                viewBox="0 0 100 100"
                role="img"
                aria-label="Application status distribution chart"
              >
                <title>Application Status Distribution</title>
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-[#F1F5F9] dark:stroke-[#232746]"
                  strokeWidth="14"
                  fill="none"
                />
                {kpis.totalApplications.value > 0 &&
                  statusBreakdown.map((slice) => {
                    if (slice.count <= 0) return null;
                    const arcLen =
                      (slice.count / kpis.totalApplications.value) * donutCircumference;
                    const offset = runningOffset;
                    runningOffset += arcLen;
                    return (
                      <circle
                        key={slice.status}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={slice.color}
                        strokeWidth="14"
                        strokeDasharray={`${arcLen.toFixed(2)} ${donutCircumference.toFixed(2)}`}
                        strokeDashoffset={`-${offset.toFixed(2)}`}
                        fill="none"
                      />
                    );
                  })}
              </svg>
              <div className="absolute text-center">
                <p className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {kpis.totalApplications.value.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">Applications</p>
              </div>
            </div>

            {/* Breakdown Legend */}
            <div className="flex-1 w-full space-y-2.5 text-xs">
              {statusBreakdown.map((slice) => (
                <div key={slice.status} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-[#4D5072] truncate dark:text-[#C5CCF0]">{slice.label}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 tabular-nums">
                    <span className="font-extrabold text-[#08093B] w-10 text-right dark:text-[#F3F5FF]">
                      {slice.count}
                    </span>
                    <span className="font-medium text-[#76799C] w-12 text-right dark:text-[#9DA6CC]">
                      {slice.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
