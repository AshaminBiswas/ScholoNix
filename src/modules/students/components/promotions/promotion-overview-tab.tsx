"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileBarChart2,
  Filter,
  History,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
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
  StudentGradeBarChart,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

function PromotionTrendSvgChart({
  points,
  granularityLabel = "By Year",
}: {
  points: Array<{ label: string; count: number }>;
  granularityLabel?: string;
}) {
  const safePoints = points.length > 0 ? points : [{ label: "Current", count: 0 }];
  const w = 520;
  const h = 190;
  const padX = 42;
  const padTop = 24;
  const padBottom = 26;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBottom;
  const maxVal = Math.max(1, ...safePoints.map((p) => p.count));
  const minVal = Math.max(0, Math.min(...safePoints.map((p) => p.count)) * 0.85);
  const range = Math.max(1, maxVal - minVal);

  const coords = safePoints.map((p, idx) => {
    const x =
      safePoints.length === 1
        ? padX + plotW / 2
        : padX + (idx / (safePoints.length - 1)) * plotW;
    const norm = (p.count - minVal) / range;
    const y = padTop + plotH - norm * (plotH * 0.78) - plotH * 0.08;
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
          Promotion Trend
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
          aria-label="Promotion trend line chart"
        >
          <defs>
            <linearGradient id="snxPromoTrendGrad" x1="0" y1="0" x2="0" y2="1">
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
          {areaPath && <path d={areaPath} fill="url(#snxPromoTrendGrad)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#663CF6"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {coords.map((c, idx) => (
            <g key={`${c.label}-${idx}`}>
              <circle
                cx={c.x}
                cy={c.y}
                r="4.2"
                className="fill-white dark:fill-[#141731]"
                stroke="#663CF6"
                strokeWidth="2.4"
              />
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor="middle"
                className="fill-[#08093B] dark:fill-[#E9ECFF] text-[10px] font-bold"
              >
                {c.count.toLocaleString("en-IN")}
              </text>
              <text
                x={c.x}
                y={h - 6}
                textAnchor="middle"
                className="fill-[#76799C] dark:fill-[#9DA6CC] text-[9.5px] font-semibold"
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

interface PromotionOverviewTabProps {
  data: StudentPromotionOverviewData;
  academicYear: string;
  fromGrade: string;
  toGrade: string;
  statusFilter: string;
  onFilterChange: (patch: {
    academicYear?: string;
    fromGrade?: string;
    toGrade?: string;
    status?: string;
  }) => void;
  onResetFilters: () => void;
  onSwitchTab: (tab: PromotionSuiteTab) => void;
  onOpenClassList: (grade: string) => void;
  onOpenBatchModal: (defaultFromGrade?: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onDownloadReport: () => void;
}

export function PromotionOverviewTab({
  data,
  academicYear,
  fromGrade,
  toGrade,
  statusFilter,
  onFilterChange,
  onResetFilters,
  onSwitchTab,
  onOpenClassList,
  onOpenBatchModal,
  onOpenStudentProfile,
  onDownloadReport,
}: PromotionOverviewTabProps) {
  const [classQuery, setClassQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredMatrix = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    if (!q) return data.classMatrix;
    return data.classMatrix.filter(
      (row) =>
        row.fromGrade.toLowerCase().includes(q) ||
        row.toGrade.toLowerCase().includes(q) ||
        row.sectionSummary.toLowerCase().includes(q),
    );
  }, [data.classMatrix, classQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMatrix.length / pageSize));
  const pagedMatrix = filteredMatrix.slice((page - 1) * pageSize, page * pageSize);

  const selectCls =
    "h-9 rounded-xl border border-[#D9DEF2] bg-white/95 px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

  return (
    <div className="space-y-5">
      {/* Filter Strip */}
      <div className={`${STUDENT_CARD_SURFACE} p-3.5 sm:p-4 flex flex-wrap items-end gap-3`}>
        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            Academic Year
          </span>
          <select
            value={academicYear}
            onChange={(e) => onFilterChange({ academicYear: e.target.value })}
            className={selectCls}
          >
            {data.academicYears.map((ay) => (
              <option key={ay} value={ay}>
                {ay}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            From Class
          </span>
          <select
            value={fromGrade}
            onChange={(e) => onFilterChange({ fromGrade: e.target.value })}
            className={selectCls}
          >
            <option value="ALL">All Classes</option>
            {data.grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            To Class
          </span>
          <select
            value={toGrade}
            onChange={(e) => onFilterChange({ toGrade: e.target.value })}
            className={selectCls}
          >
            <option value="ALL">All Classes</option>
            {data.grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value="Alumni">Alumni / Graduate</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className={selectCls}
          >
            <option value="ALL">All Status</option>
            <option value="PROMOTED">Promoted</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_PROMOTED">Not Promoted</option>
            <option value="ALUMNI">Alumni</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onResetFilters}
          className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white/90 px-3 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#C5CCF0] dark:hover:bg-[#1B1F3F]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StudentKpiCard
          label="Total Students"
          value={data.kpis.totalStudents}
          icon={<Users className="h-5 w-5" />}
          tone="violet"
          subtitle={`for AY ${academicYear}`}
        />
        <StudentKpiCard
          label="Eligible for Promotion"
          value={data.kpis.eligibleStudents}
          icon={<Award className="h-5 w-5" />}
          tone="sky"
          subtitle="Active cohort pool"
        />
        <StudentKpiCard
          label="Promoted"
          value={data.kpis.promotedCount}
          deltaPct={Number(data.kpis.promotionRatePct.toFixed(1))}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle={`${data.kpis.promotionRatePct.toFixed(1)}% completed`}
        />
        <StudentKpiCard
          label="Pending"
          value={data.kpis.pendingCount}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
          subtitle={`${data.kpis.totalStudents > 0 ? ((data.kpis.pendingCount / data.kpis.totalStudents) * 100).toFixed(1) : "0.0"}% awaiting review`}
        />
        <StudentKpiCard
          label="Not Promoted"
          value={data.kpis.notPromotedCount}
          icon={<XCircle className="h-5 w-5" />}
          tone="pink"
          subtitle="Retained in class"
        />
      </div>

      {/* Charts Row: Promotion Trend + Promotion by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <PromotionTrendSvgChart points={data.trendByYear} granularityLabel="By Year" />
        </div>
        <div className="lg:col-span-5">
          <StudentDonutChart
            title="Promotion by Status"
            centerTotal={data.kpis.eligibleStudents}
            centerLabel="Eligible"
            slices={[
              {
                label: "Promoted",
                count: data.kpis.promotedCount,
                percentage:
                  data.kpis.eligibleStudents > 0
                    ? Math.round((data.kpis.promotedCount / data.kpis.eligibleStudents) * 1000) / 10
                    : 0,
                color: "#22C55E",
              },
              {
                label: "Pending",
                count: data.kpis.pendingCount,
                percentage:
                  data.kpis.eligibleStudents > 0
                    ? Math.round((data.kpis.pendingCount / data.kpis.eligibleStudents) * 1000) / 10
                    : 0,
                color: "#F59E0B",
              },
              {
                label: "Not Promoted",
                count: data.kpis.notPromotedCount,
                percentage:
                  data.kpis.eligibleStudents > 0
                    ? Math.round((data.kpis.notPromotedCount / data.kpis.eligibleStudents) * 1000) / 10
                    : 0,
                color: "#EC4899",
              },
            ]}
          />
        </div>
      </div>

      {/* Readiness Checklist + Progress by Class */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-5 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Promotion Readiness{" "}
              <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                (Current Year)
              </span>
            </h3>
            <button
              type="button"
              onClick={() => onSwitchTab("criteria")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              Review Criteria
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              {
                label: "Results Published",
                ready: data.readiness.resultsPublished,
                targetTab: "criteria" as PromotionSuiteTab,
              },
              {
                label: "Attendance Verified",
                ready: data.readiness.attendanceVerified,
                targetTab: "criteria" as PromotionSuiteTab,
              },
              {
                label: "Promotion Rules Configured",
                ready: data.readiness.rulesConfigured,
                targetTab: "rules" as PromotionSuiteTab,
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSwitchTab(item.targetTab)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#E5E8F8] bg-white/75 px-3.5 py-2.5 text-left hover:border-[#C4B5FD] transition-colors cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A] dark:hover:border-[#663CF6]"
              >
                <span className="text-xs font-bold text-[#08093B] dark:text-[#EEF0FF]">
                  {item.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    item.ready
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{item.ready ? "Complete" : "Configure"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <StudentGradeBarChart
            title="Promotion Progress by Class"
            bars={data.trendByClass}
            onViewDetails={() => onSwitchTab("list")}
          />
        </div>
      </div>

      {/* Class-wise Promotion List Matrix */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Promotion List
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#76799C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={classQuery}
                onChange={(e) => {
                  setClassQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by class, section..."
                className="h-8 w-56 rounded-xl border border-[#D9DEF2] bg-white/95 pl-8 pr-3 text-xs text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              />
            </div>
            <button
              type="button"
              onClick={() => onSwitchTab("list")}
              className="h-8 inline-flex items-center gap-1 rounded-xl border border-[#D9DEF2] bg-white/90 px-2.5 text-xs font-bold text-[#4D5072] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#C5CCF0]"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 px-4">Class (Current)</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Promote To</th>
                <th className="py-2.5 px-3 text-right">Total Students</th>
                <th className="py-2.5 px-3 text-right">Promoted</th>
                <th className="py-2.5 px-3 text-right">Pending</th>
                <th className="py-2.5 px-3 text-right">Not Promoted</th>
                <th className="py-2.5 px-3 text-right">Promotion %</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {pagedMatrix.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                  >
                    No class promotion data matches the current filters.
                  </td>
                </tr>
              ) : (
                pagedMatrix.map((row) => (
                  <tr
                    key={row.fromGrade}
                    className="hover:bg-[#F6F5FF]/70 transition-colors dark:hover:bg-[#1B1F3F]/60"
                  >
                    <td className="py-2.5 px-4 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {row.fromGrade}
                    </td>
                    <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                      {row.sectionSummary}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#4F27E8] dark:text-[#C4B5FD]">
                      {row.toGrade}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {row.totalStudents}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                      {row.promotedCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700 dark:text-amber-300">
                      {row.pendingCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700 dark:text-rose-300">
                      {row.notPromotedCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08093B] dark:text-[#EEF0FF]">
                      {row.promotionPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          row.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenClassList(row.fromGrade)}
                          title={`View ${row.fromGrade} Promotion List`}
                          className="p-1.5 rounded-lg text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenBatchModal(row.fromGrade)}
                          title={`Run promotion batch for ${row.fromGrade}`}
                          className="p-1.5 rounded-lg text-[#4D5072] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#B4BDD9] dark:hover:bg-[#251D4A]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[#EAEEFA] flex items-center justify-between text-[11px] text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
          <span>
            Showing {pagedMatrix.length} of {filteredMatrix.length} classes
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-bold text-[#08093B] dark:text-[#EEF0FF]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Bento: Summary | Recent Promotions | Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-4 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Promotion Summary
          </h3>
          <div className="space-y-2 text-xs">
            {[
              { label: "Total Classes", val: data.classMatrix.length },
              { label: "Total Students", val: data.kpis.totalStudents },
              { label: "Eligible Students", val: data.kpis.eligibleStudents },
              { label: "Promoted", val: data.kpis.promotedCount, cls: "text-emerald-600 dark:text-emerald-300" },
              { label: "Pending", val: data.kpis.pendingCount, cls: "text-amber-600 dark:text-amber-300" },
              { label: "Not Promoted", val: data.kpis.notPromotedCount, cls: "text-rose-600 dark:text-rose-300" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-1.5 border-b border-[#F0F2FB] last:border-0 dark:border-[#232746]"
              >
                <span className="font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                  {row.label}
                </span>
                <span
                  className={`font-black ${
                    row.cls || "text-[#08093B] dark:text-[#EEF0FF]"
                  }`}
                >
                  {row.val.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-4 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Recent Promotions
            </h3>
            <button
              type="button"
              onClick={() => onSwitchTab("list")}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {data.recentPromotions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No promotion records finalized yet for {academicYear}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recentPromotions.slice(0, 5).map((item) => (
                <button
                  key={item.studentId}
                  type="button"
                  onClick={() => onOpenStudentProfile(item.studentId)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#EAEEFA] bg-white/80 px-3 py-2 text-left hover:border-[#C4B5FD] transition-colors cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-8 w-8 rounded-full bg-gradient-to-br from-[#663CF6] to-[#4F27E8] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {item.studentName
                        .split(" ")
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {item.studentName}
                      </p>
                      <p className="text-[10px] font-medium text-[#76799C] truncate dark:text-[#9DA6CC]">
                        {item.currentGrade} → {item.nextGrade}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {item.status === "ALUMNI" ? "Alumni" : "Promoted"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-4 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "New Promotion",
                sub: "Select Class",
                icon: <Plus className="h-4 w-4" />,
                onClick: () => onOpenBatchModal(),
              },
              {
                label: "Bulk Promotion",
                sub: "Multiple Classes",
                icon: <Layers className="h-4 w-4" />,
                onClick: () => onSwitchTab("list"),
              },
              {
                label: "Promotion Rules",
                sub: "Set Mapping",
                icon: <SlidersHorizontal className="h-4 w-4" />,
                onClick: () => onSwitchTab("rules"),
              },
              {
                label: "Generate Report",
                sub: "Class Wise CSV",
                icon: <FileBarChart2 className="h-4 w-4" />,
                onClick: onDownloadReport,
              },
              {
                label: "View History",
                sub: "Past Years",
                icon: <History className="h-4 w-4" />,
                onClick: () => onSwitchTab("history"),
              },
              {
                label: "Settings",
                sub: "Configure",
                icon: <Settings className="h-4 w-4" />,
                onClick: () => onSwitchTab("settings"),
              },
            ].map((act) => (
              <button
                key={act.label}
                type="button"
                onClick={act.onClick}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#E5E8F8] bg-white/85 px-2.5 py-3 text-center hover:border-[#663CF6] hover:bg-[#F6F5FF] transition-colors cursor-pointer dark:border-[#272B4D] dark:bg-[#10132A] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1B1F3F]"
              >
                <span className="text-[#663CF6] dark:text-[#C4B5FD]">{act.icon}</span>
                <span className="text-[11px] font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {act.label}
                </span>
                <span className="text-[9.5px] font-medium text-[#76799C] dark:text-[#9DA6CC]">
                  ({act.sub})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
