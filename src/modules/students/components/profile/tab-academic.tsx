"use client";

import React, { useMemo, useState } from "react";
import { Award, BookOpen, GraduationCap, Plus, Trophy } from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentEnrolmentTrendChart,
} from "@/modules/students/components/student-charts-and-cards";
import { SharedProfileRemarksCard } from "./shared-remarks-card";

export function TabAcademic({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const s = dossier.student;
  const terms = useMemo(() => {
    const uniq = Array.from(new Set(dossier.examResults.map((r) => r.term)));
    return uniq.length > 0 ? uniq : ["Term 1", "Term 2"];
  }, [dossier.examResults]);
  const [selectedTerm, setSelectedTerm] = useState(terms[0] || "Term 1");
  const [addingMark, setAddingMark] = useState(false);
  const [subject, setSubject] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksObtained, setMarksObtained] = useState(85);
  const [grade, setGrade] = useState("A");
  const [addingAchievement, setAddingAchievement] = useState(false);
  const [achievementText, setAchievementText] = useState("");

  const termRows = dossier.examResults.filter((r) => r.term === selectedTerm);
  const overallObtained = dossier.examResults.reduce((acc, r) => acc + r.marksObtained, 0);
  const overallMax = dossier.examResults.reduce((acc, r) => acc + r.maxMarks, 0);
  const overallPct = overallMax > 0 ? Math.round((overallObtained / overallMax) * 1000) / 10 : 0;
  const overallGrade =
    overallPct >= 90 ? "A+" : overallPct >= 80 ? "A" : overallPct >= 70 ? "B" : overallPct > 0 ? "C" : "—";

  const termSummaries = terms.map((term) => {
    const rows = dossier.examResults.filter((r) => r.term === term);
    const max = rows.reduce((a, r) => a + r.maxMarks, 0);
    const got = rows.reduce((a, r) => a + r.marksObtained, 0);
    const pct = max > 0 ? Math.round((got / max) * 1000) / 10 : 0;
    return { term, max, got, pct, grade: pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : "—" };
  });

  const attPresent = dossier.attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const attAbsent = dossier.attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const attLeave = dossier.attendanceRecords.filter((a) => a.status === "LEAVE").length;
  const attTotal = dossier.attendanceRecords.length;

  const achievements = dossier.notesRemarks.filter(
    (n) => n.tabScope === "ACADEMIC" && n.kind === "ACHIEVEMENT",
  );

  const handleSaveMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    await onMutate({
      action: "UPSERT_ACADEMIC_MARK",
      academicYear: s.currentAcademicYear,
      term: selectedTerm,
      subject: subject.trim(),
      maxMarks,
      marksObtained,
      grade,
    });
    setSubject("");
    setAddingMark(false);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementText.trim()) return;
    await onMutate({
      action: "ADD_REMARK",
      tabScope: "ACADEMIC",
      kind: "ACHIEVEMENT",
      body: achievementText.trim(),
    });
    setAchievementText("");
    setAddingAchievement(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Academic Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              ["Overall Percentage", `${overallPct}%`, "bg-[#EDE7FF]/70 dark:bg-[#221A44]"],
              ["Overall Grade", overallGrade, "bg-emerald-50 dark:bg-emerald-950/40"],
              ["Class Rank", dossier.examResults[0]?.classRank ? `${dossier.examResults[0].classRank}` : "—", "bg-sky-50 dark:bg-sky-950/40"],
              ["School Rank", dossier.examResults[0]?.schoolRank ? `${dossier.examResults[0].schoolRank}` : "—", "bg-pink-50 dark:bg-pink-950/40"],
            ].map(([label, val, bg]) => (
              <div key={String(label)} className={`rounded-2xl p-3 ${bg}`}>
                <p className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">{val}</p>
                <p className="mt-1 text-[11px] font-semibold text-[#4D5072] dark:text-[#9DA6CC]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Current Class Details</span>
          </h3>
          {[
            ["Academic Year", s.currentAcademicYear],
            ["Class / Section", `${s.currentGrade} - ${s.currentSection}`],
            ["Class Teacher", dossier.extendedProfile.classTeacher || "Assigned Teacher"],
            ["House", dossier.extendedProfile.houseName || dossier.groups[0]?.name || "—"],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between">
              <span className="text-[#76799C] dark:text-[#9DA6CC]">{k}</span>
              <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} lg:col-span-2 p-4 sm:p-5 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <BookOpen className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Subjects &amp; Marks ({selectedTerm})</span>
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="rounded-xl border border-[#CAD0EB] bg-white px-2.5 py-1 text-xs font-bold dark:border-[#343B6B] dark:bg-[#10142C]"
              >
                {terms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setAddingMark((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#663CF6] px-3 py-1 text-xs font-bold text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Enter Marks</span>
                </button>
              )}
            </div>
          </div>

          {addingMark && (
            <form onSubmit={handleSaveMark} className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                required
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                placeholder="Max"
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(Number(e.target.value))}
                placeholder="Marks"
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Grade"
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <button type="submit" className="rounded-lg bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                Save
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Max Marks</th>
                  <th className="py-2 pr-3">Marks Obtained</th>
                  <th className="py-2 pr-3">Percentage</th>
                  <th className="py-2">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                {termRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#76799C] dark:text-[#9DA6CC]">
                      No exam marks recorded for {selectedTerm} yet.
                    </td>
                  </tr>
                ) : (
                  termRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3 font-bold text-[#08093B] dark:text-[#F3F5FF]">{row.subject}</td>
                      <td className="py-2 pr-3">{row.maxMarks}</td>
                      <td className="py-2 pr-3 font-bold">{row.marksObtained}</td>
                      <td className="py-2 pr-3">{Math.round((row.marksObtained / row.maxMarks) * 1000) / 10}%</td>
                      <td className="py-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Term-wise Performance</h3>
            <div className="space-y-1.5 text-xs">
              {termSummaries.map((ts) => (
                <div key={ts.term} className="flex items-center justify-between border-b border-[#F1F3FB] pb-1.5 dark:border-[#232746]">
                  <span className="font-bold">{ts.term}</span>
                  <span>
                    {ts.got}/{ts.max} ({ts.pct}%) • <strong>{ts.grade}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <StudentEnrolmentTrendChart
            points={termSummaries.map((ts) => ({ label: ts.term, count: ts.pct }))}
            granularityLabel="Grade Trend %"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudentDonutChart
          title="Attendance & Academic Summary"
          centerTotal={attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0}
          centerLabel="% Att."
          slices={[
            { label: "Present", count: attPresent, percentage: attTotal ? Math.round((attPresent / attTotal) * 100) : 0, color: "#22C55E" },
            { label: "Absent", count: attAbsent, percentage: attTotal ? Math.round((attAbsent / attTotal) * 100) : 0, color: "#F59E0B" },
            { label: "Leave", count: attLeave, percentage: attTotal ? Math.round((attLeave / attTotal) * 100) : 0, color: "#8B5CF6" },
          ]}
        />

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Awards &amp; Achievements</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => setAddingAchievement((v) => !v)}
                className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
              >
                + Add Achievement
              </button>
            )}
          </div>
          {addingAchievement && (
            <form onSubmit={handleSaveAchievement} className="flex gap-2">
              <input
                value={achievementText}
                onChange={(e) => setAchievementText(e.target.value)}
                placeholder="Best Reader Award / Olympiad..."
                className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
              />
              <button type="submit" className="rounded-xl bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                Add
              </button>
            </form>
          )}
          <div className="space-y-2 text-xs">
            {achievements.length === 0 ? (
              <p className="text-[#76799C] dark:text-[#9DA6CC]">No awards recorded yet.</p>
            ) : (
              achievements.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FAF8FE] px-3 py-2 dark:bg-[#10142C]">
                  <span className="flex items-center gap-2 font-bold">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    <span>{a.body}</span>
                  </span>
                  <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                    {new Date(a.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <SharedProfileRemarksCard
        title="Academic Remarks"
        tabScope="ACADEMIC"
        remarks={dossier.notesRemarks}
        canEdit={canEdit}
        onMutate={onMutate}
      />
    </div>
  );
}
