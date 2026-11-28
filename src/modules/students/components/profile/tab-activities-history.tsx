"use client";

import React, { useState } from "react";
import { Activity, Award, CheckSquare, GraduationCap, Plus } from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentEnrolmentTrendChart,
} from "@/modules/students/components/student-charts-and-cards";
import { SharedProfileRemarksCard } from "./shared-remarks-card";

export function TabActivities({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [subFilter, setSubFilter] = useState<"both" | "activities" | "homework">("both");
  const [addingAct, setAddingAct] = useState(false);
  const [actTitle, setActTitle] = useState("");
  const [actCategory, setActCategory] = useState("Sports");
  const [actDate, setActDate] = useState(new Date().toISOString().slice(0, 10));

  const [addingHw, setAddingHw] = useState(false);
  const [hwSubject, setHwSubject] = useState("Mathematics");
  const [hwTitle, setHwTitle] = useState("");
  const [hwDue, setHwDue] = useState(new Date().toISOString().slice(0, 10));

  const hwSubmitted = dossier.homeworkItems.filter((h) => h.status === "SUBMITTED").length;
  const hwPending = dossier.homeworkItems.filter((h) => h.status === "PENDING").length;
  const hwTotal = dossier.homeworkItems.length;
  const hwPct = hwTotal > 0 ? Math.round((hwSubmitted / hwTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <Activity className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Activities &amp; Homework</span>
        </h3>
        <div className="flex items-center gap-1.5">
          {(
            [
              ["both", "Activities & Homework"],
              ["activities", "Activities"],
              ["homework", "Homework"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSubFilter(k)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                subFilter === k
                  ? "bg-[#663CF6] text-white"
                  : "border border-[#CAD0EB] bg-white text-[#4D5072] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#9DA6CC]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className={`${STUDENT_CARD_SURFACE} p-3`}><p className="text-xl font-black text-[#5B35F5]">{dossier.coCurricularActivities.length}</p><p className="text-[11px] font-bold">Activities Participated</p></div>
        <div className={`${STUDENT_CARD_SURFACE} p-3`}><p className="text-xl font-black text-emerald-600">{hwTotal}</p><p className="text-[11px] font-bold">Homework Assigned</p></div>
        <div className={`${STUDENT_CARD_SURFACE} p-3`}><p className="text-xl font-black text-sky-600">{hwSubmitted}</p><p className="text-[11px] font-bold">Submitted</p></div>
        <div className={`${STUDENT_CARD_SURFACE} p-3`}><p className="text-xl font-black text-rose-600">{hwPending}</p><p className="text-[11px] font-bold">Pending</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(subFilter === "both" || subFilter === "activities") && (
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Student Activities</h4>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAddingAct((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#CAD0EB] px-2.5 py-1 text-xs font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Activity
                </button>
              )}
            </div>
            {addingAct && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await onMutate({
                    action: "ADD_ACTIVITY",
                    title: actTitle,
                    category: actCategory,
                    eventDate: actDate,
                    status: "Participated",
                  });
                  setActTitle("");
                  setAddingAct(false);
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl bg-[#FAF8FE] p-2.5 dark:bg-[#10142C]"
              >
                <input value={actTitle} onChange={(e) => setActTitle(e.target.value)} placeholder="Event title" required className="rounded-lg border px-2 py-1 text-xs dark:bg-[#141731] dark:border-[#343B6B]" />
                <input value={actCategory} onChange={(e) => setActCategory(e.target.value)} placeholder="Category" className="rounded-lg border px-2 py-1 text-xs dark:bg-[#141731] dark:border-[#343B6B]" />
                <input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} className="rounded-lg border px-2 py-1 text-xs dark:bg-[#141731] dark:border-[#343B6B]" />
                <button type="submit" className="rounded-lg bg-[#663CF6] px-3 py-1 text-xs font-bold text-white cursor-pointer">Save</button>
              </form>
            )}
            {dossier.coCurricularActivities.length === 0 ? (
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">No co-curricular events recorded yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {dossier.coCurricularActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
                    <div><p className="font-bold">{a.title}</p><p className="text-[10px] text-[#76799C]">{a.category} • {a.eventDate}</p></div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(subFilter === "both" || subFilter === "homework") && (
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                <CheckSquare className="h-4 w-4 text-[#663CF6]" /> Homework Assignments
              </h4>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAddingHw((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#CAD0EB] px-2.5 py-1 text-xs font-bold text-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:text-[#C4B5FD]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Homework
                </button>
              )}
            </div>
            {addingHw && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await onMutate({
                    action: "ADD_HOMEWORK",
                    subject: hwSubject,
                    title: hwTitle,
                    assignedOn: new Date().toISOString().slice(0, 10),
                    dueDate: hwDue,
                    status: "PENDING",
                  });
                  setHwTitle("");
                  setAddingHw(false);
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl bg-[#FAF8FE] p-2.5 dark:bg-[#10142C]"
              >
                <input value={hwSubject} onChange={(e) => setHwSubject(e.target.value)} placeholder="Subject" className="rounded-lg border px-2 py-1 text-xs dark:bg-[#141731] dark:border-[#343B6B]" />
                <input value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} placeholder="Assignment title" required className="rounded-lg border px-2 py-1 text-xs dark:bg-[#141731] dark:border-[#343B6B]" />
                <input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)} className="rounded-lg border px-2 py-1 text-xs dark:bg-[#141731] dark:border-[#343B6B]" />
                <button type="submit" className="rounded-lg bg-[#663CF6] px-3 py-1 text-xs font-bold text-white cursor-pointer">Save</button>
              </form>
            )}
            {dossier.homeworkItems.length === 0 ? (
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">No homework assigned yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {dossier.homeworkItems.map((h) => (
                  <div key={h.id} className="flex items-center justify-between border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
                    <div><p className="font-bold">{h.subject}: {h.title}</p><p className="text-[10px] text-[#76799C]">Due {h.dueDate}</p></div>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() =>
                        onMutate({
                          action: "TOGGLE_HOMEWORK",
                          homeworkId: h.id,
                          status: h.status === "SUBMITTED" ? "PENDING" : "SUBMITTED",
                        })
                      }
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                        h.status === "SUBMITTED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {h.status}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <StudentDonutChart
        title="Homework Performance"
        centerTotal={hwPct}
        centerLabel="% Done"
        slices={[
          { label: "Submitted", count: hwSubmitted, percentage: hwTotal ? Math.round((hwSubmitted / hwTotal) * 100) : 0, color: "#22C55E" },
          { label: "Pending", count: hwPending, percentage: hwTotal ? Math.round((hwPending / hwTotal) * 100) : 0, color: "#F59E0B" },
        ]}
      />

      <SharedProfileRemarksCard
        title="Activity & Homework Remarks"
        tabScope="ACTIVITIES"
        remarks={dossier.notesRemarks}
        canEdit={canEdit}
        onMutate={onMutate}
      />
    </div>
  );
}

export function TabHistory({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [subMode, setSubMode] = useState<"academic" | "transfer" | "other">("academic");
  const s = dossier.student;
  const years = Array.from(new Set(dossier.examResults.map((e) => e.academicYear)));
  const yearlyPoints = years.map((y) => {
    const rows = dossier.examResults.filter((e) => e.academicYear === y);
    const max = rows.reduce((a, r) => a + r.maxMarks, 0);
    const got = rows.reduce((a, r) => a + r.marksObtained, 0);
    return { label: y, count: max > 0 ? Math.round((got / max) * 100) : 0 };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>Student History</span>
        </h3>
        <div className="flex items-center gap-1.5">
          {(
            [
              ["academic", "Academic History"],
              ["transfer", "Transfer History"],
              ["other", "Other History"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSubMode(k)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                subMode === k
                  ? "bg-[#663CF6] text-white"
                  : "border border-[#CAD0EB] bg-white text-[#4D5072] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#9DA6CC]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(subMode === "academic" || subMode === "other") && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
              <h4 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                <Award className="h-4 w-4 text-[#663CF6]" /> Promotion &amp; Class History
              </h4>
              {s.enrollments.length === 0 ? (
                <p className="text-[#76799C] dark:text-[#9DA6CC]">Current admission enrollment active ({s.currentGrade} - {s.currentSection}).</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                      <th className="py-1.5">Academic Year</th>
                      <th className="py-1.5">Class</th>
                      <th className="py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                    {s.enrollments.map((enr) => (
                      <tr key={enr.id}>
                        <td className="py-2 font-bold">{enr.academicYear}</td>
                        <td className="py-2">{enr.grade} - {enr.section}</td>
                        <td className="py-2"><span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">{enr.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <StudentEnrolmentTrendChart
              points={yearlyPoints}
              granularityLabel="Multi-Year Performance %"
            />
          </div>
        </>
      )}

      {(subMode === "transfer" || subMode === "other") && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
          <h4 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Transfer History</h4>
          {s.transfers.length === 0 ? (
            <p className="text-[#76799C] dark:text-[#9DA6CC]">No transfer records found.</p>
          ) : (
            s.transfers.map((t) => (
              <div key={t.id} className="flex justify-between border-b border-[#F1F3FB] pb-2 dark:border-[#232746]">
                <span><strong>{t.transferType}</strong> • {t.counterpartySchool || t.reason || "—"}</span>
                <span className="font-mono">{t.tcNumber || t.transferDate.slice(0, 10)}</span>
              </div>
            ))
          )}
        </div>
      )}

      <SharedProfileRemarksCard
        title="History Remarks"
        tabScope="HISTORY"
        remarks={dossier.notesRemarks}
        canEdit={canEdit}
        onMutate={onMutate}
      />
    </div>
  );
}
