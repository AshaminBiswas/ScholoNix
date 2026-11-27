"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionFeeLedgerRecord,
  AdmissionSettingRecord,
} from "@/modules/school/admissions/types";
import {
  EnquiriesDonutChart,
  EnquiryTrendChart,
  PortalActionMenu,
  formatShortDate,
  type DonutSlice,
} from "../enquiries/enquiry-shared";
import {
  ADMISSION_TYPE_META,
  ENROLLMENT_STATUS_META,
  FEE_PAYMENT_STATUS_META,
  SeatUtilizationGauge,
  buildLedgerLookup,
  getStudentDocumentProgress,
} from "./admitted-shared";

interface AdmittedOverviewTabProps {
  students: AdmissionApplicationRecord[];
  allSubmittedApplicationsCount: number;
  ledgers: AdmissionFeeLedgerRecord[];
  settings: AdmissionSettingRecord;
  onViewStudent: (stu: AdmissionApplicationRecord) => void;
  onEditStudent: (stu: AdmissionApplicationRecord) => void;
  onDownloadPdf: (stu: AdmissionApplicationRecord) => void;
  onOpenIdCard: (students: AdmissionApplicationRecord[]) => void;
  onSwitchSubTab: (tab: "list" | "documents" | "fees" | "reports") => void;
}

export function AdmittedOverviewTab({
  students,
  allSubmittedApplicationsCount,
  ledgers,
  settings,
  onViewStudent,
  onEditStudent,
  onDownloadPdf,
  onOpenIdCard,
  onSwitchSubTab,
}: AdmittedOverviewTabProps) {
  const [trendGranularity, setTrendGranularity] = useState<"month" | "week">("month");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const ledgerByApp = useMemo(() => buildLedgerLookup(ledgers), [ledgers]);

  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const weekStart = now.getTime() - 7 * 86_400_000;
    const total = students.length;
    const thisMonth = students.filter(
      (s) => Date.parse(s.admittedAt || s.appliedAt) >= monthStart,
    ).length;
    const thisWeek = students.filter(
      (s) => Date.parse(s.admittedAt || s.appliedAt) >= weekStart,
    ).length;
    const rate =
      allSubmittedApplicationsCount > 0
        ? (total / allSubmittedApplicationsCount) * 100
        : 0;
    return { total, thisMonth, thisWeek, rate };
  }, [students, allSubmittedApplicationsCount]);

  const byGrade = useMemo(() => {
    const counts = new Map<string, number>();
    settings.enabledGrades.forEach((g) => counts.set(g, 0));
    for (const s of students) {
      counts.set(s.gradeApplied, (counts.get(s.gradeApplied) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0 || settings.enabledGrades.length <= 8)
      .slice(0, 8);
  }, [students, settings.enabledGrades]);

  const typeSlices = useMemo<DonutSlice[]>(() => {
    const total = students.length;
    if (total === 0) return [];
    const keys = ["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"] as const;
    return keys
      .map((k) => {
        const count = students.filter((s) => (s.admissionType || "FRESH") === k).length;
        return {
          label: ADMISSION_TYPE_META[k].label,
          count,
          percentage: (count / total) * 100,
          color: ADMISSION_TYPE_META[k].color,
        };
      })
      .filter((s) => s.count > 0);
  }, [students]);

  const trendPoints = useMemo(() => {
    const now = new Date();
    if (trendGranularity === "week") {
      const buckets: Array<{ start: number; end: number; label: string; count: number }> = [];
      for (let i = 5; i >= 0; i -= 1) {
        const end = now.getTime() - i * 7 * 86_400_000;
        const start = end - 7 * 86_400_000;
        buckets.push({
          start,
          end,
          label: i === 0 ? "This Wk" : `${i}w ago`,
          count: 0,
        });
      }
      for (const s of students) {
        const ts = Date.parse(s.admittedAt || s.appliedAt);
        const found = buckets.find((b) => ts >= b.start && ts <= b.end);
        if (found) found.count += 1;
      }
      return buckets.map(({ label, count }) => ({ label, count }));
    }

    const months: Array<{ key: string; label: string; count: number }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push({
        key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d),
        count: 0,
      });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const s of students) {
      const d = new Date(s.admittedAt || s.appliedAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.count += 1;
    }
    return months;
  }, [students, trendGranularity]);

  const totalSeatsCapacity = useMemo(() => {
    const seatsPerClass = settings.extendedConfig?.totalSeatsPerClass ?? 60;
    const gradesCount = Math.max(1, settings.enabledGrades.length);
    return seatsPerClass * gradesCount;
  }, [settings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.admissionNumber, s.applicationCode, s.studentName, s.gradeApplied, s.guardianPhone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pendingFeeCount = useMemo(
    () =>
      students.filter((s) => {
        const l = ledgerByApp.get(s.id);
        return l && l.outstandingPaise > 0;
      }).length,
    [students, ledgerByApp],
  );
  const pendingDocsCount = useMemo(
    () => students.filter((s) => getStudentDocumentProgress(s).status !== "COMPLETE").length,
    [students],
  );

  const maxGradeCount = Math.max(1, ...byGrade.map(([, c]) => c));

  return (
    <div className="space-y-4">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-[18px] border border-[#DFD8FA] bg-gradient-to-br from-[#F7F3FF] to-[#EFE9FF] p-4 shadow-xs dark:border-[#2F295C] dark:from-[#1B173D] dark:to-[#151232]">
          <p className="text-xs font-bold text-[#5B4B9A] dark:text-violet-300">Total Admitted</p>
          <p className="mt-1 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.total}
          </p>
          <p className="mt-0.5 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Confirmed enrollments
          </p>
        </div>

        <div className="rounded-[18px] border border-indigo-200/80 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]/70 p-4 shadow-xs dark:border-indigo-900/50 dark:from-[#161B3E] dark:to-[#111532]">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">This Month</p>
          <p className="mt-1 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.thisMonth}
          </p>
          <p className="mt-0.5 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Admitted this month
          </p>
        </div>

        <div className="rounded-[18px] border border-sky-200/80 bg-gradient-to-br from-[#F0F8FF] to-[#E6F4FE] p-4 shadow-xs dark:border-sky-900/50 dark:from-[#112238] dark:to-[#0E1B2E]">
          <p className="text-xs font-bold text-sky-700 dark:text-sky-300">This Week</p>
          <p className="mt-1 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.thisWeek}
          </p>
          <p className="mt-0.5 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">Last 7 days</p>
        </div>

        <div className="rounded-[18px] border border-emerald-200/80 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]/60 p-4 shadow-xs dark:border-emerald-900/50 dark:from-[#0E2920] dark:to-[#0A1F18]">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            Admission Rate
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.rate.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Admitted / Applications
          </p>
        </div>
      </div>

      {/* Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Admitted Students by Grade
            </h3>
            <button
              type="button"
              onClick={() => onSwitchSubTab("list")}
              className="text-xs font-bold text-[#6D28D9] hover:underline dark:text-violet-300"
            >
              View Details &rarr;
            </button>
          </div>
          {students.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No grade admissions yet
            </div>
          ) : (
            <div className="flex items-end gap-2.5 h-40 pt-4 px-1">
              {byGrade.map(([grade, count]) => (
                <div key={grade} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                    {count}
                  </span>
                  <div className="w-full max-w-[36px] h-24 rounded-t-lg bg-[#F0EBFE] dark:bg-[#1E2246] flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#7C3AED] to-[#A78BFA]"
                      style={{
                        height: `${Math.max(count > 0 ? 10 : 2, (count / maxGradeCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[#4D5072] dark:text-[#9DA6CC] truncate max-w-full">
                    {grade.replace(/^Class\s+/i, "")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Admitted by Admission Type
          </h3>
          <EnquiriesDonutChart
            centerValue={students.length}
            centerLabel="Admitted"
            slices={typeSlices}
            emptyLabel="Admit students to view admission type breakdown"
          />
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Admission Trend
            </h3>
            <select
              aria-label="Admission trend granularity"
              value={trendGranularity}
              onChange={(e) => setTrendGranularity(e.target.value as "month" | "week")}
              className="rounded-lg border border-[#CAD0EB] bg-[#F5F7FD] px-2.5 py-1 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="month">By Month</option>
              <option value="week">By Week</option>
            </select>
          </div>
          <EnquiryTrendChart points={trendPoints} />
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Seat Utilization
          </h3>
          <SeatUtilizationGauge admitted={students.length} totalSeats={totalSeatsCapacity} />
        </section>
      </div>

      {/* Admitted Students Preview Table */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Admitted Students ({filtered.length})
          </h3>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name, admission no., etc."
            className="w-64 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
          />
        </div>

        {students.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
            <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
              No admitted students yet
            </p>
            <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Once an application stage is updated to Admitted or you admit a student directly, their Admission Number appears here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2.5 pr-3">Admission No.</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Admission Date</th>
                    <th className="py-2.5 px-3">Admission Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Fee Status</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {paged.map((stu) => {
                    const typeMeta = ADMISSION_TYPE_META[stu.admissionType || "FRESH"];
                    const enrollMeta = ENROLLMENT_STATUS_META[stu.enrollmentStatus || "ACTIVE"];
                    const ledger = ledgerByApp.get(stu.id);
                    const feeMeta = FEE_PAYMENT_STATUS_META[ledger?.paymentStatus || "PENDING"];
                    return (
                      <tr
                        key={stu.id}
                        className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#1A1E3D]/70 transition-colors"
                      >
                        <td className="py-3 pr-3 font-extrabold text-[#6D28D9] dark:text-violet-300">
                          <button
                            type="button"
                            onClick={() => onViewStudent(stu)}
                            className="hover:underline"
                          >
                            {stu.admissionNumber || stu.applicationCode}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                          {stu.studentName}
                        </td>
                        <td className="py-3 px-3">{stu.gradeApplied}</td>
                        <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                          {formatShortDate(stu.admittedAt || stu.appliedAt)}
                        </td>
                        <td className="py-3 px-3">{typeMeta.label}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${enrollMeta.badgeClass}`}
                          >
                            {enrollMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${feeMeta.badgeClass}`}
                          >
                            {feeMeta.label}
                          </span>
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label={`View ${stu.studentName}`}
                              onClick={() => onViewStudent(stu)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300 dark:hover:bg-[#252A4E]"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 4.5c-4.17 0-7.63 2.57-9 5.5 1.37 2.93 4.83 5.5 9 5.5s7.63-2.57 9-5.5c-1.37-2.93-4.83-5.5-9-5.5zm0 8.83A3.33 3.33 0 1110 6.67a3.33 3.33 0 010 6.66z" />
                                <circle cx="10" cy="10" r="1.8" />
                              </svg>
                            </button>
                            <PortalActionMenu
                              ariaLabel={`Actions for ${stu.studentName}`}
                              items={[
                                { label: "View Details", onClick: () => onViewStudent(stu) },
                                { label: "Edit Application", onClick: () => onEditStudent(stu) },
                                {
                                  label: "Download Admission PDF",
                                  onClick: () => onDownloadPdf(stu),
                                },
                                { label: "Generate ID Card", onClick: () => onOpenIdCard([stu]) },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-[#232746] text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              <span>
                Showing {(safePage - 1) * pageSize + 1} –{" "}
                {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} admitted students
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[#D6DBF0] px-2.5 py-1 font-semibold disabled:opacity-40 dark:border-[#313761]"
                >
                  Prev
                </button>
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-[#D6DBF0] px-2.5 py-1 font-semibold disabled:opacity-40 dark:border-[#313761]"
                >
                  Next
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Bottom 2-Column Row: Recent Admissions + Important Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Recent Admissions
            </h3>
            <button
              type="button"
              onClick={() => onSwitchSubTab("list")}
              className="text-xs font-bold text-[#6D28D9] hover:underline dark:text-violet-300"
            >
              View All &rarr;
            </button>
          </div>
          {students.length === 0 ? (
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">No recent admissions yet.</p>
          ) : (
            students.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/60 px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#191D3D]"
              >
                <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {s.studentName} &ndash; {s.gradeApplied}
                </span>
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  {formatShortDate(s.admittedAt || s.appliedAt)}
                </span>
              </div>
            ))
          )}
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-1">
            Important Notes &amp; Reminders
          </h3>
          {[
            `${students.length} students admitted for ${settings.currentAcademicYear} (${
              totalSeatsCapacity > 0 ? ((students.length / totalSeatsCapacity) * 100).toFixed(1) : "0.0"
            }% seat utilization).`,
            `${Math.max(0, totalSeatsCapacity - students.length)} seats remaining across configured grades.`,
            `Pending fee payment for ${pendingFeeCount} admitted ${pendingFeeCount === 1 ? "student" : "students"}.`,
            `Verify and collect pending documents for ${pendingDocsCount} ${pendingDocsCount === 1 ? "student" : "students"}.`,
          ].map((note) => (
            <div
              key={note}
              className="rounded-xl border border-[#E5E9F8] bg-[#F5F7FD] px-3.5 py-2 text-xs font-medium text-[#1B1D45] dark:border-[#272B4D] dark:bg-[#191D3D] dark:text-[#DCE1F9]"
            >
              {note}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
