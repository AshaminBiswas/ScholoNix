"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Eye,
  Pencil,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock3,
  XCircle,
  Filter,
  LayoutList,
  LayoutGrid,
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
  onEditApplication?: (app: AdmissionApplicationRecord) => void;
  onQuickUpdateApplication: (
    applicationId: string,
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => Promise<unknown>;
  onBulkUpdateApplications?: (
    applicationIds: string[],
    payload: {
      status?: AdmissionApplicationStatusType;
      verificationStatus?: DocumentVerificationStatusType;
    },
  ) => Promise<void>;
  canWrite: boolean;
  canVerify: boolean;
  title?: string;
  showEnhancedToolbar?: boolean;
  hideHeaderSearchBar?: boolean;
}

type SortKey = "applicationCode" | "studentName" | "gradeApplied" | "appliedAt";

const AVATAR_TONES = [
  "bg-[#EDE7FF] text-[#5B21B6] dark:bg-[#2A2056] dark:text-[#CBB8FF]",
  "bg-[#E0F2FE] text-[#0369A1] dark:bg-[#133252] dark:text-[#7DD3FC]",
  "bg-[#DCFCE7] text-[#15803D] dark:bg-[#123326] dark:text-[#6EE7B7]",
  "bg-[#FCE7F3] text-[#BE185D] dark:bg-[#3A1733] dark:text-[#F9A8D4]",
  "bg-[#FEF3C7] text-[#B45309] dark:bg-[#352611] dark:text-[#FCD34D]",
] as const;

function getStudentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

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
  onEditApplication,
  onQuickUpdateApplication,
  onBulkUpdateApplications,
  canWrite,
  canVerify,
  title = "Applications",
  showEnhancedToolbar = false,
  hideHeaderSearchBar = false,
}: AdmissionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("appliedAt");
  const [sortDir, setSortDir] = useState<"ascending" | "descending">("descending");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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
    if (targets.length === 0) return;
    setBulkMenuOpen(false);
    setBulkBusy(true);
    try {
      if (onBulkUpdateApplications) {
        await onBulkUpdateApplications(targets, payload);
      } else {
        for (const id of targets) {
          await onQuickUpdateApplication(id, payload);
        }
      }
      setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
    }
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

  const handleEditTrigger = (app: AdmissionApplicationRecord) => {
    if (onEditApplication) {
      onEditApplication(app);
    } else {
      onInspectApplication(app);
    }
  };

  return (
    <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
      {/* Enhanced Toolbar (Mockup layout for Application Management) or Standard Header */}
      {showEnhancedToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-2 rounded-[10px] border border-[#D6DBF0] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF]">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={toggleSelectAll}
                aria-label={`Select All (${pagination.total.toLocaleString("en-IN")})`}
                className="h-4 w-4 rounded border-[#CAD0EB] accent-[#663CF6] cursor-pointer"
              />
              <span>
                Select All ({pagination.total.toLocaleString("en-IN")})
              </span>
            </label>

            {(canWrite || canVerify) && (
              <div className="relative">
                <button
                  type="button"
                  disabled={selectedIds.size === 0 || bulkBusy}
                  onClick={() => setBulkMenuOpen((prev) => !prev)}
                  aria-expanded={bulkMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] shadow-2xs transition hover:border-[#663CF6] hover:text-[#663CF6] disabled:opacity-50 cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
                >
                  <span>
                    {selectedIds.size > 0
                      ? `Bulk Actions (${selectedIds.size})`
                      : "Bulk Actions"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                {bulkMenuOpen && selectedIds.size > 0 && (
                  <div
                    role="menu"
                    className="absolute left-0 top-10 z-30 w-48 rounded-[12px] border border-[#D6DBF0] bg-white p-1.5 shadow-xl dark:border-[#2E345B] dark:bg-[#141731] dark:shadow-black/60"
                  >
                    {canVerify && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleBulkAction({ verificationStatus: "VERIFIED" })}
                        className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                      >
                        Verify Documents
                      </button>
                    )}
                    {canWrite && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleBulkAction({ status: "SHORTLISTED" })}
                          className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-xs font-semibold text-[#5B21B6] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#CBB8FF] dark:hover:bg-[#231D4B]"
                        >
                          Shortlist Selected
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleBulkAction({ status: "ADMITTED" })}
                          className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                        >
                          Mark Admitted
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleBulkAction({ status: "DOCUMENTS_PENDING" })}
                          className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer dark:text-sky-300 dark:hover:bg-sky-950/50"
                        >
                          Mark Docs Pending
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleBulkAction({ status: "REJECTED" })}
                          className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer dark:text-rose-300 dark:hover:bg-rose-950/50"
                        >
                          Reject Selected
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSelectedIds(new Set());
                        setBulkMenuOpen(false);
                      }}
                      className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-xs font-semibold text-[#4D5072] hover:bg-slate-50 cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245]"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF]">
              <select
                aria-label="Show rows per page"
                value={pagination.pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-transparent font-bold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
              >
                <option value={10}>Show 10 per page</option>
                <option value={25}>Show 25 per page</option>
                <option value={50}>Show 50 per page</option>
              </select>
            </label>

            <div
              role="group"
              aria-label="View mode"
              className="inline-flex items-center rounded-[10px] border border-[#D6DBF0] bg-[#FAF8FE] p-0.5 dark:border-[#2E345B] dark:bg-[#10142C]"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Table list view"
                aria-pressed={viewMode === "list"}
                className={`inline-flex h-7 w-8 items-center justify-center rounded-[8px] transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#663CF6] text-white shadow-2xs"
                    : "text-[#4D5072] hover:text-[#663CF6] dark:text-[#9DA6CC] dark:hover:text-[#C4B5FD]"
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Card grid view"
                aria-pressed={viewMode === "grid"}
                className={`inline-flex h-7 w-8 items-center justify-center rounded-[8px] transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#663CF6] text-white shadow-2xs"
                    : "text-[#4D5072] hover:text-[#663CF6] dark:text-[#9DA6CC] dark:hover:text-[#C4B5FD]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Users className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2
              id="admissions-table-heading"
              className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]"
            >
              {title} ({pagination.total.toLocaleString("en-IN")})
            </h2>
          </div>

          {!hideHeaderSearchBar && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C] dark:text-[#9DA6CC]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search student name, application ID..."
                  aria-label="Search applications"
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] pl-8 pr-3 py-1.5 text-xs text-[#08093B] placeholder:text-[#76799C] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD] dark:focus:border-[#8B5CF6] dark:focus:bg-[#141731]"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]">
                <Filter className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
                <label htmlFor="verification-filter-select" className="sr-only">
                  Document Verification Filter
                </label>
                <select
                  id="verification-filter-select"
                  value={verificationFilter}
                  onChange={(e) =>
                    onVerificationFilterChange(
                      e.target.value as DocumentVerificationStatusType | "all",
                    )
                  }
                  className="bg-transparent text-xs font-semibold text-[#08093B] focus:outline-none cursor-pointer dark:text-[#F3F5FF] dark:[&>option]:bg-[#141731]"
                >
                  <option value="all">Verification: All</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contextual Bulk Action Strip when items are checked in standard header mode */}
      {!showEnhancedToolbar && selectedIds.size > 0 && (canWrite || canVerify) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#DDD6FE] bg-[#FAF8FE] px-3.5 py-2 text-xs dark:border-[#3D3170] dark:bg-[#1B183E]">
          <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
            {selectedIds.size} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {canVerify && (
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => handleBulkAction({ verificationStatus: "VERIFIED" })}
                className="rounded-[8px] bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-60"
              >
                Verify Docs
              </button>
            )}
            {canWrite && (
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => handleBulkAction({ status: "SHORTLISTED" })}
                className="rounded-[8px] bg-[#663CF6] px-2.5 py-1 font-bold text-white hover:bg-[#4F27E8] cursor-pointer disabled:opacity-60"
              >
                Shortlist Selected
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-[8px] border border-[#CAD0EB] bg-white px-2.5 py-1 font-semibold text-[#4D5072] hover:bg-slate-50 cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {showEnhancedToolbar && (
        <h2 id="admissions-table-heading" className="sr-only">
          {title} ({pagination.total.toLocaleString("en-IN")})
        </h2>
      )}

      {/* Grid View Mode */}
      {viewMode === "grid" ? (
        sortedRows.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-12 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
            <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
              No admission applications found
            </p>
            <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
              {searchQuery || verificationFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "Create your first admission application to begin tracking applicants."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {sortedRows.map((app, index) => {
              const statusMeta = ADMISSION_STATUS_META[app.status];
              const verMeta = DOCUMENT_VERIFICATION_META[app.verificationStatus];
              const tone = AVATAR_TONES[index % AVATAR_TONES.length]!;
              return (
                <article
                  key={app.id}
                  className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/60 p-4 space-y-3 transition hover:border-[#C4B5FD] dark:border-[#272B4D] dark:bg-[#10142C]/75 dark:hover:border-[#5D45B3]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleRow(app.id)}
                        aria-label={`Select ${app.studentName}`}
                        className="h-4 w-4 rounded border-[#CAD0EB] accent-[#663CF6] cursor-pointer"
                      />
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${tone}`}
                        aria-hidden="true"
                      >
                        {getStudentInitials(app.studentName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                          {app.studentName}
                        </p>
                        <button
                          type="button"
                          onClick={() => onInspectApplication(app)}
                          className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
                        >
                          {app.applicationCode}
                        </button>
                      </div>
                    </div>
                    <span className="rounded-lg border border-[#D6DBF0] bg-white px-2 py-0.5 text-[11px] font-bold text-[#4D5072] dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#C5CCF0]">
                      {app.gradeApplied}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
                    >
                      {statusMeta.label}
                    </span>
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
                  </div>

                  <div className="flex items-center justify-between border-t border-[#DFE3F5] pt-2.5 text-[11px] text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <span className="truncate">
                      {app.guardianName} · {app.guardianPhone}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onInspectApplication(app)}
                        aria-label={`Inspect ${app.studentName}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#C5CCF0]"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => handleEditTrigger(app)}
                          aria-label={`Edit ${app.studentName}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#C5CCF0]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        /* Semantic Scrollable Data Table */
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="admissions-table-heading"
          className="overflow-x-auto school-menu-scrollbar rounded-[14px] border border-[#DFE3F5] dark:border-[#272B4D]"
        >
          <table className="w-full min-w-[780px] text-left text-xs border-collapse">
            <caption className="sr-only">School admission applications directory</caption>
            <thead className="bg-[#F6F5FD] text-[11px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
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

            <tbody className="divide-y divide-[#F1F5F9] bg-white dark:divide-[#232746] dark:bg-[#141731]">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      No admission applications found
                    </p>
                    <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                      {searchQuery || verificationFilter !== "all"
                        ? "Try adjusting your search query or filters."
                        : "Create your first admission application to begin tracking applicants."}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedRows.map((app, index) => {
                  const statusMeta = ADMISSION_STATUS_META[app.status];
                  const verMeta = DOCUMENT_VERIFICATION_META[app.verificationStatus];
                  const isBusy = busyRowId === app.id;
                  const avatarTone = AVATAR_TONES[index % AVATAR_TONES.length]!;
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-[#FAF8FE] transition dark:hover:bg-[#1B2042]"
                    >
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
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${avatarTone}`}
                            aria-hidden="true"
                          >
                            {getStudentInitials(app.studentName)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onInspectApplication(app)}
                            className="text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
                          >
                            {app.applicationCode}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          {app.studentName}
                        </div>
                        <div className="text-[11px] text-[#76799C] truncate max-w-[200px] dark:text-[#9DA6CC]">
                          Guardian: {app.guardianName}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#4D5072] dark:text-[#C5CCF0]">
                        {app.gradeApplied}
                      </td>
                      <td className="px-3 py-3 text-[#4D5072] dark:text-[#9DA6CC]">
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6] dark:hover:text-[#D9CEFF]"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>

                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => handleEditTrigger(app)}
                              aria-label={`Edit ${app.studentName}`}
                              title="Edit Application"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6] dark:hover:text-[#D9CEFF]"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}

                          {(canWrite || canVerify) && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                setOpenMenuId((prev) => (prev === app.id ? null : app.id))
                              }
                              aria-label={`More actions for ${app.studentName}`}
                              aria-expanded={openMenuId === app.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer disabled:opacity-50 dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6] dark:hover:text-[#D9CEFF]"
                            >
                              <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}

                          {openMenuId === app.id && (
                            <div className="absolute right-0 top-9 z-30 w-44 rounded-[12px] border border-[#D6DBF0] bg-white p-1.5 text-left shadow-xl dark:border-[#2E345B] dark:bg-[#141731] dark:shadow-black/60">
                              {canVerify && app.verificationStatus !== "VERIFIED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickAction(app.id, { verificationStatus: "VERIFIED" })
                                  }
                                  className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                                >
                                  Mark Docs Verified
                                </button>
                              )}
                              {canWrite && app.status !== "SHORTLISTED" && app.status !== "ADMITTED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickAction(app.id, { status: "SHORTLISTED" })
                                  }
                                  className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#CBB8FF] dark:hover:bg-[#231D4B]"
                                >
                                  Shortlist Applicant
                                </button>
                              )}
                              {canWrite && app.status !== "ADMITTED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickAction(app.id, { status: "ADMITTED" })
                                  }
                                  className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer dark:text-emerald-300 dark:hover:bg-emerald-950/50"
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
                                  className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer dark:text-sky-300 dark:hover:bg-sky-950/50"
                                >
                                  Mark Docs Pending
                                </button>
                              )}
                              {canWrite && app.status !== "REJECTED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickAction(app.id, { status: "REJECTED" })
                                  }
                                  className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer dark:text-rose-300 dark:hover:bg-rose-950/50"
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
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] disabled:opacity-40 cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {pageNumbers.map((pageNum, idx) => {
              const prev = pageNumbers[idx - 1];
              const showEllipsis = prev !== undefined && pageNum - prev > 1;
              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && (
                    <span className="px-1 text-[#76799C] dark:text-[#9DA6CC]">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    aria-current={pagination.page === pageNum ? "page" : undefined}
                    className={`inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                      pagination.page === pageNum
                        ? "border-[#663CF6] bg-[#663CF6] text-white"
                        : "border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] disabled:opacity-40 cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-2">
            <label htmlFor="rows-per-page-select" className="text-[#76799C] dark:text-[#9DA6CC]">
              Rows per page:
            </label>
            <select
              id="rows-per-page-select"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-[#D6DBF0] bg-white px-2 py-1 text-xs font-bold text-[#08093B] focus:border-[#663CF6] focus:outline-none cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
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
