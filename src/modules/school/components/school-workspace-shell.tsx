"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildSchoolRoute } from "@/modules/school/utils/shell-props";
export { buildSchoolRoute };
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Clock,
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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  UserPlus,
  Sparkles,
  Send,
  CheckCircle2,
  Loader2,
  Building2,
} from "lucide-react";

import type { AdmissionsTab } from "@/modules/school/admissions/types";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export interface SchoolShellSchool {
  id: string;
  name: string;
  slug: string;
  uniqueId?: string | null;
  code: string;
  affiliationBoard: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface SchoolShellUser {
  id: string;
  name: string;
  displayRole: string;
  avatarInitials: string;
  email: string | null;
  phone: string | null;
}

interface SchoolWorkspaceShellProps {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  activeNav: "dashboard" | "admissions" | "profile" | "help";
  activeAdmissionsTab?: AdmissionsTab;
  onSelectAdmissionsTab?: (tab: AdmissionsTab) => void;
  noticeCount?: number;
  onOpenSearch?: () => void;
  children: React.ReactNode;
}

export function SchoolWorkspaceShell({
  school,
  user,
  activeNav,
  activeAdmissionsTab,
  onSelectAdmissionsTab,
  noticeCount = 0,
  onOpenSearch,
  children,
}: SchoolWorkspaceShellProps) {
  const router = useRouter();
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [admissionsOpen, setAdmissionsOpen] = useState(activeNav === "admissions");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [portalModal, setPortalModal] = useState<"support" | "feedback" | null>(null);

  // In-portal Support & Feedback submission state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<
    "General Experience" | "Feature Request" | "Bug Report" | "Design & Usability" | "Administration & Billing"
  >("General Experience");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedbackMsg, setSubmitFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const dashboardHref = buildSchoolRoute(school.slug);
  const profileHref = buildSchoolRoute(school.slug, "profile");
  const helpHref = buildSchoolRoute(school.slug, "help");

  // Warm the primary peer workspace route once so Dashboard <-> Admissions switching stays responsive
  // without triggering 5 concurrent SSR prefetches for every Admissions sub-tab.
  useEffect(() => {
    if (typeof router.prefetch !== "function") return;
    if (activeNav === "admissions") {
      router.prefetch(dashboardHref);
    } else {
      router.prefetch(buildSchoolRoute(school.slug, "admissions?tab=overview"));
    }
  }, [activeNav, dashboardHref, router, school.slug]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setPortalModal(null);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network error during sign-out
    }
    router.push("/login");
  };

  const openSupportModal = (mode: "support" | "feedback") => {
    setUserMenuOpen(false);
    setSubmitFeedbackMsg(null);
    setSubject("");
    setMessage("");
    setPortalModal(mode);
  };

  const handleSubmitPortalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFeedbackMsg(null);
    setIsSubmitting(true);

    try {
      if (portalModal === "support") {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email || "noreply@scholonix.com",
            phone: user.phone || "",
            schoolName: school.name,
            role: user.displayRole,
            subject: subject.trim() || "School Workspace Support Request",
            message: message.trim(),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Unable to send support inquiry.");
        }
        setSubmitFeedbackMsg({ type: "success", text: json.message });
      } else if (portalModal === "feedback") {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: feedbackCategory,
            rating,
            feedback: message.trim(),
            role: user.displayRole,
            email: user.email || "",
            schoolName: school.name,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Unable to submit feedback.");
        }
        setSubmitFeedbackMsg({ type: "success", text: json.message });
      }
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      setSubmitFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F6FC] text-[#1B1D45] flex flex-col font-sans overflow-x-clip dark:bg-[#090B1A] dark:text-[#DCE1F9] transition-colors duration-200">
      {/* =========================================================================
          1. TOP APP HEADER / BAR (Strictly single-tenant, no multi-school switcher)
          ========================================================================= */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#D6DBF0] bg-white/98 backdrop-blur-md px-3 sm:px-6 flex items-center shadow-xs dark:border-[#272B4D] dark:bg-[#0E1026]/95">
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle Controls & Single Verified School Pill */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              id="mobile-sidebar-toggle-btn"
              type="button"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#08093B] shadow-xs transition hover:border-[#663CF6] hover:bg-[#FAF8FE] lg:hidden cursor-pointer dark:border-[#2E345B] dark:bg-[#161A36] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6] dark:hover:bg-[#201D47]"
              aria-label={mobileSidebarOpen ? "Hide menu bar" : "Open menu bar"}
              aria-expanded={mobileSidebarOpen}
              aria-controls="school-sidebar"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              id="desktop-sidebar-toggle-btn"
              type="button"
              onClick={() => setDesktopSidebarOpen((prev) => !prev)}
              className="hidden lg:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D6DBF0] bg-white text-[#08093B] shadow-xs transition hover:border-[#663CF6] hover:bg-[#FAF8FE] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#161A36] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6] dark:hover:bg-[#201D47] dark:hover:text-[#C4B5FD]"
              aria-label={desktopSidebarOpen ? "Hide menu bar" : "Open menu bar"}
              aria-expanded={desktopSidebarOpen}
              aria-controls="school-sidebar"
              title={desktopSidebarOpen ? "Hide menu bar" : "Open menu bar"}
            >
              {desktopSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* Static Single-School Identity Badge */}
            <Link
              id="active-school-badge"
              href={dashboardHref}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#D6DBF0] bg-[#FAF8FE] px-2.5 sm:px-3 py-1 text-xs font-bold text-[#08093B] shadow-xs transition hover:border-[#9B76FF] max-w-[190px] sm:max-w-xs dark:border-[#2E345B] dark:bg-[#181B38] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
              title={school.name}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#663CF6] text-white text-[10px]">
                🎓
              </div>
              <span className="truncate">{school.name}</span>
            </Link>
          </div>

          {/* Middle: Universal Search Bar (Ctrl + K when on Dashboard) */}
          <div className="flex-1 max-w-md hidden md:block">
            {onOpenSearch ? (
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex w-full items-center justify-between rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3.5 py-1.5 text-xs text-[#76799C] transition hover:border-[#663CF6] hover:bg-white cursor-pointer shadow-xs dark:border-[#30365C] dark:bg-[#141731] dark:text-[#9DA6CC] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-[#76799C] dark:text-[#9DA6CC]" />
                  <span>Search students, staff, classes, fees, etc.</span>
                </div>
                <kbd className="rounded border border-[#D6DBF0] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#4D5072] shadow-xs dark:border-[#2E345B] dark:bg-[#0E1026] dark:text-[#C5CCF0]">
                  Ctrl + K
                </kbd>
              </button>
            ) : (
              <Link
                href={dashboardHref}
                className="flex w-full items-center justify-between rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3.5 py-1.5 text-xs text-[#76799C] transition hover:border-[#663CF6] hover:bg-white shadow-xs dark:border-[#30365C] dark:bg-[#141731] dark:text-[#9DA6CC] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                  <span>Back to {school.name} Dashboard</span>
                </div>
              </Link>
            )}
          </div>

          {/* Right: Theme Toggle, Notifications & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Notification Bell with Badge */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DBF0] bg-white text-[#4D5072] transition hover:bg-[#F2EEFD] hover:text-[#663CF6] shadow-xs dark:border-[#2E345B] dark:bg-[#161A36] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6] dark:hover:bg-[#231D4B] dark:hover:text-[#D9CEFF]"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {noticeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0E1026]">
                  {noticeCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-[#D6DBF0] bg-white p-1 pr-2 sm:pr-3 transition hover:border-[#663CF6] shadow-xs cursor-pointer dark:border-[#2E345B] dark:bg-[#161A36] dark:hover:border-[#8B5CF6]"
                aria-expanded={userMenuOpen}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#663CF6] to-[#8B5CF6] text-xs font-bold text-white shadow-xs">
                  {user.avatarInitials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold leading-tight text-[#08093B] dark:text-[#F3F5FF]">{user.name}</p>
                  <p className="text-[10px] text-[#76799C] capitalize dark:text-[#9DA6CC]">{user.displayRole}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-[#4D5072] dark:text-[#9DA6CC]" />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-[16px] border border-[#D6DBF0] bg-white p-2 shadow-xl z-50 dark:border-[#2E345B] dark:bg-[#141731] dark:shadow-black/60">
                  <div className="px-3 py-2 border-b border-[#DFE3F5] dark:border-[#232746]">
                    <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">{user.name}</p>
                    <p className="text-[11px] text-[#76799C] truncate dark:text-[#9DA6CC]">
                      {user.email || user.displayRole}
                    </p>
                    <span className="inline-block mt-1 rounded bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] max-w-full truncate dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                      {school.name}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      href={profileHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs text-[#4D5072] hover:bg-[#F6F5FD] hover:text-[#663CF6] dark:text-[#C5CCF0] dark:hover:bg-[#1E2244] dark:hover:text-[#D9CEFF]"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>School Profile</span>
                    </Link>
                    <Link
                      href={helpHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs text-[#4D5072] hover:bg-[#F6F5FD] hover:text-[#663CF6] dark:text-[#C5CCF0] dark:hover:bg-[#1E2244] dark:hover:text-[#D9CEFF]"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Help Center</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => openSupportModal("support")}
                      className="flex w-full items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs text-[#4D5072] hover:bg-[#F6F5FD] hover:text-[#663CF6] cursor-pointer dark:text-[#C5CCF0] dark:hover:bg-[#1E2244] dark:hover:text-[#D9CEFF]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Contact Support</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSupportModal("feedback")}
                      className="flex w-full items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs text-[#4D5072] hover:bg-[#F6F5FD] hover:text-[#663CF6] cursor-pointer dark:text-[#C5CCF0] dark:hover:bg-[#1E2244] dark:hover:text-[#D9CEFF]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                      <span>Give Feedback</span>
                    </button>
                  </div>
                  <div className="border-t border-[#DFE3F5] pt-1 dark:border-[#232746]">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer dark:text-red-400 dark:hover:bg-red-950/50"
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
          2. LAYOUT: FIXED SCROLLABLE SIDEBAR + MAIN WORKSPACE
          ========================================================================= */}
      <div className="flex flex-1">
        <aside
          id="school-sidebar"
          aria-label="School navigation menu"
          className={`fixed top-14 left-0 bottom-0 z-30 w-64 h-[calc(100dvh-3.5rem)] border-r border-[#D6DBF0] bg-white transform transition-[transform,visibility] duration-300 ease-in-out dark:border-[#272B4D] dark:bg-[#0E1026] ${
            mobileSidebarOpen
              ? "translate-x-0 visible pointer-events-auto"
              : "-translate-x-full invisible pointer-events-none"
          } ${
            desktopSidebarOpen
              ? "lg:translate-x-0 lg:visible lg:pointer-events-auto"
              : "lg:-translate-x-full lg:invisible lg:pointer-events-none"
          }`}
        >
          <div className="h-full overflow-y-auto overscroll-contain school-menu-scrollbar px-3 py-4 flex flex-col justify-between">
            <nav aria-label="Primary school navigation" className="space-y-1">
              {/* Dashboard Item */}
              <Link
                href={dashboardHref}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-xs font-bold transition ${
                  activeNav === "dashboard"
                    ? "bg-[#663CF6] text-white shadow-md"
                    : "text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] dark:text-[#B4BDD9] dark:hover:bg-[#191D3D] dark:hover:text-[#D9CEFF]"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>

              {/* Admissions Dropdown (closed by default on Dashboard/Help; open on Admissions routes) */}
              <div className="pt-1">
                <button
                  id="admissions-dropdown-btn"
                  type="button"
                  onClick={() => setAdmissionsOpen((prev) => !prev)}
                  aria-expanded={admissionsOpen}
                  aria-controls="admissions-submenu"
                  className={`flex w-full items-center justify-between rounded-[12px] px-3.5 py-2.5 text-xs font-bold cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] ${
                    activeNav === "admissions"
                      ? "bg-[#663CF6] text-white shadow-md"
                      : admissionsOpen
                        ? "bg-[#FAF8FE] text-[#663CF6] dark:bg-[#1C1A3D] dark:text-[#C4B5FD]"
                        : "text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] dark:text-[#B4BDD9] dark:hover:bg-[#191D3D] dark:hover:text-[#D9CEFF]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    <span>Admissions</span>
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none ${
                      admissionsOpen
                        ? `rotate-180 ${activeNav === "admissions" ? "text-white" : "text-[#663CF6] dark:text-[#A78BFA]"}`
                        : `rotate-0 ${activeNav === "admissions" ? "text-white" : "text-[#76799C] dark:text-[#9DA6CC]"}`
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {admissionsOpen && (
                  <div
                    id="admissions-submenu"
                    className="mt-1 ml-4 space-y-0.5 rounded-[12px] border border-[#EDE7FF] bg-[#FAF8FE]/80 p-1.5 text-[11px] font-medium text-[#4D5072] dark:border-[#2C285A] dark:bg-[#151836] dark:text-[#B4BDD9]"
                  >
                    {(
                      [
                        { label: "Overview", tab: "overview" },
                        { label: "Applications", tab: "applications" },
                        { label: "Enquiries", tab: "enquiries" },
                        { label: "Admitted Students", tab: "admitted" },
                        { label: "Admission Settings", tab: "settings" },
                      ] as Array<{ label: string; tab: AdmissionsTab }>
                    ).map((subItem) => {
                      const isSubActive =
                        activeNav === "admissions" &&
                        (activeAdmissionsTab ?? "overview") === subItem.tab;
                      const href = buildSchoolRoute(school.slug, `admissions?tab=${subItem.tab}`);
                      return (
                        <Link
                          key={subItem.tab}
                          href={href}
                          prefetch={false}
                          aria-current={isSubActive ? "page" : undefined}
                          onMouseEnter={() => {
                            if (activeNav !== "admissions" && typeof router.prefetch === "function") {
                              router.prefetch(href);
                            }
                          }}
                          onFocus={() => {
                            if (activeNav !== "admissions" && typeof router.prefetch === "function") {
                              router.prefetch(href);
                            }
                          }}
                          onClick={(e) => {
                            setMobileSidebarOpen(false);
                            if (
                              activeNav === "admissions" &&
                              onSelectAdmissionsTab &&
                              !e.metaKey &&
                              !e.ctrlKey &&
                              !e.shiftKey &&
                              !e.altKey &&
                              e.button === 0
                            ) {
                              e.preventDefault();
                              onSelectAdmissionsTab(subItem.tab);
                            }
                          }}
                          className={`flex w-full items-center rounded-[8px] border-l-2 px-2.5 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] ${
                            isSubActive
                              ? "border-[#663CF6] bg-white font-bold text-[#663CF6] shadow-2xs dark:border-[#8B5CF6] dark:bg-[#221D4C] dark:text-[#E2D9FF]"
                              : "border-transparent text-[#4D5072] hover:border-[#663CF6] hover:bg-white hover:text-[#663CF6] dark:text-[#B4BDD9] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1E2245] dark:hover:text-[#D9CEFF]"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Standard Menu Items */}
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
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex w-full items-center justify-between rounded-[10px] px-3.5 py-2 text-left text-xs font-semibold text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] cursor-pointer transition dark:text-[#B4BDD9] dark:hover:bg-[#191D3D] dark:hover:text-[#D9CEFF]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[9px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-3 w-3 text-[#CAD0EB] dark:text-[#4C5582]" aria-hidden="true" />
                    </div>
                  </button>
                );
              })}

              {/* School Profile */}
              <Link
                href={profileHref}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center justify-between rounded-[12px] px-3.5 py-2.5 text-xs font-bold transition ${
                  activeNav === "profile"
                    ? "bg-[#663CF6] text-white shadow-md"
                    : "text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] dark:text-[#B4BDD9] dark:hover:bg-[#191D3D] dark:hover:text-[#D9CEFF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  <span>School Profile</span>
                </div>
                <ChevronRight
                  className={`h-3 w-3 ${activeNav === "profile" ? "text-white" : "text-[#CAD0EB] dark:text-[#4C5582]"}`}
                  aria-hidden="true"
                />
              </Link>

              {/* In-Portal Help Item */}
              <Link
                href={helpHref}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center justify-between rounded-[12px] px-3.5 py-2.5 text-xs font-bold transition ${
                  activeNav === "help"
                    ? "bg-[#663CF6] text-white shadow-md"
                    : "text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#663CF6] dark:text-[#B4BDD9] dark:hover:bg-[#191D3D] dark:hover:text-[#D9CEFF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Help Center</span>
                </div>
                <ChevronRight
                  className={`h-3 w-3 ${activeNav === "help" ? "text-white" : "text-[#CAD0EB] dark:text-[#4C5582]"}`}
                  aria-hidden="true"
                />
              </Link>
            </nav>

            {/* Sidebar Bottom Card: Connected School Status */}
            <div className="mt-6 rounded-[14px] border border-[#DDD6FE] bg-gradient-to-br from-[#EDE7FF]/60 via-white to-[#F6F2FF] p-3 text-center dark:border-[#2E2A5C] dark:from-[#1D1840] dark:via-[#141731] dark:to-[#181B38]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#663CF6] dark:text-[#A78BFA]">
                Connected School
              </p>
              <p className="mt-1 text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">{school.name}</p>
              <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                {school.affiliationBoard} · {school.code}
              </p>
              {school.uniqueId && (
                <p className="mt-1 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-mono font-bold text-[#663CF6] dark:bg-[#10142C] dark:text-[#C4B5FD]">
                  ID: {school.uniqueId}
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-20 bg-black/30 backdrop-blur-xs lg:hidden dark:bg-black/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Workspace Content */}
        <div
          className={`flex-1 min-w-0 transition-[padding] duration-300 ease-in-out ${
            desktopSidebarOpen ? "lg:pl-64" : "lg:pl-0"
          }`}
        >
        <main className="min-w-0 overflow-x-hidden p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full flex flex-col justify-between">
          <div className="space-y-6">{children}</div>

          {/* Shared In-Portal Footer */}
          <div className="pt-2">
            <footer className="border-t border-[#DFE3F5] pt-6 pb-4 text-xs text-[#76799C] flex flex-col sm:flex-row items-center justify-between gap-3 dark:border-[#232746] dark:text-[#9DA6CC]">
              <p>
                &copy; {new Date().getFullYear()} ScholoNix · {school.name} Workspace
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openSupportModal("support")}
                  className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] cursor-pointer"
                >
                  Support
                </button>
                <button
                  type="button"
                  onClick={() => openSupportModal("feedback")}
                  className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] cursor-pointer"
                >
                  Feedback
                </button>
                <Link href={helpHref} className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                  Help Center
                </Link>
              </div>
            </footer>
          </div>
        </main>
        </div>
      </div>

      {/* =========================================================================
          IN-PORTAL SUPPORT & FEEDBACK MODAL (Never leaves school workspace)
          ========================================================================= */}
      {portalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-support-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 dark:bg-black/65"
        >
          <div className="w-full max-w-md rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-2xl dark:border-[#2E345B] dark:bg-[#141731]">
            <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 mb-4 dark:border-[#232746]">
              <div>
                <h3 id="portal-support-modal-title" className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {portalModal === "support" ? "Contact School Support" : "Share Product Feedback"}
                </h3>
                <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                  Submitting as {user.name} · {school.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPortalModal(null)}
                aria-label="Close dialog"
                className="rounded-full p-1 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1F2447] dark:hover:text-[#F3F5FF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitFeedbackMsg && (
              <div
                className={`mb-4 flex items-start gap-2 rounded-[12px] border p-3 text-xs font-medium ${
                  submitFeedbackMsg.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitFeedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPortalForm} className="space-y-3.5">
              {portalModal === "support" ? (
                <div>
                  <label className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Fee receipt setup question"
                    className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#DCE1F9] dark:placeholder:text-[#7A83AD]"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) =>
                        setFeedbackCategory(
                          e.target.value as
                            | "General Experience"
                            | "Feature Request"
                            | "Bug Report"
                            | "Design & Usability"
                            | "Administration & Billing",
                        )
                      }
                      className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#DCE1F9]"
                    >
                      <option value="General Experience">General Experience</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Design & Usability">Design &amp; Usability</option>
                      <option value="Administration & Billing">Administration &amp; Billing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-2.5 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#DCE1F9]"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                  {portalModal === "support" ? "How can we help?" : "Your Feedback"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={portalModal === "support" ? 10 : 5}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your request or feedback..."
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#DCE1F9] dark:placeholder:text-[#7A83AD]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPortalModal(null)}
                  className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F8FAFC] cursor-pointer dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1D2245]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
