"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import type { PlatformGlobalPromotionsData } from "@/modules/students/promotion-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

export function PlatformPromotionsGlobalTab({
  onOpenSchoolPromotions,
}: {
  onOpenSchoolPromotions: (schoolId: string) => void;
}) {
  const [data, setData] = useState<PlatformGlobalPromotionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadGlobal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/promotions/overview", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load global promotions overview");
      }
      setData(json.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGlobal();
  }, [loadGlobal]);

  const filteredSchools = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.schoolSummaries;
    return data.schoolSummaries.filter(
      (s) =>
        s.schoolName.toLowerCase().includes(q) ||
        (s.schoolUniqueId || "").toLowerCase().includes(q),
    );
  }, [data, query]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[18px] bg-white/75 dark:bg-[#141731]/75"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[18px] bg-white/75 dark:bg-[#141731]/75" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${STUDENT_CARD_SURFACE} p-6 text-center space-y-3`}>
        <p className="text-xs font-bold text-rose-600 dark:text-rose-300">
          {error || "Unable to load global student promotions overview."}
        </p>
        <button
          type="button"
          onClick={() => void loadGlobal()}
          className="h-9 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-4 text-xs font-bold text-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Global Student Promotions Console
          </h2>
          <p className="text-xs font-medium text-[#4D5072] dark:text-[#9DA6CC]">
            Cross-tenant promotion readiness, completion velocity, and Redis-cached school drill-down management.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadGlobal()}
          className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#D9DEF2] bg-white/95 px-3.5 text-xs font-bold text-[#08093B] hover:bg-[#F3F5FD] cursor-pointer dark:border-[#2E345E] dark:bg-[#141731] dark:text-[#EEF0FF]"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 5 Global KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StudentKpiCard
          label="Active Schools"
          value={data.totalSchools}
          icon={<Building2 className="h-5 w-5" />}
          tone="violet"
          subtitle={`${data.kpis.schoolsCompletedCount} completed`}
        />
        <StudentKpiCard
          label="Total Students"
          value={data.kpis.totalStudents}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
          subtitle="Across all schools"
        />
        <StudentKpiCard
          label="Promoted"
          value={data.kpis.promotedCount}
          deltaPct={Number(data.kpis.overallPromotionRatePct.toFixed(1))}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
          subtitle="Platform completion"
        />
        <StudentKpiCard
          label="Pending"
          value={data.kpis.pendingCount}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
          subtitle="Awaiting final batch"
        />
        <StudentKpiCard
          label="Not Promoted"
          value={data.kpis.notPromotedCount}
          icon={<XCircle className="h-5 w-5" />}
          tone="pink"
          subtitle="Retained across network"
        />
      </div>

      {/* Charts & Recent Platform Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <StudentDonutChart
            title="Network Promotion Outcome"
            centerTotal={data.kpis.totalStudents}
            centerLabel="Students"
            slices={[
              {
                label: "Promoted",
                count: data.kpis.promotedCount,
                percentage:
                  data.kpis.totalStudents > 0
                    ? Math.round((data.kpis.promotedCount / data.kpis.totalStudents) * 1000) / 10
                    : 0,
                color: "#22C55E",
              },
              {
                label: "Pending",
                count: data.kpis.pendingCount,
                percentage:
                  data.kpis.totalStudents > 0
                    ? Math.round((data.kpis.pendingCount / data.kpis.totalStudents) * 1000) / 10
                    : 0,
                color: "#F59E0B",
              },
              {
                label: "Not Promoted",
                count: data.kpis.notPromotedCount,
                percentage:
                  data.kpis.totalStudents > 0
                    ? Math.round((data.kpis.notPromotedCount / data.kpis.totalStudents) * 1000) / 10
                    : 0,
                color: "#EC4899",
              },
            ]}
          />
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 lg:col-span-7 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] flex items-center gap-2">
            <Award className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Recent Multi-Tenant Promotion Batches</span>
          </h3>

          {data.recentBatches.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No global promotion batches recorded yet. Select any school below to manage or execute promotion batches.
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentBatches.slice(0, 5).map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EAEEFA] bg-white/80 px-3.5 py-2.5 dark:border-[#272B4D] dark:bg-[#10132A]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                      {batch.schoolName} — {batch.fromGrade || "All Classes"} →{" "}
                      {batch.toGrade || "Next"}
                    </p>
                    <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                      AY {batch.academicYear} → {batch.toAcademicYear} • Triggered by{" "}
                      {batch.triggeredByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {batch.promotedCount + batch.alumniCount} Promoted (
                      {batch.promotionPct.toFixed(1)}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenSchoolPromotions(batch.schoolId)}
                      className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* School-by-School Promotion Readiness & Management Table */}
      <div className={`${STUDENT_CARD_SURFACE} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#EAEEFA] flex flex-wrap items-center justify-between gap-3 dark:border-[#272B4D]">
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            School Promotion Readiness & Progress
          </h3>
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#76799C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search school or ID..."
              className="h-8 w-64 rounded-xl border border-[#D9DEF2] bg-white/95 pl-8 pr-3 text-xs text-[#08093B] outline-none focus:border-[#663CF6] dark:border-[#2E345E] dark:bg-[#10132A] dark:text-[#EEF0FF]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEEFA] bg-[#F7F8FE] text-[10px] font-bold uppercase tracking-wide text-[#76799C] dark:border-[#272B4D] dark:bg-[#10132A] dark:text-[#9DA6CC]">
                <th className="py-2.5 px-4">School</th>
                <th className="py-2.5 px-3 text-right">Students</th>
                <th className="py-2.5 px-3 text-right">Promoted</th>
                <th className="py-2.5 px-3 text-right">Pending</th>
                <th className="py-2.5 px-3 text-right">Not Promoted</th>
                <th className="py-2.5 px-3 text-right">Promotion %</th>
                <th className="py-2.5 px-3">Rules Status</th>
                <th className="py-2.5 px-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FB] dark:divide-[#232746]">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                  >
                    No schools match the search query.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((s) => (
                  <tr
                    key={s.schoolId}
                    className="hover:bg-[#F6F5FF]/70 transition-colors dark:hover:bg-[#1B1F3F]/60"
                  >
                    <td className="py-2.5 px-4">
                      <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {s.schoolName}
                      </p>
                      {s.schoolUniqueId && (
                        <p className="text-[10px] font-mono text-[#76799C] dark:text-[#9DA6CC]">
                          {s.schoolUniqueId}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#08093B] dark:text-[#EEF0FF]">
                      {s.totalStudents.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                      {s.promotedCount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700 dark:text-amber-300">
                      {s.pendingCount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700 dark:text-rose-300">
                      {s.notPromotedCount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-[#4F27E8] dark:text-[#C4B5FD]">
                      {s.promotionRatePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.rulesConfigured
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {s.rulesConfigured ? "Configured" : "Default Rules"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenSchoolPromotions(s.schoolId)}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#EDE7FF] px-3 py-1.5 text-[11px] font-bold text-[#4F27E8] hover:bg-[#DDD6FE] cursor-pointer dark:bg-[#251D4A] dark:text-[#DDD6FE] dark:hover:bg-[#322763]"
                      >
                        <span>Manage Promotions</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
