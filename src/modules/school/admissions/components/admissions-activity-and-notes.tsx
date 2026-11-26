"use client";

import React, { useState } from "react";
import {
  Activity,
  Bell,
  Calendar,
  FileText,
  Users,
  Info,
  Plus,
  Trash2,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import type {
  AdmissionActivityRecord,
  AdmissionReminderRecord,
} from "@/modules/school/admissions/types";

interface AdmissionsActivityAndNotesProps {
  activities: AdmissionActivityRecord[];
  reminders: AdmissionReminderRecord[];
  academicYear: string;
  canWrite: boolean;
  onCreateReminder: (input: {
    title: string;
    academicYear?: string;
    priority: "INFO" | "WARNING";
  }) => Promise<void>;
  onToggleReminder: (reminderId: string, isCompleted: boolean) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export function AdmissionsActivityAndNotes({
  activities,
  reminders,
  academicYear,
  canWrite,
  onCreateReminder,
  onToggleReminder,
  onDeleteReminder,
}: AdmissionsActivityAndNotesProps) {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [notePriority, setNotePriority] = useState<"INFO" | "WARNING">("INFO");
  const [submittingNote, setSubmittingNote] = useState(false);

  const visibleActivities = showAllActivities ? activities : activities.slice(0, 5);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteTitle.trim();
    if (trimmed.length < 3) return;
    setSubmittingNote(true);
    try {
      await onCreateReminder({
        title: trimmed,
        academicYear: academicYear === "all" ? undefined : academicYear,
        priority: notePriority,
      });
      setNoteTitle("");
      setAddingNote(false);
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Recent Admission Activities (6 cols) */}
      <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Recent Admission Activities
              </h2>
            </div>

            {activities.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllActivities((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
              >
                <span>{showAllActivities ? "Show Less" : "View All"}</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>

          {visibleActivities.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-8 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">No admission activity yet</p>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Every new enquiry, verification update, and status change appears here live.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleActivities.map((act) => {
                const dotColor =
                  act.action === "APPLICATION_UPDATED" && act.summary.includes("Admitted")
                    ? "bg-emerald-500 ring-emerald-100 dark:ring-emerald-950/60"
                    : act.action === "ENQUIRY_CREATED"
                      ? "bg-sky-500 ring-sky-100 dark:ring-sky-950/60"
                      : "bg-[#663CF6] ring-[#EDE7FF] dark:bg-[#8B5CF6] dark:ring-[#2B2058]";
                return (
                  <li key={act.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4 ${dotColor}`}
                        aria-hidden="true"
                      />
                      <span className="text-[#1B1D45] font-medium leading-relaxed dark:text-[#DCE1F9]">
                        {act.summary}
                      </span>
                    </div>
                    <time
                      dateTime={act.createdAt}
                      className="shrink-0 text-[11px] text-[#76799C] whitespace-nowrap dark:text-[#9DA6CC]"
                    >
                      {formatRelativeTime(act.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Important Notes & Reminders (6 cols) */}
      <section className="lg:col-span-6 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Important Notes &amp; Reminders
              </h2>
            </div>

            {canWrite && (
              <button
                type="button"
                onClick={() => setAddingNote((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD] dark:hover:border-[#8B5CF6]"
              >
                {addingNote ? (
                  <>
                    <X className="h-3 w-3" aria-hidden="true" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    <span>Add Note</span>
                  </>
                )}
              </button>
            )}
          </div>

          {addingNote && (
            <form
              onSubmit={handleAddNote}
              className="mb-3 rounded-[12px] border border-[#DDD6FE] bg-[#FAF8FE] p-3 space-y-2 dark:border-[#3D3170] dark:bg-[#10142C]"
            >
              <input
                type="text"
                required
                minLength={3}
                maxLength={240}
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Send admission confirmation letters to Class I batch"
                aria-label="Reminder note text"
                className="w-full rounded-[8px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={notePriority}
                  onChange={(e) => setNotePriority(e.target.value as "INFO" | "WARNING")}
                  aria-label="Reminder priority"
                  className="rounded-[8px] border border-[#CAD0EB] bg-white px-2 py-1 text-xs font-semibold text-[#08093B] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                >
                  <option value="INFO">Standard Note</option>
                  <option value="WARNING">Action Needed</option>
                </select>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="rounded-[8px] bg-[#663CF6] px-3 py-1 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
                >
                  {submittingNote ? "Saving..." : "Save Reminder"}
                </button>
              </div>
            </form>
          )}

          {reminders.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#D6DBF0] bg-[#FAF8FE]/60 py-8 px-4 text-center dark:border-[#2E345B] dark:bg-[#10142C]/60">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">All caught up</p>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Add a reminder note or set an admission deadline in Settings.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {reminders.map((rem) => {
                const isDeadline = rem.id.startsWith("sys-deadline-");
                const isPendingDocs = rem.id.startsWith("sys-pending-docs-");
                const isShortlisted = rem.id.startsWith("sys-shortlisted-");
                const IconComp = isDeadline
                  ? Calendar
                  : isPendingDocs
                    ? FileText
                    : isShortlisted
                      ? Users
                      : Info;

                return (
                  <li
                    key={rem.id}
                    className={`flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2.5 text-xs ${
                      rem.isCompleted
                        ? "border-slate-200 bg-slate-50/70 opacity-70 dark:border-[#272B4D] dark:bg-[#10142C]/60"
                        : rem.priority === "WARNING"
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/70 dark:bg-amber-950/35"
                          : "border-[#DFE3F5] bg-[#FAF8FE] dark:border-[#2A2F58] dark:bg-[#10142C]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[#663CF6] shadow-2xs dark:bg-[#1D1B3F] dark:text-[#C4B5FD]">
                        <IconComp className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span
                        className={`font-medium text-[#1B1D45] leading-relaxed dark:text-[#DCE1F9] ${
                          rem.isCompleted ? "line-through" : ""
                        }`}
                      >
                        {rem.title}
                      </span>
                    </div>

                    {!rem.isSystemGenerated && canWrite && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleReminder(rem.id, !rem.isCompleted)}
                          aria-label={
                            rem.isCompleted ? "Mark reminder active" : "Mark reminder completed"
                          }
                          className="rounded p-1 text-emerald-700 hover:bg-emerald-50 cursor-pointer dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(rem.id)}
                          aria-label="Delete reminder"
                          className="rounded p-1 text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
