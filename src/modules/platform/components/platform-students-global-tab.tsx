"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  Award,
  Building2,
  GraduationCap,
  Loader2,
  RefreshCw,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  PlatformGlobalStudentsAnalytics,
  StudentFilterParams,
} from "@/modules/students/types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentEnrolmentTrendChart,
  StudentFilterStrip,
  StudentGradeBarChart,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

export function PlatformStudentsGlobalTab({
  onSelectSchoolStudent,
  onToast,
}: {
  onSelectSchoolStudent: (schoolId: string, studentId?: string | null) => void;
  onToast?: (type: "success" | "error", text: string) => void;
}) {
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [filters, setFilters] = useState<StudentFilterParams>({
    status: "ALL",
    gender: "ALL",
    page: 1,
    pageSize: 15,
  });
  const [data, setData] = useState<PlatformGlobalStudentsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGlobal = async (
    nextSchoolId = schoolFilter,
    nextFilters = filters,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (nextSchoolId !== "ALL") sp.set("schoolId", nextSchoolId);
      if (nextFilters.academicYear) sp.set("academicYear", nextFilters.academicYear);
      if (nextFilters.grade) sp.set("grade", nextFilters.grade);
      if (nextFilters.section) sp.set("section", nextFilters.section);
      if (nextFilters.status && nextFilters.status !== "ALL") {
        sp.set("status", nextFilters.status);
      }
      if (nextFilters.gender && nextFilters.gender !== "ALL") {
        sp.set("gender", nextFilters.gender);
      }
      if (nextFilters.fromDate) sp.set("fromDate", nextFilters.fromDate);
      if (nextFilters.search) sp.set("search", nextFilters.search);

      const res = await fetch(`/api/platform/students/overview?${sp.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Failed to load global students overview.");
      }
      setData(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load global students.";
      setError(msg);
      onToast?.("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobal(schoolFilter, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    schoolFilter,
    filters.academicYear,
    filters.grade,
    filters.section,
    filters.status,
    filters.gender,
    filters.fromDate,
    filters.search,
  ]);

  const analytics = data?.analytics;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
            Clients &gt;{" "}
            <span className="text-[#663CF6] dark:text-[#C4B5FD]">
              Global Students Analytics
            </span>
          </p>
          <h2 className="mt-0.5 text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
            Platform Students &amp; Enrolment Intelligence
          </h2>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Cross-school student analytics cached via Upstash Redis across{" "}
            {data?.totalSchoolsWithStudents ?? 0} client school(s).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter global students by school"
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
          >
            <option value="ALL">All Client Schools</option>
            {(data?.schoolSummaries || []).map((s) => (
              <option key={s.schoolId} value={s.schoolId}>
                {s.schoolName} ({s.totalStudents})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadGlobal()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C4B5FD]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {data && (
        <StudentFilterStrip
          filters={filters}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          academicYears={data.academicYears}
          grades={data.grades}
          sections={data.sections}
        />
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-16 text-xs font-bold text-[#76799C] dark:text-[#9DA6CC]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#663CF6]" />
          <span>Loading platform-wide student analytics...</span>
        </div>
      ) : error && !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-xs font-bold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : (
        analytics &&
        data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <StudentKpiCard
                label="Total Students"
                value={analytics.kpis.totalStudents}
                deltaPct={analytics.kpis.totalGrowthPct}
                icon={<Users className="h-5 w-5" />}
                tone="violet"
              />
              <StudentKpiCard
                label="Active Students"
                value={analytics.kpis.activeStudents}
                deltaPct={analytics.kpis.activeGrowthPct}
                icon={<GraduationCap className="h-5 w-5" />}
                tone="sky"
              />
              <StudentKpiCard
                label="New Enrolments"
                value={analytics.kpis.newEnrolments}
                deltaPct={analytics.kpis.newEnrolmentsGrowthPct}
                icon={<UserPlus className="h-5 w-5" />}
                tone="emerald"
              />
              <StudentKpiCard
                label="Transferred"
                value={analytics.kpis.transferredCount}
                deltaPct={analytics.kpis.transferredGrowthPct}
                icon={<ArrowRightLeft className="h-5 w-5" />}
                tone="amber"
              />
              <StudentKpiCard
                label="Alumni / Inactive"
                value={`${analytics.kpis.alumniCount} / ${analytics.kpis.inactiveStudents}`}
                icon={<Award className="h-5 w-5" />}
                tone="pink"
                subtitle="Graduated / Inactive"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <StudentEnrolmentTrendChart points={analytics.enrolmentTrend} />
              </div>
              <StudentDonutChart
                title="Students by Status"
                centerTotal={analytics.kpis.totalStudents}
                slices={analytics.statusSlices}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <StudentGradeBarChart
                  title="Students by Grade (Across Tenants)"
                  bars={analytics.gradeBars}
                />
              </div>
              <StudentDonutChart
                title="Gender Distribution"
                centerTotal={analytics.kpis.totalStudents}
                slices={analytics.genderSlices}
              />
            </div>

            {/* Per-School Student Rollup */}
            <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                  <Building2 className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                  <span>School-by-School Student Summary</span>
                </h3>
                <span className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
                  Click any school to open its Student Suite
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                      <th className="py-2 pr-3">School</th>
                      <th className="py-2 pr-3 text-right">Total</th>
                      <th className="py-2 pr-3 text-right">Active</th>
                      <th className="py-2 pr-3 text-right">New Enrolments</th>
                      <th className="py-2 pr-3 text-right">Inactive</th>
                      <th className="py-2 pr-3 text-right">Transferred</th>
                      <th className="py-2 text-right">Workspace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                    {data.schoolSummaries.map((row) => (
                      <tr key={row.schoolId} className="hover:bg-[#FAF8FE] dark:hover:bg-[#191E3D]">
                        <td className="py-2.5 pr-3">
                          <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            {row.schoolName}
                          </p>
                          {row.schoolUniqueId && (
                            <p className="font-mono text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                              {row.schoolUniqueId}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-black text-[#08093B] dark:text-[#F3F5FF]">
                          {row.totalStudents}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-bold text-emerald-600 dark:text-emerald-300">
                          {row.activeStudents}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                          {row.newEnrolments}
                        </td>
                        <td className="py-2.5 pr-3 text-right text-[#4D5072] dark:text-[#9DA6CC]">
                          {row.inactiveStudents}
                        </td>
                        <td className="py-2.5 pr-3 text-right text-[#4D5072] dark:text-[#9DA6CC]">
                          {row.transferredCount}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectSchoolStudent(row.schoolId, null)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#EDE7FF] px-2.5 py-1 text-[11px] font-bold text-[#5B35F5] hover:bg-[#DFD4FF] cursor-pointer dark:bg-[#251D4A] dark:text-[#D5C4FF]"
                          >
                            <span>Open Students</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross-School Matching Students Directory */}
            <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
              <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                <UserMinus className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>Matching Student Directory ({data.students.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                      <th className="py-2 pr-3">Admission No.</th>
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">School</th>
                      <th className="py-2 pr-3">Grade / Sec</th>
                      <th className="py-2 pr-3">Guardian</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                    {data.students.slice(0, 40).map((stu) => (
                      <tr key={stu.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#191E3D]">
                        <td className="py-2 pr-3 font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                          {stu.admissionNumber}
                        </td>
                        <td className="py-2 pr-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          {stu.studentName}
                        </td>
                        <td className="py-2 pr-3 text-[#4D5072] dark:text-[#9DA6CC]">
                          {stu.schoolName}
                        </td>
                        <td className="py-2 pr-3 text-[#08093B] dark:text-[#F3F5FF]">
                          {stu.currentGrade} - {stu.currentSection}
                        </td>
                        <td className="py-2 pr-3 text-[#4D5072] dark:text-[#9DA6CC]">
                          {stu.guardianName} ({stu.guardianPhone})
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectSchoolStudent(stu.schoolId, stu.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#663CF6] px-2.5 py-1 text-[10px] font-extrabold text-white cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
