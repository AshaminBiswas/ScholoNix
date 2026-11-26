"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  Clock3,
  CreditCard,
  Megaphone,
  MessageSquare,
  BarChart3,
  ChevronDown,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Mail,
  FileText,
  School,
  X,
  UserPlus,
  Sparkles,
} from "lucide-react";
import type { SchoolDashboardData } from "@/modules/school/types";
import { SchoolCampusIllustration } from "./school-campus-illustration";
import { SchoolWorkspaceShell, buildSchoolRoute } from "./school-workspace-shell";
import { buildSchoolShellProps } from "@/modules/school/utils/shell-props";

interface SchoolOption {
  id: string;
  name: string;
  slug: string;
  code: string;
  city?: string | null;
  state?: string | null;
}

interface SchoolDashboardProps {
  initialData: SchoolDashboardData;
  availableSchools?: SchoolOption[];
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
}

export function SchoolDashboard({ initialData, user }: SchoolDashboardProps) {
  const router = useRouter();
  // Active single-tenant school dashboard data
  const [data, setData] = useState<SchoolDashboardData>(initialData);

  // Dashboard-specific modal state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickActionModal, setQuickActionModal] = useState<string | null>(null);

  // Interactive Tasks
  const [tasks, setTasks] = useState(initialData.todayTasks);

  // Interactive filters
  const [studentSectionFilter, setStudentSectionFilter] = useState<"section" | "grade">("section");
  const [feeMonthFilter, setFeeMonthFilter] = useState<string>("This Month");
  const [academicTermFilter, setAcademicTermFilter] = useState<string>("By Term");

  // Keep tasks synced if initial data changes
  useEffect(() => {
    setData(initialData);
    setTasks(initialData.todayTasks);
  }, [initialData]);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuickActionModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Toggle task item completion
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    );
  };

  const completedTasksCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const shellProps = useMemo(
    () => buildSchoolShellProps(data.school, user),
    [data.school, user],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredQuickPages = useMemo(() => {
    const pages = [
      { label: "Admissions Overview", hint: "KPIs, funnel & recent applications", href: buildSchoolRoute(data.school.slug, "admissions?tab=overview") },
      { label: "Application Management", hint: "Search, verify & manage applications", href: buildSchoolRoute(data.school.slug, "admissions?tab=applications") },
      { label: "Admission Enquiries", hint: "Track parent leads & enquiries", href: buildSchoolRoute(data.school.slug, "admissions?tab=enquiries") },
      { label: "Admitted Students", hint: "View finalized student admissions", href: buildSchoolRoute(data.school.slug, "admissions?tab=admitted") },
      { label: "Admission Settings", hint: "Academic year, prefix & grades", href: buildSchoolRoute(data.school.slug, "admissions?tab=settings") },
      { label: "School Profile", hint: "Unique School ID & login link", href: buildSchoolRoute(data.school.slug, "profile") },
      { label: "Help Center", hint: "Guides & support articles", href: buildSchoolRoute(data.school.slug, "help") },
    ];
    if (!normalizedSearch) return pages.slice(0, 4);
    return pages.filter(
      (p) =>
        p.label.toLowerCase().includes(normalizedSearch) ||
        p.hint.toLowerCase().includes(normalizedSearch),
    );
  }, [data.school.slug, normalizedSearch]);

  const filteredAdmissions = useMemo(() => {
    if (!normalizedSearch) return data.recentAdmissions;
    return data.recentAdmissions.filter((adm) =>
      `${adm.name} ${adm.classApplied} ${adm.status} ${adm.appliedOn}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [data.recentAdmissions, normalizedSearch]);

  const filteredNotices = useMemo(() => {
    if (!normalizedSearch) return [];
    return data.notices.filter((n) =>
      `${n.title} ${n.summary}`.toLowerCase().includes(normalizedSearch),
    );
  }, [data.notices, normalizedSearch]);

  return (
    <SchoolWorkspaceShell
      school={shellProps.school}
      user={shellProps.user}
      activeNav="dashboard"
      noticeCount={data.notices.length}
      onOpenSearch={() => setSearchOpen(true)}
    >
          {/* Top Hero Section: Greeting & Campus Architecture Banner */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight dark:text-[#F3F5FF]">
                Good Morning, {data.currentUser.name} 👋
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#9DA6CC]">
                Here&apos;s what&apos;s happening at{" "}
                <span className="font-bold text-[#663CF6] dark:text-[#A78BFA]">{data.school.name}</span> today.
              </p>

              {/* 4 Info Meta Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-[#4D5072] dark:text-[#C5CCF0]">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs dark:border-[#2E345B] dark:bg-[#141731]">
                  <Calendar className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                  <span>{data.academicSession.currentDate}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs dark:border-[#2E345B] dark:bg-[#141731]">
                  <GraduationCap className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400" />
                  <span>Academic Year: {data.academicSession.year}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs dark:border-[#2E345B] dark:bg-[#141731]">
                  <FileText className="h-3.5 w-3.5 text-[#D97706] dark:text-amber-400" />
                  <span>Term: {data.academicSession.term}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs dark:border-[#2E345B] dark:bg-[#141731]">
                  <Clock className="h-3.5 w-3.5 text-[#15803D] dark:text-emerald-400" />
                  <span>{data.academicSession.workingDaysLeft} Working Days Left</span>
                </div>
              </div>
            </div>

            {/* Campus Architectural Banner Illustration */}
            <div className="w-full xl:w-[480px]">
              <SchoolCampusIllustration schoolName={data.school.name} />
            </div>
          </div>

          {/* =========================================================================
              4. 4 TOP KPI METRIC CARDS
              ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#DDD6FE]/80 bg-gradient-to-br from-white via-[#F6F2FF] to-[#EDE7FF]/60 p-5 shadow-xs transition hover:shadow-md dark:border-[#372D6B] dark:from-[#161936] dark:via-[#1B183E] dark:to-[#221A4A]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE] dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]">
                  <Users className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.totalStudents.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C] dark:text-[#9DA6CC]">
                Total Students
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                {data.kpis.totalStudents.value.toLocaleString()}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">vs. previous month</p>
            </div>

            {/* Total Staff */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#BAE6FD]/80 bg-gradient-to-br from-white via-[#F0F8FF] to-[#E0F2FE]/60 p-5 shadow-xs transition hover:shadow-md dark:border-[#1E476E] dark:from-[#131934] dark:via-[#11223E] dark:to-[#122949]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E0F2FE] text-[#0284C7] ring-1 ring-[#BAE6FD] dark:bg-[#133252] dark:text-[#7DD3FC] dark:ring-[#1E547A]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.totalStaff.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C] dark:text-[#9DA6CC]">
                Total Staff
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                {data.kpis.totalStaff.value}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">vs. previous month</p>
            </div>

            {/* Pending Admissions */}
            <div className="relative overflow-hidden rounded-[20px] border border-orange-200/80 bg-gradient-to-br from-white via-[#FFF7ED] to-[#FFEDD5]/60 p-5 shadow-xs transition hover:shadow-md dark:border-orange-900/60 dark:from-[#17162E] dark:via-[#261B1A] dark:to-[#2D1E19]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-orange-100 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800/70">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.pendingAdmissions.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C] dark:text-[#9DA6CC]">
                Pending Admissions
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                {data.kpis.pendingAdmissions.value}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">vs. previous month</p>
            </div>

            {/* Fee Dues */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#FDE68A]/80 bg-gradient-to-br from-white via-[#FFFBEB] to-[#FEF3C7]/60 p-5 shadow-xs transition hover:shadow-md dark:border-amber-900/60 dark:from-[#16172E] dark:via-[#241E14] dark:to-[#2B2316]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FEF3C7] text-[#D97706] ring-1 ring-[#FDE68A] dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/70">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.feeDues.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C] dark:text-[#9DA6CC]">
                Fee Dues
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                ₹{data.kpis.feeDues.value.toLocaleString("en-IN")}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C] dark:text-[#9DA6CC]">vs. previous month</p>
            </div>
          </div>

          {/* =========================================================================
              5. ROW 1: STUDENT OVERVIEW + ATTENDANCE + TODAY'S TASKS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Student Overview (5 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
                  <Users className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                  <span>Student Overview</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setStudentSectionFilter((f) => (f === "section" ? "grade" : "section"))
                  }
                  className="rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#4D5072] flex items-center gap-1 hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
                >
                  <span>{studentSectionFilter === "section" ? "By Section" : "By Grade"}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Donut Graphic & Legend */}
              <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                {/* SVG Donut */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" className="stroke-[#F1F5F9] dark:stroke-[#232746]" strokeWidth="12" fill="none" />
                    {(() => {
                      const circumference = 2 * Math.PI * 38;
                      let offset = 0;
                      return data.studentOverview.sections.map((sec, idx) => {
                        const length = (sec.percentage / 100) * circumference;
                        const currentOffset = offset;
                        offset += length;
                        if (length <= 0) return null;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            stroke={sec.color}
                            strokeWidth="12"
                            strokeDasharray={`${length.toFixed(1)} ${circumference.toFixed(1)}`}
                            strokeDashoffset={`-${currentOffset.toFixed(1)}`}
                            fill="none"
                            strokeLinecap="round"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {data.studentOverview.total.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Students</p>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-1.5 w-full text-xs">
                  {data.studentOverview.sections.length === 0 ? (
                    <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">No student records added yet.</p>
                  ) : (
                    data.studentOverview.sections.map((sec, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sec.color }}
                          />
                          <span className="text-[#4D5072] font-medium truncate dark:text-[#C5CCF0]">{sec.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#08093B] font-bold dark:text-[#F3F5FF]">
                          <span>{sec.count}</span>
                          <span className="text-[10px] text-[#76799C] w-9 text-right font-normal dark:text-[#9DA6CC]">
                            {sec.percentage}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Today (3 cols) */}
            <div className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2 dark:text-[#F3F5FF]">
                  <Clock className="h-4 w-4 text-[#15803D] dark:text-emerald-400" />
                  <span>Attendance (Today)</span>
                </h3>
              </div>

              {/* Circular Meter */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" className="stroke-[#F1F5F9] dark:stroke-[#232746]" strokeWidth="10" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#22C55E"
                      strokeWidth="10"
                      strokeDasharray={`${(data.attendanceToday.rate / 100) * 238} 238`}
                      strokeDashoffset="0"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {data.attendanceToday.rate}%
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Present</p>
                  </div>
                </div>

                {/* Substats */}
                <div className="mt-3 grid grid-cols-3 gap-2 w-full text-center border-t border-[#DFE3F5] pt-3 text-[11px] dark:border-[#232746]">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{data.attendanceToday.present.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Present</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-red-500 font-bold dark:text-red-400">
                      <XCircle className="h-3 w-3" />
                      <span>{data.attendanceToday.absent}</span>
                    </div>
                    <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Absent</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[#76799C] font-bold dark:text-[#9DA6CC]">
                      <span>{data.attendanceToday.notMarked}</span>
                    </div>
                    <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Not Marked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Tasks (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Today&apos;s Tasks</h3>
                  <span className="text-xs font-bold text-[#663CF6] dark:text-[#A78BFA]">
                    ({completedTasksCount} of {tasks.length})
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer dark:text-[#A78BFA]"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#EDE7FF] h-1.5 rounded-full overflow-hidden mb-3 dark:bg-[#251D4A]">
                <div
                  className="bg-[#663CF6] h-full transition-all duration-300 dark:bg-[#8B5CF6]"
                  style={{
                    width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Task Items Checklist */}
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No tasks scheduled for today.
                  </p>
                ) : (
                  tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-[#FAF8FE] transition cursor-pointer select-none dark:hover:bg-[#1B2042]"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="h-4 w-4 rounded border-[#CAD0EB] text-[#663CF6] focus:ring-[#663CF6] cursor-pointer"
                      />
                      <span
                        className={`text-xs flex-1 transition ${
                          task.completed
                            ? "line-through text-[#94A3B8] dark:text-[#6B7399]"
                            : "text-[#1B1D45] font-medium dark:text-[#DCE1F9]"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-bold text-[#64748B] dark:bg-[#1E2244] dark:text-[#9DA6CC]">
                        {task.category}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              6. ROW 2: FEE COLLECTION BAR CHART + UPCOMING EVENTS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Fee Collection (8 cols) */}
            <div className="lg:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Fee Collection</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800/70 dark:text-emerald-300">
                    {data.feeCollection.collectionRate}% Collection Rate
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFeeMonthFilter((m) => (m === "This Month" ? "Quarterly" : "This Month"))
                    }
                    className="rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#4D5072] flex items-center gap-1 hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
                  >
                    <span>{feeMonthFilter}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Top stats summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[#DFE3F5] pb-4 mb-4 dark:border-[#232746]">
                <div>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Collected</p>
                  <p className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
                    ₹{data.feeCollection.collectedAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Total Fee</p>
                  <p className="text-sm font-bold text-[#4D5072] dark:text-[#C5CCF0]">
                    ₹{data.feeCollection.totalFee.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Pending</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    ₹{data.feeCollection.pendingFee.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Overdue</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    ₹{data.feeCollection.overdueFee.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Monthly Bar Chart */}
              <div className="flex items-center justify-between text-[11px] text-[#76799C] mb-2 dark:text-[#9DA6CC]">
                <span>Monthly Collection (in Lakhs ₹)</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#663CF6]" />
                    <span>Collected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#DDD6FE] dark:bg-[#4C3F8C]" />
                    <span>Due</span>
                  </div>
                </div>
              </div>

              {data.feeCollection.monthlyTrends.length === 0 ? (
                <div className="flex items-center justify-center h-36 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  No monthly fee collection data recorded yet.
                </div>
              ) : (
                <div className="flex items-end justify-between h-36 pt-4 gap-1 sm:gap-2">
                  {data.feeCollection.monthlyTrends.map((item, idx) => {
                    const maxH = Math.max(
                      1,
                      ...data.feeCollection.monthlyTrends.flatMap((x) => [x.collected, x.due]),
                    );
                    const collectedHeight = Math.min(100, (item.collected / maxH) * 100);
                    const dueHeight = Math.min(100, (item.due / maxH) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center h-28">
                          <div
                            className="w-2 sm:w-3.5 bg-gradient-to-t from-[#663CF6] to-[#8B5CF6] rounded-t-sm transition-all hover:opacity-85"
                            style={{ height: `${collectedHeight}%` }}
                            title={`Collected: ₹${item.collected}L`}
                          />
                          <div
                            className="w-2 sm:w-3.5 bg-[#DDD6FE] rounded-t-sm transition-all hover:opacity-85 dark:bg-[#3A306B]"
                            style={{ height: `${dueHeight}%` }}
                            title={`Due: ₹${item.due}L`}
                          />
                        </div>
                        <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Events (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Upcoming Events</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer dark:text-[#A78BFA]"
                >
                  <span>View Calendar</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Event Cards */}
              <div className="space-y-3">
                {data.upcomingEvents.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No upcoming school events scheduled.
                  </p>
                ) : (
                  data.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] hover:border-[#9B76FF] transition dark:border-[#2A2F58] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
                    >
                      {/* Date Block */}
                      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-[10px] bg-[#663CF6] text-white shrink-0 shadow-xs">
                        <span className="text-base font-black leading-none">{event.date}</span>
                        <span className="text-[10px] font-bold uppercase">{event.month}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">{event.title}</h4>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${event.badgeBg} ${event.badgeText} shrink-0`}>
                            {event.category}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#76799C] flex items-center gap-1 dark:text-[#9DA6CC]">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">Syncs with academic calendar</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              7. ROW 3: RECENT ADMISSIONS + ACTIVITIES + QUICK ACTIONS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recent Admissions (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Recent Admissions</h3>
                </div>
                <Link
                  href={buildSchoolRoute(data.school.slug, "admissions?tab=applications")}
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 dark:text-[#A78BFA]"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DFE3F5] text-[10px] font-bold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                      <th className="pb-2">Applicant</th>
                      <th className="pb-2">Class</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                    {data.recentAdmissions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                          No admission applications recorded yet.
                        </td>
                      </tr>
                    ) : (
                      data.recentAdmissions.map((adm) => (
                        <tr key={adm.id} className="hover:bg-[#FAF8FE] transition dark:hover:bg-[#1B2042]">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${adm.avatarBg}`}>
                                {adm.initials}
                              </span>
                              <span className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">{adm.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-[#4D5072] dark:text-[#C5CCF0]">{adm.classApplied}</td>
                          <td className="py-2.5">
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${adm.statusBg} ${adm.statusColor}`}>
                              {adm.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                            {adm.appliedOn}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activities (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#0284C7] dark:text-sky-400" />
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Recent Activities</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer dark:text-[#A78BFA]"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Timeline List */}
              <div className="space-y-3">
                {data.recentActivities.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No recent activity logs yet.
                  </p>
                ) : (
                  data.recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-[#663CF6] mt-1.5 shrink-0 ring-4 ring-[#EDE7FF] dark:bg-[#8B5CF6] dark:ring-[#251D4A]" />
                      <div className="flex-1 text-xs leading-relaxed">
                        <p className="text-[#1B1D45] font-medium dark:text-[#DCE1F9]">{act.description}</p>
                        <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{act.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">Live audit events recorded</span>
              </div>
            </div>

            {/* Quick Actions (3 cols) */}
            <div className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#D97706] dark:text-amber-400" />
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Quick Actions</h3>
              </div>

              {/* 6 Action Tiles */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Add Student", icon: UserPlus, color: "text-[#663CF6] bg-[#EDE7FF] dark:text-[#CBB8FF] dark:bg-[#251D4A]" },
                  { label: "Add Staff", icon: GraduationCap, color: "text-[#0284C7] bg-[#E0F2FE] dark:text-sky-300 dark:bg-sky-950/60" },
                  { label: "Create Class", icon: School, color: "text-[#15803D] bg-[#DCFCE7] dark:text-emerald-300 dark:bg-emerald-950/60" },
                  { label: "Send Notice", icon: Megaphone, color: "text-[#D946EF] bg-[#FAE8FF] dark:text-fuchsia-300 dark:bg-fuchsia-950/60" },
                  { label: "Collect Fee", icon: CreditCard, color: "text-[#D97706] bg-[#FEF3C7] dark:text-amber-300 dark:bg-amber-950/60" },
                  { label: "Generate Report", icon: BarChart3, color: "text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/60" },
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickActionModal(act.label)}
                      className="group flex flex-col items-center justify-center rounded-[14px] border border-[#D6DBF0] bg-white p-3 text-center transition hover:border-[#663CF6] hover:bg-[#FAF8FE] hover:shadow-xs cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1B2042]"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${act.color} transition-transform group-hover:scale-110 mb-1.5`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#08093B] group-hover:text-[#663CF6] dark:text-[#F3F5FF] dark:group-hover:text-[#C4B5FD]">
                        {act.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================================
              8. ROW 4: CLASS-WISE STRENGTH + FEE OVERVIEW + COMMUNICATION
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Class-wise Student Strength (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Class-wise Student Strength</h3>
                <button type="button" className="text-xs font-bold text-[#663CF6] hover:underline dark:text-[#A78BFA]">
                  View Details →
                </button>
              </div>

              {/* Bar Chart */}
              {data.classStrength.length === 0 ? (
                <div className="flex items-center justify-center h-36 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  No class strength records yet.
                </div>
              ) : (
                <div className="flex items-end justify-around h-36 pt-4 gap-2">
                  {data.classStrength.map((c, idx) => {
                    const maxCount = Math.max(1, ...data.classStrength.map((x) => x.count));
                    const h = (c.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-bold text-[#08093B] dark:text-[#F3F5FF]">{c.count}</span>
                        <div
                          className="w-10 sm:w-12 bg-gradient-to-t from-[#663CF6] via-[#8B5CF6] to-[#A78BFA] rounded-t-md transition-all hover:opacity-90"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">{c.range}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fee Overview Donut (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Fee Overview</h3>
              </div>

              <div className="flex items-center gap-4 py-2">
                {/* SVG Donut */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" className="stroke-[#F1F5F9] dark:stroke-[#232746]" strokeWidth="12" fill="none" />
                    {(() => {
                      const circumference = 2 * Math.PI * 38;
                      const totalFee = data.feeCollection.totalFee;
                      const collectedArc =
                        totalFee > 0 ? (data.feeCollection.collectedAmount / totalFee) * circumference : 0;
                      const pendingArc =
                        totalFee > 0 ? (data.feeCollection.pendingFee / totalFee) * circumference : 0;
                      return (
                        <>
                          {collectedArc > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              stroke="#663CF6"
                              strokeWidth="12"
                              strokeDasharray={`${collectedArc.toFixed(1)} ${circumference.toFixed(1)}`}
                              strokeDashoffset="0"
                              fill="none"
                            />
                          )}
                          {pendingArc > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              stroke="#F59E0B"
                              strokeWidth="12"
                              strokeDasharray={`${pendingArc.toFixed(1)} ${circumference.toFixed(1)}`}
                              strokeDashoffset={`-${collectedArc.toFixed(1)}`}
                              fill="none"
                            />
                          )}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {data.feeCollection.totalFee > 0
                        ? `₹${(data.feeCollection.totalFee / 100000).toFixed(2)}L`
                        : "₹0"}
                    </p>
                    <p className="text-[9px] text-[#76799C] dark:text-[#9DA6CC]">Total Fee</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#663CF6]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Collected</span>
                    </div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      ₹{(data.feeCollection.collectedAmount / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Pending</span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ₹{(data.feeCollection.pendingFee / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Overdue</span>
                    </div>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      ₹{(data.feeCollection.overdueFee / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Summary (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Communication Summary</h3>
                <button type="button" className="text-xs font-bold text-[#663CF6] hover:underline dark:text-[#A78BFA]">
                  View Reports →
                </button>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2.5 py-2">
                <div className="rounded-[14px] bg-[#EDE7FF]/60 border border-[#DDD6FE] p-3 text-center dark:bg-[#251D4A]/80 dark:border-[#4A3B8F]">
                  <Megaphone className="h-4 w-4 mx-auto text-[#663CF6] dark:text-[#CBB8FF]" />
                  <p className="mt-2 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {data.communicationSummary.noticesSent}
                  </p>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Notices Sent</p>
                </div>

                <div className="rounded-[14px] bg-[#E0F2FE]/60 border border-[#BAE6FD] p-3 text-center dark:bg-[#10253A]/80 dark:border-[#1D547A]">
                  <MessageSquare className="h-4 w-4 mx-auto text-[#0284C7] dark:text-sky-400" />
                  <p className="mt-2 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {data.communicationSummary.smsDelivered}
                  </p>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">SMS Delivered</p>
                </div>

                <div className="rounded-[14px] bg-[#FAF8FE] border border-[#D6DBF0] p-3 text-center dark:bg-[#10142C] dark:border-[#2E345B]">
                  <Mail className="h-4 w-4 mx-auto text-[#7C3AED] dark:text-[#A78BFA]" />
                  <p className="mt-2 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {data.communicationSummary.emailsDelivered}
                  </p>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">Emails Delivered</p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              9. ROW 5: ACADEMIC PERFORMANCE + TOP CLASSES
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Academic Performance (8 cols) */}
            <div className="lg:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Academic Performance</h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAcademicTermFilter((t) => (t === "By Term" ? "By Exam" : "By Term"))
                  }
                  className="rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#4D5072] flex items-center gap-1 hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6]"
                >
                  <span>{academicTermFilter}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Score Card */}
                <div className="rounded-[16px] bg-[#FAF8FE] border border-[#DDD6FE] p-4 text-center sm:w-44 shrink-0 dark:bg-[#10142C] dark:border-[#372D6B]">
                  <p className="text-2xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {data.academicPerformance.overallPassRate}%
                  </p>
                  <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">Overall Pass Rate</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 mt-2 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{data.academicPerformance.trendVsLastTerm}% vs. last term</span>
                  </span>
                </div>

                {/* Trend Progression Chart */}
                <div className="flex-1 w-full">
                  <p className="text-[11px] font-bold text-[#76799C] mb-2 dark:text-[#9DA6CC]">
                    Average Class Performance (%)
                  </p>
                  {data.academicPerformance.termTrends.length === 0 ? (
                    <div className="flex items-center justify-center h-28 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                      No academic term results published yet.
                    </div>
                  ) : (
                    <div className="flex items-end justify-between h-28 pt-2 gap-2">
                      {data.academicPerformance.termTrends.map((t, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
                          <span className="text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                            {t.percentage}%
                          </span>
                          <div
                            className="w-full max-w-[40px] bg-gradient-to-t from-[#663CF6] to-[#A78BFA] rounded-t-sm"
                            style={{ height: `${(t.percentage / 100) * 80}px` }}
                          />
                          <span className="text-[9px] text-[#76799C] text-center line-clamp-1 dark:text-[#9DA6CC]">
                            {t.term}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Performing Classes (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Top Performing Classes</h3>
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">This Term</span>
              </div>

              <div className="space-y-3">
                {data.academicPerformance.topClasses.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No class rankings available yet.
                  </p>
                ) : (
                  data.academicPerformance.topClasses.map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF8FE] border border-[#DFE3F5] dark:bg-[#10142C] dark:border-[#2A2F58]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                          {item.rank}
                        </span>
                        <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">{item.className}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{item.score}%</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">Adheres to standard board grading</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              10. ROW 6: ADMISSION FUNNEL + STAFF OVERVIEW + GENDER BREAKDOWN
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Admission Funnel (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Admission Funnel</h3>
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">This Academic Year</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Visual Trapezoid Funnel */}
                <div className="flex-1 space-y-1.5">
                  <div className="bg-[#8B5CF6] text-white text-[11px] font-bold p-1.5 rounded-sm flex justify-between">
                    <span>Enquiries</span>
                    <span>{data.admissionFunnel.enquiries}</span>
                  </div>
                  <div className="bg-[#9B76FF] text-white text-[11px] font-bold p-1.5 rounded-sm flex justify-between mx-2">
                    <span>Applications</span>
                    <span>{data.admissionFunnel.applications}</span>
                  </div>
                  <div className="bg-[#A78BFA] text-white text-[11px] font-bold p-1.5 rounded-sm flex justify-between mx-4">
                    <span>Shortlisted</span>
                    <span>{data.admissionFunnel.shortlisted}</span>
                  </div>
                  <div className="bg-[#22C55E] text-white text-[11px] font-bold p-1.5 rounded-sm flex justify-between mx-6">
                    <span>Admitted</span>
                    <span>{data.admissionFunnel.admitted}</span>
                  </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="text-center p-3 rounded-[14px] bg-[#FAF8FE] border border-[#DDD6FE] shrink-0 dark:bg-[#10142C] dark:border-[#372D6B]">
                  <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">Conversion Rate</p>
                  <p className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                    {data.admissionFunnel.conversionRate}%
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold dark:text-emerald-400">
                    +{data.admissionFunnel.trendVsLastYear}% vs. last year
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Overview Donut (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Staff Overview</h3>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" className="stroke-[#F1F5F9] dark:stroke-[#232746]" strokeWidth="12" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#8B5CF6"
                      strokeWidth="12"
                      strokeDasharray={`${(data.staffOverview.teachingPercentage / 100) * 238} 238`}
                      strokeDashoffset="0"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">{data.staffOverview.total}</p>
                    <p className="text-[9px] text-[#76799C] dark:text-[#9DA6CC]">Total Staff</p>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Teaching</span>
                    </div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{data.staffOverview.teaching}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Non-Teaching</span>
                    </div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{data.staffOverview.nonTeaching}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Administrative</span>
                    </div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {data.staffOverview.administrative}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Student by Gender (3 cols) */}
            <div className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Student by Gender</h3>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" className="stroke-[#F1F5F9] dark:stroke-[#232746]" strokeWidth="12" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#38BDF8"
                      strokeWidth="12"
                      strokeDasharray={`${(data.genderBreakdown.boysPercentage / 100) * 238} 238`}
                      strokeDashoffset="0"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#EC4899"
                      strokeWidth="12"
                      strokeDasharray={`${(data.genderBreakdown.girlsPercentage / 100) * 238} 238`}
                      strokeDashoffset={`-${(data.genderBreakdown.boysPercentage / 100) * 238}`}
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {data.genderBreakdown.total}
                    </p>
                    <p className="text-[9px] text-[#76799C] dark:text-[#9DA6CC]">Students</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Boys</span>
                    </div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {data.genderBreakdown.boys} ({data.genderBreakdown.boysPercentage}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#EC4899]" />
                      <span className="text-[#4D5072] dark:text-[#C5CCF0]">Girls</span>
                    </div>
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {data.genderBreakdown.girls} ({data.genderBreakdown.girlsPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              11. ROW 7: KEY INSIGHTS + NOTICES & ANNOUNCEMENTS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Key Insights (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" />
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Key Insights</h3>
              </div>

              <div className="space-y-3">
                {data.keyInsights.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    Insights will appear as attendance and fee records grow.
                  </p>
                ) : (
                  data.keyInsights.map((ins) => (
                    <div
                      key={ins.id}
                      className="flex items-start gap-3 p-3 rounded-[14px] bg-[#FAF8FE] border border-[#DFE3F5] dark:bg-[#10142C] dark:border-[#2A2F58]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white shadow-xs shrink-0 text-[#663CF6] dark:bg-[#1D1B3F] dark:text-[#C4B5FD]">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          {ins.metric}{" "}
                          <span className="text-[#663CF6] dark:text-[#A78BFA]">{ins.changeText}</span>{" "}
                          <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">{ins.highlightText}</span>
                        </p>
                        <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{ins.periodText}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notices & Announcements (7 cols) */}
            <div className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[#0284C7] dark:text-sky-400" />
                  <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Notices & Announcements</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer dark:text-[#A78BFA]"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3">
                {data.notices.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No notices or announcements published yet.
                  </p>
                ) : (
                  data.notices.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-[14px] border border-[#DFE3F5] hover:border-[#9B76FF] transition bg-[#FAF8FE] dark:border-[#2A2F58] dark:bg-[#10142C] dark:hover:border-[#8B5CF6]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[#663CF6] shadow-xs shrink-0 dark:bg-[#1D1B3F] dark:text-[#C4B5FD]">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">{n.title}</h4>
                          <p className="mt-0.5 text-[11px] text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
                            {n.summary}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#76799C] shrink-0 dark:text-[#9DA6CC]">
                        {n.date}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 text-right">
                <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">Broadcasts to parents & staff</span>
              </div>
            </div>
          </div>

      {/* Quick Action Modal Preview */}
      {quickActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 dark:bg-black/65">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl border border-[#D6DBF0] dark:bg-[#141731] dark:border-[#2E345B]">
            <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 mb-4 dark:border-[#232746]">
              <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {quickActionModal}
              </h3>
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="rounded-full p-1 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] dark:text-[#9DA6CC] dark:hover:bg-[#1E2245] dark:hover:text-[#F3F5FF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
              Launch module for <strong>{quickActionModal}</strong> configured for{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">{data.school.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F8FAFC] dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8]"
              >
                Proceed to Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal (Ctrl + K) */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search school workspace"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-xs p-4 pt-20 dark:bg-black/65"
        >
          <div className="w-full max-w-lg rounded-[20px] bg-white p-4 shadow-2xl border border-[#D6DBF0] dark:bg-[#141731] dark:border-[#2E345B]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                setSearchOpen(false);
                if (q) {
                  router.push(
                    buildSchoolRoute(
                      data.school.slug,
                      `admissions?tab=applications&search=${encodeURIComponent(q)}`,
                    ),
                  );
                } else if (filteredQuickPages[0]) {
                  router.push(filteredQuickPages[0].href);
                }
              }}
              className="flex items-center gap-2 border-b border-[#DFE3F5] pb-3 dark:border-[#232746]"
            >
              <Search className="h-4 w-4 text-[#76799C] dark:text-[#9DA6CC] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search Student ID, name, classes, admissions, or pages..."
                aria-label="Search Student ID, name, classes, admissions, or pages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#08093B] placeholder:text-[#76799C] focus:outline-none dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="rounded p-1 text-[#76799C] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:text-[#F3F5FF]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="rounded p-1 text-[#76799C] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:text-[#F3F5FF]"
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#D6DBF0] dark:border-[#343B6B]">
                  ESC
                </span>
              </button>
            </form>
            <div className="mt-3 space-y-3 max-h-72 overflow-y-auto text-xs">
              <div>
                <p className="px-2 py-1 text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Recent Admissions ({filteredAdmissions.length})
                </p>
                {filteredAdmissions.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    {normalizedSearch
                      ? `No recent admissions matched "${searchQuery.trim()}". Press Enter to search all applications.`
                      : "No admission records found yet."}
                  </p>
                ) : (
                  filteredAdmissions.map((adm) => (
                    <Link
                      key={adm.id}
                      href={buildSchoolRoute(
                        data.school.slug,
                        `admissions?tab=applications&search=${encodeURIComponent(adm.name)}`,
                      )}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]"
                    >
                      <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{adm.name}</span>
                      <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                        {adm.classApplied} · {adm.status}
                      </span>
                    </Link>
                  ))
                )}
              </div>

              {filteredNotices.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                    Notices
                  </p>
                  {filteredNotices.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-[8px] bg-[#FAF8FE]/70 dark:bg-[#10142C]"
                    >
                      <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{n.title}</p>
                      <p className="text-[11px] text-[#76799C] truncate dark:text-[#9DA6CC]">{n.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="px-2 py-1 text-[10px] font-bold uppercase text-[#76799C] dark:text-[#9DA6CC]">
                  Workspace Navigation
                </p>
                {filteredQuickPages.map((page) => (
                  <Link
                    key={page.label}
                    href={page.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#FAF8FE] dark:hover:bg-[#1B2042]"
                  >
                    <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{page.label}</span>
                    <span className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">{page.hint}</span>
                  </Link>
                ))}
                {normalizedSearch && (
                  <Link
                    href={buildSchoolRoute(
                      data.school.slug,
                      `admissions?tab=applications&search=${encodeURIComponent(searchQuery.trim())}`,
                    )}
                    onClick={() => setSearchOpen(false)}
                    className="mt-1 flex items-center justify-between p-2 rounded-[8px] bg-[#FAF8FE] text-[#663CF6] font-bold hover:bg-[#EDE7FF]/60 dark:bg-[#1B183E] dark:text-[#C4B5FD] dark:hover:bg-[#252052]"
                  >
                    <span>Search &ldquo;{searchQuery.trim()}&rdquo; in All Applications</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SchoolWorkspaceShell>
  );
}
