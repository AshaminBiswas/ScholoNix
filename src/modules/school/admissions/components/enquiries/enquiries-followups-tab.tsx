"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionEnquiryFollowUpRecord,
  AdmissionEnquiryRecord,
  EnquiryFollowUpStatusValue,
  EnquiryFollowUpTypeValue,
  SchoolStaffOption,
} from "@/modules/school/admissions/types";
import {
  EnquiriesDonutChart,
  FOLLOW_UP_STATUS_META,
  FOLLOW_UP_TIME_SLOTS,
  FOLLOW_UP_TYPE_OPTIONS,
  PortalActionMenu,
  formatDateTimeIst,
  type DonutSlice,
} from "./enquiry-shared";

interface EnquiriesFollowUpsTabProps {
  enquiries: AdmissionEnquiryRecord[];
  followUps: AdmissionEnquiryFollowUpRecord[];
  availableAcademicYears: string[];
  staffOptions: SchoolStaffOption[];
  canWrite: boolean;
  onViewEnquiryById: (enquiryId: string) => void;
  onScheduleFollowUp: (
    enquiryId: string,
    payload: {
      followUpType: EnquiryFollowUpTypeValue;
      scheduledAt: string;
      assignedToUserId?: string | null;
      assignedToName?: string | null;
      notes: string;
    },
  ) => Promise<void>;
  onUpdateFollowUpStatus: (
    enquiryId: string,
    followUpId: string,
    status: EnquiryFollowUpStatusValue,
  ) => Promise<void>;
}

export function EnquiriesFollowUpsTab({
  enquiries,
  followUps,
  availableAcademicYears,
  staffOptions,
  canWrite,
  onViewEnquiryById,
  onScheduleFollowUp,
  onUpdateFollowUpStatus,
}: EnquiriesFollowUpsTabProps) {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryFollowUpStatusValue>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EnquiryFollowUpTypeValue>("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Schedule form state
  const [targetEnquiryId, setTargetEnquiryId] = useState("");
  const [followUpType, setFollowUpType] = useState<EnquiryFollowUpTypeValue>("Phone Call");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:30");
  const [assignStaffId, setAssignStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const selectedEnquiry = useMemo(
    () => enquiries.find((e) => e.id === targetEnquiryId) ?? null,
    [enquiries, targetEnquiryId],
  );

  const stats = useMemo(() => {
    const total = followUps.length;
    const upcoming = followUps.filter((f) => f.status === "UPCOMING").length;
    const dueToday = followUps.filter((f) => f.status === "DUE_TODAY").length;
    const completed = followUps.filter((f) => f.status === "COMPLETED").length;
    const overdue = followUps.filter((f) => f.status === "OVERDUE").length;
    return { total, upcoming, dueToday, completed, overdue };
  }, [followUps]);

  const insightSlices = useMemo<DonutSlice[]>(() => {
    const t = stats.total;
    if (t === 0) return [];
    return [
      {
        label: "Upcoming",
        count: stats.upcoming,
        percentage: (stats.upcoming / t) * 100,
        color: FOLLOW_UP_STATUS_META.UPCOMING.color,
      },
      {
        label: "Due Today",
        count: stats.dueToday,
        percentage: (stats.dueToday / t) * 100,
        color: FOLLOW_UP_STATUS_META.DUE_TODAY.color,
      },
      {
        label: "Completed",
        count: stats.completed,
        percentage: (stats.completed / t) * 100,
        color: FOLLOW_UP_STATUS_META.COMPLETED.color,
      },
      {
        label: "Overdue",
        count: stats.overdue,
        percentage: (stats.overdue / t) * 100,
        color: FOLLOW_UP_STATUS_META.OVERDUE.color,
      },
    ];
  }, [stats]);

  const staffNames = useMemo(() => {
    const set = new Set<string>();
    followUps.forEach((f) => {
      if (f.assignedToName) set.add(f.assignedToName);
    });
    staffOptions.forEach((s) => set.add(s.name));
    return Array.from(set).sort();
  }, [followUps, staffOptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return followUps.filter((f) => {
      if (yearFilter !== "all" && f.academicYear && f.academicYear !== yearFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (typeFilter !== "all" && f.followUpType !== typeFilter) return false;
      if (staffFilter !== "all" && f.assignedToName !== staffFilter) return false;
      if (!q) return true;
      return [f.enquiryCode, f.studentName, f.guardianName, f.notes, f.assignedToName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [followUps, search, yearFilter, statusFilter, typeFilter, staffFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const upcomingQueue = useMemo(
    () =>
      followUps
        .filter((f) => f.status === "UPCOMING" || f.status === "DUE_TODAY")
        .slice(0, 4),
    [followUps],
  );

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!targetEnquiryId || !followUpDate || !notes.trim()) {
      setFormError("Please select an enquiry, follow-up date, and notes.");
      return;
    }
    const staff = staffOptions.find((s) => s.id === assignStaffId);
    const iso = new Date(`${followUpDate}T${followUpTime}:00+05:30`).toISOString();
    setSubmitting(true);
    try {
      await onScheduleFollowUp(targetEnquiryId, {
        followUpType,
        scheduledAt: iso,
        assignedToUserId: staff?.id || null,
        assignedToName: staff?.name || null,
        notes: notes.trim(),
      });
      setTargetEnquiryId("");
      setFollowUpDate("");
      setNotes("");
      setFormSuccess("Follow-up scheduled successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to schedule follow-up.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] p-5 text-white shadow-sm">
        <h3 className="text-base font-extrabold">Follow-ups</h3>
        <p className="text-xs text-violet-100 mt-0.5">
          Schedule, track, and manage all enquiry follow-ups.
        </p>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.total}
          </p>
          <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Total Follow-ups
          </p>
        </div>
        <div className="rounded-[16px] border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-[#112238]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.upcoming}
          </p>
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">Upcoming</p>
        </div>
        <div className="rounded-[16px] border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-[#2B210E]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.dueToday}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Due Today</p>
        </div>
        <div className="rounded-[16px] border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-[#0E2920]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.completed}
          </p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Completed
          </p>
        </div>
        <div className="rounded-[16px] border border-rose-200/80 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-[#2C1219]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {stats.overdue}
          </p>
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Overdue</p>
        </div>
      </div>

      {/* Filters & Follow-ups Table */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by enquiry ID, parent name, student name..."
            className="flex-1 min-w-[240px] rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3.5 py-2 text-xs text-[#1B1D45] placeholder:text-[#76799C] focus:border-[#7C3AED] focus:outline-none dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setYearFilter("all");
              setStatusFilter("all");
              setTypeFilter("all");
              setStaffFilter("all");
              setPage(1);
            }}
            className="rounded-xl border border-[#D6DBF0] px-3.5 py-2 text-xs font-bold text-[#6D28D9] hover:bg-[#F0EBFE] dark:border-[#313761] dark:text-violet-300 dark:hover:bg-[#23274D]"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
              Academic Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
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
              Follow-up Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | EnquiryFollowUpStatusValue)
              }
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="all">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="DUE_TODAY">Due Today</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
              Follow-up Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | EnquiryFollowUpTypeValue)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="all">All Types</option>
              {FOLLOW_UP_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC] mb-1">
              Assigned To
            </label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="all">All Staff</option>
              {staffNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE3F5] text-[11px] uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2.5 pr-3">Enquiry ID</th>
                <th className="py-2.5 px-3">Parent / Enquirer Name</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Follow-up Type</th>
                <th className="py-2.5 px-3">Follow-up Date &amp; Time</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Assigned To</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No follow-ups scheduled yet.
                  </td>
                </tr>
              ) : (
                paged.map((fu) => {
                  const meta = FOLLOW_UP_STATUS_META[fu.status];
                  return (
                    <tr
                      key={fu.id}
                      className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#1A1E3D]/70 transition-colors"
                    >
                      <td className="py-3 pr-3 font-bold text-[#6D28D9] dark:text-violet-300">
                        <button
                          type="button"
                          onClick={() => onViewEnquiryById(fu.enquiryId)}
                          className="hover:underline"
                        >
                          {fu.enquiryCode || "Enquiry"}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
                        {fu.guardianName || "—"}
                      </td>
                      <td className="py-3 px-3 text-[#4D5072] dark:text-[#BAC2E2]">
                        {fu.studentName || "—"}
                      </td>
                      <td className="py-3 px-3 text-[#1B1D45] dark:text-[#DCE1F9]">
                        {fu.followUpType}
                      </td>
                      <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                        {formatDateTimeIst(fu.scheduledAt)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                        {fu.assignedToName || "Unassigned"}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label="View enquiry"
                            onClick={() => onViewEnquiryById(fu.enquiryId)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300 dark:hover:bg-[#252A4E]"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10 4.5c-4.17 0-7.63 2.57-9 5.5 1.37 2.93 4.83 5.5 9 5.5s7.63-2.57 9-5.5c-1.37-2.93-4.83-5.5-9-5.5zm0 8.83A3.33 3.33 0 1110 6.67a3.33 3.33 0 010 6.66z" />
                              <circle cx="10" cy="10" r="1.8" />
                            </svg>
                          </button>
                          <PortalActionMenu
                            ariaLabel={`Follow-up menu ${fu.id}`}
                            items={[
                              {
                                label: "View Enquiry",
                                onClick: () => onViewEnquiryById(fu.enquiryId),
                              },
                              ...(canWrite
                                ? [
                                    {
                                      label: "Mark Completed",
                                      disabled: fu.status === "COMPLETED",
                                      onClick: () =>
                                        void onUpdateFollowUpStatus(
                                          fu.enquiryId,
                                          fu.id,
                                          "COMPLETED",
                                        ),
                                    },
                                    {
                                      label: "Cancel Follow-up",
                                      disabled: fu.status === "CANCELLED",
                                      danger: true,
                                      onClick: () =>
                                        void onUpdateFollowUpStatus(
                                          fu.enquiryId,
                                          fu.id,
                                          "CANCELLED",
                                        ),
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
          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-[#232746] text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            <span>
              Showing {(safePage - 1) * pageSize + 1} –{" "}
              {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} follow-ups
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
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Bottom 2-Col Row: Schedule New Follow-up + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Schedule New Follow-up
          </h3>
          <form onSubmit={handleScheduleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Enquiry ID <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetEnquiryId}
                  onChange={(e) => setTargetEnquiryId(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  <option value="">Select enquiry</option>
                  {enquiries
                    .filter((e) => !e.isDraft && e.status !== "CLOSED")
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.enquiryCode} — {e.studentName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedEnquiry?.studentName || "—"}
                  className="w-full rounded-xl border border-[#E5E9F8] bg-[#F5F7FD] px-3 py-2 text-xs text-[#4D5072] dark:border-[#2A2F54] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Parent / Enquirer Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedEnquiry?.guardianName || "—"}
                  className="w-full rounded-xl border border-[#E5E9F8] bg-[#F5F7FD] px-3 py-2 text-xs text-[#4D5072] dark:border-[#2A2F54] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Follow-up Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value as EnquiryFollowUpTypeValue)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  {FOLLOW_UP_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Follow-up Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Follow-up Time <span className="text-rose-500">*</span>
                </label>
                <select
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  {FOLLOW_UP_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Assign To
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  <option value="">Assign to me</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Follow-up Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, discussion points or next steps..."
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              />
              <div className="text-right text-[10px] text-[#76799C] dark:text-[#8A94B8]">
                {notes.length} / 500
              </div>
            </div>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {formSuccess}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetEnquiryId("");
                  setFollowUpDate("");
                  setNotes("");
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:text-[#DCE1F9]"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!canWrite || submitting}
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? "Scheduling..." : "Schedule Follow-up"}
              </button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Follow-up Insights
          </h3>
          <EnquiriesDonutChart
            centerValue={stats.total}
            centerLabel="Follow-ups"
            slices={insightSlices}
            emptyLabel="No follow-up analytics available yet"
          />

          <div className="pt-3 border-t border-[#F1F5F9] dark:border-[#232746] space-y-2">
            <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Upcoming Follow-ups
            </h4>
            {upcomingQueue.length === 0 ? (
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                No upcoming follow-ups scheduled.
              </p>
            ) : (
              upcomingQueue.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onViewEnquiryById(u.enquiryId)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E5E9F8] px-3 py-2 text-left text-xs hover:border-[#9B76FF] dark:border-[#272B4D] dark:hover:border-violet-500/60"
                >
                  <span className="truncate font-semibold text-[#6D28D9] dark:text-violet-300">
                    {u.enquiryCode} — {u.studentName}
                  </span>
                  <span className="shrink-0 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                    {formatDateTimeIst(u.scheduledAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
