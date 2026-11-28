"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import type {
  StudentActivityRecord,
  StudentGroupRecord,
  StudentRecord,
} from "@/modules/students/types";
import type {
  StudentDossier360Data,
  StudentProfileTab,
} from "@/modules/students/dossier-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";
import { StudentProfileHeader } from "@/modules/students/components/profile/student-profile-header";
import { TabProfileOverview } from "@/modules/students/components/profile/tab-profile-overview";
import { TabAcademic } from "@/modules/students/components/profile/tab-academic";
import { TabAttendance } from "@/modules/students/components/profile/tab-attendance";
import { TabFees } from "@/modules/students/components/profile/tab-fees";
import { TabDocuments } from "@/modules/students/components/profile/tab-documents";
import { TabCommunication } from "@/modules/students/components/profile/tab-communication";
import {
  TabActivities,
  TabHistory,
} from "@/modules/students/components/profile/tab-activities-history";

function buildFallbackDossier(
  student: StudentRecord,
  groups: StudentGroupRecord[],
  activities: StudentActivityRecord[],
): StudentDossier360Data {
  const paidPaise = student.feeSummary?.paidPaise ?? 0;
  const totalFeePaise = student.feeSummary?.totalFeePaise ?? 5000000;
  const outstandingPaise = Math.max(0, totalFeePaise - paidPaise);
  return {
    student,
    extendedProfile: {},
    groups: groups.filter((g) => student.groupIds.includes(g.id)),
    activities: activities.filter((a) => a.studentId === student.id),
    attendanceRecords: [],
    examResults: [],
    documents: [],
    communications: [],
    homeworkItems: [],
    coCurricularActivities: [],
    notesRemarks: [],
    feeSummary: {
      totalFeePaise,
      paidPaise,
      outstandingPaise,
      status: outstandingPaise === 0 ? "PAID" : paidPaise > 0 ? "PARTIALLY_PAID" : "PENDING",
      feePlanName: `${student.currentGrade} - Annual`,
      nextDueDate: outstandingPaise > 0 ? "10 Feb 2026" : null,
      feeHeads: [
        { head: "Tuition Fee", frequency: "Monthly", amountPaise: 2500000 },
        { head: "Development Fee", frequency: "Annually", amountPaise: 1000000 },
        { head: "Activity & Exam Fee", frequency: "Annually", amountPaise: 900000 },
        { head: "ICT & Library Fee", frequency: "Annually", amountPaise: 600000 },
      ],
      installments: [],
      payments: [],
    },
    canRevealSensitiveId: false,
  };
}

export function StudentProfileDossier({
  mode = "school",
  student,
  groups,
  activities,
  allStudents,
  canEdit,
  onSelectStudent,
  onBackToList,
  onEditStudent,
  onOpenIdCard,
}: {
  mode?: "school" | "platform";
  student: StudentRecord | null;
  groups: StudentGroupRecord[];
  activities: StudentActivityRecord[];
  allStudents: StudentRecord[];
  canEdit: boolean;
  onSelectStudent: (studentId: string) => void;
  onBackToList: () => void;
  onEditStudent: (student: StudentRecord) => void;
  onOpenIdCard: (student: StudentRecord) => void;
  onTransferStudent?: (student: StudentRecord) => void;
}) {
  const [activeTab, setActiveTab] = useState<StudentProfileTab>("profile");
  const [dossier, setDossier] = useState<StudentDossier360Data | null>(() =>
    student ? buildFallbackDossier(student, groups, activities) : null,
  );
  const [loading, setLoading] = useState(false);

  const studentId = student?.id ?? null;
  const schoolId = student?.schoolId ?? null;

  useEffect(() => {
    if (!student || !studentId || !schoolId) {
      setDossier(null);
      return;
    }
    setDossier(buildFallbackDossier(student, groups, activities));
    let cancelled = false;
    setLoading(true);

    const url =
      mode === "platform"
        ? `/api/platform/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(studentId)}/dossier`
        : `/api/school/students/${encodeURIComponent(studentId)}/dossier`;

    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && json.dossier) {
          setDossier(json.dossier);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, student, studentId, schoolId, groups, activities]);

  if (!student || !dossier) {
    return (
      <div className={`${STUDENT_CARD_SURFACE} p-6 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
              Select a Student Profile
            </h2>
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Choose any student below to open their complete 360° profile dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Student List</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allStudents.slice(0, 12).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStudent(s.id)}
              className="flex items-center gap-3 rounded-2xl border border-[#E2E6F6] bg-[#FAF8FE]/80 p-3 text-left transition hover:border-[#663CF6] cursor-pointer dark:border-[#272B4D] dark:bg-[#10142C]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#5B35F5] text-xs font-black text-white">
                {s.studentName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {s.studentName}
                </p>
                <p className="font-mono text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                  {s.admissionNumber}
                </p>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  {s.currentGrade} - {s.currentSection} • {s.guardianName}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleMutate = async (payload: Record<string, unknown>) => {
    const url =
      mode === "platform"
        ? `/api/platform/schools/${encodeURIComponent(student.schoolId)}/students/${encodeURIComponent(student.id)}/dossier`
        : `/api/school/students/${encodeURIComponent(student.id)}/dossier`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || json?.error || "Update failed.");
    }
    if (json.dossier) {
      setDossier(json.dossier);
    }
  };

  return (
    <div className="space-y-4">
      <StudentProfileHeader
        student={dossier.student}
        allStudents={allStudents}
        activeTab={activeTab}
        canEdit={canEdit}
        pdfUrl={
          mode === "school"
            ? `/api/school/students/${encodeURIComponent(student.id)}/dossier/pdf`
            : undefined
        }
        onTabChange={setActiveTab}
        onSelectStudent={onSelectStudent}
        onBackToList={onBackToList}
        onEditProfile={() => onEditStudent(student)}
        onOpenIdCard={() => onOpenIdCard(student)}
      />

      {loading && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#663CF6] dark:text-[#C4B5FD]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Syncing live 360° profile data...</span>
        </div>
      )}

      {activeTab === "profile" && (
        <TabProfileOverview
          dossier={dossier}
          canEdit={canEdit}
          onMutate={handleMutate}
          onEditStudent={() => onEditStudent(student)}
        />
      )}
      {activeTab === "academic" && (
        <TabAcademic dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
      {activeTab === "attendance" && (
        <TabAttendance dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
      {activeTab === "fees" && (
        <TabFees dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
      {activeTab === "documents" && (
        <TabDocuments dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
      {activeTab === "communication" && (
        <TabCommunication dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
      {activeTab === "activities" && (
        <TabActivities dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
      {activeTab === "history" && (
        <TabHistory dossier={dossier} canEdit={canEdit} onMutate={handleMutate} />
      )}
    </div>
  );
}
