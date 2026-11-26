"use client";

import React, { useMemo } from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
} from "@/modules/school/admissions/types";
import { ENQUIRY_STATUS_UI_META } from "./enquiry-shared";

interface EnquiriesReportsTabProps {
  enquiries: AdmissionEnquiryRecord[];
  sources: AdmissionEnquirySourceRecord[];
  applications: AdmissionApplicationRecord[];
  canExport: boolean;
  onExportCsv: () => void;
}

export function EnquiriesReportsTab({
  enquiries,
  sources,
  applications,
  canExport,
  onExportCsv,
}: EnquiriesReportsTabProps) {
  const submittedEnquiries = useMemo(
    () => enquiries.filter((e) => !e.isDraft),
    [enquiries],
  );

  const funnel = useMemo(() => {
    const total = submittedEnquiries.length;
    const engaged = submittedEnquiries.filter(
      (e) =>
        e.status === "CONTACTED" ||
        e.status === "FOLLOW_UP" ||
        e.status === "CONVERTED",
    ).length;
    const converted = submittedEnquiries.filter((e) => e.status === "CONVERTED").length;
    const admitted = submittedEnquiries.filter((e) => {
      if (!e.convertedApplicationId) return false;
      const app = applications.find((a) => a.id === e.convertedApplicationId);
      return app?.status === "ADMITTED";
    }).length;
    return { total, engaged, converted, admitted };
  }, [submittedEnquiries, applications]);

  const byGrade = useMemo(() => {
    const map = new Map<string, { total: number; converted: number; open: number }>();
    for (const enq of submittedEnquiries) {
      const curr = map.get(enq.gradeApplied) ?? { total: 0, converted: 0, open: 0 };
      curr.total += 1;
      if (enq.status === "CONVERTED") curr.converted += 1;
      if (enq.status === "NEW" || enq.status === "CONTACTED" || enq.status === "FOLLOW_UP") {
        curr.open += 1;
      }
      map.set(enq.gradeApplied, curr);
    }
    return Array.from(map.entries()).map(([grade, stats]) => ({
      grade,
      ...stats,
      rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
    }));
  }, [submittedEnquiries]);

  const bySource = useMemo(() => {
    const map = new Map<string, { total: number; converted: number; closed: number }>();
    sources.forEach((s) => map.set(s.name, { total: 0, converted: 0, closed: 0 }));
    for (const enq of submittedEnquiries) {
      const curr = map.get(enq.source) ?? { total: 0, converted: 0, closed: 0 };
      curr.total += 1;
      if (enq.status === "CONVERTED") curr.converted += 1;
      if (enq.status === "CLOSED") curr.closed += 1;
      map.set(enq.source, curr);
    }
    return Array.from(map.entries())
      .map(([source, s]) => ({
        source,
        ...s,
        rate: s.total > 0 ? (s.converted / s.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [submittedEnquiries, sources]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] p-5 text-white shadow-sm">
        <div>
          <h3 className="text-base font-extrabold">Enquiry Reports &amp; Conversion Funnel</h3>
          <p className="text-xs text-violet-100 mt-0.5">
            Track lead conversion efficiency across grades, sources, and enquiry stages.
          </p>
        </div>
        {canExport && (
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/25 border border-white/25"
          >
            Export Enquiries CSV
          </button>
        )}
      </div>

      {/* Funnel Bar */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
          Admission Lead Funnel
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Enquiries", value: funnel.total, pct: 100, color: "bg-violet-600" },
            {
              label: "Engaged / Follow-up",
              value: funnel.engaged,
              pct: funnel.total > 0 ? (funnel.engaged / funnel.total) * 100 : 0,
              color: "bg-sky-500",
            },
            {
              label: "Converted to Application",
              value: funnel.converted,
              pct: funnel.total > 0 ? (funnel.converted / funnel.total) * 100 : 0,
              color: "bg-emerald-500",
            },
            {
              label: "Final Admitted",
              value: funnel.admitted,
              pct: funnel.total > 0 ? (funnel.admitted / funnel.total) * 100 : 0,
              color: "bg-indigo-600",
            },
          ].map((stage) => (
            <div
              key={stage.label}
              className="rounded-[14px] border border-[#E5E9F8] bg-[#FAF8FE]/70 p-4 dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <p className="text-xs font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                {stage.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                {stage.value}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E9F8] dark:bg-[#272B4D] overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.color}`}
                  style={{ width: `${Math.min(100, stage.pct)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                {stage.pct.toFixed(1)}% of enquiries
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
            Conversion by Grade
          </h4>
          {byGrade.length === 0 ? (
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC] py-6 text-center">
              No grade analytics available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2">Grade</th>
                    <th className="py-2 text-right">Enquiries</th>
                    <th className="py-2 text-right">Active</th>
                    <th className="py-2 text-right">Converted</th>
                    <th className="py-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {byGrade.map((g) => (
                    <tr key={g.grade}>
                      <td className="py-2.5 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                        {g.grade}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{g.total}</td>
                      <td className="py-2.5 text-right tabular-nums">{g.open}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {g.converted}
                      </td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">
                        {g.rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
            Source Performance Breakdown
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                  <th className="py-2">Source</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Converted</th>
                  <th className="py-2 text-right">Closed</th>
                  <th className="py-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                {bySource.map((s) => (
                  <tr key={s.source}>
                    <td className="py-2.5 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                      {s.source}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{s.total}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {s.converted}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{s.closed}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {s.rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[#F1F5F9] dark:border-[#232746]">
            {Object.entries(ENQUIRY_STATUS_UI_META).map(([key, meta]) => {
              const count = submittedEnquiries.filter((e) => e.status === key).length;
              return (
                <span
                  key={key}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                >
                  {meta.label}: {count}
                </span>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
