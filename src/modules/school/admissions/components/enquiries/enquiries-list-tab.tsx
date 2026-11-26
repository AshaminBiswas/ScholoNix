"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
  AdmissionEnquiryStatusType,
} from "@/modules/school/admissions/types";
import {
  ENQUIRY_STATUS_UI_META,
  PortalActionMenu,
  formatShortDate,
  getSourceColorMeta,
} from "./enquiry-shared";

interface EnquiriesListTabProps {
  enquiries: AdmissionEnquiryRecord[];
  sources: AdmissionEnquirySourceRecord[];
  availableAcademicYears: string[];
  availableGrades: string[];
  canWrite: boolean;
  canExport: boolean;
  onViewEnquiry: (enquiry: AdmissionEnquiryRecord) => void;
  onEditEnquiry: (enquiry: AdmissionEnquiryRecord) => void;
  onUpdateStatus: (enquiryId: string, status: AdmissionEnquiryStatusType) => Promise<void>;
  onConvertEnquiry: (enquiry: AdmissionEnquiryRecord) => Promise<void>;
  onExportCsv: () => void;
}

export function EnquiriesListTab({
  enquiries,
  sources,
  availableAcademicYears,
  availableGrades,
  canWrite,
  canExport,
  onViewEnquiry,
  onEditEnquiry,
  onUpdateStatus,
  onConvertEnquiry,
  onExportCsv,
}: EnquiriesListTabProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [yearFilter, setYearFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdmissionEnquiryStatusType | "DRAFT">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const kpis = useMemo(() => {
    const submitted = enquiries.filter((e) => !e.isDraft);
    return {
      total: submitted.length,
      open: submitted.filter((e) => e.status === "NEW" || e.status === "CONTACTED").length,
      followUp: submitted.filter((e) => e.status === "FOLLOW_UP").length,
      converted: submitted.filter((e) => e.status === "CONVERTED").length,
      closed: submitted.filter((e) => e.status === "CLOSED").length,
    };
  }, [enquiries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((enq) => {
      if (yearFilter !== "all" && enq.academicYear !== yearFilter) return false;
      if (gradeFilter !== "all" && enq.gradeApplied !== gradeFilter) return false;
      if (sourceFilter !== "all" && enq.source !== sourceFilter) return false;
      if (statusFilter === "DRAFT") {
        if (!enq.isDraft) return false;
      } else if (statusFilter !== "all") {
        if (enq.isDraft || enq.status !== statusFilter) return false;
      }
      if (!q) return true;
      return [
        enq.enquiryCode,
        enq.studentName,
        enq.guardianName,
        enq.guardianPhone,
        enq.guardianEmail,
        enq.gradeApplied,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [enquiries, search, yearFilter, gradeFilter, sourceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sourceNames = useMemo(() => {
    const names = new Set(sources.map((s) => s.name));
    enquiries.forEach((e) => names.add(e.source));
    return Array.from(names);
  }, [sources, enquiries]);

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-[18px] bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] p-5 text-white shadow-sm">
        <h3 className="text-base font-extrabold">Enquiry List</h3>
        <p className="text-xs text-violet-100 mt-0.5">
          View, search, filter and manage all admission enquiries.
        </p>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.total}
          </p>
          <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Total Enquiries
          </p>
        </div>
        <div className="rounded-[16px] border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-[#112238]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.open}
          </p>
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">Open</p>
        </div>
        <div className="rounded-[16px] border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-[#2B210E]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.followUp}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Follow-up Due
          </p>
        </div>
        <div className="rounded-[16px] border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-[#0E2920]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.converted}
          </p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Converted
          </p>
        </div>
        <div className="rounded-[16px] border border-rose-200/80 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-[#2C1219]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {kpis.closed}
          </p>
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Closed</p>
        </div>
      </div>

      {/* Main Filter + Table Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by enquiry ID, parent name, student name, phone or email..."
            className="flex-1 min-w-[240px] rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3.5 py-2 text-xs text-[#1B1D45] placeholder:text-[#76799C] focus:border-[#7C3AED] focus:outline-none dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="rounded-xl border border-[#CAD0EB] px-3.5 py-2 text-xs font-bold text-[#6D28D9] hover:bg-[#F0EBFE] dark:border-[#313761] dark:text-violet-300 dark:hover:bg-[#23274D]"
          >
            Filters
          </button>
          {canExport && (
            <button
              type="button"
              onClick={onExportCsv}
              className="rounded-xl border border-[#CAD0EB] px-3.5 py-2 text-xs font-bold text-[#1B1D45] hover:bg-[#F5F7FD] dark:border-[#313761] dark:text-[#DCE1F9] dark:hover:bg-[#23274D]"
            >
              Export
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
                Academic Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              >
                <option value="all">All Academic Years</option>
                {availableAcademicYears.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
                Grade Interested
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              >
                <option value="all">All Grades</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              >
                <option value="all">All Sources</option>
                {sourceNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as "all" | AdmissionEnquiryStatusType | "DRAFT",
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              >
                <option value="all">All Status</option>
                <option value="NEW">Open</option>
                <option value="CONTACTED">Contacted</option>
                <option value="FOLLOW_UP">Follow-up Due</option>
                <option value="CONVERTED">Converted</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setYearFilter("all");
                  setGradeFilter("all");
                  setSourceFilter("all");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[#D6DBF0] px-3 py-1.5 text-xs font-bold text-[#6D28D9] hover:bg-[#F0EBFE] dark:border-[#313761] dark:text-violet-300 dark:hover:bg-[#23274D]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

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
                <th className="py-2.5 px-3">Follow-up Date</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No enquiries match the selected filters.
                  </td>
                </tr>
              ) : (
                paged.map((enq) => {
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
                        {enq.isDraft ? (
                          <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Draft
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                        {enq.nextFollowUpAt ? formatShortDate(enq.nextFollowUpAt) : "-"}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`View details for ${enq.enquiryCode}`}
                            onClick={() => onViewEnquiry(enq)}
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
                              aria-label={`Edit ${enq.enquiryCode}`}
                              onClick={() => onEditEnquiry(enq)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#4D5072] hover:bg-[#F0EBFE] hover:text-[#6D28D9] dark:text-[#9DA6CC] dark:hover:bg-[#252A4E]"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M13.58 3.58a2 2 0 112.83 2.83l-9.2 9.2-3.5.7.7-3.5 9.17-9.23z" />
                              </svg>
                            </button>
                          )}
                          <PortalActionMenu
                            ariaLabel={`Menu for ${enq.enquiryCode}`}
                            items={[
                              { label: "View Details", onClick: () => onViewEnquiry(enq) },
                              ...(canWrite
                                ? [
                                    { label: "Edit Enquiry", onClick: () => onEditEnquiry(enq) },
                                    {
                                      label: "Convert to Application",
                                      disabled:
                                        enq.isDraft ||
                                        enq.status === "CONVERTED" ||
                                        Boolean(enq.convertedApplicationId),
                                      onClick: () => void onConvertEnquiry(enq),
                                    },
                                    {
                                      label: "Mark Follow-up Due",
                                      disabled: enq.status === "CONVERTED",
                                      onClick: () => void onUpdateStatus(enq.id, "FOLLOW_UP"),
                                    },
                                    {
                                      label: "Mark Closed",
                                      disabled: enq.status === "CLOSED",
                                      danger: true,
                                      onClick: () => void onUpdateStatus(enq.id, "CLOSED"),
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9] dark:border-[#232746] text-xs text-[#4D5072] dark:text-[#9DA6CC]">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} –{" "}
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} enquiries
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
              aria-label="List rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
