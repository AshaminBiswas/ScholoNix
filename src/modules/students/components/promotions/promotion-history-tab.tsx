"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  Layers,
  Percent,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import type {
  PromotionSuiteTab,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

function HistoryRateTrendChart({
  points,
}: {
  points: Array<{ label: string; pct: number }>;
}) {
  const safe = points.length > 0 ? points : [{ label: "Current", pct: 98.5 }];
  const w = 520;
  const h = 190;
  const padX = 42;
  const padTop = 24;
  const padBottom = 26;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBottom;
  const minVal = Math.max(0, Math.min(...safe.map((p) => p.pct)) - 3);
  const maxVal = 100;
  const range = Math.max(1, maxVal - minVal);

  const coords = safe.map((p, idx) => {
    const x =
      safe.length === 1
        ? padX + plotW / 2
        : padX + (idx / (safe.length - 1)) * plotW;
    const norm = (p.pct - minVal) / range;
    const y = padTop + plotH - norm * (plotH * 0.8) - plotH * 0.08;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1]!.x},${padTop + plotH} L${coords[0]!.x},${padTop + plotH} Z`
      : "";

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
      <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
        Promotion Trend{" "}
        <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">
          (Last {safe.length} Years)
        </span>
      </h3>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[320px] h-44" role="img" aria-label="Historical promotion rate chart">
          <defs>
            <linearGradient id="snxHistPromoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#663CF6" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#663CF6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.2, 0.5, 0.8].map((frac) => (
            <line
              key={frac}
              x1={padX}
              x2={w - padX}
              y1={padTop + plotH * frac}
              y2={padTop + plotH * frac}
              className="stroke-[#E3E7F7] dark:stroke-[#272B4D]"
              strokeDasharray="3 4"
            />
          ))}
          {areaPath && <path d={areaPath} fill="url(#snxHistPromoGrad)" />}
          {linePath && (
            <path d={linePath} fill="none" stroke="#663CF6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {coords.map((c, idx) => (
            <g key={`${c.label}-${idx}`}>
              <circle cx={c.x} cy={c.y} r="4.2" className="fill-white dark:fill-[#141731]" stroke="#663CF6" strokeWidth="2.4" />
              <text x={c.x} y={c.y - 10} textAnchor="middle" className="fill-[#08093B] dark:fill-[#E9ECFF] text-[10px] font-bold">
                {c.pct.toFixed(1)}%
              </text>
              <text x={c.x} y={h - 6} textAnchor="middle" className="fill-[#76799C] dark:fill-[#9DA6CC] text-[9.5px] font-semibold">
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function PromotionHistoryTab({
  data,
  onSwitchTab,
  onSelectYearAndOpenList,
  onDownloadReport,
}: {
  data: StudentPromotionOverviewData;
  onSwitchTab: (tab: PromotionSuiteTab) => void;
  onSelectYearAndOpenList: (academicYear: string, fromGrade?: string) => void;
  onDownloadReport: () => void;
}) {
  const [yearFilter, setYearFilter] = useState("ALL");

  const visibleBatches = useMemo(
    () =>
      yearFilter === "ALL"
        ? data.batches
        : data.batches.filter((b) => b.academicYear === yearFilter),
    [data.batches, yearFilter],
  );

  const totals = useMemo(() => {
    const promoted = visibleBatches.reduce((acc, b) => acc + b.promotedCount + b.alumniCount, 0);
    const retained = visibleBatches.reduce((acc, b) => acc + b.retainedCount, 0);
    const eligible = Math.max(promoted + retained, data.kpis.promotedCount + data.kpis.notPromotedCount);
    const rate =
      promoted + retained > 0
        ? Math.round((promoted / (promoted + retained)) * 1000) / 10
        : data.kpis.promotionRatePct;
    const latest = visibleBatches[0]?.completedAt
      ? new Date(visibleBatches[0].completedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Current Cycle";
    return {
      batches: visibleBatches.length,
      promoted: promoted || data.kpis.promotedCount,
      retained: retained || data.kpis.notPromotedCount,
      eligible,
      rate,
      latest,
    };
  }, [visibleBatches, data.kpis]);

  const ratePoints = useMemo(() => {
    if (data.batches.length > 0) {
      return [...data.batches]
        .slice(0, 7)
        .reverse()
        .map((b) => ({ label: b.academicYear, pct: b.promotionPct }));
    }
    return data.trendByYear.map((t) => ({
      label: t.label,
      pct: data.kpis.promotionRatePct || 98.5,
    }));
  }, [data.batches, data.trendByYear, data.kpis.promotionRatePct]);

  return (
    <div className="space-y-5">
      {/* History KPI Strip + Year Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
            Promotion History
          </h3>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Track all past promotion batches, inspect year-wise completions, and download audit-ready reports.
          </p>
        </div>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="h-9 rounded-xl border border-[#D9DEF2] bg-white px-3 text-xs font-bold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
        >
          <option value="ALL">All Academic Years</option>
          {data.academicYears.map((ay) => (
            <option key={ay} value={ay}>
              {ay}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StudentKpiCard
          label="Total Batches"
          value={totals.batches}
          icon={<Layers className="h-5 w-5" />}
          tone="violet"
          subtitle="Recorded promotion runs"
        />
        <StudentKpiCard
          label="Total Promoted"
          value={totals.promoted}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle="Across selected years"
        />
        <StudentKpiCard
          label="Total Not Promoted"
          value={totals.retained}
          icon={<XCircle className="h-5 w-5" />}
          tone="amber"
          subtitle="Retained records"
        />
        <StudentKpiCard
          label="Overall Promotion Rate"
          value={`${totals.rate.toFixed(1)}%`}
          icon={<Percent className="h-5 w-5" />}
          tone="sky"
          subtitle="Historical pass rate"
        />
        <StudentKpiCard
          label="Last Promotion"
          value={totals.latest}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          tone="violet"
          subtitle="Most recent batch"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <HistoryRateTrendChart points={ratePoints} />
        </div>
        <div className="lg:col-span-5">
          <StudentDonutChart
            title="Promotion Outcome (All Years)"
            centerTotal={totals.promoted + totals.retained}
            centerLabel="Students"
            slices={[
              {
                label: "Promoted",
                count: totals.promoted,
                percentage:
                  totals.promoted + totals.retained > 0
                    ? Math.round((totals.promoted / (totals.promoted + totals.retained)) * 1000) / 10
                    : 0,
                color: "#22C55E",
              },
              {
                label: "Not Promoted",
                count: totals.retained,
                percentage:
                  totals.promoted + totals.retained > 0
                    ? Math.round((totals.retained / (totals.promoted + totals.retained)) * 1000) / 10
                    : 0,
                color: "#F43F5E",
              },
            ]}
          />
        </div>
      </div>

      {/* Promotion History Records (Year-wise) Table */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex items-center justify-between dark:border-[#272B4D]">
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <History className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Promotion History Records (Year-wise)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-3">Academic Year</th>
                <th className="py-2.5 px-3">From Class</th>
                <th className="py-2.5 px-3">To Class</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Promoted</th>
                <th className="py-2.5 px-3 text-right">Not Promoted</th>
                <th className="py-2.5 px-3 text-right">Promotion %</th>
                <th className="py-2.5 px-3">Completed On</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {visibleBatches.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                  >
                    No finalized promotion batch history recorded yet. Execute a batch from Overview or Promotion List to populate audit history.
                  </td>
                </tr>
              ) : (
                visibleBatches.map((batch, idx) => (
                  <tr key={batch.id} className="hover:bg-[#F6F5FF]/70 dark:hover:bg-[#1B1F3F]/60">
                    <td className="py-2.5 px-4 text-[#76799C] dark:text-[#9DA6CC]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {batch.academicYear} → {batch.toAcademicYear}
                    </td>
                    <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                      {batch.fromGrade || "All Classes"}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#4F27E8] dark:text-[#C4B5FD]">
                      {batch.toGrade || "Next Class"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {batch.totalEligible}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                      {batch.promotedCount + batch.alumniCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700 dark:text-rose-300">
                      {batch.retainedCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08093B] dark:text-[#EEF0FF]">
                      {batch.promotionPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                      {batch.completedAt ? batch.completedAt.slice(0, 10) : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {batch.status === "COMPLETED" ? "Completed" : batch.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectYearAndOpenList(batch.academicYear, batch.fromGrade || undefined)
                          }
                          title="View batch students"
                          className="p-1.5 rounded-lg text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onDownloadReport}
                          title="Download CSV report"
                          className="p-1.5 rounded-lg text-[#4D5072] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#B4BDD9] dark:hover:bg-[#251D4A]"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class-wise Promotion History + Recent Promotion Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Class-wise Promotion History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEEFA] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-3">Class (From)</th>
                  <th className="py-2 px-3">Class (To)</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-right">Promoted</th>
                  <th className="py-2 px-3 text-right">Not Promoted</th>
                  <th className="py-2 pl-3 text-right">Promotion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
                {data.classMatrix.map((c) => (
                  <tr key={c.fromGrade}>
                    <td className="py-2 pr-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {c.fromGrade}
                    </td>
                    <td className="py-2 px-3 text-[#4D5072] dark:text-[#B4BDD9]">{c.toGrade}</td>
                    <td className="py-2 px-3 text-right font-semibold">{c.totalStudents}</td>
                    <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-300 font-semibold">
                      {c.promotedCount}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-700 dark:text-rose-300 font-semibold">
                      {c.notPromotedCount}
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {c.promotionPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Recent Promotion Activity
          </h3>
          {data.batches.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Activity timeline updates automatically whenever promotion batches or rules are saved.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.batches.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="flex items-start gap-2.5 rounded-xl border border-[#EAEEFA] bg-white/80 p-3 dark:border-[#272B4D] dark:bg-[#10132A]"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        Promotion Completed ({b.toGrade || "Batch"})
                      </p>
                      <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                        {b.completedAt ? b.completedAt.slice(0, 10) : "Recent"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4D5072] dark:text-[#B4BDD9] mt-0.5">
                      {b.promotedCount + b.alumniCount} promoted, {b.retainedCount} retained by{" "}
                      {b.triggeredByName}.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Quick Actions Strip matching Screenshot 3 */}
      <div className={`${STUDENT_CARD_SURFACE} p-4`}>
        <h3 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF] mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            {
              label: "View Student Promotions",
              icon: <Users className="h-4 w-4" />,
              onClick: () => onSwitchTab("list"),
            },
            {
              label: "Download History Report",
              icon: <Download className="h-4 w-4" />,
              onClick: onDownloadReport,
            },
            {
              label: "Promotion Summary",
              icon: <FileSpreadsheet className="h-4 w-4" />,
              onClick: () => onSwitchTab("overview"),
            },
            {
              label: "Promotion Rules",
              icon: <Layers className="h-4 w-4" />,
              onClick: () => onSwitchTab("rules"),
            },
            {
              label: "Result Criteria",
              icon: <ShieldCheck className="h-4 w-4" />,
              onClick: () => onSwitchTab("criteria"),
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#E5E8F8] bg-white/85 px-3 py-3 text-center hover:border-[#663CF6] hover:bg-[#F6F5FF] transition-colors cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1B1F3F]"
            >
              <span className="text-[#663CF6] dark:text-[#C4B5FD]">{item.icon}</span>
              <span className="text-[11px] font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
