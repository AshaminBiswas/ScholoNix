"use client";

import React, { useMemo } from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionFeeLedgerRecord,
  AdmissionSettingRecord,
} from "@/modules/school/admissions/types";
import {
  buildLedgerLookup,
  formatInrFromPaise,
  getStudentDocumentProgress,
} from "./admitted-shared";

interface AdmittedReportsTabProps {
  students: AdmissionApplicationRecord[];
  ledgers: AdmissionFeeLedgerRecord[];
  settings: AdmissionSettingRecord;
  canExport: boolean;
  onExportCsv: (dataset: "roster" | "documents" | "fees") => void;
}

export function AdmittedReportsTab({
  students,
  ledgers,
  settings,
  canExport,
  onExportCsv,
}: AdmittedReportsTabProps) {
  const ledgerByApp = useMemo(() => buildLedgerLookup(ledgers), [ledgers]);

  const gradeReadiness = useMemo(() => {
    const seatsPerClass = settings.extendedConfig?.totalSeatsPerClass ?? 60;
    return settings.enabledGrades.map((grade) => {
      const list = students.filter((s) => s.gradeApplied === grade);
      const docComplete = list.filter((s) => getStudentDocumentProgress(s).status === "COMPLETE")
        .length;
      let netPaise = 0;
      let paidPaise = 0;
      for (const s of list) {
        const l = ledgerByApp.get(s.id);
        if (l) {
          netPaise += Math.max(0, l.totalFeePaise - l.concessionPaise);
          paidPaise += l.paidPaise;
        }
      }
      return {
        grade,
        admitted: list.length,
        seatsPerClass,
        seatPct: seatsPerClass > 0 ? (list.length / seatsPerClass) * 100 : 0,
        docPct: list.length > 0 ? (docComplete / list.length) * 100 : 0,
        feePct: netPaise > 0 ? (paidPaise / netPaise) * 100 : 0,
        collectedPaise: paidPaise,
      };
    });
  }, [students, settings, ledgerByApp]);

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] p-5 text-white shadow-sm">
        <h3 className="text-base font-extrabold">Admitted Students Reports &amp; Exports</h3>
        <p className="text-xs text-violet-100 mt-0.5">
          Audit seat utilization, document verification readiness, and fee collection across all grades.
        </p>
      </div>

      {canExport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              dataset: "roster" as const,
              title: "Admitted Students Roster CSV",
              desc: "Full confirmed admission list with Admission Numbers, status, and guardian contact.",
            },
            {
              dataset: "documents" as const,
              title: "Document Readiness Audit CSV",
              desc: "Student-wise submitted vs verified checklist counts and verification states.",
            },
            {
              dataset: "fees" as const,
              title: "Fee Ledger & Dues CSV",
              desc: "Assessed fees, concessions, collected INR amounts, and outstanding balances.",
            },
          ].map((card) => (
            <div
              key={card.dataset}
              className="rounded-[18px] border border-[#D6DBF0] bg-white p-4 shadow-xs flex flex-col justify-between gap-3 dark:border-[#272B4D] dark:bg-[#141731]"
            >
              <div>
                <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {card.title}
                </h4>
                <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">{card.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onExportCsv(card.dataset)}
                className="rounded-xl bg-[#F0EBFE] px-4 py-2 text-xs font-bold text-[#6D28D9] hover:bg-[#6D28D9] hover:text-white transition-colors dark:bg-violet-950/60 dark:text-violet-300"
              >
                Download CSV
              </button>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
          Grade-wise Seat, Document &amp; Fee Readiness Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2.5 pr-3">Grade</th>
                <th className="py-2.5 px-3 text-right">Admitted / Capacity</th>
                <th className="py-2.5 px-3 text-right">Seat Utilization</th>
                <th className="py-2.5 px-3 text-right">Docs Complete</th>
                <th className="py-2.5 px-3 text-right">Fees Collected</th>
                <th className="py-2.5 pl-3 text-right">Collection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
              {gradeReadiness.map((row) => (
                <tr key={row.grade}>
                  <td className="py-3 pr-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {row.grade}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {row.admitted} / {row.seatsPerClass}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold tabular-nums">
                    {row.seatPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {row.docPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums">
                    {formatInrFromPaise(row.collectedPaise)}
                  </td>
                  <td className="py-3 pl-3 text-right font-semibold text-[#6D28D9] dark:text-violet-300 tabular-nums">
                    {row.feePct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
