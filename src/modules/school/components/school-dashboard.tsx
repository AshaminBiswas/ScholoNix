"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  Clock3,
  CreditCard,
  Megaphone,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Mail,
  FileText,
  Building2,
  School,
  Menu,
  X,
  LogOut,
  RefreshCw,
  Check,
  UserPlus,
  Send,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { SchoolDashboardData } from "@/server/school/school-dashboard-service";
import { SchoolCampusIllustration } from "./school-campus-illustration";
import { BrandLogo } from "@/components/ui/brand-logo";

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
  availableSchools: SchoolOption[];
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
}

export function SchoolDashboard({ initialData, availableSchools, user }: SchoolDashboardProps) {
  const router = useRouter();

  // Active dynamic school dashboard data
  const [data, setData] = useState<SchoolDashboardData>(initialData);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(initialData.school.id);
  const [isLoadingSchool, setIsLoadingSchool] = useState<boolean>(false);

  // UI state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
    setSelectedSchoolId(initialData.school.id);
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
        setSchoolDropdownOpen(false);
        setUserMenuOpen(false);
        setQuickActionModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle switching school dynamically
  const handleSwitchSchool = async (schoolId: string) => {
    if (schoolId === data.school.id) {
      setSchoolDropdownOpen(false);
      return;
    }
    setIsLoadingSchool(true);
    setSchoolDropdownOpen(false);

    try {
      const isDemo = typeof window !== "undefined" && window.location.search.includes("demo=true");
      const res = await fetch(`/api/school/dashboard?schoolId=${schoolId}${isDemo ? "&demo=true" : ""}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setTasks(json.data.todayTasks);
        setSelectedSchoolId(schoolId);
      }
    } catch (err) {
      console.error("Failed to load school dashboard data:", err);
    } finally {
      setIsLoadingSchool(false);
    }
  };

  // Toggle task item completion
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedTasksCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#F4F6FC] text-[#1B1D45] flex flex-col font-sans overflow-x-hidden">
      {/* =========================================================================
          1. TOP APP HEADER / BAR
          ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-[#D6DBF0] bg-white/98 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Toggle & Brand / Panel Identifier */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#08093B] shadow-xs lg:hidden"
              aria-label="Toggle navigation drawer"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <School className="h-5 w-5 text-[#663CF6]" />
              <span className="text-sm font-extrabold text-[#08093B]">
                School Web Panel
              </span>
            </div>

            {/* School Switcher Pill Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="school-switcher-dropdown-btn"
                onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 sm:px-3 py-1 text-xs font-bold text-[#08093B] transition hover:border-[#9B76FF] hover:bg-[#F2EEFD] shadow-xs cursor-pointer max-w-[150px] sm:max-w-none"
                aria-expanded={schoolDropdownOpen}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#663CF6] text-white text-[10px]">
                  🎓
                </div>
                <span className="truncate">
                  {data.school.name}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-[#4D5072]" />
              </button>

              {/* School Switcher Dropdown Menu */}
              {schoolDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-[16px] border border-[#D6DBF0] bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#76799C] border-b border-[#DFE3F5]">
                    Select Registered School
                  </div>
                  <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
                    {availableSchools.map((s) => {
                      const isSelected = s.id === selectedSchoolId;
                      return (
                        <button
                          key={s.id}
                          id={`switch-school-${s.id}`}
                          type="button"
                          onClick={() => handleSwitchSchool(s.id)}
                          className={`flex w-full items-center justify-between rounded-[10px] p-2 text-left text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-[#EDE7FF] font-bold text-[#663CF6]"
                              : "text-[#1B1D45] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] text-[#76799C]">
                              {s.code || s.slug} {s.city ? `· ${s.city}` : ""}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-[#663CF6] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Universal Search Bar (Ctrl + K) */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center justify-between rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3.5 py-1.5 text-xs text-[#76799C] transition hover:border-[#663CF6] hover:bg-white cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#76799C]" />
                <span>Search students, staff, classes, fees, etc.</span>
              </div>
              <kbd className="rounded border border-[#D6DBF0] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#4D5072] shadow-xs">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Right: Notifications, Help & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell with Badge */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DBF0] bg-white text-[#4D5072] transition hover:bg-[#F2EEFD] hover:text-[#663CF6] shadow-xs"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                4
              </span>
            </button>

            {/* Help Link */}
            <Link
              href="/help"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DBF0] bg-white text-[#4D5072] transition hover:bg-[#F2EEFD] hover:text-[#663CF6] shadow-xs"
              aria-label="Open Help Center"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-[#D6DBF0] bg-white p-1 pr-2 sm:pr-3 transition hover:border-[#663CF6] shadow-xs cursor-pointer"
                aria-expanded={userMenuOpen}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#663CF6] to-[#8B5CF6] text-xs font-bold text-white shadow-xs">
                  {data.currentUser.avatarInitials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold leading-tight text-[#08093B]">
                    {data.currentUser.name}
                  </p>
                  <p className="text-[10px] text-[#76799C] capitalize">
                    {data.currentUser.role}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-[#4D5072]" />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-[16px] border border-[#D6DBF0] bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-[#DFE3F5]">
                    <p className="text-xs font-bold text-[#08093B]">{data.currentUser.name}</p>
                    <p className="text-[11px] text-[#76799C]">{user.email || data.currentUser.role}</p>
                    <span className="inline-block mt-1 rounded bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6]">
                      {data.school.name}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/contact"
                      className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs text-[#4D5072] hover:bg-[#F6F5FD] hover:text-[#663CF6]"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Contact Support</span>
                    </Link>
                    <Link
                      href="/feedback"
                      className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs text-[#4D5072] hover:bg-[#F6F5FD] hover:text-[#663CF6]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>Give Feedback</span>
                    </Link>
                  </div>
                  <div className="border-t border-[#DFE3F5] pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. LAYOUT: SIDEBAR + MAIN WORKSPACE
          ========================================================================= */}
      <div className="flex flex-1">
        {/* Left Sidebar Menu */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-[#D6DBF0] bg-white pt-16 lg:pt-0 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto px-3 py-4 flex flex-col justify-between">
            <div className="space-y-1">
              {/* Dashboard Item (Active Purple) */}
              <Link
                href="/dashboard"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 rounded-[12px] bg-[#663CF6] px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {/* Admissions with sub-items */}
              <div className="pt-1">
                <div className="flex items-center justify-between rounded-[10px] px-3.5 py-2 text-xs font-semibold text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] cursor-pointer">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4" />
                    <span>Admissions</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#76799C]" />
                </div>
                <div className="ml-7 space-y-1 border-l-2 border-[#DDD6FE] pl-2.5 py-1 text-[11px] font-medium text-[#76799C]">
                  <p className="hover:text-[#663CF6] cursor-pointer py-0.5">Applications</p>
                  <p className="hover:text-[#663CF6] cursor-pointer py-0.5">Enquiries</p>
                  <p className="hover:text-[#663CF6] cursor-pointer py-0.5">Admitted Students</p>
                  <p className="hover:text-[#663CF6] cursor-pointer py-0.5">Admission Settings</p>
                </div>
              </div>

              {/* Standard Menu Items with Chevrons matching mockup */}
              {[
                { icon: Users, label: "Students" },
                { icon: Users, label: "Parents & Guardians" },
                { icon: GraduationCap, label: "Academics" },
                { icon: Clock, label: "Attendance" },
                { icon: Calendar, label: "Timetable" },
                { icon: Users, label: "Staff" },
                { icon: CreditCard, label: "Finance" },
                { icon: Megaphone, label: "Marketing", badge: "New" },
                { icon: MessageSquare, label: "Communication" },
                { icon: BarChart3, label: "Reports" },
                { icon: Settings, label: "Settings" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-[10px] px-3.5 py-2 text-xs font-semibold text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[9px] font-extrabold text-[#663CF6]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-3 w-3 text-[#CAD0EB]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Bottom Card: Connected School Status */}
            <div className="mt-6 rounded-[14px] border border-[#DDD6FE] bg-gradient-to-br from-[#EDE7FF]/60 via-white to-[#F6F2FF] p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#663CF6]">
                Connected School
              </p>
              <p className="mt-1 text-xs font-extrabold text-[#08093B] truncate">
                {data.school.name}
              </p>
              <p className="text-[10px] text-[#76799C]">
                {data.school.affiliationBoard} · {data.school.code}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* =========================================================================
            3. MAIN CONTENT CANVAS
            ========================================================================= */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Top Hero Section: Greeting & Campus Architecture Banner */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight">
                Good Morning, {data.currentUser.name} 👋
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#4D5072]">
                Here&apos;s what&apos;s happening at{" "}
                <span className="font-bold text-[#663CF6]">{data.school.name}</span> today.
              </p>

              {/* 4 Info Meta Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-[#4D5072]">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs">
                  <Calendar className="h-3.5 w-3.5 text-[#663CF6]" />
                  <span>{data.academicSession.currentDate}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs">
                  <GraduationCap className="h-3.5 w-3.5 text-[#0284C7]" />
                  <span>Academic Year: {data.academicSession.year}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs">
                  <FileText className="h-3.5 w-3.5 text-[#D97706]" />
                  <span>Term: {data.academicSession.term}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6DBF0] bg-white px-3 py-1 shadow-xs">
                  <Clock className="h-3.5 w-3.5 text-[#15803D]" />
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
            <div className="relative overflow-hidden rounded-[20px] border border-[#DDD6FE]/80 bg-gradient-to-br from-white via-[#F6F2FF] to-[#EDE7FF]/60 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE]">
                  <Users className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.totalStudents.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C]">
                Total Students
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B]">
                {data.kpis.totalStudents.value.toLocaleString()}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C]">vs. previous month</p>
            </div>

            {/* Total Staff */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#BAE6FD]/80 bg-gradient-to-br from-white via-[#F0F8FF] to-[#E0F2FE]/60 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E0F2FE] text-[#0284C7] ring-1 ring-[#BAE6FD]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.totalStaff.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C]">
                Total Staff
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B]">
                {data.kpis.totalStaff.value}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C]">vs. previous month</p>
            </div>

            {/* Pending Admissions */}
            <div className="relative overflow-hidden rounded-[20px] border border-orange-200/80 bg-gradient-to-br from-white via-[#FFF7ED] to-[#FFEDD5]/60 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-orange-100 text-orange-600 ring-1 ring-orange-200">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.pendingAdmissions.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C]">
                Pending Admissions
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B]">
                {data.kpis.pendingAdmissions.value}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C]">vs. previous month</p>
            </div>

            {/* Fee Dues */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#FDE68A]/80 bg-gradient-to-br from-white via-[#FFFBEB] to-[#FEF3C7]/60 p-5 shadow-xs transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FEF3C7] text-[#D97706] ring-1 ring-[#FDE68A]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{data.kpis.feeDues.change}%</span>
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#76799C]">
                Fee Dues
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#08093B]">
                ₹{data.kpis.feeDues.value.toLocaleString("en-IN")}
              </h3>
              <p className="mt-1 text-[11px] text-[#76799C]">vs. previous month</p>
            </div>
          </div>

          {/* =========================================================================
              5. ROW 1: STUDENT OVERVIEW + ATTENDANCE + TODAY'S TASKS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Student Overview (5 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#663CF6]" />
                  <span>Student Overview</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setStudentSectionFilter((f) => (f === "section" ? "grade" : "section"))
                  }
                  className="rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#4D5072] flex items-center gap-1 hover:border-[#663CF6]"
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
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                    {/* Primary arc (37%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#8B5CF6"
                      strokeWidth="12"
                      strokeDasharray="88 238"
                      strokeDashoffset="0"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Middle arc (25%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#38BDF8"
                      strokeWidth="12"
                      strokeDasharray="59 238"
                      strokeDashoffset="-90"
                      fill="none"
                    />
                    {/* Secondary arc (22%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#EC4899"
                      strokeWidth="12"
                      strokeDasharray="52 238"
                      strokeDashoffset="-151"
                      fill="none"
                    />
                    {/* Senior Sec arc (16%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray="38 238"
                      strokeDashoffset="-205"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-sm font-black text-[#08093B]">
                      {data.studentOverview.total.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#76799C]">Students</p>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-1.5 w-full text-xs">
                  {data.studentOverview.sections.map((sec, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sec.color }}
                        />
                        <span className="text-[#4D5072] font-medium truncate">{sec.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#08093B] font-bold">
                        <span>{sec.count}</span>
                        <span className="text-[10px] text-[#76799C] w-9 text-right font-normal">
                          {sec.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance Today (3 cols) */}
            <div className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#15803D]" />
                  <span>Attendance (Today)</span>
                </h3>
              </div>

              {/* Circular Meter */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="10" fill="none" />
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
                    <p className="text-base font-black text-[#08093B]">
                      {data.attendanceToday.rate}%
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600">Present</p>
                  </div>
                </div>

                {/* Substats */}
                <div className="mt-3 grid grid-cols-3 gap-2 w-full text-center border-t border-[#DFE3F5] pt-3 text-[11px]">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{data.attendanceToday.present.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-[#76799C]">Present</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-red-500 font-bold">
                      <XCircle className="h-3 w-3" />
                      <span>{data.attendanceToday.absent}</span>
                    </div>
                    <span className="text-[10px] text-[#76799C]">Absent</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[#76799C] font-bold">
                      <span>{data.attendanceToday.notMarked}</span>
                    </div>
                    <span className="text-[10px] text-[#76799C]">Not Marked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Tasks (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#08093B]">Today&apos;s Tasks</h3>
                  <span className="text-xs font-bold text-[#663CF6]">
                    ({completedTasksCount} of {tasks.length})
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#EDE7FF] h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-[#663CF6] h-full transition-all duration-300"
                  style={{ width: `${(completedTasksCount / tasks.length) * 100}%` }}
                />
              </div>

              {/* Task Items Checklist */}
              <div className="space-y-2">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-[#FAF8FE] transition cursor-pointer select-none"
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
                          ? "line-through text-[#94A3B8]"
                          : "text-[#1B1D45] font-medium"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-bold text-[#64748B]">
                      {task.category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================================
              6. ROW 2: FEE COLLECTION BAR CHART + UPCOMING EVENTS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Fee Collection (8 cols) */}
            <div className="lg:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#663CF6]" />
                  <h3 className="text-sm font-extrabold text-[#08093B]">Fee Collection</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    {data.feeCollection.collectionRate}% Collection Rate
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFeeMonthFilter((m) => (m === "This Month" ? "Quarterly" : "This Month"))
                    }
                    className="rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#4D5072] flex items-center gap-1 hover:border-[#663CF6]"
                  >
                    <span>{feeMonthFilter}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Top stats summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[#DFE3F5] pb-4 mb-4">
                <div>
                  <p className="text-[10px] text-[#76799C]">Collected</p>
                  <p className="text-sm font-black text-[#08093B]">
                    ₹{data.feeCollection.collectedAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#76799C]">Total Fee</p>
                  <p className="text-sm font-bold text-[#4D5072]">
                    ₹{data.feeCollection.totalFee.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#76799C]">Pending</p>
                  <p className="text-sm font-bold text-amber-600">
                    ₹{data.feeCollection.pendingFee.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#76799C]">Overdue</p>
                  <p className="text-sm font-bold text-red-600">
                    ₹{data.feeCollection.overdueFee.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Monthly Bar Chart */}
              <div className="flex items-center justify-between text-[11px] text-[#76799C] mb-2">
                <span>Monthly Collection (in Lakhs ₹)</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#663CF6]" />
                    <span>Collected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#DDD6FE]" />
                    <span>Due</span>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between h-36 pt-4 gap-1 sm:gap-2">
                {data.feeCollection.monthlyTrends.map((item, idx) => {
                  const maxH = 20; // scale reference
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
                          className="w-2 sm:w-3.5 bg-[#DDD6FE] rounded-t-sm transition-all hover:opacity-85"
                          style={{ height: `${dueHeight}%` }}
                          title={`Due: ₹${item.due}L`}
                        />
                      </div>
                      <span className="text-[10px] text-[#76799C]">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Events (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#663CF6]" />
                  <h3 className="text-sm font-extrabold text-[#08093B]">Upcoming Events</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Calendar</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Event Cards */}
              <div className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2.5 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] hover:border-[#9B76FF] transition"
                  >
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-[10px] bg-[#663CF6] text-white shrink-0 shadow-xs">
                      <span className="text-base font-black leading-none">{event.date}</span>
                      <span className="text-[10px] font-bold uppercase">{event.month}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-[#08093B] truncate">{event.title}</h4>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${event.badgeBg} ${event.badgeText} shrink-0`}>
                          {event.category}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#76799C] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#76799C]">Syncs with academic calendar</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              7. ROW 3: RECENT ADMISSIONS + ACTIVITIES + QUICK ACTIONS
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Recent Admissions (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#663CF6]" />
                  <h3 className="text-sm font-extrabold text-[#08093B]">Recent Admissions</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DFE3F5] text-[10px] font-bold uppercase text-[#76799C]">
                      <th className="pb-2">Applicant</th>
                      <th className="pb-2">Class</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {data.recentAdmissions.map((adm) => (
                      <tr key={adm.id} className="hover:bg-[#FAF8FE] transition">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${adm.avatarBg}`}>
                              {adm.initials}
                            </span>
                            <span className="font-bold text-[#08093B] truncate">{adm.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-[#4D5072]">{adm.classApplied}</td>
                        <td className="py-2.5">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${adm.statusBg} ${adm.statusColor}`}>
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-[11px] text-[#76799C]">
                          {adm.appliedOn}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activities (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#0284C7]" />
                  <h3 className="text-sm font-extrabold text-[#08093B]">Recent Activities</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Timeline List */}
              <div className="space-y-3">
                {data.recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#663CF6] mt-1.5 shrink-0 ring-4 ring-[#EDE7FF]" />
                    <div className="flex-1 text-xs leading-relaxed">
                      <p className="text-[#1B1D45] font-medium">{act.description}</p>
                      <span className="text-[10px] text-[#76799C]">{act.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#76799C]">Live audit events recorded</span>
              </div>
            </div>

            {/* Quick Actions (3 cols) */}
            <div className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#D97706]" />
                <h3 className="text-sm font-extrabold text-[#08093B]">Quick Actions</h3>
              </div>

              {/* 6 Action Tiles */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Add Student", icon: UserPlus, color: "text-[#663CF6] bg-[#EDE7FF]" },
                  { label: "Add Staff", icon: GraduationCap, color: "text-[#0284C7] bg-[#E0F2FE]" },
                  { label: "Create Class", icon: School, color: "text-[#15803D] bg-[#DCFCE7]" },
                  { label: "Send Notice", icon: Megaphone, color: "text-[#D946EF] bg-[#FAE8FF]" },
                  { label: "Collect Fee", icon: CreditCard, color: "text-[#D97706] bg-[#FEF3C7]" },
                  { label: "Generate Report", icon: BarChart3, color: "text-indigo-600 bg-indigo-50" },
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickActionModal(act.label)}
                      className="group flex flex-col items-center justify-center rounded-[14px] border border-[#D6DBF0] bg-white p-3 text-center transition hover:border-[#663CF6] hover:bg-[#FAF8FE] hover:shadow-xs cursor-pointer"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${act.color} transition-transform group-hover:scale-110 mb-1.5`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-[#08093B] group-hover:text-[#663CF6]">
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
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B]">Class-wise Student Strength</h3>
                <button type="button" className="text-xs font-bold text-[#663CF6] hover:underline">
                  View Details →
                </button>
              </div>

              {/* Bar Chart */}
              <div className="flex items-end justify-around h-36 pt-4 gap-2">
                {data.classStrength.map((c, idx) => {
                  const maxCount = Math.max(...data.classStrength.map((x) => x.count));
                  const h = (c.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[11px] font-bold text-[#08093B]">{c.count}</span>
                      <div
                        className="w-10 sm:w-12 bg-gradient-to-t from-[#663CF6] via-[#8B5CF6] to-[#A78BFA] rounded-t-md transition-all hover:opacity-90"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] font-semibold text-[#76799C]">{c.range}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fee Overview Donut (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B]">Fee Overview</h3>
              </div>

              <div className="flex items-center gap-4 py-2">
                {/* SVG Donut */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                    {/* Collected (72.6%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#663CF6"
                      strokeWidth="12"
                      strokeDasharray="172 238"
                      strokeDashoffset="0"
                      fill="none"
                    />
                    {/* Pending (27.4%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray="65 238"
                      strokeDashoffset="-173"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xs font-black text-[#08093B]">₹17.55L</p>
                    <p className="text-[9px] text-[#76799C]">Total Fee</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#663CF6]" />
                      <span className="text-[#4D5072]">Collected</span>
                    </div>
                    <span className="font-bold text-[#08093B]">
                      ₹{(data.feeCollection.collectedAmount / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-[#4D5072]">Pending</span>
                    </div>
                    <span className="font-bold text-amber-600">
                      ₹{(data.feeCollection.pendingFee / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[#4D5072]">Overdue</span>
                    </div>
                    <span className="font-bold text-red-600">
                      ₹{(data.feeCollection.overdueFee / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Summary (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B]">Communication Summary</h3>
                <button type="button" className="text-xs font-bold text-[#663CF6] hover:underline">
                  View Reports →
                </button>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2.5 py-2">
                <div className="rounded-[14px] bg-[#EDE7FF]/60 border border-[#DDD6FE] p-3 text-center">
                  <Megaphone className="h-4 w-4 mx-auto text-[#663CF6]" />
                  <p className="mt-2 text-lg font-black text-[#08093B]">
                    {data.communicationSummary.noticesSent}
                  </p>
                  <p className="text-[10px] text-[#76799C]">Notices Sent</p>
                </div>

                <div className="rounded-[14px] bg-[#E0F2FE]/60 border border-[#BAE6FD] p-3 text-center">
                  <MessageSquare className="h-4 w-4 mx-auto text-[#0284C7]" />
                  <p className="mt-2 text-lg font-black text-[#08093B]">
                    {data.communicationSummary.smsDelivered}
                  </p>
                  <p className="text-[10px] text-[#76799C]">SMS Delivered</p>
                </div>

                <div className="rounded-[14px] bg-[#FAF8FE] border border-[#D6DBF0] p-3 text-center">
                  <Mail className="h-4 w-4 mx-auto text-[#7C3AED]" />
                  <p className="mt-2 text-lg font-black text-[#08093B]">
                    {data.communicationSummary.emailsDelivered}
                  </p>
                  <p className="text-[10px] text-[#76799C]">Emails Delivered</p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              9. ROW 5: ACADEMIC PERFORMANCE + TOP CLASSES
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Academic Performance (8 cols) */}
            <div className="lg:col-span-8 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#663CF6]" />
                  <h3 className="text-sm font-extrabold text-[#08093B]">Academic Performance</h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAcademicTermFilter((t) => (t === "By Term" ? "By Exam" : "By Term"))
                  }
                  className="rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 py-1 text-[11px] font-bold text-[#4D5072] flex items-center gap-1 hover:border-[#663CF6]"
                >
                  <span>{academicTermFilter}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Score Card */}
                <div className="rounded-[16px] bg-[#FAF8FE] border border-[#DDD6FE] p-4 text-center sm:w-44 shrink-0">
                  <p className="text-2xl font-black text-[#08093B]">
                    {data.academicPerformance.overallPassRate}%
                  </p>
                  <p className="text-xs text-[#76799C]">Overall Pass Rate</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{data.academicPerformance.trendVsLastTerm}% vs. last term</span>
                  </span>
                </div>

                {/* Trend Progression Chart */}
                <div className="flex-1 w-full">
                  <p className="text-[11px] font-bold text-[#76799C] mb-2">
                    Average Class Performance (%)
                  </p>
                  <div className="flex items-end justify-between h-28 pt-2 gap-2">
                    {data.academicPerformance.termTrends.map((t, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
                        <span className="text-[10px] font-bold text-[#663CF6]">
                          {t.percentage}%
                        </span>
                        <div
                          className="w-full max-w-[40px] bg-gradient-to-t from-[#663CF6] to-[#A78BFA] rounded-t-sm"
                          style={{ height: `${(t.percentage / 100) * 80}px` }}
                        />
                        <span className="text-[9px] text-[#76799C] text-center line-clamp-1">
                          {t.term}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Classes (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B]">Top Performing Classes</h3>
                <span className="text-[11px] text-[#76799C]">This Term</span>
              </div>

              <div className="space-y-3">
                {data.academicPerformance.topClasses.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAF8FE] border border-[#DFE3F5]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-bold text-[#663CF6]">
                        {item.rank}
                      </span>
                      <span className="text-xs font-bold text-[#08093B]">{item.className}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600">{item.score}%</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-[#76799C]">Adheres to standard board grading</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              10. ROW 6: ADMISSION FUNNEL + STAFF OVERVIEW + GENDER BREAKDOWN
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Admission Funnel (5 cols) */}
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#08093B]">Admission Funnel</h3>
                <span className="text-[11px] text-[#76799C]">This Academic Year</span>
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
                <div className="text-center p-3 rounded-[14px] bg-[#FAF8FE] border border-[#DDD6FE] shrink-0">
                  <p className="text-xs text-[#76799C]">Conversion Rate</p>
                  <p className="text-xl font-black text-[#08093B]">
                    {data.admissionFunnel.conversionRate}%
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    +{data.admissionFunnel.trendVsLastYear}% vs. last year
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Overview Donut (4 cols) */}
            <div className="lg:col-span-4 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B]">Staff Overview</h3>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
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
                    <p className="text-sm font-black text-[#08093B]">{data.staffOverview.total}</p>
                    <p className="text-[9px] text-[#76799C]">Total Staff</p>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                      <span className="text-[#4D5072]">Teaching</span>
                    </div>
                    <span className="font-bold text-[#08093B]">{data.staffOverview.teaching}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                      <span className="text-[#4D5072]">Non-Teaching</span>
                    </div>
                    <span className="font-bold text-[#08093B]">{data.staffOverview.nonTeaching}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-[#4D5072]">Administrative</span>
                    </div>
                    <span className="font-bold text-[#08093B]">
                      {data.staffOverview.administrative}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Student by Gender (3 cols) */}
            <div className="lg:col-span-3 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#08093B]">Student by Gender</h3>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
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
                    <p className="text-xs font-black text-[#08093B]">
                      {data.genderBreakdown.total}
                    </p>
                    <p className="text-[9px] text-[#76799C]">Students</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                      <span className="text-[#4D5072]">Boys</span>
                    </div>
                    <span className="font-bold text-[#08093B]">
                      {data.genderBreakdown.boys} ({data.genderBreakdown.boysPercentage}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#EC4899]" />
                      <span className="text-[#4D5072]">Girls</span>
                    </div>
                    <span className="font-bold text-[#08093B]">
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
            <div className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#663CF6]" />
                <h3 className="text-sm font-extrabold text-[#08093B]">Key Insights</h3>
              </div>

              <div className="space-y-3">
                {data.keyInsights.map((ins) => (
                  <div
                    key={ins.id}
                    className="flex items-start gap-3 p-3 rounded-[14px] bg-[#FAF8FE] border border-[#DFE3F5]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white shadow-xs shrink-0 text-[#663CF6]">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-[#08093B]">
                        {ins.metric}{" "}
                        <span className="text-[#663CF6]">{ins.changeText}</span>{" "}
                        <span className="font-semibold text-[#76799C]">{ins.highlightText}</span>
                      </p>
                      <p className="text-[10px] text-[#76799C]">{ins.periodText}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notices & Announcements (7 cols) */}
            <div className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[#0284C7]" />
                  <h3 className="text-sm font-extrabold text-[#08093B]">Notices & Announcements</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-[#663CF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3">
                {data.notices.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-[14px] border border-[#DFE3F5] hover:border-[#9B76FF] transition bg-[#FAF8FE]"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[#663CF6] shadow-xs shrink-0">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#08093B]">{n.title}</h4>
                        <p className="mt-0.5 text-[11px] text-[#4D5072] leading-relaxed">
                          {n.summary}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#76799C] shrink-0">
                      {n.date}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right">
                <span className="text-[11px] text-[#76799C]">Broadcasts to parents & staff</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              12. BOTTOM HELP & FEEDBACK BANNER (From uploaded mockup)
              ========================================================================= */}
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#663CF6] via-[#7C3AED] to-[#4F27E8] p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/15 backdrop-blur-md text-white">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Need Help or Have Suggestions?</h3>
                  <p className="mt-0.5 text-xs text-purple-100">
                    Get support, share feedback or request a feature enhancement.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-white px-4 py-2 text-xs font-bold text-[#4F27E8] shadow-sm transition hover:bg-[#F6F5FD]"
                >
                  <span>Contact Support</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/feedback"
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-white/30"
                >
                  <span>Share Feedback</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer inside panel */}
          <footer className="border-t border-[#DFE3F5] pt-6 pb-4 text-xs text-[#76799C] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>&copy; {new Date().getFullYear()} ScholoNix. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="hover:text-[#663CF6]">
                Support
              </Link>
              <Link href="/feedback" className="hover:text-[#663CF6]">
                Feedback
              </Link>
              <Link href="/help" className="hover:text-[#663CF6]">
                Help Center
              </Link>
            </div>
          </footer>
        </main>
      </div>

      {/* Quick Action Modal Preview */}
      {quickActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl border border-[#D6DBF0]">
            <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 mb-4">
              <h3 className="text-base font-extrabold text-[#08093B]">
                {quickActionModal}
              </h3>
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="rounded-full p-1 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#4D5072] leading-relaxed">
              Launch module for <strong>{quickActionModal}</strong> configured for{" "}
              <strong>{data.school.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickActionModal(null)}
                className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F8FAFC]"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-xs p-4 pt-20">
          <div className="w-full max-w-lg rounded-[20px] bg-white p-4 shadow-2xl border border-[#D6DBF0]">
            <div className="flex items-center gap-2 border-b border-[#DFE3F5] pb-3">
              <Search className="h-4 w-4 text-[#76799C]" />
              <input
                type="text"
                autoFocus
                placeholder="Search students, teachers, fees, roll numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm text-[#08093B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded p-1 text-[#76799C] hover:text-[#08093B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-1 max-h-64 overflow-y-auto text-xs">
              <p className="px-2 py-1 text-[10px] font-bold uppercase text-[#76799C]">
                Quick School Matches ({data.school.name})
              </p>
              {data.recentAdmissions.map((adm) => (
                <div
                  key={adm.id}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#FAF8FE] cursor-pointer"
                >
                  <span className="font-bold text-[#08093B]">{adm.name}</span>
                  <span className="text-[11px] text-[#76799C]">{adm.classApplied}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
