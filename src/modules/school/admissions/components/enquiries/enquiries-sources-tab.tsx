"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
} from "@/modules/school/admissions/types";
import {
  EnquiriesDonutChart,
  PortalActionMenu,
  getSourceColorMeta,
  type DonutSlice,
} from "./enquiry-shared";

interface EnquiriesSourcesTabProps {
  enquiries: AdmissionEnquiryRecord[];
  sources: AdmissionEnquirySourceRecord[];
  canWrite: boolean;
  onCreateSource: (payload: {
    name: string;
    description: string;
    isActive: boolean;
    colorToken: "violet" | "sky" | "cyan" | "emerald" | "amber" | "indigo" | "rose";
  }) => Promise<void>;
  onUpdateSource: (payload: {
    id: string;
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onDeleteSource: (sourceId: string) => Promise<void>;
  onFilterBySource: (sourceName: string) => void;
}

export function EnquiriesSourcesTab({
  enquiries,
  sources,
  canWrite,
  onCreateSource,
  onUpdateSource,
  onDeleteSource,
  onFilterBySource,
}: EnquiriesSourcesTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Add New Source form state
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState<"active" | "inactive">("active");
  const [newColor, setNewColor] = useState<
    "violet" | "sky" | "cyan" | "emerald" | "amber" | "indigo" | "rose"
  >("violet");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const submittedEnquiries = useMemo(
    () => enquiries.filter((e) => !e.isDraft),
    [enquiries],
  );

  const sourceMetrics = useMemo(() => {
    return sources.map((src) => {
      const matching = submittedEnquiries.filter(
        (e) => e.source.toLowerCase() === src.name.toLowerCase(),
      );
      const total = matching.length;
      const converted = matching.filter((e) => e.status === "CONVERTED").length;
      const conversionRate = total > 0 ? (converted / total) * 100 : 0;
      return {
        ...src,
        total,
        converted,
        conversionRate,
      };
    });
  }, [sources, submittedEnquiries]);

  const totals = useMemo(() => {
    const totalEnq = submittedEnquiries.length;
    const activeSources = sources.filter((s) => s.isActive).length;
    const totalConverted = submittedEnquiries.filter((e) => e.status === "CONVERTED").length;
    const overallConv = totalEnq > 0 ? (totalConverted / totalEnq) * 100 : 0;
    const byCount = [...sourceMetrics].sort((a, b) => b.total - a.total);
    const byConv = [...sourceMetrics]
      .filter((s) => s.total > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate);
    return {
      totalEnq,
      activeSources,
      overallConv,
      topSource: byCount[0] ?? null,
      bestConversion: byConv[0] ?? null,
      lowestConversion: byConv[byConv.length - 1] ?? null,
    };
  }, [submittedEnquiries, sources, sourceMetrics]);

  const donutSlices = useMemo<DonutSlice[]>(() => {
    const total = totals.totalEnq;
    if (total === 0) return [];
    return sourceMetrics
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((s) => ({
        label: s.name,
        count: s.total,
        percentage: (s.total / total) * 100,
        color: getSourceColorMeta(s.name, s.colorToken).hex,
      }));
  }, [sourceMetrics, totals.totalEnq]);

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sourceMetrics.filter((s) => {
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      if (!q) return true;
      return `${s.name} ${s.description || ""}`.toLowerCase().includes(q);
    });
  }, [sourceMetrics, search, statusFilter]);

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!newName.trim()) {
      setFormError("Source name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreateSource({
        name: newName.trim(),
        description: newDesc.trim(),
        isActive: newStatus === "active",
        colorToken: newColor,
      });
      setNewName("");
      setNewDesc("");
      setNewStatus("active");
      setFormSuccess("Source added successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save source.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#6366F1] p-5 text-white shadow-sm">
        <h3 className="text-base font-extrabold">Enquiry Sources</h3>
        <p className="text-xs text-violet-100 mt-0.5">
          Manage enquiry sources, track source-wise performance, and measure conversion.
        </p>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {totals.totalEnq}
          </p>
          <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Total Enquiries
          </p>
        </div>
        <div className="rounded-[16px] border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-[#112238]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {totals.activeSources}
          </p>
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">Active Sources</p>
        </div>
        <div className="rounded-[16px] border border-emerald-200/80 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-[#0E2920]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {totals.overallConv.toFixed(1)}%
          </p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Overall Conversion
          </p>
        </div>
        <div className="rounded-[16px] border border-[#DFD8FA] bg-[#F7F3FF] p-3.5 dark:border-[#2F295C] dark:bg-[#1B173D]">
          <p className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF] truncate">
            {totals.topSource?.name || "—"}
          </p>
          <p className="text-[11px] font-semibold text-[#5B4B9A] dark:text-violet-300">
            Top Source
          </p>
        </div>
        <div className="rounded-[16px] border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-[#2B210E]">
          <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
            {totals.bestConversion ? `${totals.bestConversion.conversionRate.toFixed(1)}%` : "—"}
          </p>
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 truncate">
            Best Conversion {totals.bestConversion ? `(${totals.bestConversion.name})` : ""}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Enquiries by Source
          </h3>
          <EnquiriesDonutChart
            centerValue={totals.totalEnq}
            centerLabel="Enquiries"
            slices={donutSlices}
          />
        </section>

        <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            Source-wise Conversion Rate
          </h3>
          {sourceMetrics.filter((s) => s.total > 0).length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No conversion data yet
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40 pt-5 px-2">
              {sourceMetrics.slice(0, 6).map((s) => (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                    {s.conversionRate.toFixed(1)}%
                  </span>
                  <div className="w-full max-w-[42px] h-24 rounded-t-lg bg-[#F0EBFE] dark:bg-[#1E2246] flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#7C3AED] to-[#A78BFA] transition-all"
                      style={{
                        height: `${Math.max(4, Math.min(100, s.conversionRate))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[#4D5072] dark:text-[#9DA6CC] truncate max-w-full text-center">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Source List Table */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Source List ({filteredSources.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search source by name..."
              className="w-56 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE3F5] text-[11px] uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2.5 pr-3">Source Name</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Enquiries</th>
                <th className="py-2.5 px-3 text-right">Converted</th>
                <th className="py-2.5 px-3 text-right">Conversion Rate</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
              {filteredSources.map((src) => {
                const isEditing = editingId === src.id;
                return (
                  <tr
                    key={src.id}
                    className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#1A1E3D]/70 transition-colors"
                  >
                    <td className="py-3 pr-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-36 rounded-lg border border-[#7C3AED] bg-white px-2 py-1 text-xs dark:bg-[#1A1F3D]"
                        />
                      ) : (
                        src.name
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                        />
                      ) : (
                        src.description || "—"
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">{src.total}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{src.converted}</td>
                    <td className="py-3 px-3 text-right font-semibold tabular-nums">
                      {src.conversionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          src.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {src.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdateSource({
                                  id: src.id,
                                  name: editName.trim() || src.name,
                                  description: editDesc.trim(),
                                });
                                setEditingId(null);
                              }}
                              className="rounded-lg bg-[#6D28D9] px-2.5 py-1 text-[11px] font-bold text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-[#D6DBF0] px-2 py-1 text-[11px] font-semibold dark:border-[#313761]"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              aria-label={`View enquiries from ${src.name}`}
                              onClick={() => onFilterBySource(src.name)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300 dark:hover:bg-[#252A4E]"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 4.5c-4.17 0-7.63 2.57-9 5.5 1.37 2.93 4.83 5.5 9 5.5s7.63-2.57 9-5.5c-1.37-2.93-4.83-5.5-9-5.5zm0 8.83A3.33 3.33 0 1110 6.67a3.33 3.33 0 010 6.66z" />
                                <circle cx="10" cy="10" r="1.8" />
                              </svg>
                            </button>
                            <PortalActionMenu
                              ariaLabel={`Actions for ${src.name}`}
                              items={[
                                {
                                  label: "View Enquiries",
                                  onClick: () => onFilterBySource(src.name),
                                },
                                ...(canWrite
                                  ? [
                                      {
                                        label: "Edit Source",
                                        onClick: () => {
                                          setEditingId(src.id);
                                          setEditName(src.name);
                                          setEditDesc(src.description || "");
                                        },
                                      },
                                      {
                                        label: src.isActive ? "Mark Inactive" : "Activate",
                                        onClick: () =>
                                          void onUpdateSource({
                                            id: src.id,
                                            isActive: !src.isActive,
                                          }),
                                      },
                                      {
                                        label: "Delete Source",
                                        danger: true,
                                        onClick: () => void onDeleteSource(src.id),
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom 2-Col Row: Add New Source + Source Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-4">
            + Add New Source
          </h3>
          <form onSubmit={handleAddSource} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Source Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter source name"
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "active" | "inactive")}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                  Color Tag
                </label>
                <select
                  value={newColor}
                  onChange={(e) =>
                    setNewColor(
                      e.target.value as
                        | "violet"
                        | "sky"
                        | "cyan"
                        | "emerald"
                        | "amber"
                        | "indigo"
                        | "rose",
                    )
                  }
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
                >
                  <option value="violet">Violet</option>
                  <option value="sky">Sky</option>
                  <option value="emerald">Emerald</option>
                  <option value="amber">Amber</option>
                  <option value="cyan">Cyan</option>
                  <option value="indigo">Indigo</option>
                  <option value="rose">Rose</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1B1D45] dark:text-[#DCE1F9] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                maxLength={250}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Enter a short description for this source..."
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] dark:border-[#313761] dark:bg-[#1A1F3D] dark:text-[#DCE1F9]"
              />
              <div className="text-right text-[10px] text-[#76799C] dark:text-[#8A94B8]">
                {newDesc.length} / 250
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewName("");
                  setNewDesc("");
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
                {submitting ? "Saving..." : "Save Source"}
              </button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Source Insights
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 p-3 dark:border-[#272B4D] dark:bg-[#191D3D]">
              <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">Top Source</p>
              <p className="text-[#4D5072] dark:text-[#9DA6CC] mt-0.5">
                {totals.topSource
                  ? `${totals.topSource.name} — ${totals.topSource.total} enquiries (${
                      totals.totalEnq > 0
                        ? ((totals.topSource.total / totals.totalEnq) * 100).toFixed(1)
                        : "0.0"
                    }%)`
                  : "No enquiry data available yet."}
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 p-3 dark:border-[#272B4D] dark:bg-[#191D3D]">
              <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">Best Conversion</p>
              <p className="text-[#4D5072] dark:text-[#9DA6CC] mt-0.5">
                {totals.bestConversion
                  ? `${totals.bestConversion.name} — ${totals.bestConversion.conversionRate.toFixed(1)}%`
                  : "No conversions recorded yet."}
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 p-3 dark:border-[#272B4D] dark:bg-[#191D3D]">
              <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">Lowest Conversion</p>
              <p className="text-[#4D5072] dark:text-[#9DA6CC] mt-0.5">
                {totals.lowestConversion
                  ? `${totals.lowestConversion.name} — ${totals.lowestConversion.conversionRate.toFixed(1)}%`
                  : "No conversions recorded yet."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
