"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionFeeLedgerRecord,
  AdmissionFeePaymentRecord,
  AdmittedFeeHeadValue,
  AdmittedPaymentModeValue,
} from "@/modules/school/admissions/types";
import {
  EnquiriesDonutChart,
  EnquiryTrendChart,
  PortalActionMenu,
  formatShortDate,
  type DonutSlice,
} from "../enquiries/enquiry-shared";
import {
  FEE_HEAD_OPTIONS,
  FEE_PAYMENT_STATUS_META,
  PAYMENT_MODE_OPTIONS,
  buildLedgerLookup,
  formatInrFromPaise,
} from "./admitted-shared";

interface AdmittedFeesTabProps {
  students: AdmissionApplicationRecord[];
  ledgers: AdmissionFeeLedgerRecord[];
  payments: AdmissionFeePaymentRecord[];
  canWrite: boolean;
  canExport: boolean;
  onRecordPayment: (payload: {
    applicationId: string;
    idempotencyKey: string;
    feeHead: AdmittedFeeHeadValue;
    amountRupees: number;
    paymentDate: string;
    paymentMode: AdmittedPaymentModeValue;
    referenceNo: string;
  }) => Promise<void>;
  onOpenSetLedgerModal: (stu: AdmissionApplicationRecord | null) => void;
  onOpenReceiptModal: (payment: AdmissionFeePaymentRecord) => void;
  onSendReminder: (stu: AdmissionApplicationRecord) => void;
  onExportFeesCsv: () => void;
}

export function AdmittedFeesTab({
  students,
  ledgers,
  payments,
  canWrite,
  canExport,
  onRecordPayment,
  onOpenSetLedgerModal,
  onOpenReceiptModal,
  onSendReminder,
  onExportFeesCsv,
}: AdmittedFeesTabProps) {
  const [search, setSearch] = useState("");
  const [trendMode, setTrendMode] = useState<"month" | "week">("month");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Record Fee Payment form state
  const [targetAppId, setTargetAppId] = useState("");
  const [feeHead, setFeeHead] = useState<AdmittedFeeHeadValue>("Admission Fee");
  const [amountRupees, setAmountRupees] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<AdmittedPaymentModeValue>("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const ledgerByApp = useMemo(() => buildLedgerLookup(ledgers), [ledgers]);

  const summary = useMemo(() => {
    let totalFeePaise = 0;
    let totalCollectedPaise = 0;
    let totalOutstandingPaise = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;

    for (const s of students) {
      const l = ledgerByApp.get(s.id);
      if (l) {
        totalFeePaise += Math.max(0, l.totalFeePaise - l.concessionPaise);
        totalCollectedPaise += l.paidPaise;
        totalOutstandingPaise += l.outstandingPaise;
        if (l.paymentStatus === "PAID") paidCount += 1;
        else if (l.paymentStatus === "PARTIAL") partialCount += 1;
        else pendingCount += 1;
      } else {
        pendingCount += 1;
      }
    }
    const collectionRate =
      totalFeePaise > 0 ? (totalCollectedPaise / totalFeePaise) * 100 : 0;

    return {
      totalStudents: students.length,
      totalFeePaise,
      totalCollectedPaise,
      totalOutstandingPaise,
      collectionRate,
      paidCount,
      partialCount,
      pendingCount,
    };
  }, [students, ledgerByApp]);

  const statusSlices = useMemo<DonutSlice[]>(() => {
    const t = students.length;
    if (t === 0) return [];
    return [
      {
        label: "Fully Paid",
        count: summary.paidCount,
        percentage: (summary.paidCount / t) * 100,
        color: FEE_PAYMENT_STATUS_META.PAID.color,
      },
      {
        label: "Partially Paid",
        count: summary.partialCount,
        percentage: (summary.partialCount / t) * 100,
        color: FEE_PAYMENT_STATUS_META.PARTIAL.color,
      },
      {
        label: "Pending",
        count: summary.pendingCount,
        percentage: (summary.pendingCount / t) * 100,
        color: FEE_PAYMENT_STATUS_META.PENDING.color,
      },
    ];
  }, [students.length, summary]);

  const feeTrendPoints = useMemo(() => {
    const now = new Date();
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
    for (const p of payments) {
      const d = new Date(p.paymentDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.count += Math.round(p.amountPaise / 100);
    }
    return months;
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.admissionNumber, s.studentName, s.gradeApplied]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const appId = targetAppId || students[0]?.id;
    const numericAmount = Number(amountRupees);
    if (!appId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError("Please select a student and enter a valid positive payment amount.");
      return;
    }
    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `fee-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    setSubmitting(true);
    try {
      await onRecordPayment({
        applicationId: appId,
        idempotencyKey,
        feeHead,
        amountRupees: numericAmount,
        paymentDate,
        paymentMode,
        referenceNo: referenceNo.trim(),
      });
      setAmountRupees("");
      setReferenceNo("");
      setFormSuccess("Payment recorded and receipt generated.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record fee payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 5 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {summary.totalStudents}
          </p>
          <p className="text-[11px] font-semibold text-[#76799C]">Total Students</p>
        </div>
        <div className="rounded-[16px] border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-[#112238]">
          <p className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {formatInrFromPaise(summary.totalFeePaise)}
          </p>
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
            Total Net Fee
          </p>
        </div>
        <div className="rounded-[16px] border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-[#0E2920]">
          <p className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {formatInrFromPaise(summary.totalCollectedPaise)}
          </p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Total Collected
          </p>
        </div>
        <div className="rounded-[16px] border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-[#2B210E]">
          <p className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {formatInrFromPaise(summary.totalOutstandingPaise)}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Outstanding
          </p>
        </div>
        <div className="rounded-[16px] border border-[#DFD8FA] bg-[#F7F3FF] p-3.5 dark:border-[#2F295C] dark:bg-[#1B173D]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {summary.collectionRate.toFixed(1)}%
          </p>
          <p className="text-[11px] font-semibold text-[#5B4B9A] dark:text-violet-300">
            Collection Rate
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Fee Collection Trend (&#8377;)
            </h3>
            <select
              value={trendMode}
              onChange={(e) => setTrendMode(e.target.value as "month" | "week")}
              className="rounded-lg border border-[#CAD0EB] bg-[#F5F7FD] px-2.5 py-1 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="month">By Month</option>
              <option value="week">Last 6 Periods</option>
            </select>
          </div>
          <EnquiryTrendChart points={feeTrendPoints} />
        </section>

        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Fee Status by Student
          </h3>
          <EnquiriesDonutChart
            centerValue={students.length}
            centerLabel="Students"
            slices={statusSlices}
          />
        </section>
      </div>

      {/* Student Fee Status Table */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Student Fee Status ({filtered.length})
          </h3>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by admission no., student name, etc."
            className="w-64 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE3F5] text-[11px] uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2.5 pr-3">#</th>
                <th className="py-2.5 px-3">Admission No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3 text-right">Total Fee (&#8377;)</th>
                <th className="py-2.5 px-3 text-right">Paid (&#8377;)</th>
                <th className="py-2.5 px-3 text-right">Due (&#8377;)</th>
                <th className="py-2.5 px-3">Payment Status</th>
                <th className="py-2.5 px-3">Last Payment</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-[#76799C]">
                    No student fee records yet.
                  </td>
                </tr>
              ) : (
                paged.map((stu, idx) => {
                  const ledger = ledgerByApp.get(stu.id);
                  const netPaise = ledger
                    ? Math.max(0, ledger.totalFeePaise - ledger.concessionPaise)
                    : 0;
                  const paidPaise = ledger?.paidPaise ?? 0;
                  const duePaise = ledger?.outstandingPaise ?? 0;
                  const feeMeta = FEE_PAYMENT_STATUS_META[ledger?.paymentStatus || "PENDING"];
                  const stuLatestPayment = payments.find((p) => p.applicationId === stu.id);
                  return (
                    <tr key={stu.id}>
                      <td className="py-3 pr-3 font-bold">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#6D28D9] dark:text-violet-300">
                        {stu.admissionNumber || stu.applicationCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                        {stu.studentName}
                      </td>
                      <td className="py-3 px-3">{stu.gradeApplied}</td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {formatInrFromPaise(netPaise)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatInrFromPaise(paidPaise)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                        {formatInrFromPaise(duePaise)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${feeMeta.badgeClass}`}
                        >
                          {feeMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                        {ledger?.lastPaymentDate ? formatShortDate(ledger.lastPaymentDate) : "-"}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <PortalActionMenu
                          ariaLabel={`Fee menu ${stu.studentName}`}
                          items={[
                            ...(canWrite
                              ? [
                                  {
                                    label: "Record Payment",
                                    onClick: () => setTargetAppId(stu.id),
                                  },
                                  {
                                    label: "Set Fee / Concession",
                                    onClick: () => onOpenSetLedgerModal(stu),
                                  },
                                ]
                              : []),
                            ...(stuLatestPayment
                              ? [
                                  {
                                    label: "View Latest Receipt",
                                    onClick: () => onOpenReceiptModal(stuLatestPayment),
                                  },
                                ]
                              : []),
                            {
                              label: "Send Fee Reminder",
                              onClick: () => onSendReminder(stu),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-[#232746] text-xs">
            <span>
              Page {safePage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-2.5 py-1 font-semibold disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-2.5 py-1 font-semibold disabled:opacity-40"
              >
                Next
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 3-Column Fee Collection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Fee Collection Summary
          </h3>
          {[
            { label: "Total Net Fee", val: formatInrFromPaise(summary.totalFeePaise) },
            { label: "Collected", val: formatInrFromPaise(summary.totalCollectedPaise) },
            { label: "Outstanding", val: formatInrFromPaise(summary.totalOutstandingPaise) },
            { label: "Collection Rate", val: `${summary.collectionRate.toFixed(1)}%` },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-xs dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <span className="font-semibold text-[#4D5072] dark:text-[#9DA6CC]">{r.label}</span>
              <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                {r.val}
              </span>
            </div>
          ))}
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Record Fee Payment
          </h3>
          <form onSubmit={handlePaymentSubmit} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold mb-1">Student *</label>
              <select
                value={targetAppId || students[0]?.id || ""}
                onChange={(e) => setTargetAppId(e.target.value)}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                {students.length === 0 && <option value="">No admitted students</option>}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentName} ({s.admissionNumber || s.applicationCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold mb-1">Fee Head *</label>
                <select
                  value={feeHead}
                  onChange={(e) => setFeeHead(e.target.value as AdmittedFeeHeadValue)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                >
                  {FEE_HEAD_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Amount (&#8377;) *</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as AdmittedPaymentModeValue)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                >
                  {PAYMENT_MODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">
                Transaction / Reference No.
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Enter reference no. (optional)"
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>
            {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}
            {formSuccess && (
              <p className="text-xs font-semibold text-emerald-600">{formSuccess}</p>
            )}
            <button
              type="submit"
              disabled={!canWrite || submitting || students.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Record Payment"}
            </button>
          </form>
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Quick Actions
          </h3>
          {canWrite && (
            <button
              type="button"
              disabled={students.length === 0}
              onClick={() => onOpenSetLedgerModal(students[0] ?? null)}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold hover:border-[#9B76FF] disabled:opacity-40 dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <span>Set Fee / Apply Concession</span>
              <span className="text-[#6D28D9] dark:text-violet-300">&rarr;</span>
            </button>
          )}
          <button
            type="button"
            disabled={students.length === 0}
            onClick={() => {
              const firstPending =
                students.find((s) => (ledgerByApp.get(s.id)?.outstandingPaise ?? 0) > 0) ||
                students[0];
              if (firstPending) onSendReminder(firstPending);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold hover:border-[#9B76FF] disabled:opacity-40 dark:border-[#272B4D] dark:bg-[#191D3D]"
          >
            <span>Send Fee Reminder</span>
            <span className="text-[#6D28D9] dark:text-violet-300">&rarr;</span>
          </button>
          {canExport && (
            <button
              type="button"
              onClick={onExportFeesCsv}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <span>Download Fee Report CSV</span>
              <span className="text-[#6D28D9] dark:text-violet-300">&rarr;</span>
            </button>
          )}
        </section>
      </div>

      {/* Bottom 2-Col Row: Recent Fee Transactions + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Recent Fee Transactions
          </h3>
          {payments.length === 0 ? (
            <p className="text-xs text-[#76799C]">No fee payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2">Receipt</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {payments.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 font-bold text-[#6D28D9] dark:text-violet-300">
                        <button
                          type="button"
                          onClick={() => onOpenReceiptModal(p)}
                          className="hover:underline"
                        >
                          {p.receiptNumber}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-semibold">{p.studentName || "Student"}</td>
                      <td className="py-2 px-3 text-right font-bold tabular-nums">
                        {formatInrFromPaise(p.amountPaise)}
                      </td>
                      <td className="py-2 px-3">{p.paymentMode}</td>
                      <td className="py-2 text-right text-[#4D5072] dark:text-[#9DA6CC]">
                        {formatShortDate(p.paymentDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-1">
            Fee Insights
          </h3>
          {[
            `${summary.paidCount} students have paid the full fee (${
              summary.totalStudents > 0
                ? ((summary.paidCount / summary.totalStudents) * 100).toFixed(1)
                : "0.0"
            }%).`,
            `${summary.partialCount} students have made partial payments.`,
            `${summary.pendingCount} students have pending fee assessments or dues.`,
            `Total outstanding balance is ${formatInrFromPaise(summary.totalOutstandingPaise)}.`,
          ].map((insight) => (
            <div
              key={insight}
              className="rounded-xl border border-[#E5E9F8] bg-[#F5F7FD] px-3.5 py-2 text-xs font-medium text-[#1B1D45] dark:border-[#272B4D] dark:bg-[#191D3D] dark:text-[#DCE1F9]"
            >
              {insight}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
