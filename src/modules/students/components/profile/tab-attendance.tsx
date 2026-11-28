"use client";

import React, { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentEnrolmentTrendChart,
} from "@/modules/students/components/student-charts-and-cards";
import { SharedProfileRemarksCard } from "./shared-remarks-card";

export function TabAttendance({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const s = dossier.student;
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [marking, setMarking] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState<"PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY">("PRESENT");
  const [attRemarks, setAttRemarks] = useState("");
  const [search, setSearch] = useState("");

  const present = dossier.attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const absent = dossier.attendanceRecords.filter((r) => r.status === "ABSENT").length;
  const leave = dossier.attendanceRecords.filter((r) => r.status === "LEAVE").length;
  const total = dossier.attendanceRecords.length;
  const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

  const [yearNum, monthNum] = monthCursor.split("-").map(Number);
  const daysInMonth = new Date(yearNum!, monthNum!, 0).getDate();
  const firstWeekday = new Date(yearNum!, monthNum! - 1, 1).getDay();

  const statusByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of dossier.attendanceRecords) {
      map.set(r.attendanceDate, r.status);
    }
    return map;
  }, [dossier.attendanceRecords]);

  const monthlyRollup = useMemo(() => {
    const map = new Map<string, { working: number; present: number; absent: number; leave: number }>();
    for (const r of dossier.attendanceRecords) {
      const m = r.attendanceDate.slice(0, 7);
      const cur = map.get(m) || { working: 0, present: 0, absent: 0, leave: 0 };
      if (r.status !== "HOLIDAY") cur.working += 1;
      if (r.status === "PRESENT") cur.present += 1;
      if (r.status === "ABSENT") cur.absent += 1;
      if (r.status === "LEAVE") cur.leave += 1;
      map.set(m, cur);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dossier.attendanceRecords]);

  const filteredLogs = dossier.attendanceRecords.filter(
    (r) =>
      !search.trim() ||
      r.attendanceDate.includes(search.trim()) ||
      r.status.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(yearNum!, monthNum! - 1 + delta, 1);
    setMonthCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleMarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onMutate({
      action: "MARK_ATTENDANCE",
      academicYear: s.currentAcademicYear,
      attendanceDate: attDate,
      status: attStatus,
      remarks: attRemarks || undefined,
    });
    setAttRemarks("");
    setMarking(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <CalendarCheck className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Attendance Overview</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => setMarking((v) => !v)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Mark Attendance</span>
              </button>
            )}
          </div>

          {marking && (
            <form onSubmit={handleMarkSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                required
                className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <select
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value as typeof attStatus)}
                className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">Leave</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
              <input
                value={attRemarks}
                onChange={(e) => setAttRemarks(e.target.value)}
                placeholder="Remarks..."
                className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <button type="submit" className="rounded-lg bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                Save
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            {[
              ["Attendance", `${pct}%`, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"],
              ["Present", String(present), "bg-[#EDE7FF] text-[#5B35F5] dark:bg-[#221A44] dark:text-[#CBB8FF]"],
              ["Absent", String(absent), "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"],
              ["Leave", String(leave), "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"],
            ].map(([label, val, cls]) => (
              <div key={String(label)} className={`rounded-2xl p-3 ${cls}`}>
                <p className="text-xl font-black">{val}</p>
                <p className="text-[11px] font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <StudentEnrolmentTrendChart
          points={monthlyRollup.map(([m, v]) => ({
            label: m,
            count: v.working > 0 ? Math.round((v.present / v.working) * 100) : 0,
          }))}
          granularityLabel="Attendance % by Month"
        />
      </div>

      {/* Calendar + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Attendance Calendar</h3>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button type="button" onClick={() => shiftMonth(-1)} className="rounded border border-[#CAD0EB] p-1 cursor-pointer dark:border-[#343B6B]">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-20 text-center">{monthCursor}</span>
              <button type="button" onClick={() => shiftMonth(1)} className="rounded border border-[#CAD0EB] p-1 cursor-pointer dark:border-[#343B6B]">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="font-bold text-[#76799C] dark:text-[#9DA6CC] py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const iso = `${monthCursor}-${String(day).padStart(2, "0")}`;
              const st = statusByDate.get(iso);
              const badgeCls =
                st === "PRESENT"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                  : st === "ABSENT"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                    : st === "LEAVE"
                      ? "bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300"
                      : "bg-[#FAF8FE] text-[#08093B] dark:bg-[#10142C] dark:text-[#DCE1F9]";
              return (
                <div key={iso} className={`rounded-lg py-1.5 font-bold ${badgeCls}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <StudentDonutChart
          title="Attendance Summary"
          centerTotal={pct}
          centerLabel="% Att."
          slices={[
            { label: "Present", count: present, percentage: total ? Math.round((present / total) * 100) : 0, color: "#22C55E" },
            { label: "Absent", count: absent, percentage: total ? Math.round((absent / total) * 100) : 0, color: "#EF4444" },
            { label: "Leave", count: leave, percentage: total ? Math.round((leave / total) * 100) : 0, color: "#8B5CF6" },
          ]}
        />
      </div>

      {/* Attendance Details Log */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Attendance Details</h3>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date or status..."
            className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Remarks</th>
                <th className="py-2">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#76799C] dark:text-[#9DA6CC]">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 20).map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 font-mono font-bold">{r.attendanceDate}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-bold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{r.remarks || "—"}</td>
                    <td className="py-2 text-[#76799C] dark:text-[#9DA6CC]">{r.markedByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SharedProfileRemarksCard
        title="Attendance Remarks"
        tabScope="ATTENDANCE"
        remarks={dossier.notesRemarks}
        canEdit={canEdit}
        onMutate={onMutate}
      />
    </div>
  );
}
