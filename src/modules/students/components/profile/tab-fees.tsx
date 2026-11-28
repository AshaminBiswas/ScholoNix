"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, CreditCard, Download, IndianRupee, Plus } from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
} from "@/modules/students/components/student-charts-and-cards";
import { SharedProfileRemarksCard } from "./shared-remarks-card";

function inr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function TabFees({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const f = dossier.feeSummary;
  const pctPaid =
    f.totalFeePaise > 0 ? Math.round((f.paidPaise / f.totalFeePaise) * 1000) / 10 : 0;

  const [paying, setPaying] = useState(false);
  const [amountRupees, setAmountRupees] = useState("5000");
  const [paymentMode, setPaymentMode] = useState<
    "UPI" | "CARD" | "NETBANKING" | "CASH" | "CHEQUE" | "BANK_TRANSFER"
  >("UPI");
  const [feeHeadsLabel, setFeeHeadsLabel] = useState("Tuition & Academic Fee");
  const [payErr, setPayErr] = useState<string | null>(null);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayErr(null);
    const amountPaise = Math.round(Number(amountRupees) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      setPayErr("Enter an amount of at least ₹1.");
      return;
    }
    try {
      await onMutate({
        action: "RECORD_FEE_PAYMENT",
        idempotencyKey: `stu-${dossier.student.id}-${Date.now()}`,
        amountPaise,
        paymentMode,
        feeHeadsLabel,
      });
      setPaying(false);
    } catch (err) {
      setPayErr(err instanceof Error ? err.message : "Failed to record fee payment.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <CreditCard className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Fees Overview ({dossier.student.currentAcademicYear})</span>
            </h3>
            {canEdit && f.outstandingPaise > 0 && (
              <button
                type="button"
                onClick={() => setPaying((v) => !v)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Record Payment</span>
              </button>
            )}
          </div>

          {paying && (
            <form onSubmit={handleRecordPayment} className="space-y-2 rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
              {payErr && <p className="text-xs font-bold text-rose-600">{payErr}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="number"
                  min={1}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="Amount (INR)"
                  required
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                />
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="NETBANKING">Net Banking</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                <input
                  value={feeHeadsLabel}
                  onChange={(e) => setFeeHeadsLabel(e.target.value)}
                  placeholder="Fee Head(s)"
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                />
                <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                  Confirm Payment
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="rounded-2xl bg-[#EDE7FF]/70 p-3 dark:bg-[#221A44]">
              <p className="text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">{inr(f.totalFeePaise)}</p>
              <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Total Fee</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{inr(f.paidPaise)}</p>
              <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Paid Amount</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/50">
              <p className="text-lg font-black text-amber-700 dark:text-amber-300">{inr(f.outstandingPaise)}</p>
              <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Outstanding</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/50">
              <p className="text-lg font-black text-sky-700 dark:text-sky-300">{pctPaid}%</p>
              <p className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Paid Ratio</p>
            </div>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Fee Status</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {f.status.replace("_", " ")}
            </span>
          </div>
          {[
            ["Academic Year", dossier.student.currentAcademicYear],
            ["Fee Plan", f.feePlanName],
            ["Next Due Date", f.nextDueDate || "Settled"],
            ["Outstanding", inr(f.outstandingPaise)],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between">
              <span className="text-[#76799C] dark:text-[#9DA6CC]">{k}</span>
              <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Structure + Dues by Installment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <IndianRupee className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Fee Structure ({dossier.student.currentGrade})</span>
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2">Fee Head</th>
                <th className="py-2">Frequency</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
              {f.feeHeads.map((h) => (
                <tr key={h.head}>
                  <td className="py-2 font-semibold">{h.head}</td>
                  <td className="py-2 text-[#76799C] dark:text-[#9DA6CC]">{h.frequency}</td>
                  <td className="py-2 text-right font-bold">{inr(h.amountPaise)}</td>
                </tr>
              ))}
              <tr className="bg-[#EDE7FF]/60 font-black dark:bg-[#221A44]">
                <td className="py-2 px-2">Total Annual Fee</td>
                <td />
                <td className="py-2 px-2 text-right">{inr(f.totalFeePaise)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Fee Dues by Installment</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2">Installment</th>
                <th className="py-2">Due Date</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
              {f.installments.map((inst) => (
                <tr key={inst.installment}>
                  <td className="py-2 font-bold">{inst.installment}</td>
                  <td className="py-2 text-[#76799C] dark:text-[#9DA6CC]">{inst.dueDate}</td>
                  <td className="py-2 text-right font-bold">{inr(inst.amountPaise)}</td>
                  <td className="py-2 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        inst.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {inst.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History + Fee Collection Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Payment History ({f.payments.length})
            </h3>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Fee Statement</span>
            </button>
          </div>
          {f.payments.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No receipts posted yet.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                  <th className="py-2">Receipt No.</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Fee Head(s)</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                {f.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2">{p.paymentDate}</td>
                    <td className="py-2">{p.feeHeadsLabel}</td>
                    <td className="py-2 font-bold">{inr(p.amountPaise)}</td>
                    <td className="py-2">{p.paymentMode}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <StudentDonutChart
          title="Fee Collection"
          centerTotal={Math.round(f.totalFeePaise / 100)}
          centerLabel="Total INR"
          slices={[
            { label: "Paid", count: Math.round(f.paidPaise / 100), percentage: pctPaid, color: "#22C55E" },
            { label: "Outstanding", count: Math.round(f.outstandingPaise / 100), percentage: Math.round((100 - pctPaid) * 10) / 10, color: "#F472B6" },
          ]}
        />
      </div>

      {/* Reminders & Remarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <Bell className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Fee Reminders &amp; Alerts</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  onMutate({
                    action: "SEND_COMMUNICATION",
                    channel: "SMS",
                    direction: "OUTBOUND",
                    recipientName: dossier.student.guardianName,
                    subject: "Fee Due Reminder",
                    body: `Reminder: Outstanding fee of ${inr(f.outstandingPaise)} is due for ${dossier.student.studentName}.`,
                  })
                }
                className="rounded-xl border border-[#CAD0EB] px-3 py-1 text-xs font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
              >
                Send Reminder
              </button>
            )}
          </div>
          <label className="flex items-center justify-between rounded-xl bg-[#FAF8FE] p-3 text-xs font-semibold cursor-pointer dark:bg-[#10142C]">
            <span>Enable automated SMS/Email reminders for upcoming dues</span>
            <input
              type="checkbox"
              checked={Boolean(dossier.extendedProfile.communicationPreferences?.autoFeeReminder ?? true)}
              onChange={(e) =>
                onMutate({
                  action: "UPDATE_EXTENDED_PROFILE",
                  extended: {
                    communicationPreferences: {
                      academicUpdates: dossier.extendedProfile.communicationPreferences?.academicUpdates ?? true,
                      attendanceAlerts: dossier.extendedProfile.communicationPreferences?.attendanceAlerts ?? true,
                      feeNotifications: dossier.extendedProfile.communicationPreferences?.feeNotifications ?? true,
                      schoolAnnouncements: dossier.extendedProfile.communicationPreferences?.schoolAnnouncements ?? true,
                      autoFeeReminder: e.target.checked,
                    },
                  },
                })
              }
            />
          </label>
        </div>

        <SharedProfileRemarksCard
          title="Fee Remarks"
          tabScope="FEES"
          remarks={dossier.notesRemarks}
          canEdit={canEdit}
          onMutate={onMutate}
        />
      </div>
    </div>
  );
}
