"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Eye,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock3,
  XCircle,
  Filter,
} from "lucide-react";
import {
  ADMISSION_STATUS_META,
  DOCUMENT_VERIFICATION_META,
  type AdmissionApplicationRecord,
  type AdmissionApplicationStatusType,
  type DocumentVerificationStatusType,
} from "@/modules/school/admissions/types";

interface AdmissionsTableProps {
  applications: AdmissionApplicationRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  searchQuery: string;
  onSearchChange: (q: string) => void;
  verificationFilter: DocumentVerificationStatusType | "all";
  onVerificationFilterChange: (v: DocumentVerificationStatusType | "all") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onInspectApplication: (app: AdmissionApplicationRecord) => void;
  onQuickUpdateApplication: (
    applicationId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => Promise<void>;
  onOpenNewApplication?: () => void;
  canWrite: boolean;
  canVerify: boolean;
  title?: string;
}

type SortKey = "applicationCode" | "studentName" | "gradeApplied" | "appliedAt";

export function AdmissionsTable({
  applications,
  pagination,
  searchQuery,
  onSearchChange,
  verificationFilter,
  onVerificationFilterChange,
  onPageChange,
  onPageSizeChange,
  onInspectApplication,
  onQuickUpdateApplication,
  onOpenNewApplication,
  canWrite,
  canVerify,
  title = "Applications",
}: AdmissionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("appliedAt");
  const [sortDir, setSortDir] = useState<"ascending" | "descending">("descending");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  const sortedRows = useMemo(() => {
    const copy = [...applications];
    const factor = sortDir === "ascending" ? 1 : -1;
    copy.sort((a, b) => {
      if (sortKey === "appliedAt") {
        return factor * (Date.parse(a.appliedAt) - Date.parse(b.appliedAt));
      }
      return factor * collator.compare(a[sortKey], b[sortKey]);
    });
    return copy;
  }, [applications, sortKey, sortDir, collator]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "ascending" ? "descending" : "ascending"));
    } else {
      setSortKey(key);
      setSortDir("ascending");
    }
  };

  const allOnPageSelected =
    sortedRows.length > 0 && sortedRows.every((row) => selectedIds.has(row.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRows.map((r) => r.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuickAction = async (
    appId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => {
    setOpenMenuId(null);
    setBusyRowId(appId);
    try {
      await onQuickUpdateApplication(appId, payload);
    } finally {
      setBusyRowId(null);
    }
  };

  const handleBulkAction = async (payload: {
    status?: AdmissionApplicationStatusType;
    verificationStatus?: DocumentVerificationStatusType;
  }) => {
    const targets = Array.from(selectedIds);
    for (const id of targets) {
      await onQuickUpdateApplication(id, payload);
    }
    setSelectedIds(new Set());
  };

  const startIndex = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endIndex = Math.min(pagination.total, pagination.page * pagination.pageSize);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const total = pagination.totalPages;
    const current = pagination.page;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i);
      }
    }
    return pages;
  }, [pagination.page, pagination.totalPages]);

  return (
    <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6]">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 id="admissions-table-heading" className="text-base font-extrabold text-[#08093B]">
            {title} ({pagination.total.toLocaleString("en-IN")})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search student name, application ID..."
              aria-label="Search applications"
              className="w-full rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] pl-8 pr-3 py-1.5 text-xs text-[#08093B] placeholder:text-[#76799C] focus:border-[#663CF6] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-[#663CF6]" aria-hidden="true" />
            <label htmlFor="verification-filter-select" className="sr-only">
              Document Verification Filter
            </label>
            <select
              id="verification-filter-select"
              value={verificationFilter}
              onChange={(e) =>
                onVerificationFilterChange(e.target.value as DocumentVerificationStatusType | "all")
              }
              className="bg-transparent text-xs font-semibold text-[#08093B] focus:outline-none cursor-pointer"
            >
              <option value="all">Verification: All</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Strip */}
      {selectedIds.size > 0 && (canWrite || canVerify) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#DDD6FE] bg-[#FAF8FE] px-3.5 py-2 text-xs">
          <span className="font-bold text-[#08093B]">{selectedIds.size} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            {canVerify && (
              <button
                type="button"
                onClick={() => handleBulkAction({ verificationStatus: "VERIFIED" })}
                className="rounded-[8px] bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700 cursor-pointer"
              >
                Verify Docs
              </button>
            )}
            {canWrite && (
              <button
                type="button"
                onClick={() => handleBulkAction({ status: "SHORTLISTED" })}
                className="rounded-[8px] bg-[#663CF6] px-2.5 py-1 font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
              >
                Shortlist Selected
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1 font-semibold text-[#4D5072] hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Semantic Scrollable Data Table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="admissions-table-heading"
        className="overflow-x-auto school-menu-scrollbar rounded-[14px] border border-[#DFE3F5]"
      >
        <table className="w-full min-w-[780px] text-left text-xs border-collapse">
          <caption className="sr-only">School admission applications directory</caption>
          <thead className="bg-[#F6F5FD] text-[11px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5]">
            <tr>
              <th scope="col" className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all applications on page"
                  className="h-4 w-4 rounded border-[#CAD0EB] accent-[#663CF6] cursor-pointer"
                />
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "applicationCode" ? sortDir : undefined}
                className="p-0"
              >
                <button
                  type="button"
                  onClick={() => handleSort("applicationCode")}
                  className="flex w-full items-center gap-1 px-3 py-3 text-left font-bold uppercase tracking-wider hover:text-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] cursor-pointer"
                >
                  <span>Application ID</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" aria-hidden="true" />
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "studentName" ? sortDir : undefined}
                className="p-0"
              >
                <button
                  type="button"
                  onClick={() => handleSort("studentName")}
                  className="flex w-full items-center gap-1 px-3 py-3 text-left font-bold uppercase tracking-wider hover:text-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] cursor-pointer"
                >
                  <span>Student Name</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" aria-hidden="true" />
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "gradeApplied" ? sortDir : undefined}
                className="p-0"
              >
                <button
                  type="button"
                  onClick={() => handleSort("gradeApplied")}
                  className="flex w-full items-center gap-1 px-3 py-3 text-left font-bold uppercase tracking-wider hover:text-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] cursor-pointer"
                >
                  <span>Grade Applied</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" aria-hidden="true" />
                </button>
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "appliedAt" ? sortDir : undefined}
                className="p-0"
              >
                <button
                  type="button"
                  onClick={() => handleSort("appliedAt")}
                  className="flex w-full items-center gap-1 px-3 py-3 text-left font-bold uppercase tracking-wider hover:text-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] cursor-pointer"
                >
                  <span>Application Date</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-3 py-3">
                Status
              </th>
              <th scope="col" className="px-3 py-3">
                Verification
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F5F9] bg-white">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-sm font-bold text-[#08093B]">
                    No admission applications found
                  </p>
                  <p className="mt-1 text-xs text-[#76799C]">
                    {searchQuery || verificationFilter !== "all"
                      ? "Try adjusting your search query or filters."
                      : "Create your first admission application to begin tracking applicants."}
                  </p>
                  {onOpenNewApplication && canWrite && !searchQuery && (
                    <button
                      type="button"
                      onClick={onOpenNewApplication}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4F27E8] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>New Application</span>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              sortedRows.map((app) => {
                const statusMeta = ADMISSION_STATUS_META[app.status];
                const verMeta = DOCUMENT_VERIFICATION_META[app.verificationStatus];
                const isBusy = busyRowId === app.id;
                return (
                  <tr key={app.id} className="hover:bg-[#FAF8FE] transition">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleRow(app.id)}
                        aria-label={`Select ${app.studentName}`}
                        className="h-4 w-4 rounded border-[#CAD0EB] accent-[#663CF6] cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 font-bold">
                      <button
                        type="button"
                        onClick={() => onInspectApplication(app)}
                        className="text-[#663CF6] hover:underline cursor-pointer"
                      >
                        {app.applicationCode}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-[#08093B]">{app.studentName}</div>
                      <div className="text-[11px] text-[#76799C] truncate max-w-[200px]">
                        Guardian: {app.guardianName}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#4D5072]">{app.gradeApplied}</td>
                    <td className="px-3 py-3 text-[#4D5072]">
                      <time dateTime={app.appliedAt}>
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Kolkata",
                        }).format(new Date(app.appliedAt))}
                      </time>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${verMeta.bgClass} ${verMeta.textClass} ${verMeta.borderClass}`}
                      >
                        {app.verificationStatus === "VERIFIED" ? (
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        ) : app.verificationStatus === "REJECTED" ? (
                          <XCircle className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Clock3 className="h-3 w-3" aria-hidden="true" />
                        )}
                        <span>{verMeta.label}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="relative inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onInspectApplication(app)}
                          aria-label={`Inspect ${app.studentName}`}
                          title="Inspect & Verify"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        {(canWrite || canVerify) && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              setOpenMenuId((prev) => (prev === app.id ? null : app.id))
                            }
                            aria-label={`More actions for ${app.studentName}`}
                            aria-expanded={openMenuId === app.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer disabled:opacity-50"
                          >
                            <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}

                        {openMenuId === app.id && (
                          <div className="absolute right-0 top-9 z-30 w-44 rounded-[12px] border border-[#D6DBF0] bg-white p-1.5 text-left shadow-xl">
                            {canVerify && app.verificationStatus !== "VERIFIED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAction(app.id, { verificationStatus: "VERIFIED" })
                                }
                                className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                              >
                                Mark Docs Verified
                              </button>
                            )}
                            {canWrite && app.status !== "SHORTLISTED" && app.status !== "ADMITTED" && (
                              <button
                                type="button"
                                onClick={() => handleQuickAction(app.id, { status: "SHORTLISTED" })}
                                className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#FAF8FE] cursor-pointer"
                              >
                                Shortlist Applicant
                              </button>
                            )}
                            {canWrite && app.status !== "ADMITTED" && (
                              <button
                                type="button"
                                onClick={() => handleQuickAction(app.id, { status: "ADMITTED" })}
                                className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                              >
                                Mark Admitted
                              </button>
                            )}
                            {canWrite && app.status !== "DOCUMENTS_PENDING" && app.status !== "ADMITTED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAction(app.id, { status: "DOCUMENTS_PENDING" })
                                }
                                className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer"
                              >
                                Mark Docs Pending
                              </button>
                            )}
                            {canWrite && app.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => handleQuickAction(app.id, { status: "REJECTED" })}
                                className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                              >
                                Reject Application
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-[#4D5072]">
        <p>
          Showing <strong>{startIndex}</strong> – <strong>{endIndex}</strong> of{" "}
          <strong>{pagination.total.toLocaleString("en-IN")}</strong> applications
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              aria-label="Previous page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {pageNumbers.map((pageNum, idx) => {
              const prev = pageNumbers[idx - 1];
              const showEllipsis = prev !== undefined && pageNum - prev > 1;
              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && <span className="px-1 text-[#76799C]">…</span>}
                  <button
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    aria-current={pagination.page === pageNum ? "page" : undefined}
                    className={`inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                      pagination.page === pageNum
                        ? "border-[#663CF6] bg-[#663CF6] text-white"
                        : "border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6]"
                    }`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              );
            })}
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              aria-label="Next page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-2">
            <label htmlFor="rows-per-page-select" className="text-[#76799C]">
              Rows per page:
            </label>
            <select
              id="rows-per-page-select"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-[#D6DBF0] bg-white px-2 py-1 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
