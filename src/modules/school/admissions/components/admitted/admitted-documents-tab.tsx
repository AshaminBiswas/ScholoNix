"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionActivityRecord,
  AdmissionApplicationRecord,
  AdmissionDocumentType,
  AdmissionSettingRecord,
} from "@/modules/school/admissions/types";
import {
  EnquiriesDonutChart,
  PortalActionMenu,
  formatShortDate,
  type DonutSlice,
} from "../enquiries/enquiry-shared";
import { getStudentDocumentProgress } from "./admitted-shared";

interface AdmittedDocumentsTabProps {
  schoolSlug: string;
  students: AdmissionApplicationRecord[];
  settings: AdmissionSettingRecord;
  activities: AdmissionActivityRecord[];
  canWrite: boolean;
  canVerify: boolean;
  canExport: boolean;
  onViewStudent: (stu: AdmissionApplicationRecord) => void;
  onUploadDocument: (
    applicationId: string,
    docType: AdmissionDocumentType,
    file: File,
  ) => Promise<void>;
  onMarkStudentDocsVerified: (stu: AdmissionApplicationRecord) => Promise<void>;
  onExportDocumentsCsv: () => void;
}

const UPLOADABLE_DOC_OPTIONS: Array<{ value: AdmissionDocumentType; label: string }> = [
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "student_photo", label: "Student Photograph" },
  { value: "student_aadhaar", label: "Student Aadhaar / ID Proof" },
  { value: "father_aadhaar", label: "Father's Aadhaar Card" },
  { value: "mother_aadhaar", label: "Mother's Aadhaar Card" },
  { value: "last_marksheet", label: "Previous Report Card / TC" },
];

export function AdmittedDocumentsTab({
  schoolSlug,
  students,
  settings,
  activities,
  canWrite,
  canVerify,
  canExport,
  onViewStudent,
  onUploadDocument,
  onMarkStudentDocsVerified,
  onExportDocumentsCsv,
}: AdmittedDocumentsTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [docType, setDocType] = useState<AdmissionDocumentType | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = students.length;
    let complete = 0;
    let pending = 0;
    let verificationPending = 0;
    for (const s of students) {
      const p = getStudentDocumentProgress(s);
      if (p.status === "COMPLETE") complete += 1;
      else if (p.status === "VERIFICATION_PENDING") verificationPending += 1;
      else pending += 1;
    }
    const rate = total > 0 ? (complete / total) * 100 : 0;
    return { total, complete, pending, verificationPending, rate };
  }, [students]);

  const donutSlices = useMemo<DonutSlice[]>(() => {
    if (stats.total === 0) return [];
    return [
      {
        label: "Complete",
        count: stats.complete,
        percentage: (stats.complete / stats.total) * 100,
        color: "#22C55E",
      },
      {
        label: "Pending",
        count: stats.pending,
        percentage: (stats.pending / stats.total) * 100,
        color: "#F59E0B",
      },
      {
        label: "Verification Pending",
        count: stats.verificationPending,
        percentage: (stats.verificationPending / stats.total) * 100,
        color: "#7C3AED",
      },
    ];
  }, [stats]);

  const checklistConfig = useMemo(() => {
    const reqs = settings.extendedConfig?.documentRequirements ?? [];
    if (reqs.length > 0) return reqs;
    return [
      { id: "birth_certificate", label: "Birth Certificate", mandatory: true },
      { id: "address_proof", label: "Address Proof", mandatory: true },
      { id: "student_photo", label: "Student Photograph", mandatory: true },
      { id: "previous_report_card", label: "Previous School Marksheet / TC", mandatory: false },
    ];
  }, [settings]);

  const docTypeSubmissionRates = useMemo(() => {
    const total = Math.max(1, students.length);
    return checklistConfig.map((req) => {
      const lower = req.label.toLowerCase();
      const count = students.filter((s) =>
        (s.documentsChecklist || []).some(
          (item) =>
            item.submitted &&
            (item.key === req.id || item.label.toLowerCase().includes(lower.slice(0, 8))),
        ),
      ).length;
      return {
        label: req.label,
        count,
        total: students.length,
        pct: students.length > 0 ? (count / total) * 100 : 0,
      };
    });
  }, [checklistConfig, students]);

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

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    setUploadFeedback(null);
    const targetId = selectedStudentId || students[0]?.id;
    if (!targetId || !docType || !file) {
      setUploadError("Please select a student, document type, and valid PDF/JPG/PNG file.");
      return;
    }
    setUploading(true);
    try {
      await onUploadDocument(targetId, docType, file);
      setFile(null);
      setDocType("");
      setUploadFeedback("Document uploaded and checklist updated.");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 5 Document KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.total}
          </p>
          <p className="text-[11px] font-semibold text-[#76799C]">Total Students</p>
        </div>
        <div className="rounded-[16px] border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-[#0E2920]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.complete}
          </p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Documents Complete
          </p>
        </div>
        <div className="rounded-[16px] border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-[#2B210E]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.pending}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Document Pending
          </p>
        </div>
        <div className="rounded-[16px] border border-violet-200/80 bg-violet-50/50 p-3.5 dark:border-violet-900/50 dark:bg-[#1B173D]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.verificationPending}
          </p>
          <p className="text-[11px] font-semibold text-[#5B4B9A] dark:text-violet-300">
            Verification Pending
          </p>
        </div>
        <div className="rounded-[16px] border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-[#112238]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.rate.toFixed(1)}%
          </p>
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
            Completion Rate
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Document Submission Status
          </h3>
          <EnquiriesDonutChart
            centerValue={stats.total}
            centerLabel="Students"
            slices={donutSlices}
          />
        </section>

        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Documents by Type (Submission Rate)
          </h3>
          {docTypeSubmissionRates.map((item) => (
            <div key={item.label} className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span>{item.label}</span>
                <span className="tabular-nums text-[#4D5072] dark:text-[#9DA6CC]">
                  {item.count} / {item.total} ({item.pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F0EBFE] dark:bg-[#1E2246] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]"
                  style={{ width: `${Math.min(100, item.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Student Documents Table */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Student Documents ({filtered.length})
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
                <th className="py-2.5 px-3">Documents Status</th>
                <th className="py-2.5 px-3">Submitted</th>
                <th className="py-2.5 px-3">Verified</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#76799C]">
                    No admitted student document records yet.
                  </td>
                </tr>
              ) : (
                paged.map((stu, idx) => {
                  const prog = getStudentDocumentProgress(stu);
                  const badge =
                    prog.status === "COMPLETE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                      : prog.status === "VERIFICATION_PENDING"
                        ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60"
                        : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60";
                  const label =
                    prog.status === "COMPLETE"
                      ? "Complete"
                      : prog.status === "VERIFICATION_PENDING"
                        ? "Verification Pending"
                        : "Pending";
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
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {prog.submitted} / {prog.total}
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {prog.verified} / {prog.total}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`View documents for ${stu.studentName}`}
                            onClick={() => onViewStudent(stu)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10 4.5c-4.17 0-7.63 2.57-9 5.5 1.37 2.93 4.83 5.5 9 5.5s7.63-2.57 9-5.5c-1.37-2.93-4.83-5.5-9-5.5zm0 8.83A3.33 3.33 0 1110 6.67a3.33 3.33 0 010 6.66z" />
                              <circle cx="10" cy="10" r="1.8" />
                            </svg>
                          </button>
                          <PortalActionMenu
                            ariaLabel={`Document menu ${stu.studentName}`}
                            items={[
                              { label: "View Details", onClick: () => onViewStudent(stu) },
                              ...(canVerify
                                ? [
                                    {
                                      label: "Verify All Documents",
                                      disabled: prog.status === "COMPLETE",
                                      onClick: () => void onMarkStudentDocsVerified(stu),
                                    },
                                  ]
                                : []),
                              ...(stu.uploadedDocuments?.[0]
                                ? [
                                    {
                                      label: "Open First Uploaded File",
                                      onClick: () => {
                                        const doc = stu.uploadedDocuments?.[0];
                                        if (doc) {
                                          window.open(
                                            `/api/school/admissions/documents/view?storageKey=${encodeURIComponent(
                                              doc.storageKey,
                                            )}&schoolSlug=${encodeURIComponent(schoolSlug)}`,
                                            "_blank",
                                          );
                                        }
                                      },
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

      {/* 3-Column Bottom Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Document Checklist
          </h3>
          {checklistConfig.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/60 px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <span className="font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">{req.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  req.mandatory
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {req.mandatory ? "Required" : "Conditional"}
              </span>
            </div>
          ))}
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Upload / Update Document
          </h3>
          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">Student *</label>
              <select
                value={selectedStudentId || students[0]?.id || ""}
                onChange={(e) => setSelectedStudentId(e.target.value)}
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
            <div>
              <label className="block text-[11px] font-bold mb-1">Document Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as AdmissionDocumentType | "")}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                <option value="">Select Document Type</option>
                {UPLOADABLE_DOC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-dashed border-[#CAD0EB] bg-[#FAF8FE] px-3 py-3 text-xs dark:border-[#313761] dark:bg-[#191D3D]"
              />
              <p className="mt-1 text-[10px] text-[#76799C]">
                Supported formats: PDF, JPG, PNG | Max size: 5 MB
              </p>
            </div>
            {uploadError && <p className="text-xs font-semibold text-rose-600">{uploadError}</p>}
            {uploadFeedback && (
              <p className="text-xs font-semibold text-emerald-600">{uploadFeedback}</p>
            )}
            <button
              type="submit"
              disabled={!canWrite || uploading || students.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </section>

        <section className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
            Quick Actions &amp; Recent Activity
          </h3>
          {canVerify && students[0] && (
            <button
              type="button"
              onClick={() => {
                const target =
                  students.find((s) => s.id === (selectedStudentId || students[0]?.id)) ||
                  students[0];
                if (target) void onMarkStudentDocsVerified(target);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <span>Verify Selected Student Documents</span>
              <span className="text-[#6D28D9] dark:text-violet-300">&rarr;</span>
            </button>
          )}
          {canExport && (
            <button
              type="button"
              onClick={onExportDocumentsCsv}
              className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#191D3D]"
            >
              <span>Download Document List CSV</span>
              <span className="text-[#6D28D9] dark:text-violet-300">&rarr;</span>
            </button>
          )}
          <div className="pt-2 space-y-1.5">
            {activities
              .filter(
                (a) =>
                  a.summary.toLowerCase().includes("document") ||
                  a.summary.toLowerCase().includes("verified"),
              )
              .slice(0, 3)
              .map((act) => (
                <div
                  key={act.id}
                  className="rounded-lg bg-[#F5F7FD] px-3 py-2 text-[11px] text-[#4D5072] dark:bg-[#191D3D] dark:text-[#9DA6CC]"
                >
                  <p className="font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">{act.summary}</p>
                  <p>{formatShortDate(act.createdAt)}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
