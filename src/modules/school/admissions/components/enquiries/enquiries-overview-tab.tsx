"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
  AdmissionEnquiryStatusType,
} from "@/modules/school/admissions/types";
import {
  ENQUIRY_STATUS_UI_META,
  EnquiriesDonutChart,
  EnquiryTrendChart,
  PortalActionMenu,
  formatShortDate,
  getSourceColorMeta,
  type DonutSlice,
} from "./enquiry-shared";

interface EnquiriesOverviewTabProps {
  schoolName: string;
  enquiries: AdmissionEnquiryRecord[];
  sources: AdmissionEnquirySourceRecord[];
  availableGrades: string[];
  currentAcademicYear: string;
  canWrite: boolean;
  canExport: boolean;
  onViewEnquiry: (enquiry: AdmissionEnquiryRecord) => void;
  onEditEnquiry: (enquiry: AdmissionEnquiryRecord) => void;
  onOpenNewEnquiryForm: () => void;
  onQuickCreateEnquiry: (payload: {
    guardianName: string;
    studentName: string;
    guardianPhone: string;
    guardianEmail: string;
    gradeApplied: string;
    source: string;
    notes: string;
    academicYear: string;
  }) => Promise<void>;
  onUpdateEnquiryStatus: (
    enquiryId: string,
    status: AdmissionEnquiryStatusType,
  ) => Promise<void>;
  onConvertEnquiry: (enquiry: AdmissionEnquiryRecord) => Promise<void>;
  onExportCsv: () => void;
  onSwitchSubTab: (tab: "list" | "followups" | "sources" | "reports") => void;
}

export function EnquiriesOverviewTab({
  schoolName,
  enquiries,
  sources,
  availableGrades,
  currentAcademicYear,
  canWrite,
  canExport,
  onViewEnquiry,
  onEditEnquiry,
  onOpenNewEnquiryForm,
  onQuickCreateEnquiry,
  onUpdateEnquiryStatus,
  onConvertEnquiry,
  onExportCsv,
  onSwitchSubTab,
}: EnquiriesOverviewTabProps) {
  const [trendRange, setTrendRange] = useState<3 | 6 | 12>(6);
  const [tableSearch, setTableSearch] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState<"all" | AdmissionEnquiryStatusType>(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Quick Add New Enquiry form state
  const [qGuardianName, setQGuardianName] = useState("");
  const [qStudentName, setQStudentName] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [qGrade, setQGrade] = useState("");
  const [qSource, setQSource] = useState("");
  const [qNotes, setQNotes] = useState("");
  const [qSubmitting, setQSubmitting] = useState(false);
  const [qError, setQError] = useState<string | null>(null);
  const [qSuccess, setQSuccess] = useState<string | null>(null);

  const submittedEnquiries = useMemo(
    () => enquiries.filter((e) => !e.isDraft),
    [enquiries],
  );

  const kpis = useMemo(() => {
    const total = submittedEnquiries.length;
    const open = submittedEnquiries.filter(
      (e) => e.status === "NEW" || e.status === "CONTACTED",
    ).length;
    const followUp = submittedEnquiries.filter((e) => e.status === "FOLLOW_UP").length;
    const converted = submittedEnquiries.filter((e) => e.status === "CONVERTED").length;
    const closed = submittedEnquiries.filter((e) => e.status === "CLOSED").length;
    return { total, open, followUp, converted, closed };
  }, [submittedEnquiries]);

  const sourceSlices = useMemo<DonutSlice[]>(() => {
    const total = submittedEnquiries.length;
    if (total === 0) return [];
    const counts = new Map<string, number>();
    for (const enq of submittedEnquiries) {
      counts.set(enq.source, (counts.get(enq.source) ?? 0) + 1);
    }
    const sourceMetaMap = new Map(sources.map((s) => [s.name.toLowerCase(), s.colorToken]));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        label: name,
        count,
        percentage: (count / total) * 100,
        color: getSourceColorMeta(name, sourceMetaMap.get(name.toLowerCase())).hex,
      }));
  }, [submittedEnquiries, sources]);

  const trendPoints = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; count: number }> = [];
    for (let i = trendRange - 1; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(d);
      months.push({ key, label, count: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const enq of submittedEnquiries) {
      const d = new Date(enq.enquiryDate || enq.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.count += 1;
    }
    return months;
  }, [submittedEnquiries, trendRange]);

  const filteredEnquiries = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return submittedEnquiries.filter((e) => {
      if (tableStatusFilter !== "all" && e.status !== tableStatusFilter) return false;
      if (!q) return true;
      return [e.enquiryCode, e.studentName, e.guardianName, e.guardianPhone, e.guardianEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [submittedEnquiries, tableSearch, tableStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEnquiries = filteredEnquiries.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const activeSources = useMemo(
    () => sources.filter((s) => s.isActive),
    [sources],
  );

  async function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQError(null);
    setQSuccess(null);
    if (!qGuardianName.trim() || !qPhone.trim() || !qGrade || !qSource) {
      setQError("Please fill all required fields marked with *.");
      return;
    }
    setQSubmitting(true);
    try {
      await onQuickCreateEnquiry({
        guardianName: qGuardianName.trim(),
        studentName: qStudentName.trim() || qGuardianName.trim(),
        guardianPhone: qPhone.trim(),
        guardianEmail: qEmail.trim(),
        gradeApplied: qGrade,
        source: qSource,
        notes: qNotes.trim(),
        academicYear: currentAcademicYear,
      });
      setQGuardianName("");
      setQStudentName("");
      setQPhone("");
      setQEmail("");
      setQGrade("");
      setQSource("");
      setQNotes("");
      setQSuccess("Enquiry saved successfully.");
    } catch (err) {
      setQError(err instanceof Error ? err.message : "Failed to save enquiry.");
    } finally {
      setQSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-[18px] border border-[#DFD8FA] bg-gradient-to-br from-[#F7F3FF] to-[#EFE9FF] p-4 shadow-xs dark:border-[#2F295C] dark:from-[#1B173D] dark:to-[#151232]">
          <p className="text-xs font-bold text-[#5B4B9A] dark:text-violet-300">Total Enquiries</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.total}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Active cohort records
          </p>
        </div>

        <div className="rounded-[18px] border border-sky-200/80 bg-gradient-to-br from-[#F0F8FF] to-[#E6F4FE] p-4 shadow-xs dark:border-sky-900/50 dark:from-[#112238] dark:to-[#0E1B2E]">
          <p className="text-xs font-bold text-sky-700 dark:text-sky-300">Open</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.open}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            New &amp; contacted
          </p>
        </div>

        <div className="rounded-[18px] border border-amber-200/80 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/60 p-4 shadow-xs dark:border-amber-900/50 dark:from-[#2B210E] dark:to-[#22190B]">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Follow-up Due</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.followUp}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Scheduled outreach
          </p>
        </div>

        <div className="rounded-[18px] border border-emerald-200/80 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]/60 p-4 shadow-xs dark:border-emerald-900/50 dark:from-[#0E2920] dark:to-[#0A1F18]">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Converted</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.converted}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Converted to applications
          </p>
        </div>

        <div className="rounded-[18px] border border-rose-200/80 bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6]/60 p-4 shadow-xs dark:border-rose-900/50 dark:from-[#2C1219] dark:to-[#220E14]">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Closed</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.closed}
          </p>
          <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
            Completed or dropped
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Enquiries by Source
            </h3>
            <button
              type="button"
              onClick={() => onSwitchSubTab("sources")}
              className="text-xs font-semibold text-[#6D28D9] hover:underline dark:text-violet-300"
            >
              Manage Sources &rarr;
            </button>
          </div>
          <EnquiriesDonutChart
            centerValue={kpis.total}
            centerLabel="Enquiries"
            slices={sourceSlices}
            emptyLabel="Log an enquiry to view source distribution"
          />
        </section>

        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Enquiry Trend
            </h3>
            <select
              aria-label="Enquiry trend range"
              value={trendRange}
              onChange={(e) => setTrendRange(Number(e.target.value) as 3 | 6 | 12)}
              className="rounded-lg border border-[#CAD0EB] bg-[#F5F7FD] px-2.5 py-1 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <EnquiryTrendChart points={trendPoints} />
        </section>
      </div>

      {/* Enquiries Recent Table Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Enquiries ({filteredEnquiries.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, email or enquiry ID..."
              className="w-64 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs text-[#1B1D45] placeholder:text-[#76799C] focus:border-[#7C3AED] focus:outline-none dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9] dark:placeholder:text-[#7C83AA]"
            />
            <select
              aria-label="Filter recent enquiries by status"
              value={tableStatusFilter}
              onChange={(e) => {
                setTableStatusFilter(e.target.value as "all" | AdmissionEnquiryStatusType);
                setPage(1);
              }}
              className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
            >
              <option value="all">All Status</option>
              <option value="NEW">Open</option>
              <option value="CONTACTED">Contacted</option>
              <option value="FOLLOW_UP">Follow-up Due</option>
              <option value="CONVERTED">Converted</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {filteredEnquiries.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
            <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
              No enquiries recorded yet
            </p>
            <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Log walk-in, phone, or website admission enquiries for {schoolName}.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2.5 pr-3">Enquiry ID</th>
                    <th className="py-2.5 px-3">Parent / Enquirer Name</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Grade Interested</th>
                    <th className="py-2.5 px-3">Enquiry Date</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {pagedEnquiries.map((enq) => {
                    const statusMeta = ENQUIRY_STATUS_UI_META[enq.status];
                    const sourceMeta = getSourceColorMeta(enq.source);
                    return (
                      <tr
                        key={enq.id}
                        className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#1A1E3D]/70 transition-colors"
                      >
                        <td className="py-3 pr-3 font-bold text-[#6D28D9] dark:text-violet-300">
                          <button
                            type="button"
                            onClick={() => onViewEnquiry(enq)}
                            className="hover:underline"
                          >
                            {enq.enquiryCode}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
                          {enq.guardianName}
                        </td>
                        <td className="py-3 px-3 text-[#4D5072] dark:text-[#BAC2E2]">
                          {enq.studentName}
                        </td>
                        <td className="py-3 px-3 text-[#1B1D45] dark:text-[#DCE1F9]">
                          {enq.gradeApplied}
                        </td>
                        <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                          {formatShortDate(enq.enquiryDate || enq.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sourceMeta.pillClass}`}
                          >
                            {enq.source}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label={`View ${enq.enquiryCode}`}
                              onClick={() => onViewEnquiry(enq)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300 dark:hover:bg-[#252A4E]"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 4.5c-4.17 0-7.63 2.57-9 5.5 1.37 2.93 4.83 5.5 9 5.5s7.63-2.57 9-5.5c-1.37-2.93-4.83-5.5-9-5.5zm0 8.83A3.33 3.33 0 1110 6.67a3.33 3.33 0 010 6.66z" />
                                <circle cx="10" cy="10" r="1.8" />
                              </svg>
                            </button>
                            <PortalActionMenu
                              ariaLabel={`More actions for ${enq.enquiryCode}`}
                              items={[
                                { label: "View Details", onClick: () => onViewEnquiry(enq) },
                                ...(canWrite
                                  ? [
                                      { label: "Edit Enquiry", onClick: () => onEditEnquiry(enq) },
                                      {
                                        label: "Convert to Application",
                                        disabled:
                                          enq.status === "CONVERTED" ||
                                          Boolean(enq.convertedApplicationId),
                                        onClick: () => void onConvertEnquiry(enq),
                                      },
                                      {
                                        label: "Mark Closed",
                                        disabled: enq.status === "CLOSED",
                                        danger: true,
                                        onClick: () =>
                                          void onUpdateEnquiryStatus(enq.id, "CLOSED"),
                                      },
                                    ]
                                  : []),
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9] dark:border-[#232746] text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              <span>
                Showing {(safePage - 1) * pageSize + 1} –{" "}
                {Math.min(safePage * pageSize, filteredEnquiries.length)} of{" "}
                {filteredEnquiries.length} enquiries
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
                  aria-label="Rows per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Bottom 2-Column Row: Quick Add New Enquiry + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              + Add New Enquiry
            </h3>
            {canWrite && (
              <button
                type="button"
                onClick={onOpenNewEnquiryForm}
                className="text-xs font-semibold text-[#6D28D9] hover:underline dark:text-violet-300"
              >
                Open Full Form &rarr;
              </button>
            )}
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Parent / Enquirer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={qGuardianName}
                  onChange={(e) => setQGuardianName(e.target.value)}
                  placeholder="Enter parent or enquirer name"
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={qStudentName}
                  onChange={(e) => setQStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={qPhone}
                  onChange={(e) => setQPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={qEmail}
                  onChange={(e) => setQEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Grade Interested <span className="text-rose-500">*</span>
                </label>
                <select
                  value={qGrade}
                  onChange={(e) => setQGrade(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  <option value="">Select grade</option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Source <span className="text-rose-500">*</span>
                </label>
                <select
                  value={qSource}
                  onChange={(e) => setQSource(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  <option value="">Select source</option>
                  {activeSources.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Enquiry Details
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={qNotes}
                onChange={(e) => setQNotes(e.target.value)}
                placeholder="Enter enquiry details, questions or remarks..."
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              />
              <div className="text-right text-[10px] text-[#76799C] dark:text-[#8A94B8]">
                {qNotes.length} / 500
              </div>
            </div>

            {qError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{qError}</p>
            )}
            {qSuccess && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {qSuccess}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQGuardianName("");
                  setQStudentName("");
                  setQPhone("");
                  setQEmail("");
                  setQGrade("");
                  setQSource("");
                  setQNotes("");
                  setQError(null);
                  setQSuccess(null);
                }}
                className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-semibold text-[#1B1D45] hover:bg-[#F5F7FD] dark:border-[#313761] dark:text-[#DCE1F9] dark:hover:bg-[#1F2447]"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!canWrite || qSubmitting}
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
              >
                {qSubmitting ? "Saving..." : "Save Enquiry"}
              </button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
            Enquiry Quick Actions
          </h3>

          {[
            {
              title: "Schedule Follow-up",
              desc: "Set a reminder for a future follow-up.",
              onClick: () => onSwitchSubTab("followups"),
            },
            {
              title: "Convert to Application",
              desc: "View open enquiries ready to convert.",
              onClick: () => onSwitchSubTab("list"),
            },
            {
              title: "View Follow-up Queue",
              desc: "Track due today and overdue reminders.",
              onClick: () => onSwitchSubTab("followups"),
            },
            ...(canExport
              ? [
                  {
                    title: "Download Enquiry Report",
                    desc: "Export enquiry records in CSV format.",
                    onClick: onExportCsv,
                  },
                ]
              : []),
            {
              title: "Manage Sources",
              desc: "Add or edit enquiry sources (Website, Walk-In, etc.).",
              onClick: () => onSwitchSubTab("sources"),
            },
          ].map((action) => (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="flex w-full items-center justify-between rounded-[14px] border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left hover:border-[#9B76FF] hover:bg-[#F0EBFE]/60 dark:border-[#272B4D] dark:bg-[#191D3D] dark:hover:border-violet-500/60 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {action.title}
                </p>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{action.desc}</p>
              </div>
              <span className="text-xs font-bold text-[#6D28D9] dark:text-violet-300">&rsaquo;</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
