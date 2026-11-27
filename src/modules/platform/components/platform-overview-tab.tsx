"use client";

import React from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  IndianRupee,
  LifeBuoy,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import type { PlatformOverviewData, PlatformTab } from "@/modules/platform/types";
import {
  PlanBadge,
  PlatformKpiCard,
  formatDateShort,
  formatDateTime,
  formatInrFromPaise,
} from "./platform-shared";

export function PlatformOverviewTab({
  overview,
  onSelectSchool,
  onNavigateTab,
}: {
  overview: PlatformOverviewData;
  onSelectSchool: (schoolId: string) => void;
  onNavigateTab: (tab: PlatformTab) => void;
}) {
  const { kpis, planBreakdown, boardBreakdown, signupTrend, expiringTrials, recentAuditLogs, health } =
    overview;
  const maxTrend = Math.max(1, ...signupTrend.map((t) => t.count));

  return (
    <div className="space-y-5">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <PlatformKpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Registered Schools"
          value={kpis.totalSchools}
          sublabel={`${kpis.activeSchools} active · ${kpis.trialSchools} trial · ${kpis.suspendedSchools} suspended`}
        />
        <PlatformKpiCard
          icon={<Users className="h-4 w-4" />}
          label="Platform User Accounts"
          value={kpis.totalUsers}
          sublabel="Admins, principals, staff, parents & students"
          accentClass="bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
        />
        <PlatformKpiCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Admissions & Enrolment"
          value={kpis.totalAdmittedStudents}
          sublabel={`${kpis.totalApplications} apps · ${kpis.totalEnquiries} enquiries`}
          accentClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
        />
        <PlatformKpiCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Student Fees Tracked"
          value={formatInrFromPaise(kpis.studentFeeCollectedPaise)}
          sublabel="Across all tenant schools"
          accentClass="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
        />
        <PlatformKpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="SaaS Revenue Collected"
          value={formatInrFromPaise(kpis.saasRevenueCollectedPaise)}
          sublabel={`${formatInrFromPaise(kpis.saasPendingPaise)} pending / overdue`}
          accentClass="bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
        />
        <PlatformKpiCard
          icon={<LifeBuoy className="h-4 w-4" />}
          label="Open Support & Feedback"
          value={kpis.openSupportTickets}
          sublabel="Contact forms, ratings & portal requests"
          accentClass="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300"
        />
        <PlatformKpiCard
          icon={<FileText className="h-4 w-4" />}
          label="Recent Audit Trail"
          value={recentAuditLogs.length}
          sublabel="Latest captured platform & tenant events"
          accentClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
        />
        <PlatformKpiCard
          icon={<Activity className="h-4 w-4" />}
          label="System Health"
          value={health.databaseConnected ? `Healthy (${health.dbLatencyMs ?? 0}ms)` : "Fallback Mode"}
          sublabel={
            health.platformSchemaProvisioned
              ? "All platform & RLS tables active"
              : "Apply platform SQL migration for billing/tickets"
          }
          accentClass={
            health.databaseConnected
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
          }
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* School Onboarding Trend */}
        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            School Registrations (Last 6 Months)
          </h3>
          <p className="text-[11px] text-[#76799C] mb-4 dark:text-[#9DA6CC]">
            Monthly tenant onboarding velocity across ScholoNix
          </p>
          <div className="flex items-end justify-between gap-2 h-40 pt-4">
            {signupTrend.map((pt) => {
              const pct = Math.max(8, Math.round((pt.count / maxTrend) * 100));
              return (
                <div key={pt.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    {pt.count}
                  </span>
                  <div className="w-full max-w-[40px] rounded-t-[10px] bg-[#EDE7FF] dark:bg-[#251D4A] flex items-end h-28 overflow-hidden">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full rounded-t-[10px] bg-gradient-to-t from-[#663CF6] to-[#A78BFA]"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* SaaS Plan Mix */}
        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Schools by SaaS Plan
              </h3>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Active tier allocation
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("billing")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              Billing →
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {planBreakdown.map((item) => (
              <div key={item.plan} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{item.label}</span>
                  <span className="font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#F1F3FA] overflow-hidden dark:bg-[#1F2447]">
                  <div
                    style={{ width: `${Math.max(item.percentage, item.count > 0 ? 6 : 0)}%` }}
                    className={`h-full rounded-full ${
                      item.plan === "ENTERPRISE"
                        ? "bg-amber-500"
                        : item.plan === "PROFESSIONAL"
                          ? "bg-[#663CF6]"
                          : "bg-sky-500"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#EEF1FA] dark:border-[#232746]">
            <p className="text-[11px] font-bold text-[#76799C] mb-2 dark:text-[#9DA6CC]">
              Top Affiliation Boards
            </p>
            <div className="flex flex-wrap gap-1.5">
              {boardBreakdown.map((b) => (
                <span
                  key={b.board}
                  className="rounded-lg border border-[#DFE3F5] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#08093B] dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  {b.board}: {b.count}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Expiring Trials */}
        <section className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Trial Expirations
            </h3>
          </div>

          {expiringTrials.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#DFE3F5] p-5 text-center text-xs text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
              No active trial deadlines pending.
            </div>
          ) : (
            <div className="space-y-2">
              {expiringTrials.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSchool(s.id)}
                  className="w-full text-left rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-2.5 hover:border-[#663CF6] transition cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                      {s.name}
                    </span>
                    <PlanBadge plan={s.plan} />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    Ends: {formatDateShort(s.trialEndsAt)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Platform Activity */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Recent Security &amp; Governance Events
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("audit")}
            className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
          >
            View All Logs →
          </button>
        </div>

        {recentAuditLogs.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
            No security or platform events recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Tenant / Scope</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]">
                    <td className="px-3 py-2 whitespace-nowrap text-[#76799C] dark:text-[#9DA6CC]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                      {log.action}
                    </td>
                    <td className="px-3 py-2 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                      {log.schoolName || "Platform"}
                    </td>
                    <td className="px-3 py-2 text-[#4D5072] dark:text-[#C5CCF0]">
                      {log.actorName || log.actorId || "System"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                      {log.entityType}:{log.entityId.slice(0, 18)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick status footer notice */}
      {!health.platformSchemaProvisioned && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Database Note:</strong> Run{" "}
          <code className="font-mono font-bold">
            prisma/migrations/20261127110000_company_admin_platform/migration.sql
          </code>{" "}
          in Supabase SQL Editor to enable persistent SaaS billing invoices, support ticket triage, and announcements in PostgreSQL.
        </div>
      )}
    </div>
  );
}
