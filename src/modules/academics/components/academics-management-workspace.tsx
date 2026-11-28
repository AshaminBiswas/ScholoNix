"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FolderTree,
  GraduationCap,
  Layers,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";
import type {
  AcademicNavSection,
  AcademicWorkspaceSnapshot,
} from "@/modules/academics/types";

const CONTROL_INPUT =
  "rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-medium text-[#1B1D45] placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 dark:border-[#313761] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7C83AA] dark:focus:border-[#8B5CF6]";

export function AcademicsManagementWorkspace({
  mode = "school",
  schoolId,
  initialSnapshot,
  initialSection = "explorer",
  permissions,
  onNavigateSection,
}: {
  mode?: "school" | "platform";
  schoolId?: string;
  initialSnapshot: AcademicWorkspaceSnapshot;
  initialSection?: AcademicNavSection;
  permissions: {
    canWrite: boolean;
    canManageSettings: boolean;
  };
  onNavigateSection?: (sec: AcademicNavSection) => void;
}) {
  const apiBase =
    mode === "platform" && schoolId
      ? `/api/platform/schools/${encodeURIComponent(schoolId)}/academics`
      : "/api/school/academics";
  const [snapshot, setSnapshot] = useState<AcademicWorkspaceSnapshot>(initialSnapshot);
  const [section, setSection] = useState<AcademicNavSection>(initialSection);

  // Tree Explorer selection state
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialSnapshot.classes[0]?.id ?? "",
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSnapshot.classes[0]?.sections[0]?.id ?? "",
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSnapshot.classes[0]?.sections[0]?.students[0]?.id ?? "",
  );
  const [classSearch, setClassSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Quick inline creation states
  const [newClassName, setNewClassName] = useState("");
  const [newClassDept, setNewClassDept] = useState("General");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionTeacher, setNewSectionTeacher] = useState("");
  const [newSectionCapacity, setNewSectionCapacity] = useState(40);
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCategory, setNewSubjectCategory] = useState<
    "CORE" | "ELECTIVE" | "LAB" | "CO_SCHOLASTIC"
  >("CORE");
  const [newSubjectClassTarget, setNewSubjectClassTarget] = useState<string>("NONE");
  const [newSubjectMultiClassIds, setNewSubjectMultiClassIds] = useState<string[]>([]);
  const [mapSubjectId, setMapSubjectId] = useState(initialSnapshot.subjects[0]?.id ?? "");
  const [newSessionName, setNewSessionName] = useState("");

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return snapshot.classes;
    return snapshot.classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subjects.some((s) => s.subjectName.toLowerCase().includes(q)),
    );
  }, [snapshot.classes, classSearch]);

  const activeClass = useMemo(
    () =>
      snapshot.classes.find((c) => c.id === selectedClassId) ??
      snapshot.classes[0] ??
      null,
    [snapshot.classes, selectedClassId],
  );

  const activeSection = useMemo(
    () =>
      activeClass?.sections.find((s) => s.id === selectedSectionId) ??
      activeClass?.sections[0] ??
      null,
    [activeClass, selectedSectionId],
  );

  const visibleStudents = useMemo(() => {
    const list = activeSection?.students ?? [];
    const q = studentSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q),
    );
  }, [activeSection, studentSearch]);

  const activeStudent = useMemo(
    () =>
      visibleStudents.find((s) => s.id === selectedStudentId) ??
      visibleStudents[0] ??
      null,
    [visibleStudents, selectedStudentId],
  );

  const handleSessionChange = async (year: string) => {
    setBusy(true);
    try {
      const res = await fetch(
        `${apiBase}?academicYear=${encodeURIComponent(year)}`,
      );
      const json = await res.json();
      if (res.ok && json?.snapshot) {
        setSnapshot(json.snapshot);
        setSelectedClassId(json.snapshot.classes[0]?.id ?? "");
        setSelectedSectionId(json.snapshot.classes[0]?.sections[0]?.id ?? "");
        setSelectedStudentId(
          json.snapshot.classes[0]?.sections[0]?.students[0]?.id ?? "",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const runMutation = async (payload: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Update failed.");
      }
      setSnapshot(json.snapshot);
      notify("ok", okMsg);
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const switchSection = (next: AcademicNavSection) => {
    setSection(next);
    onNavigateSection?.(next);
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
            toast.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header + Breadcrumb Tree Path */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav
            aria-label="Academic hierarchy breadcrumb"
            className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]"
          >
            <span>Academics</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#663CF6] dark:text-[#C4B5FD]">
              {activeClass?.name ?? "Classes & Subjects"}
            </span>
            {activeSection && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>Section {activeSection.name}</span>
              </>
            )}
            {activeStudent && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{activeStudent.studentName}</span>
                <ChevronRight className="h-3 w-3" />
                <span>Parents ({activeStudent.guardians.length})</span>
              </>
            )}
          </nav>
          <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Academics &amp; Curriculum Tree
          </h1>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Navigate Classes &amp; Subjects &rarr; Sections &rarr; Students &rarr; Parents &amp; Guardians in one unified hierarchy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
            Academic Year:
          </label>
          <select
            aria-label="Select academic year"
            value={snapshot.activeAcademicYear}
            onChange={(e) => handleSessionChange(e.target.value)}
            className={CONTROL_INPUT}
          >
            {snapshot.sessions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} {s.isCurrent ? "(Current)" : ""}
              </option>
            ))}
          </select>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-[#663CF6]" />}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StudentKpiCard
          label="Classes"
          value={snapshot.kpis.totalClasses}
          icon={<GraduationCap className="h-5 w-5" />}
          tone="violet"
          subtitle={snapshot.activeAcademicYear}
        />
        <StudentKpiCard
          label="Subjects"
          value={snapshot.kpis.totalSubjects}
          icon={<BookOpen className="h-5 w-5" />}
          tone="sky"
          subtitle="Active curriculum"
        />
        <StudentKpiCard
          label="Sections"
          value={snapshot.kpis.totalSections}
          icon={<Layers className="h-5 w-5" />}
          tone="amber"
          subtitle="Class divisions"
        />
        <StudentKpiCard
          label="Students"
          value={snapshot.kpis.totalStudents}
          icon={<Users className="h-5 w-5" />}
          tone="emerald"
          subtitle="Enrolled in session"
        />
        <StudentKpiCard
          label="Parents Linked"
          value={snapshot.kpis.totalLinkedGuardians}
          icon={<UserCheck className="h-5 w-5" />}
          tone="pink"
          subtitle="Canonical guardians"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "explorer", label: "Academic Explorer (Tree)", icon: FolderTree },
            { id: "classes", label: "Classes & Subjects", icon: BookOpen },
            { id: "sections", label: "Sections & Teachers", icon: Layers },
            { id: "years", label: "Academic Years", icon: Calendar },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchSection(tab.id)}
              className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                active
                  ? "bg-gradient-to-r from-[#663CF6] to-[#7C5CFC] text-white shadow-md"
                  : "border border-[#D6DBF0] bg-white/90 text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#B4BDD9]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INTERACTIVE TREE EXPLORER */}
      {section === "explorer" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Column 1: Classes & Subject Counts */}
          <div className={`${STUDENT_CARD_SURFACE} xl:col-span-3 p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                1. All Classes
              </h2>
              <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                {filteredClasses.length}
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#76799C]" />
              <input
                type="search"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Filter class or subject..."
                className={`${CONTROL_INPUT} w-full pl-8`}
              />
            </div>

            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredClasses.map((cls) => {
                const isSelected = activeClass?.id === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      const firstSec = cls.sections[0];
                      setSelectedSectionId(firstSec?.id ?? "");
                      setSelectedStudentId(firstSec?.students[0]?.id ?? "");
                    }}
                    className={`w-full rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      isSelected
                        ? "border-[#663CF6] bg-[#FAF8FE] shadow-xs dark:border-[#8B5CF6] dark:bg-[#1E1A44]"
                        : "border-[#DFE3F5] bg-white hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#10142C]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {cls.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                        {cls.studentCount} stu
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                      {cls.subjects.length} subjects &middot; {cls.sections.length} sections
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Selected Class -> Subjects & Sections */}
          <div className="xl:col-span-3 space-y-4">
            {/* Subjects Card */}
            <div className={`${STUDENT_CARD_SURFACE} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                  2a. Subjects ({activeClass?.subjects.length ?? 0})
                </h2>
              </div>

              {activeClass && activeClass.subjects.length === 0 ? (
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  No subjects mapped to {activeClass.name} yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {activeClass?.subjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/70 px-2.5 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                          {sub.subjectName}{" "}
                          <span className="font-mono text-[10px] text-[#663CF6] dark:text-[#C4B5FD]">
                            ({sub.subjectCode})
                          </span>
                        </p>
                        <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                          {sub.teacherName || "Teacher TBD"} &middot; {sub.weeklyPeriods}/wk
                        </p>
                      </div>
                      {permissions.canWrite && (
                        <button
                          type="button"
                          onClick={() =>
                            runMutation(
                              { action: "REMOVE_CLASS_SUBJECT", assignmentId: sub.id },
                              `Removed ${sub.subjectName}.`,
                            )
                          }
                          aria-label={`Remove ${sub.subjectName}`}
                          className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {permissions.canWrite && activeClass && snapshot.subjects.length > 0 && (
                <div className="pt-2 border-t border-[#DFE3F5] dark:border-[#232746] space-y-2">
                  <div className="flex gap-1.5">
                    <select
                      aria-label="Map subject to class"
                      value={mapSubjectId}
                      onChange={(e) => setMapSubjectId(e.target.value)}
                      className={`${CONTROL_INPUT} flex-1 min-w-0`}
                    >
                      {snapshot.subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy || !mapSubjectId}
                      onClick={() =>
                        runMutation(
                          {
                            action: "ASSIGN_CLASS_SUBJECT",
                            classId: activeClass.id,
                            className: activeClass.name,
                            subjectId: mapSubjectId,
                            academicYear: snapshot.activeAcademicYear,
                            teacherName: null,
                            weeklyPeriods: 5,
                            maxMarks: 100,
                            passMarks: 33,
                            isCompulsory: true,
                          },
                          `Mapped subject to ${activeClass.name}.`,
                        )
                      }
                      className="rounded-[10px] bg-[#663CF6] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#5B35F5] cursor-pointer"
                    >
                      + Map
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sections Card */}
            <div className={`${STUDENT_CARD_SURFACE} p-4 space-y-3`}>
              <h2 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                2b. Sections ({activeClass?.sections.length ?? 0})
              </h2>
              <div className="space-y-1.5">
                {activeClass?.sections.map((sec) => {
                  const isSel = activeSection?.id === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        setSelectedStudentId(sec.students[0]?.id ?? "");
                      }}
                      className={`w-full rounded-xl border p-2.5 text-left transition cursor-pointer ${
                        isSel
                          ? "border-[#663CF6] bg-[#FAF8FE] dark:border-[#8B5CF6] dark:bg-[#1E1A44]"
                          : "border-[#DFE3F5] bg-white hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#10142C]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                          Section {sec.name}
                        </span>
                        <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                          {sec.students.length} / {sec.capacity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                        {sec.classTeacherName || "Class Teacher Unassigned"}
                        {sec.roomNumber ? ` · Room ${sec.roomNumber}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Students in Selected Section */}
          <div className={`${STUDENT_CARD_SURFACE} xl:col-span-3 p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                3. Students {activeSection ? `(${activeClass?.name} - ${activeSection.name})` : ""}
              </h2>
              <span className="text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                {visibleStudents.length}
              </span>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#76799C]" />
              <input
                type="search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student or Adm No..."
                className={`${CONTROL_INPUT} w-full pl-8`}
              />
            </div>

            {visibleStudents.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                No students in this section yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {visibleStudents.map((stu) => {
                  const isSel = activeStudent?.id === stu.id;
                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => setSelectedStudentId(stu.id)}
                      className={`w-full rounded-xl border p-2.5 text-left transition cursor-pointer ${
                        isSel
                          ? "border-[#663CF6] bg-[#FAF8FE] dark:border-[#8B5CF6] dark:bg-[#1E1A44]"
                          : "border-[#DFE3F5] bg-white hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#10142C]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                          {stu.studentName}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                          {stu.rollNumber ? `#${stu.rollNumber}` : stu.admissionNumber}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                        {stu.admissionNumber} &middot; {stu.guardians.length} guardian(s)
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 4: Parents & Guardians of Selected Student */}
          <div className={`${STUDENT_CARD_SURFACE} xl:col-span-3 p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wide text-[#08093B] dark:text-[#F3F5FF]">
                4. Parents &amp; Guardians
              </h2>
              {activeStudent && (
                <Link
                  href={`/${encodeURIComponent(snapshot.schoolSlug)}/students/profile/${encodeURIComponent(activeStudent.id)}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#663CF6] hover:underline dark:text-[#C4B5FD]"
                >
                  <span>Student 360&deg;</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>

            {!activeStudent ? (
              <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Select a student to inspect linked parents and guardians.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeStudent.guardians.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/80 p-3 space-y-2 dark:border-[#272B4D] dark:bg-[#10142C]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/${encodeURIComponent(snapshot.schoolSlug)}/parents/${encodeURIComponent(g.id)}`}
                          className="inline-flex items-center gap-1 text-xs font-black text-[#08093B] hover:text-[#663CF6] dark:text-[#F3F5FF] dark:hover:text-[#C4B5FD]"
                        >
                          <span>{g.fullName}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                          {g.relation} {g.isPrimary ? "· Primary" : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {g.portalStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-[#4D5072] dark:text-[#B4BDD9]">
                      <p className="inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-[#663CF6]" />
                        {g.phone}
                      </p>
                      {g.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-[#663CF6]" />
                          {g.email}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                      {g.restrictedContact ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          <ShieldAlert className="h-2.5 w-2.5" /> Custody Alert
                        </span>
                      ) : g.canPickup ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Pickup OK
                        </span>
                      ) : null}
                      {g.isFeePayer && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Fee Payer
                        </span>
                      )}
                    </div>

                    {g.siblingNames.length > 0 && (
                      <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                        Siblings: {g.siblingNames.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES & SUBJECTS MANAGEMENT */}
      {section === "classes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Create Class ({snapshot.activeAcademicYear})
            </h2>
            {permissions.canWrite && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Class Name (e.g., Class X)"
                  className={`${CONTROL_INPUT} flex-1 min-w-[160px]`}
                />
                <input
                  type="text"
                  value={newClassDept}
                  onChange={(e) => setNewClassDept(e.target.value)}
                  placeholder="Department (Secondary)"
                  className={`${CONTROL_INPUT} w-36`}
                />
                <button
                  type="button"
                  disabled={busy || !newClassName.trim()}
                  onClick={() => {
                    runMutation(
                      {
                        action: "CREATE_CLASS",
                        academicYear: snapshot.activeAcademicYear,
                        name: newClassName.trim(),
                        department: newClassDept.trim() || "General",
                        displayOrder: snapshot.classes.length + 1,
                        defaultSections: ["A", "B"],
                      },
                      `Class "${newClassName.trim()}" created.`,
                    );
                    setNewClassName("");
                  }}
                  className="inline-flex items-center gap-1 rounded-[10px] bg-[#663CF6] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Class
                </button>
              </div>
            )}

            <div className="space-y-2">
              {snapshot.classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/70 px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div>
                    <p className="font-black text-[#08093B] dark:text-[#F3F5FF]">{c.name}</p>
                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                      {c.department} &middot; {c.sections.length} sections &middot; {c.subjects.length} subjects
                    </p>
                  </div>
                  <span className="font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                    {c.studentCount} students
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Subject Catalog
            </h2>
            {permissions.canWrite && (
              <div className="space-y-2.5 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/60 p-3 dark:border-[#272B4D] dark:bg-[#10142C]/60">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="Code (PHY)"
                    className={`${CONTROL_INPUT} w-24`}
                  />
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Subject Name (Physics)"
                    className={`${CONTROL_INPUT} flex-1 min-w-[140px]`}
                  />
                  <select
                    aria-label="Subject category"
                    value={newSubjectCategory}
                    onChange={(e) =>
                      setNewSubjectCategory(e.target.value as typeof newSubjectCategory)
                    }
                    className={CONTROL_INPUT}
                  >
                    <option value="CORE">Core</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="LAB">Lab</option>
                    <option value="CO_SCHOLASTIC">Co-Scholastic</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Select class for subject"
                    value={newSubjectClassTarget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewSubjectClassTarget(val);
                      if (val !== "MULTI") {
                        setNewSubjectMultiClassIds([]);
                      }
                    }}
                    className={`${CONTROL_INPUT} flex-1 min-w-[180px]`}
                  >
                    <option value="NONE">Catalog Only (Assign Class Later)</option>
                    <option value="ALL">All Classes ({snapshot.classes.length})</option>
                    <option value="MULTI">Select Multiple Classes...</option>
                    {snapshot.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={busy || !newSubjectCode.trim() || !newSubjectName.trim()}
                    onClick={() => {
                      const selectedClasses =
                        newSubjectClassTarget === "ALL"
                          ? snapshot.classes
                          : newSubjectClassTarget === "MULTI"
                            ? snapshot.classes.filter((c) => newSubjectMultiClassIds.includes(c.id))
                            : newSubjectClassTarget !== "NONE"
                              ? snapshot.classes.filter((c) => c.id === newSubjectClassTarget)
                              : [];

                      runMutation(
                        {
                          action: "CREATE_SUBJECT",
                          code: newSubjectCode.trim(),
                          name: newSubjectName.trim(),
                          category: newSubjectCategory,
                          defaultMaxMarks: 100,
                          defaultPassMarks: 33,
                          academicYear: snapshot.activeAcademicYear,
                          ...(selectedClasses.length > 0
                            ? {
                                classIds: selectedClasses.map((c) => c.id),
                                classNames: selectedClasses.map((c) => c.name),
                              }
                            : {}),
                        },
                        selectedClasses.length > 0
                          ? `Subject "${newSubjectName.trim()}" added & assigned to ${selectedClasses.length} class(es).`
                          : `Subject "${newSubjectName.trim()}" added.`,
                      );
                      setNewSubjectCode("");
                      setNewSubjectName("");
                      setNewSubjectClassTarget("NONE");
                      setNewSubjectMultiClassIds([]);
                    }}
                    className="inline-flex items-center gap-1 rounded-[10px] bg-[#663CF6] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Subject
                  </button>
                </div>

                {newSubjectClassTarget === "MULTI" && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {snapshot.classes.map((cls) => {
                      const checked = newSubjectMultiClassIds.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition ${
                            checked
                              ? "border-[#663CF6] bg-[#EDE7FF] text-[#663CF6] dark:border-[#8B5CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                              : "border-[#D6DBF0] bg-white text-[#4D5072] dark:border-[#313761] dark:bg-[#141731] dark:text-[#9DA6CC]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setNewSubjectMultiClassIds((prev) =>
                                e.target.checked
                                  ? [...prev, cls.id]
                                  : prev.filter((id) => id !== cls.id),
                              );
                            }}
                            className="rounded accent-[#663CF6]"
                          />
                          <span>{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {snapshot.subjects.map((sub) => {
                const mappedClasses = snapshot.classes.filter((c) =>
                  c.subjects.some((cs) => cs.subjectId === sub.id),
                );
                return (
                  <div
                    key={sub.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/70 px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                  >
                    <div>
                      <p className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {sub.name}{" "}
                        <span className="font-mono text-[10px] text-[#663CF6] dark:text-[#C4B5FD]">
                          ({sub.code})
                        </span>
                      </p>
                      <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                        {sub.category} &middot; Pass {sub.defaultPassMarks}/{sub.defaultMaxMarks}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mappedClasses.length === 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#76799C] dark:bg-[#1B1F3F] dark:text-[#9DA6CC]">
                          Unassigned
                        </span>
                      ) : (
                        mappedClasses.map((mc) => (
                          <span
                            key={mc.id}
                            className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                          >
                            {mc.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS & TEACHERS */}
      {section === "sections" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Sections &amp; Class Teachers ({snapshot.activeAcademicYear})
            </h2>
            {permissions.canWrite && activeClass && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Section (e.g., C)"
                  className={`${CONTROL_INPUT} w-28`}
                />
                <input
                  type="text"
                  value={newSectionTeacher}
                  onChange={(e) => setNewSectionTeacher(e.target.value)}
                  placeholder="Class Teacher"
                  className={`${CONTROL_INPUT} w-40`}
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={newSectionCapacity}
                  onChange={(e) => setNewSectionCapacity(Number(e.target.value) || 40)}
                  className={`${CONTROL_INPUT} w-20`}
                />
                <button
                  type="button"
                  disabled={busy || !newSectionName.trim()}
                  onClick={() => {
                    runMutation(
                      {
                        action: "CREATE_SECTION",
                        classId: activeClass.id,
                        className: activeClass.name,
                        academicYear: snapshot.activeAcademicYear,
                        name: newSectionName.trim(),
                        capacity: newSectionCapacity,
                        classTeacherName: newSectionTeacher.trim() || null,
                      },
                      `Section ${newSectionName.trim()} added to ${activeClass.name}.`,
                    );
                    setNewSectionName("");
                    setNewSectionTeacher("");
                  }}
                  className="inline-flex items-center gap-1 rounded-[10px] bg-[#663CF6] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add to {activeClass.name}
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-extrabold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Section</th>
                  <th className="px-3 py-2.5">Class Teacher</th>
                  <th className="px-3 py-2.5">Students / Capacity</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {snapshot.classes.flatMap((c) =>
                  c.sections.map((sec) => (
                    <tr key={sec.id}>
                      <td className="px-3 py-2.5 font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {c.name}
                      </td>
                      <td className="px-3 py-2.5 font-bold">Section {sec.name}</td>
                      <td className="px-3 py-2.5 text-[#4D5072] dark:text-[#B4BDD9]">
                        {sec.classTeacherName || "Unassigned"}
                      </td>
                      <td className="px-3 py-2.5 font-semibold">
                        {sec.students.length} / {sec.capacity}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {sec.status}
                        </span>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC YEARS */}
      {section === "years" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                Academic Years &amp; Sessions
              </h2>
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Preserve historical class structures and configure upcoming school years.
              </p>
            </div>
            {permissions.canManageSettings && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="2027-2028"
                  className={`${CONTROL_INPUT} w-32`}
                />
                <button
                  type="button"
                  disabled={busy || !newSessionName.trim()}
                  onClick={() => {
                    runMutation(
                      {
                        action: "CREATE_SESSION",
                        name: newSessionName.trim(),
                        isCurrent: false,
                        status: "UPCOMING",
                      },
                      `Session "${newSessionName.trim()}" added.`,
                    );
                    setNewSessionName("");
                  }}
                  className="inline-flex items-center gap-1 rounded-[10px] bg-[#663CF6] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Session
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {snapshot.sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 flex items-center justify-between dark:border-[#272B4D] dark:bg-[#10142C]"
              >
                <div>
                  <p className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    {s.status} {s.isCurrent ? "· Active Default" : ""}
                  </p>
                </div>
                {s.isCurrent ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  permissions.canManageSettings && (
                    <button
                      type="button"
                      onClick={() =>
                        runMutation(
                          { action: "SET_CURRENT_SESSION", sessionId: s.id },
                          `${s.name} set as active academic year.`,
                        )
                      }
                      className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#141731] dark:text-[#C4B5FD]"
                    >
                      Set Current
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
