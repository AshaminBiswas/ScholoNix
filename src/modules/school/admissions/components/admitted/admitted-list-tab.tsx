"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionFeeLedgerRecord,
  AdmissionSettingRecord,
  AdmissionTypeValue,
  AdmittedEnrollmentStatusValue,
} from "@/modules/school/admissions/types";
import {
  EnquiriesDonutChart,
  PortalActionMenu,
  formatShortDate,
  type DonutSlice,
} from "../enquiries/enquiry-shared";
import {
  ADMISSION_TYPE_META,
  ENROLLMENT_STATUS_META,
  FEE_PAYMENT_STATUS_META,
  buildLedgerLookup,
} from "./admitted-shared";

interface AdmittedListTabProps {
  students: AdmissionApplicationRecord[];
  ledgers: AdmissionFeeLedgerRecord[];
  settings: AdmissionSettingRecord;
  canWrite: boolean;
  canExport: boolean;
  onViewStudent: (stu: AdmissionApplicationRecord) => void;
  onEditStudent: (stu: AdmissionApplicationRecord) => void;
  onUpdateEnrollment: (
    applicationId: string,
    payload: { enrollmentStatus?: AdmittedEnrollmentStatusValue; admissionType?: AdmissionTypeValue },
  ) => Promise<void>;
  onOpenIdCard: (selected: AdmissionApplicationRecord[]) => void;
  onOpenCommunication: (selected: AdmissionApplicationRecord[]) => void;
  onOpenDirectAdmit: () => void;
  onOpenImport: () => void;
  onExportCsv: () => void;
}

export function AdmittedListTab({
  students,
  ledgers,
  settings,
  canWrite,
  canExport,
  onViewStudent,
  onEditStudent,
  onUpdateEnrollment,
  onOpenIdCard,
  onOpenCommunication,
  onOpenDirectAdmit,
  onOpenImport,
  onExportCsv,
}: AdmittedListTabProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const ledgerByApp = useMemo(() => buildLedgerLookup(ledgers), [ledgers]);

  const counts = useMemo(() => {
    const total = students.length;
    const fresh = students.filter((s) => (s.admissionType || "FRESH") === "FRESH").length;
    const transfer = students.filter((s) => s.admissionType === "TRANSFER").length;
    const reAdmission = students.filter((s) => s.admissionType === "RE_ADMISSION").length;
    const others = students.filter((s) => s.admissionType === "OTHER").length;
    return { total, fresh, transfer, reAdmission, others };
  }, [students]);

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

  const gradeBars = useMemo(() => {
    const map = new Map<string, number>();
    settings.enabledGrades.forEach((g) => map.set(g, 0));
    for (const s of students) {
      map.set(s.gradeApplied, (map.get(s.gradeApplied) ?? 0) + 1);
    }
    return Array.from(map.entries()).filter(([, c]) => c > 0);
  }, [students, settings.enabledGrades]);

  const typeSlices = useMemo<DonutSlice[]>(() => {
    const t = students.length;
    if (t === 0) return [];
    const keys = ["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"] as const;
    return keys
      .map((k) => {
        const count = students.filter((s) => (s.admissionType || "FRESH") === k).length;
        return {
          label: ADMISSION_TYPE_META[k].label,
          count,
          percentage: (count / t) * 100,
          color: ADMISSION_TYPE_META[k].color,
        };
      })
      .filter((s) => s.count > 0);
  }, [students]);

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.includes(s.id)),
    [students, selectedIds],
  );

  const toggleAllPaged = () => {
    const pageIds = paged.map((s) => s.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  return (
    <div className="space-y-4">
      {/* 5 Type KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Admitted", val: counts.total, cls: "border-[#D6DBF0] bg-white dark:border-[#272B4D] dark:bg-[#141731]" },
          { label: "New Admission", val: counts.fresh, cls: "border-violet-200/80 bg-violet-50/50 dark:border-violet-900/50 dark:bg-[#1B173D]" },
          { label: "Transfer", val: counts.transfer, cls: "border-sky-200/80 bg-sky-50/50 dark:border-sky-900/50 dark:bg-[#112238]" },
          { label: "Re-Admission", val: counts.reAdmission, cls: "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-[#0E2920]" },
          { label: "Others", val: counts.others, cls: "border-pink-200/80 bg-pink-50/50 dark:border-pink-900/50 dark:bg-[#2C121E]" },
        ].map((k) => (
          <div key={k.label} className={`rounded-[16px] border p-3.5 ${k.cls}`}>
            <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
              {k.val}
            </p>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              {k.label}
            </p>
          </div>
        ))}
      </div>

      {/* Main List Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Admitted Students List ({filtered.length})
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

        {/* Bulk Bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#191D3D]">
          <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            disabled={selectedStudents.length === 0}
            onClick={() => onOpenIdCard(selectedStudents)}
            className="rounded-lg border border-[#CAD0EB] bg-white px-3 py-1 font-semibold text-[#1B1D45] disabled:opacity-40 hover:border-[#7C3AED] dark:border-[#313761] dark:bg-[#141731] dark:text-[#DCE1F9]"
          >
            Generate ID Card
          </button>
          <button
            type="button"
            disabled={selectedStudents.length === 0}
            onClick={() => onOpenCommunication(selectedStudents)}
            className="rounded-lg border border-[#CAD0EB] bg-white px-3 py-1 font-semibold text-[#1B1D45] disabled:opacity-40 hover:border-[#7C3AED] dark:border-[#313761] dark:bg-[#141731] dark:text-[#DCE1F9]"
          >
            Send Communication
          </button>
          {canExport && (
            <button
              type="button"
              onClick={onExportCsv}
              className="rounded-lg border border-[#CAD0EB] bg-white px-3 py-1 font-semibold text-[#1B1D45] hover:border-[#7C3AED] dark:border-[#313761] dark:bg-[#141731] dark:text-[#DCE1F9]"
            >
              Export
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE3F5] text-[11px] uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2.5 pr-2">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={paged.length > 0 && paged.every((s) => selectedIds.includes(s.id))}
                    onChange={toggleAllPaged}
                    className="accent-[#7C3AED]"
                  />
                </th>
                <th className="py-2.5 pr-3">#</th>
                <th className="py-2.5 px-3">Admission No.</th>
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
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No admitted students match the current filter.
                  </td>
                </tr>
              ) : (
                paged.map((stu, idx) => {
                  const typeMeta = ADMISSION_TYPE_META[stu.admissionType || "FRESH"];
                  const enrollMeta = ENROLLMENT_STATUS_META[stu.enrollmentStatus || "ACTIVE"];
                  const ledger = ledgerByApp.get(stu.id);
                  const feeMeta = FEE_PAYMENT_STATUS_META[ledger?.paymentStatus || "PENDING"];
                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#1A1E3D]/70 transition-colors"
                    >
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${stu.studentName}`}
                          checked={selectedIds.includes(stu.id)}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(stu.id)
                                ? prev.filter((x) => x !== stu.id)
                                : [...prev, stu.id],
                            )
                          }
                          className="accent-[#7C3AED]"
                        />
                      </td>
                      <td className="py-3 pr-3 font-bold">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#6D28D9] dark:text-violet-300">
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
                            aria-label={`Inspect ${stu.studentName}`}
                            onClick={() => onViewStudent(stu)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300 dark:hover:bg-[#252A4E]"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10 4.5c-4.17 0-7.63 2.57-9 5.5 1.37 2.93 4.83 5.5 9 5.5s7.63-2.57 9-5.5c-1.37-2.93-4.83-5.5-9-5.5zm0 8.83A3.33 3.33 0 1110 6.67a3.33 3.33 0 010 6.66z" />
                              <circle cx="10" cy="10" r="1.8" />
                            </svg>
                          </button>
                          {canWrite && (
                            <button
                              type="button"
                              aria-label={`Edit ${stu.studentName}`}
                              onClick={() => onEditStudent(stu)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#4D5072] hover:bg-[#F0EBFE] hover:text-[#6D28D9] dark:text-[#9DA6CC] dark:hover:bg-[#252A4E]"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M13.58 3.58a2 2 0 112.83 2.83l-9.2 9.2-3.5.7.7-3.5 9.17-9.23z" />
                              </svg>
                            </button>
                          )}
                          <PortalActionMenu
                            ariaLabel={`Row menu ${stu.studentName}`}
                            items={[
                              { label: "View Details", onClick: () => onViewStudent(stu) },
                              { label: "Generate ID Card", onClick: () => onOpenIdCard([stu]) },
                              {
                                label: "Send Communication",
                                onClick: () => onOpenCommunication([stu]),
                              },
                              ...(canWrite
                                ? [
                                    { label: "Edit Application", onClick: () => onEditStudent(stu) },
                                    {
                                      label: "Mark Transferred",
                                      disabled: stu.enrollmentStatus === "TRANSFERRED",
                                      onClick: () =>
                                        void onUpdateEnrollment(stu.id, {
                                          enrollmentStatus: "TRANSFERRED",
                                        }),
                                    },
                                    {
                                      label: "Mark Withdrawn",
                                      disabled: stu.enrollmentStatus === "WITHDRAWN",
                                      danger: true,
                                      onClick: () =>
                                        void onUpdateEnrollment(stu.id, {
                                          enrollmentStatus: "WITHDRAWN",
                                        }),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-[#232746] text-xs text-[#4D5072] dark:text-[#9DA6CC]">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} –{" "}
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
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </section>

      {/* Bottom 3-Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Admissions by Grade
          </h3>
          {gradeBars.length === 0 ? (
            <p className="text-xs text-[#76799C]">No grade distribution yet.</p>
          ) : (
            gradeBars.map(([grade, count]) => {
              const pct = students.length > 0 ? (count / students.length) * 100 : 0;
              return (
                <div key={grade} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>{grade}</span>
                    <span className="tabular-nums">
                      {count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F0EBFE] dark:bg-[#1E2246] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
            Admission by Type
          </h3>
          <EnquiriesDonutChart
            centerValue={students.length}
            centerLabel="Admitted"
            slices={typeSlices}
          />
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Quick Actions
          </h3>
          {[
            ...(canWrite
              ? [
                  {
                    title: "Add New Admission",
                    desc: "Admit a new student directly.",
                    onClick: onOpenDirectAdmit,
                  },
                  {
                    title: "Import Admitted List",
                    desc: "Bulk upload admitted students via CSV.",
                    onClick: onOpenImport,
                  },
                ]
              : []),
            {
              title: "Generate ID Cards",
              desc: "Create printable ID cards for students.",
              onClick: () => onOpenIdCard(selectedStudents.length > 0 ? selectedStudents : students.slice(0, 10)),
            },
            {
              title: "Send Communication",
              desc: "Send notice to admitted students.",
              onClick: () =>
                onOpenCommunication(selectedStudents.length > 0 ? selectedStudents : students),
            },
          ].map((act) => (
            <button
              key={act.title}
              type="button"
              onClick={act.onClick}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <div>
                <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {act.title}
                </p>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{act.desc}</p>
              </div>
              <span className="text-xs font-bold text-[#6D28D9] dark:text-violet-300">&rarr;</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
