"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ArrowRightLeft,
  ArrowUpDown,
  Award,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  IdCard,
  Layers,
  Plus,
  Settings,
  ShieldAlert,
  TrendingUp,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  StudentDashboardAnalytics,
  StudentFilterParams,
  StudentListSubTab,
  StudentNavSection,
  StudentRecord,
  StudentSortField,
  StudentWorkspaceSnapshot,
} from "@/modules/students/types";
import {
  computeStudentAnalytics,
  filterAndSortStudents,
  normalizeGenderLabel,
} from "@/modules/students/analytics";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
  StudentEnrolmentTrendChart,
  StudentFilterStrip,
  StudentGradeBarChart,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";
import {
  AddEditStudentModal,
  ImportStudentsModal,
  StudentIdCardsModal,
} from "@/modules/students/components/student-modals";
import { StudentProfileDossier } from "@/modules/students/components/student-profile-dossier";
import {
  StudentGroupsPanel,
  StudentPromotionPanel,
  StudentSettingsPanel,
  StudentTransferPanel,
} from "@/modules/students/components/student-lifecycle-tabs";

const SECTION_META: Record<
  StudentNavSection,
  { label: string; title: string; subtitle: string }
> = {
  dashboard: {
    label: "Student Dashboard",
    title: "Student Dashboard",
    subtitle: "Get a complete overview of all students, enrolment, transfers, and key insights.",
  },
  list: {
    label: "Student List",
    title: "Student List",
    subtitle: "View, search and manage all students in your school.",
  },
  profile: {
    label: "Student Profile",
    title: "Student Profile",
    subtitle: "Inspect personal info, guardian contacts, enrollments, fees, and lifecycle history.",
  },
  enrolment: {
    label: "Student Enrolment",
    title: "Student Enrolment",
    subtitle: "Manage new admissions, grade-section seat allocation, and CSV onboarding.",
  },
  promotion: {
    label: "Student Promotion",
    title: "Student Promotion",
    subtitle: "Promote, retain, or graduate cohorts into the next academic year.",
  },
  transfer: {
    label: "Student Transfer",
    title: "Student Transfer",
    subtitle: "Issue Transfer Certificates (TC) and record inbound or outbound school transfers.",
  },
  inactive: {
    label: "Student Inactive",
    title: "Inactive Students",
    subtitle: "Review inactive or withdrawn student records and restore active status when needed.",
  },
  alumni: {
    label: "Alumni",
    title: "Alumni Directory",
    subtitle: "Browse graduated cohorts with passing year and historical academic records.",
  },
  settings: {
    label: "Student Settings",
    title: "Student Settings",
    subtitle: "Configure sections per grade, roll numbering, TC requirements, and ID cards.",
  },
};

const TOP_PILL_TABS: Array<{
  section: StudentNavSection;
  label: string;
  icon: React.ReactNode;
}> = [
  { section: "dashboard", label: "Overview", icon: <Users className="h-3.5 w-3.5" /> },
  { section: "list", label: "Student List", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { section: "enrolment", label: "Enrolment", icon: <UserPlus className="h-3.5 w-3.5" /> },
  { section: "promotion", label: "Promotion", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { section: "transfer", label: "Transfer", icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
  { section: "alumni", label: "Alumni", icon: <Award className="h-3.5 w-3.5" /> },
  { section: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
];

function statusPillClasses(status: StudentRecord["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "INACTIVE":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
    case "TRANSFERRED":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300";
    case "ALUMNI":
      return "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300";
    default:
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300";
  }
}

export function StudentManagementWorkspace({
  mode,
  schoolId,
  initialSnapshot,
  initialAnalytics,
  initialSection = "dashboard",
  initialStudentId = null,
  permissions,
  sectionHrefBuilder,
  onSelectedStudentUrlChange,
}: {
  mode: "school" | "platform";
  schoolId: string;
  initialSnapshot: StudentWorkspaceSnapshot;
  initialAnalytics?: StudentDashboardAnalytics;
  initialSection?: StudentNavSection;
  initialStudentId?: string | null;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canPromote: boolean;
    canTransfer: boolean;
    canExport: boolean;
    canManageSettings: boolean;
  };
  sectionHrefBuilder?: (section: StudentNavSection, studentId?: string) => string;
  onSelectedStudentUrlChange?: (section: StudentNavSection, studentId?: string | null) => void;
}) {
  const [snapshot, setSnapshot] = useState<StudentWorkspaceSnapshot>(initialSnapshot);
  const [activeSection, setActiveSection] = useState<StudentNavSection>(initialSection);
  const [listSubTab, setListSubTab] = useState<StudentListSubTab>("list");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    initialStudentId || initialSnapshot.students[0]?.id || null,
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filters, setFilters] = useState<StudentFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "admissionDate",
    sortDir: "desc",
    status:
      initialSection === "inactive"
        ? "INACTIVE"
        : initialSection === "alumni"
          ? "ALUMNI"
          : "ALL",
  });
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [idCardStudents, setIdCardStudents] = useState<StudentRecord[] | null>(null);

  const apiBase =
    mode === "platform"
      ? `/api/platform/schools/${encodeURIComponent(schoolId)}/students`
      : `/api/school/students`;

  const reloadWorkspace = async () => {
    const res = await fetch(
      mode === "platform" ? apiBase : `${apiBase}/overview`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh student data.");
    }
    if (data.snapshot) {
      setSnapshot(data.snapshot);
    }
  };

  const navigateSection = (section: StudentNavSection, stuId?: string | null) => {
    setActiveSection(section);
    if (stuId !== undefined) {
      setSelectedStudentId(stuId);
    }
    if (section === "inactive") {
      setFilters((f) => ({ ...f, status: "INACTIVE", page: 1 }));
    } else if (section === "alumni") {
      setFilters((f) => ({ ...f, status: "ALUMNI", page: 1 }));
    } else if (section === "list" || section === "dashboard") {
      setFilters((f) => ({ ...f, status: "ALL", page: 1 }));
    }
    onSelectedStudentUrlChange?.(section, stuId ?? undefined);
  };

  const updateFilters = (patch: Partial<StudentFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const analytics = useMemo(() => {
    const hasCustomFilters = Boolean(
      filters.academicYear ||
        filters.grade ||
        filters.section ||
        (filters.status && filters.status !== "ALL") ||
        filters.gender ||
        filters.search ||
        filters.fromDate ||
        filters.groupId,
    );
    if (!hasCustomFilters && initialAnalytics && snapshot === initialSnapshot) {
      return initialAnalytics;
    }
    return computeStudentAnalytics(snapshot.students, filters, snapshot.grades);
  }, [snapshot, filters, initialAnalytics, initialSnapshot]);

  const tableResult = useMemo(() => {
    const allMatching = filterAndSortStudents(snapshot.students, filters);
    const pageSize = filters.pageSize || 10;
    const total = allMatching.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, filters.page || 1), totalPages);
    const start = (page - 1) * pageSize;
    return {
      allMatching,
      items: allMatching.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
    };
  }, [snapshot.students, filters]);

  const selectedProfileStudent = useMemo(
    () => snapshot.students.find((s) => s.id === selectedStudentId) || null,
    [snapshot.students, selectedStudentId],
  );

  const handleSort = (field: StudentSortField) => {
    updateFilters({
      sortBy: field,
      sortDir:
        filters.sortBy === field && filters.sortDir === "asc" ? "desc" : "asc",
      page: 1,
    });
  };

  const handleCreateOrEdit = async (payload: Record<string, unknown>) => {
    const isEdit = modalMode === "edit" && editingStudent;
    const url =
      mode === "platform"
        ? apiBase
        : isEdit
          ? `${apiBase}/${encodeURIComponent(editingStudent.id)}`
          : apiBase;

    const body =
      mode === "platform"
        ? isEdit
          ? { action: "UPDATE_STUDENT", studentId: editingStudent.id, ...payload }
          : { action: "CREATE_STUDENT", ...payload }
        : payload;

    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save student.");
    await reloadWorkspace();
    setFeedback({
      kind: "ok",
      text: isEdit ? "Student record updated." : "Student enrolled successfully.",
    });
  };

  const handleImport = async (rows: Array<Record<string, unknown>>) => {
    const url = mode === "platform" ? apiBase : `${apiBase}/import`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "platform" ? { action: "IMPORT", rows } : { rows },
      ),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Import failed.");
    await reloadWorkspace();
    setFeedback({
      kind: "ok",
      text: `Imported ${data.importedCount ?? rows.length} student record(s).`,
    });
  };

  const handlePromote = async (payload: {
    studentIds: string[];
    targetAcademicYear: string;
    targetGrade: string;
    targetSection: string;
    mode: "PROMOTE" | "RETAIN" | "GRADUATE_ALUMNI";
    remarks?: string;
  }) => {
    const url = mode === "platform" ? apiBase : `${apiBase}/promote`;
    const bodyPayload = {
      studentIds: payload.studentIds,
      toAcademicYear: payload.targetAcademicYear,
      toGrade: payload.targetGrade,
      toSection: payload.targetSection,
      markAsAlumni: payload.mode === "GRADUATE_ALUMNI",
      remarks: payload.remarks,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "platform" ? { action: "PROMOTE", ...bodyPayload } : bodyPayload,
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: "err", text: data.error || "Promotion failed." });
      return;
    }
    await reloadWorkspace();
    setFeedback({
      kind: "ok",
      text: `Updated ${data.promotedCount ?? payload.studentIds.length} student record(s).`,
    });
  };

  const handleTransfer = async (payload: {
    studentId: string;
    transferType: "TRANSFER_IN" | "TRANSFER_OUT";
    transferDate: string;
    tcNumber?: string;
    counterpartySchool?: string;
    reason?: string;
    clearanceStatus?: string;
    toGrade?: string;
  }) => {
    const url = mode === "platform" ? apiBase : `${apiBase}/transfer`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "platform" ? { action: "TRANSFER", ...payload } : payload,
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: "err", text: data.error || "Transfer failed." });
      return;
    }
    await reloadWorkspace();
    setFeedback({ kind: "ok", text: "Transfer event recorded cleanly." });
  };

  const handleBulkAction = async (
    action: "SET_STATUS" | "ASSIGN_SECTION" | "ADD_TO_GROUP",
    extra: Record<string, unknown>,
  ) => {
    if (selectedRows.length === 0) return;
    const url = mode === "platform" ? apiBase : `${apiBase}/bulk`;
    const payload = { studentIds: selectedRows, action, ...extra };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "platform"
          ? { ...payload, action: "BULK", bulkAction: action }
          : payload,
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: "err", text: data.error || "Bulk update failed." });
      return;
    }
    await reloadWorkspace();
    setSelectedRows([]);
    setFeedback({ kind: "ok", text: "Bulk action applied to selected students." });
  };

  const handleCreateGroup = async (payload: {
    name: string;
    category: string;
    colorToken: string;
    description?: string;
    memberStudentIds?: string[];
  }) => {
    const url = mode === "platform" ? apiBase : `${apiBase}/groups`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "platform" ? { action: "CREATE_GROUP", ...payload } : payload,
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: "err", text: data.error || "Group creation failed." });
      return;
    }
    await reloadWorkspace();
    setFeedback({ kind: "ok", text: `Student group "${payload.name}" created.` });
  };

  const handleSaveSettings = async (payload: Record<string, unknown>) => {
    const url = mode === "platform" ? apiBase : `${apiBase}/settings`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "platform" ? { action: "UPDATE_SETTINGS", ...payload } : payload,
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: "err", text: data.error || "Failed to update settings." });
      return;
    }
    await reloadWorkspace();
    setFeedback({ kind: "ok", text: "Student settings saved." });
  };

  const handleExportCsv = () => {
    const headers = [
      "Admission No",
      "Student Name",
      "Grade",
      "Section",
      "Roll No",
      "Gender",
      "Status",
      "Academic Year",
      "Admission Date",
      "Guardian Name",
      "Guardian Phone",
    ];
    const rows = tableResult.allMatching.map((s) =>
      [
        s.admissionNumber,
        s.studentName,
        s.currentGrade,
        s.currentSection,
        s.currentRollNumber || "",
        normalizeGenderLabel(s.gender),
        s.status,
        s.currentAcademicYear,
        s.admissionDate.slice(0, 10),
        s.guardianName,
        s.guardianPhone,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snapshot.schoolSlug || "school"}-students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const meta = SECTION_META[activeSection];

  return (
    <div className="space-y-5">
      {/* Header Row matching reference designs */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
            <span>Students</span>
            <span className="mx-1.5">&gt;</span>
            <span className="text-[#663CF6] dark:text-[#C4B5FD]">{meta.label}</span>
          </p>
          <h1 className="mt-0.5 text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            {meta.title}
          </h1>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">{meta.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canCreate && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setModalMode("create");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(91,53,245,0.28)] hover:opacity-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Student</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
              >
                <Upload className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>Import Students</span>
              </button>
            </>
          )}
          {permissions.canExport && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
            >
              <Download className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Download Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Section Pill Tabs */}
      <div className={`${STUDENT_CARD_SURFACE} p-1.5 flex flex-wrap items-center gap-1.5`}>
        {TOP_PILL_TABS.map((tab) => {
          const active = activeSection === tab.section;
          const cls = `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            active
              ? "bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] text-white shadow-sm"
              : "text-[#4D5072] hover:bg-[#F3EFFF] hover:text-[#663CF6] dark:text-[#A9B2D8] dark:hover:bg-[#1F2248] dark:hover:text-[#F3F5FF]"
          }`;
          if (sectionHrefBuilder) {
            return (
              <Link
                key={tab.section}
                href={sectionHrefBuilder(tab.section) as Route}
                onClick={() => navigateSection(tab.section)}
                className={cls}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            );
          }
          return (
            <button
              key={tab.section}
              type="button"
              onClick={() => navigateSection(tab.section)}
              className={cls}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold ${
            feedback.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Filter Strip for analytics & listing */}
      {(activeSection === "dashboard" ||
        activeSection === "list" ||
        activeSection === "enrolment" ||
        activeSection === "inactive" ||
        activeSection === "alumni") && (
        <StudentFilterStrip
          filters={filters}
          onChange={updateFilters}
          academicYears={snapshot.academicYears}
          grades={snapshot.grades}
          sections={snapshot.sections}
        />
      )}

      {/* KPI Row (5 cards matching references) */}
      {(activeSection === "dashboard" ||
        activeSection === "list" ||
        activeSection === "enrolment") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StudentKpiCard
            label="Total Students"
            value={analytics.kpis.totalStudents}
            deltaPct={analytics.kpis.totalGrowthPct}
            icon={<Users className="h-5 w-5" />}
            tone="violet"
          />
          <StudentKpiCard
            label="Active Students"
            value={analytics.kpis.activeStudents}
            deltaPct={analytics.kpis.activeGrowthPct}
            icon={<GraduationCap className="h-5 w-5" />}
            tone="sky"
          />
          {activeSection === "list" ? (
            <StudentKpiCard
              label="Inactive Students"
              value={analytics.kpis.inactiveStudents}
              deltaPct={analytics.kpis.inactiveGrowthPct}
              icon={<UserMinus className="h-5 w-5" />}
              tone="amber"
            />
          ) : (
            <StudentKpiCard
              label="New Enrolments"
              value={analytics.kpis.newEnrolments}
              deltaPct={analytics.kpis.newEnrolmentsGrowthPct}
              icon={<UserPlus className="h-5 w-5" />}
              tone="emerald"
            />
          )}
          <StudentKpiCard
            label={activeSection === "list" ? "New Enrolments" : "Transferred"}
            value={
              activeSection === "list"
                ? analytics.kpis.newEnrolments
                : analytics.kpis.transferredCount
            }
            deltaPct={
              activeSection === "list"
                ? analytics.kpis.newEnrolmentsGrowthPct
                : analytics.kpis.transferredGrowthPct
            }
            icon={
              activeSection === "list" ? (
                <UserPlus className="h-5 w-5" />
              ) : (
                <ArrowRightLeft className="h-5 w-5" />
              )
            }
            tone="emerald"
          />
          <StudentKpiCard
            label={activeSection === "list" ? "Transferred" : "Alumni"}
            value={
              activeSection === "list"
                ? analytics.kpis.transferredCount
                : analytics.kpis.alumniCount
            }
            deltaPct={
              activeSection === "list"
                ? analytics.kpis.transferredGrowthPct
                : analytics.kpis.alumniGrowthPct
            }
            icon={
              activeSection === "list" ? (
                <ArrowRightLeft className="h-5 w-5" />
              ) : (
                <Award className="h-5 w-5" />
              )
            }
            tone="pink"
          />
        </div>
      )}

      {/* DASHBOARD CHARTS (Reference 1) */}
      {activeSection === "dashboard" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <StudentEnrolmentTrendChart points={analytics.enrolmentTrend} />
            </div>
            <StudentDonutChart
              title="Students by Status"
              centerTotal={analytics.kpis.totalStudents}
              slices={analytics.statusSlices}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <StudentGradeBarChart
                title="Students by Grade"
                bars={analytics.gradeBars}
                onViewDetails={() => navigateSection("list")}
              />
            </div>
            <StudentDonutChart
              title="Gender Distribution"
              centerTotal={analytics.kpis.totalStudents}
              slices={analytics.genderSlices}
            />
          </div>
        </>
      )}

      {/* STUDENT LIST SUB-TABS & 2-UP CHARTS (Reference 2) */}
      {activeSection === "list" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["list", "Student List", <Users key="l" className="h-3.5 w-3.5" />],
                ["bulk", "Bulk Actions", <CheckSquare key="b" className="h-3.5 w-3.5" />],
                ["groups", "Student Groups", <Layers key="g" className="h-3.5 w-3.5" />],
                ["cards", "ID Cards", <IdCard key="c" className="h-3.5 w-3.5" />],
                ["export", "Export & Reports", <FileSpreadsheet key="e" className="h-3.5 w-3.5" />],
              ] as Array<[StudentListSubTab, string, React.ReactNode]>
            ).map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "cards") {
                    setIdCardStudents(
                      selectedRows.length > 0
                        ? snapshot.students.filter((s) => selectedRows.includes(s.id))
                        : tableResult.items,
                    );
                    return;
                  }
                  if (key === "export") {
                    handleExportCsv();
                    return;
                  }
                  setListSubTab(key);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  listSubTab === key
                    ? "border-[#663CF6] bg-[#EDE7FF] text-[#5B35F5] dark:border-[#7C5CFC] dark:bg-[#251D4A] dark:text-[#E5DCFF]"
                    : "border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#9DA6CC]"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {listSubTab === "bulk" && permissions.canEdit && (
            <div className={`${STUDENT_CARD_SURFACE} p-4 flex flex-wrap items-center justify-between gap-3`}>
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {selectedRows.length} student(s) selected in the table below.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={selectedRows.length === 0}
                  onClick={() => handleBulkAction("SET_STATUS", { status: "ACTIVE" })}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 cursor-pointer"
                >
                  Mark Active
                </button>
                <button
                  type="button"
                  disabled={selectedRows.length === 0}
                  onClick={() =>
                    handleBulkAction("SET_STATUS", {
                      status: "INACTIVE",
                      reason: "Marked inactive via Bulk Actions",
                    })
                  }
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 cursor-pointer"
                >
                  Mark Inactive
                </button>
                {snapshot.sections.slice(0, 3).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={selectedRows.length === 0}
                    onClick={() => handleBulkAction("ASSIGN_SECTION", { section: sec })}
                    className="rounded-lg border border-[#CAD0EB] px-2.5 py-1.5 text-xs font-bold text-[#08093B] disabled:opacity-40 cursor-pointer dark:border-[#343B6B] dark:text-[#F3F5FF]"
                  >
                    Move to Sec {sec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listSubTab === "groups" ? (
            <StudentGroupsPanel
              groups={snapshot.groups}
              students={snapshot.students}
              canEdit={permissions.canEdit}
              onCreateGroup={handleCreateGroup}
              onAssignGroupToStudents={async (groupId, studentIds) => {
                const url = mode === "platform" ? apiBase : `${apiBase}/bulk`;
                await fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(
                    mode === "platform"
                      ? {
                          action: "BULK",
                          bulkAction: "ADD_TO_GROUP",
                          studentIds,
                          groupId,
                        }
                      : { studentIds, action: "ADD_TO_GROUP", groupId },
                  ),
                });
                await reloadWorkspace();
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <StudentGradeBarChart
                  title="Students by Grade"
                  bars={analytics.gradeBars}
                />
              </div>
              <StudentDonutChart
                title="Student Distribution"
                centerTotal={analytics.kpis.totalStudents}
                slices={analytics.genderSlices}
              />
            </div>
          )}
        </>
      )}

      {/* MAIN STUDENT DATA TABLE */}
      {(activeSection === "dashboard" ||
        activeSection === "list" ||
        activeSection === "enrolment" ||
        activeSection === "inactive" ||
        activeSection === "alumni") && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <Users className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>
                {activeSection === "dashboard"
                  ? "Recent Students (Latest Enrolments)"
                  : activeSection === "inactive"
                    ? `Inactive & Withdrawn Students (${tableResult.total})`
                    : activeSection === "alumni"
                      ? `Graduated Alumni (${tableResult.total})`
                      : `Students (${tableResult.total.toLocaleString("en-IN")})`}
              </span>
            </h3>
            {selectedRows.length > 0 && (
              <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-bold text-[#5B35F5] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                {selectedRows.length} selected
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E9F8] bg-[#FAF8FE]/80 text-[10px] font-extrabold uppercase tracking-wider text-[#4D5072] dark:border-[#232746] dark:bg-[#10142C] dark:text-[#9DA6CC]">
                  <th className="p-2.5 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all visible students"
                      checked={
                        tableResult.items.length > 0 &&
                        tableResult.items.every((s) => selectedRows.includes(s.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(tableResult.items.map((s) => s.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">
                    <button
                      type="button"
                      onClick={() => handleSort("admissionNumber")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Admission No.</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-2.5">
                    <button
                      type="button"
                      onClick={() => handleSort("studentName")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Student Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-2.5">
                    <button
                      type="button"
                      onClick={() => handleSort("grade")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Grade</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-2.5">Section</th>
                  <th className="p-2.5">Gender</th>
                  <th className="p-2.5">
                    <button
                      type="button"
                      onClick={() => handleSort("admissionDate")}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Date of Admission</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
                {tableResult.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-10 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]"
                    >
                      No student records match your active filters.
                    </td>
                  </tr>
                ) : (
                  tableResult.items.map((student, index) => {
                    const rowNum =
                      (tableResult.page - 1) * tableResult.pageSize + index + 1;
                    const genderLabel = normalizeGenderLabel(student.gender);
                    const checked = selectedRows.includes(student.id);
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-[#FAF8FE]/90 dark:hover:bg-[#191E3D]"
                      >
                        <td className="p-2.5">
                          <input
                            type="checkbox"
                            aria-label={`Select ${student.studentName}`}
                            checked={checked}
                            onChange={() =>
                              setSelectedRows((prev) =>
                                prev.includes(student.id)
                                  ? prev.filter((id) => id !== student.id)
                                  : [...prev, student.id],
                              )
                            }
                          />
                        </td>
                        <td className="p-2.5 font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                          {rowNum}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                          <button
                            type="button"
                            onClick={() => navigateSection("profile", student.id)}
                            className="hover:underline cursor-pointer"
                          >
                            {student.admissionNumber}
                          </button>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5B35F5] text-[10px] font-black text-white">
                              {student.studentName.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                                {student.studentName}
                              </p>
                              <p className="text-[10px] text-[#76799C] truncate dark:text-[#9DA6CC]">
                                {student.guardianName} • {student.guardianPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                          {student.currentGrade}
                        </td>
                        <td className="p-2.5 font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                          {student.currentSection}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              genderLabel === "Female"
                                ? "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
                                : genderLabel === "Male"
                                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {genderLabel}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#4D5072] dark:text-[#9DA6CC]">
                          {student.admissionDate.slice(0, 10)}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${statusPillClasses(
                              student.status,
                            )}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`View ${student.studentName}`}
                              onClick={() => navigateSection("profile", student.id)}
                              className="rounded-lg p-1.5 text-[#663CF6] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {permissions.canEdit && (
                              <button
                                type="button"
                                aria-label={`Edit ${student.studentName}`}
                                onClick={() => {
                                  setEditingStudent(student);
                                  setModalMode("edit");
                                }}
                                className="rounded-lg p-1.5 text-[#4D5072] hover:bg-[#EEF1FA] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#232746]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`ID Card for ${student.studentName}`}
                              onClick={() => setIdCardStudents([student])}
                              className="rounded-lg p-1.5 text-[#4D5072] hover:bg-[#EEF1FA] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#232746]"
                            >
                              <IdCard className="h-3.5 w-3.5" />
                            </button>
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EEF1FA] text-xs dark:border-[#232746]">
            <p className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              Showing {tableResult.total === 0 ? 0 : (tableResult.page - 1) * tableResult.pageSize + 1}{" "}
              – {Math.min(tableResult.page * tableResult.pageSize, tableResult.total)} of{" "}
              {tableResult.total.toLocaleString("en-IN")} students
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={tableResult.page <= 1}
                onClick={() => updateFilters({ page: tableResult.page - 1 })}
                className="rounded-lg border border-[#CAD0EB] p-1.5 disabled:opacity-40 cursor-pointer dark:border-[#343B6B]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="rounded-lg bg-[#663CF6] px-2.5 py-1 text-[11px] font-bold text-white">
                {tableResult.page} / {tableResult.totalPages}
              </span>
              <button
                type="button"
                disabled={tableResult.page >= tableResult.totalPages}
                onClick={() => updateFilters({ page: tableResult.page + 1 })}
                className="rounded-lg border border-[#CAD0EB] p-1.5 disabled:opacity-40 cursor-pointer dark:border-[#343B6B]"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <select
                aria-label="Rows per page"
                value={filters.pageSize || 10}
                onChange={(e) =>
                  updateFilters({ pageSize: Number(e.target.value), page: 1 })
                }
                className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-xs font-semibold dark:border-[#343B6B] dark:bg-[#10142C]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM 3-PANEL ROW FOR DASHBOARD */}
      {activeSection === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <TrendingUp className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Key Insights</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">Enrolment Growth</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  +{analytics.keyInsights.enrolmentGrowthPct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">New Enrolments</span>
                <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {analytics.keyInsights.newEnrolments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">Transfer In</span>
                <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {analytics.keyInsights.transferIn}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">Transfer Out</span>
                <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {analytics.keyInsights.transferOut}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">Promotion (Pending)</span>
                <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {analytics.keyInsights.promotionPending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">Inactive Students</span>
                <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {analytics.keyInsights.inactiveStudents}
                </span>
              </div>
            </div>
          </div>

          <StudentDonutChart
            title="Student Distribution (Grades)"
            centerTotal={analytics.kpis.totalStudents}
            slices={analytics.gradeBars.slice(0, 6).map((g, idx) => ({
              label: g.grade,
              count: g.count,
              percentage: g.percentage,
              color: ["#7C5CFC", "#38BDF8", "#F472B6", "#34D399", "#FBBF24", "#FB7185"][idx % 6]!,
            }))}
          />

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <ShieldAlert className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Important Actions</span>
            </h3>
            <div className="space-y-2">
              {[
                {
                  title: "Add New Student",
                  desc: "Create a new student record.",
                  onClick: () => {
                    setEditingStudent(null);
                    setModalMode("create");
                  },
                },
                {
                  title: "Manage Enrolment",
                  desc: "Handle student enrolment and sections.",
                  onClick: () => navigateSection("enrolment"),
                },
                {
                  title: "Student Promotion",
                  desc: "Promote students to the next grade.",
                  onClick: () => navigateSection("promotion"),
                },
                {
                  title: "Student Transfer",
                  desc: "Process student transfer (in/out).",
                  onClick: () => navigateSection("transfer"),
                },
                {
                  title: "Generate Reports",
                  desc: "Download student-related CSV reports.",
                  onClick: handleExportCsv,
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#EEF1FA] bg-[#FAF8FE]/80 px-3 py-2 text-left transition hover:border-[#663CF6] cursor-pointer dark:border-[#232746] dark:bg-[#10142C]"
                >
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM 3-PANEL ROW FOR STUDENT LIST */}
      {activeSection === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <UserCheck className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Student Summary</span>
            </h3>
            <div className="space-y-2 text-xs">
              {[
                ["Total Students", analytics.kpis.totalStudents],
                ["Active Students", analytics.kpis.activeStudents],
                ["Inactive Students", analytics.kpis.inactiveStudents],
                ...analytics.genderSlices.map((s) => [s.label, s.count] as [string, number]),
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span className="text-[#4D5072] dark:text-[#9DA6CC]">{label}</span>
                  <span className="font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {Number(val).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <Clock className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Recent Student Activities</span>
            </h3>
            <div className="space-y-2 text-xs">
              {snapshot.activities.length === 0 ? (
                <p className="text-[#76799C] dark:text-[#9DA6CC]">No activities recorded yet.</p>
              ) : (
                snapshot.activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-2">
                    <span className="text-[#08093B] font-semibold line-clamp-1 dark:text-[#DCE1F9]">
                      {act.summary}
                    </span>
                    <span className="shrink-0 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                      {new Date(act.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: "Add New Student", fn: () => setModalMode("create") },
                { label: "Import Students", fn: () => setShowImportModal(true) },
                { label: "Bulk Update", fn: () => setListSubTab("bulk") },
                {
                  label: "Generate ID Cards",
                  fn: () => setIdCardStudents(tableResult.items),
                },
                { label: "Export Student List", fn: handleExportCsv },
              ].map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={qa.fn}
                  className="w-full flex items-center justify-between rounded-xl border border-[#EEF1FA] bg-[#FAF8FE]/80 px-3 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#232746] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <span>{qa.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE DOSSIER */}
      {activeSection === "profile" && (
        <StudentProfileDossier
          mode={mode}
          student={selectedProfileStudent}
          groups={snapshot.groups}
          activities={snapshot.activities}
          allStudents={snapshot.students}
          canEdit={permissions.canEdit}
          onSelectStudent={(id) => navigateSection("profile", id)}
          onBackToList={() => navigateSection("list", null)}
          onEditStudent={(stu) => {
            setEditingStudent(stu);
            setModalMode("edit");
          }}
          onOpenIdCard={(stu) => setIdCardStudents([stu])}
          onTransferStudent={(stu) => {
            setSelectedStudentId(stu.id);
            navigateSection("transfer", stu.id);
          }}
        />
      )}

      {/* PROMOTION */}
      {activeSection === "promotion" && (
        <StudentPromotionPanel
          students={snapshot.students}
          academicYears={snapshot.academicYears}
          grades={snapshot.grades}
          sections={snapshot.sections}
          canPromote={permissions.canPromote}
          onPromote={handlePromote}
        />
      )}

      {/* TRANSFER */}
      {activeSection === "transfer" && (
        <StudentTransferPanel
          students={snapshot.students}
          preselectedStudentId={selectedStudentId}
          canTransfer={permissions.canTransfer}
          onSubmitTransfer={handleTransfer}
          onSelectProfile={(id) => navigateSection("profile", id)}
        />
      )}

      {/* SETTINGS */}
      {activeSection === "settings" && (
        <StudentSettingsPanel
          settings={snapshot.settings}
          canManageSettings={permissions.canManageSettings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* MODALS */}
      {modalMode && (
        <AddEditStudentModal
          open
          mode={modalMode}
          initialStudent={modalMode === "edit" ? editingStudent : null}
          academicYears={snapshot.academicYears}
          grades={snapshot.grades}
          sections={snapshot.sections}
          onClose={() => {
            setModalMode(null);
            setEditingStudent(null);
          }}
          onSubmit={handleCreateOrEdit}
        />
      )}

      {showImportModal && (
        <ImportStudentsModal
          open
          academicYear={snapshot.academicYears[0] || "2025 – 2026"}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}

      {idCardStudents && (
        <StudentIdCardsModal
          students={idCardStudents}
          schoolName={snapshot.schoolName}
          settings={snapshot.settings}
          onClose={() => setIdCardStudents(null)}
        />
      )}
    </div>
  );
}
