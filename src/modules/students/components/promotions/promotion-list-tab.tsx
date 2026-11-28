"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  Search,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import type {
  PromotionDecisionStatus,
  StudentPromotionDecisionRow,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

function statusBadge(status: PromotionDecisionStatus) {
  switch (status) {
    case "PROMOTED":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "ALUMNI":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300";
    case "NOT_PROMOTED":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300";
    default:
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
  }
}

function statusLabel(status: PromotionDecisionStatus) {
  switch (status) {
    case "PROMOTED":
      return "Promoted";
    case "ALUMNI":
      return "Alumni";
    case "NOT_PROMOTED":
      return "Not Promoted";
    default:
      return "Pending";
  }
}

interface PromotionListTabProps {
  data: StudentPromotionOverviewData;
  academicYear: string;
  fromGrade: string;
  toGrade: string;
  sectionFilter: string;
  statusFilter: string;
  searchQuery: string;
  canPromote: boolean;
  onFilterChange: (patch: {
    academicYear?: string;
    fromGrade?: string;
    toGrade?: string;
    section?: string;
    status?: string;
    search?: string;
  }) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onTriggerBatchAction: (params: {
    studentIds: string[];
    decision: "PROMOTE" | "RETAIN" | "ALUMNI";
    defaultToGrade?: string;
    dryRun?: boolean;
  }) => void;
}

export function PromotionListTab({
  data,
  academicYear,
  fromGrade,
  toGrade,
  sectionFilter,
  statusFilter,
  searchQuery,
  canPromote,
  onFilterChange,
  onOpenStudentProfile,
  onTriggerBatchAction,
}: PromotionListTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.decisions.filter((row) => {
      if (fromGrade !== "ALL" && row.currentGrade !== fromGrade) return false;
      if (toGrade !== "ALL" && row.nextGrade !== toGrade) return false;
      if (sectionFilter !== "ALL" && row.currentSection !== sectionFilter) return false;
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (
        q &&
        !row.studentName.toLowerCase().includes(q) &&
        !row.admissionNumber.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [data.decisions, fromGrade, toGrade, sectionFilter, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const total = filtered.length;
    const promoted = filtered.filter((r) => r.status === "PROMOTED" || r.status === "ALUMNI").length;
    const pending = filtered.filter((r) => r.status === "PENDING").length;
    const notPromoted = filtered.filter((r) => r.status === "NOT_PROMOTED").length;
    const pct = total > 0 ? Math.round((promoted / total) * 1000) / 10 : 0;
    return { total, promoted, pending, notPromoted, pct };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pageIds = pagedRows.map((r) => r.studentId);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleAllOnPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const defaultTargetGrade = useMemo(() => {
    const first = filtered.find((r) => selectedIds.includes(r.studentId)) ?? filtered[0];
    return first?.nextGrade && first.nextGrade !== "Alumni" ? first.nextGrade : data.grades[1] || "Class II";
  }, [filtered, selectedIds, data.grades]);

  const selectCls =
    "h-9 rounded-xl border border-[#D9DEF2] bg-white/95 px-3 text-xs font-semibold text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]";

  const renderRowAction = (row: StudentPromotionDecisionRow) => (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenStudentProfile(row.studentId);
        }}
        title="Open Student Profile"
        className="p-1.5 rounded-lg text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {canPromote && row.status !== "PROMOTED" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTriggerBatchAction({
              studentIds: [row.studentId],
              decision: row.nextGrade === "Alumni" ? "ALUMNI" : "PROMOTE",
              defaultToGrade: row.nextGrade,
            });
          }}
          title="Promote Student"
          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 cursor-pointer dark:text-emerald-300 dark:hover:bg-emerald-950/60"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
      )}
      {canPromote && row.status === "PENDING" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTriggerBatchAction({
              studentIds: [row.studentId],
              decision: "RETAIN",
              defaultToGrade: row.currentGrade,
            });
          }}
          title="Mark Not Promoted"
          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 cursor-pointer dark:text-rose-300 dark:hover:bg-rose-950/60"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Filters matching Screenshot 1 */}
      <div className={`${STUDENT_CARD_SURFACE} p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3`}>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            Academic Year
          </span>
          <select
            value={academicYear}
            onChange={(e) => {
              setPage(1);
              onFilterChange({ academicYear: e.target.value });
            }}
            className={selectCls}
          >
            {data.academicYears.map((ay) => (
              <option key={ay} value={ay}>
                {ay}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            From Class
          </span>
          <select
            value={fromGrade}
            onChange={(e) => {
              setPage(1);
              onFilterChange({ fromGrade: e.target.value });
            }}
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

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            To Class
          </span>
          <select
            value={toGrade}
            onChange={(e) => {
              setPage(1);
              onFilterChange({ toGrade: e.target.value });
            }}
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

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            Section
          </span>
          <select
            value={sectionFilter}
            onChange={(e) => {
              setPage(1);
              onFilterChange({ section: e.target.value });
            }}
            className={selectCls}
          >
            <option value="ALL">All Sections</option>
            {data.sections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:text-[#9DA6CC]">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              onFilterChange({ status: e.target.value });
            }}
            className={selectCls}
          >
            <option value="ALL">All Status</option>
            <option value="PROMOTED">Promoted</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_PROMOTED">Not Promoted</option>
            <option value="ALUMNI">Alumni</option>
          </select>
        </label>
      </div>

      {/* 5 Class-Scoped KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StudentKpiCard
          label="Total Students"
          value={counts.total}
          icon={<Users className="h-5 w-5" />}
          tone="violet"
          subtitle={fromGrade === "ALL" ? "All filtered classes" : fromGrade}
        />
        <StudentKpiCard
          label="Promoted"
          value={counts.promoted}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle={`${counts.pct.toFixed(1)}% of selection`}
        />
        <StudentKpiCard
          label="Pending"
          value={counts.pending}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
          subtitle="Awaiting confirmation"
        />
        <StudentKpiCard
          label="Not Promoted"
          value={counts.notPromoted}
          icon={<XCircle className="h-5 w-5" />}
          tone="pink"
          subtitle="Retained"
        />
        <StudentKpiCard
          label="Promotion %"
          value={`${counts.pct.toFixed(1)}%`}
          icon={<GraduationCap className="h-5 w-5" />}
          tone="sky"
          subtitle="Completion rate"
        />
      </div>

      {/* Bulk Action Strip when rows selected */}
      {canPromote && selectedIds.length > 0 && (
        <div className="rounded-2xl border border-[#C4B5FD] bg-[#F5F2FF] px-4 py-3 flex flex-wrap items-center justify-between gap-3 dark:border-[#4C3D99] dark:bg-[#1B1738]">
          <span className="text-xs font-extrabold text-[#4F27E8] dark:text-[#DDD6FE]">
            {selectedIds.length} student{selectedIds.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onTriggerBatchAction({
                  studentIds: selectedIds,
                  decision: "PROMOTE",
                  defaultToGrade: defaultTargetGrade,
                  dryRun: true,
                })
              }
              className="h-8 inline-flex items-center gap-1.5 rounded-xl border border-[#C4B5FD] bg-white px-3 text-xs font-bold text-[#4F27E8] hover:bg-[#EDE7FF] cursor-pointer dark:border-[#4C3D99] dark:bg-[#10132A] dark:text-[#DDD6FE]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Dry-Run Preview</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onTriggerBatchAction({
                  studentIds: selectedIds,
                  decision: "PROMOTE",
                  defaultToGrade: defaultTargetGrade,
                })
              }
              className="h-8 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-3.5 text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Promote Selected</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onTriggerBatchAction({
                  studentIds: selectedIds,
                  decision: "RETAIN",
                  defaultToGrade: fromGrade !== "ALL" ? fromGrade : defaultTargetGrade,
                })
              }
              className="h-8 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer dark:border-rose-900 dark:bg-[#10132A] dark:text-rose-300"
            >
              Mark Not Promoted
            </button>
            <button
              type="button"
              onClick={() =>
                onTriggerBatchAction({
                  studentIds: selectedIds,
                  decision: "ALUMNI",
                  defaultToGrade: "Alumni",
                })
              }
              className="h-8 inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer dark:border-indigo-900 dark:bg-[#10132A] dark:text-indigo-300"
            >
              Graduate Alumni
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-8 px-2.5 text-xs font-semibold text-[#76799C] hover:underline cursor-pointer dark:text-[#9DA6CC]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Student-level Promotion Table matching Screenshot 1 */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Promotion List — {fromGrade === "ALL" ? "All Classes" : fromGrade}{" "}
              {toGrade !== "ALL" ? `→ ${toGrade}` : ""}
            </h3>
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#76799C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                onFilterChange({ search: e.target.value });
              }}
              placeholder="Search by student name, admission no..."
              className="h-8 w-64 rounded-xl border border-[#D9DEF2] bg-white/95 pl-8 pr-3 text-xs text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 pl-4 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all students on page"
                    className="h-3.5 w-3.5 rounded border-[#C5CCF0] accent-[#663CF6]"
                  />
                </th>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-3">Admission No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Current Class</th>
                <th className="py-2.5 px-2">Sec.</th>
                <th className="py-2.5 px-3">Next Class</th>
                <th className="py-2.5 px-3 text-center">Result</th>
                <th className="py-2.5 px-3 text-right">Promotion %</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                  >
                    No student promotion records match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, idx) => (
                  <tr
                    key={row.studentId}
                    onClick={() => onOpenStudentProfile(row.studentId)}
                    className="hover:bg-[#F6F5FF]/70 transition-colors cursor-pointer dark:hover:bg-[#1B1F3F]/60"
                  >
                    <td
                      className="py-2.5 pl-4 pr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.studentId)}
                        onChange={() => toggleOne(row.studentId)}
                        aria-label={`Select ${row.studentName}`}
                        className="h-3.5 w-3.5 rounded border-[#C5CCF0] accent-[#663CF6]"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-[#76799C] dark:text-[#9DA6CC]">
                      {(safePage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
                      {row.admissionNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#663CF6] to-[#4F27E8] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {row.studentName
                            .split(" ")
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")}
                        </span>
                        <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          {row.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#4D5072] dark:text-[#B4BDD9]">
                      {row.currentGrade}
                    </td>
                    <td className="py-2.5 px-2 text-[#4D5072] dark:text-[#B4BDD9]">
                      {row.currentSection}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#08093B] dark:text-[#EEF0FF]">
                      {row.nextGrade}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex min-w-[28px] justify-center rounded-md bg-[#EDE7FF] px-1.5 py-0.5 text-[10px] font-black text-[#4F27E8] dark:bg-[#251D4A] dark:text-[#DDD6FE]">
                        {row.resultGrade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08093B] dark:text-[#EEF0FF]">
                      {row.promotionPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBadge(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{renderRowAction(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} students
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded-lg border border-[#D9DEF2] bg-white px-2 text-[11px] font-bold text-[#08093B] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 font-bold text-[#08093B] dark:text-[#EEF0FF]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-[#D9DEF2] disabled:opacity-40 cursor-pointer dark:border-[#2E345E]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
