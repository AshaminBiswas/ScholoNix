"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type {
  PlatformAdminRoleValue,
  PlatformOverviewData,
  PlatformOverviewPeriodDays,
  PlatformSchoolEntry,
  PlatformTab,
} from "@/modules/platform/types";
import { PlatformOverviewTab } from "./platform-overview-tab";
import { PlatformSchoolsTab } from "./platform-schools-tab";
import { PlatformAdminsTab } from "./platform-admins-tab";
import { PlatformSettingsTab } from "./platform-settings-tab";
import { PlatformProvisionSchoolModal } from "./platform-provision-modal";
import {
  PlatformAnnouncementsTab,
  PlatformAuditHealthTab,
  PlatformBillingTab,
  PlatformSupportTab,
  PlatformUsersTab,
} from "./platform-operations-tabs";
import { formatDateShort } from "./platform-shared";

interface CompanyAdminPanelProps {
  adminUser: {
    id: string;
    name: string;
    email: string | null;
    platformRole?: PlatformAdminRoleValue;
    twoFactorEnabled?: boolean;
    passkeyCount?: number;
  };
  initialOverview: PlatformOverviewData;
  initialSchools: PlatformSchoolEntry[];
}

const SIDEBAR_STORAGE_KEY = "snx_platform_sidebar_collapsed";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function CompanyAdminPanel({
  adminUser,
  initialOverview,
  initialSchools,
}: CompanyAdminPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlatformTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingMenuOpen, setBillingMenuOpen] = useState(false);
  const [securityMenuOpen, setSecurityMenuOpen] = useState(false);

  const [periodDays, setPeriodDays] = useState<PlatformOverviewPeriodDays>(
    initialOverview.periodDays ?? 30,
  );
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [overview, setOverview] = useState<PlatformOverviewData>(initialOverview);
  const [schools, setSchools] = useState<PlatformSchoolEntry[]>(initialSchools);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(
    initialSchools[0]?.school.id ?? null,
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "true") setSidebarCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setQuickSearchOpen(false);
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const refreshOverview = async (targetDays: PlatformOverviewPeriodDays = periodDays) => {
    setLoadingPeriod(true);
    try {
      const res = await fetch(`/api/platform/overview?days=${targetDays}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setOverview(json.data);
      }
    } catch {
      // keep current snapshot
    } finally {
      setLoadingPeriod(false);
    }
  };

  const handleChangePeriod = (days: PlatformOverviewPeriodDays) => {
    setPeriodDays(days);
    void refreshOverview(days);
  };

  const refreshSchools = async (filters?: { q?: string; status?: string; plan?: string }) => {
    const qs = new URLSearchParams();
    if (filters?.q?.trim()) qs.set("q", filters.q.trim());
    if (filters?.status && filters.status !== "ALL") qs.set("status", filters.status);
    if (filters?.plan && filters.plan !== "ALL") qs.set("plan", filters.plan);

    const res = await fetch(`/api/platform/schools?${qs.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || "Failed to refresh schools directory.");
    }
    const nextSchools: PlatformSchoolEntry[] = json.schools || [];
    setSchools(nextSchools);
    if (nextSchools.length > 0 && !nextSchools.some((e) => e.school.id === selectedSchoolId)) {
      setSelectedSchoolId(nextSchools[0]!.school.id);
    }
    void refreshOverview(periodDays);
  };

  const quickResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return schools.slice(0, 6);
    return schools
      .filter((e) =>
        [e.school.name, e.school.uniqueId, e.school.slug, e.school.city, e.school.contactEmail].some(
          (f) => (f ? f.toLowerCase().includes(q) : false),
        ),
      )
      .slice(0, 8);
  }, [schools, quickQuery]);

  const handleLogout = async () => {
    try {
      await Promise.all([
        fetch("/api/platform/auth/logout", { method: "POST" }),
        fetch("/api/auth/logout", { method: "POST" }),
      ]);
    } catch {
      // ignore
    }
    router.refresh();
  };

  const handleSelectSchoolFromAnywhere = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setActiveTab("schools");
    setQuickSearchOpen(false);
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
  };

  const navigateTab = (tab: PlatformTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setProfileMenuOpen(false);
  };

  const alertCount =
    (overview.kpis.trialsExpiringNext7Days ?? overview.expiringTrials.length) +
    overview.kpis.openSupportTickets;

  const navBtnCls = (isActive: boolean) =>
    `w-full flex items-center justify-between gap-2.5 rounded-[12px] px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
      isActive
        ? "bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] text-white shadow-sm"
        : "text-[#383A63] hover:bg-white/75 hover:text-[#08093B] dark:text-[#B4BDD9] dark:hover:bg-[#1B1F3F] dark:hover:text-[#F3F5FF]"
    }`;

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col justify-between p-3.5 relative">
      <div className="space-y-4">
        {/* Brand Header & Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo
              className="h-8 shrink-0"
              asLink={false}
              variant={collapsed ? "icon" : "full"}
            />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#76799C] truncate dark:text-[#9DA6CC]">
                  SaaS School Management
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden rounded-lg p-1 text-[#76799C]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute -right-3.5 top-5 z-20 h-7 w-7 items-center justify-center rounded-full border border-[#D6DBF0] bg-white text-[#663CF6] shadow-sm hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#1B1F3F] dark:text-[#C4B5FD]"
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Subtle Command Center Pill */}
        {!collapsed && (
          <div className="rounded-[12px] border border-[#DDD6FE] bg-white/70 px-3 py-2 dark:border-[#342B63] dark:bg-[#19163B]/70">
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#663CF6] dark:text-[#CBB8FF]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Company Control Center</span>
            </div>
          </div>
        )}

        {/* Primary Grouped Navigation */}
        <nav aria-label="Company Admin Navigation" className="space-y-1">
          <button
            type="button"
            title="Platform Overview"
            aria-current={activeTab === "overview" ? "page" : undefined}
            onClick={() => navigateTab("overview")}
            className={navBtnCls(activeTab === "overview")}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Platform Overview</span>}
            </span>
          </button>

          <button
            type="button"
            title="Schools"
            aria-current={activeTab === "schools" ? "page" : undefined}
            onClick={() => navigateTab("schools")}
            className={navBtnCls(activeTab === "schools")}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Building2 className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Schools</span>}
            </span>
            {!collapsed && schools.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === "schools"
                    ? "bg-white/20 text-white"
                    : "bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                }`}
              >
                {schools.length}
              </span>
            )}
          </button>

          <button
            type="button"
            title="Global Users"
            aria-current={activeTab === "users" ? "page" : undefined}
            onClick={() => navigateTab("users")}
            className={navBtnCls(activeTab === "users")}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Users className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Global Users</span>}
            </span>
          </button>

          {/* Plans & Billing Accordion */}
          <div>
            <button
              type="button"
              title="Plans & Billing"
              aria-expanded={billingMenuOpen || activeTab === "billing"}
              onClick={() => {
                if (collapsed) {
                  navigateTab("billing");
                } else {
                  setBillingMenuOpen((v) => !v);
                  navigateTab("billing");
                }
              }}
              className={navBtnCls(activeTab === "billing")}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <CreditCard className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">Plans &amp; Billing</span>}
              </span>
              {!collapsed && (
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    billingMenuOpen || activeTab === "billing" ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>
            {!collapsed && (billingMenuOpen || activeTab === "billing") && (
              <div className="mt-1 ml-6 space-y-0.5 border-l border-[#D6DBF0] pl-2.5 dark:border-[#272B4D]">
                <button
                  type="button"
                  onClick={() => navigateTab("billing")}
                  className={`w-full text-left rounded-lg px-2 py-1.5 text-[11px] font-bold cursor-pointer ${
                    activeTab === "billing"
                      ? "text-[#663CF6] bg-[#EDE7FF]/70 dark:text-[#CBB8FF] dark:bg-[#251D4A]"
                      : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC]"
                  }`}
                >
                  Invoices &amp; MRR
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            title="Support & Feedback"
            aria-current={activeTab === "support" ? "page" : undefined}
            onClick={() => navigateTab("support")}
            className={navBtnCls(activeTab === "support")}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Headphones className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Support &amp; Feedback</span>}
            </span>
            {!collapsed && overview.kpis.openSupportTickets > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === "support"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                }`}
              >
                {overview.kpis.openSupportTickets}
              </span>
            )}
          </button>

          {/* Security & Health Accordion */}
          <div>
            <button
              type="button"
              title="Security & Health"
              aria-expanded={
                securityMenuOpen || activeTab === "audit" || activeTab === "admins"
              }
              onClick={() => {
                if (collapsed) {
                  navigateTab("admins");
                } else {
                  setSecurityMenuOpen((v) => !v);
                }
              }}
              className={navBtnCls(activeTab === "audit" || activeTab === "admins")}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">Security &amp; Health</span>}
              </span>
              {!collapsed && (
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    securityMenuOpen || activeTab === "audit" || activeTab === "admins"
                      ? "rotate-180"
                      : ""
                  }`}
                />
              )}
            </button>
            {!collapsed &&
              (securityMenuOpen || activeTab === "audit" || activeTab === "admins") && (
                <div className="mt-1 ml-6 space-y-0.5 border-l border-[#D6DBF0] pl-2.5 dark:border-[#272B4D]">
                  <button
                    type="button"
                    onClick={() => navigateTab("admins")}
                    className={`w-full flex items-center gap-1.5 text-left rounded-lg px-2 py-1.5 text-[11px] font-bold cursor-pointer ${
                      activeTab === "admins"
                        ? "text-[#663CF6] bg-[#EDE7FF]/70 dark:text-[#CBB8FF] dark:bg-[#251D4A]"
                        : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC]"
                    }`}
                  >
                    <UserCog className="h-3 w-3 shrink-0" />
                    <span>Company Admins</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTab("audit")}
                    className={`w-full flex items-center gap-1.5 text-left rounded-lg px-2 py-1.5 text-[11px] font-bold cursor-pointer ${
                      activeTab === "audit"
                        ? "text-[#663CF6] bg-[#EDE7FF]/70 dark:text-[#CBB8FF] dark:bg-[#251D4A]"
                        : "text-[#4D5072] hover:text-[#08093B] dark:text-[#9DA6CC]"
                    }`}
                  >
                    <Activity className="h-3 w-3 shrink-0" />
                    <span>Audit &amp; Health</span>
                  </button>
                </div>
              )}
          </div>

          <button
            type="button"
            title="Announcements"
            aria-current={activeTab === "announcements" ? "page" : undefined}
            onClick={() => navigateTab("announcements")}
            className={navBtnCls(activeTab === "announcements")}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Megaphone className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Announcements</span>}
            </span>
          </button>

          <button
            type="button"
            title="Settings"
            aria-current={activeTab === "settings" ? "page" : undefined}
            onClick={() => navigateTab("settings")}
            className={navBtnCls(activeTab === "settings")}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Settings</span>}
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom Need Help Support Card & Footer */}
      <div className="space-y-2.5 pt-3">
        {!collapsed ? (
          <div className="rounded-[16px] border border-[#DDD6FE] bg-white/80 p-3.5 space-y-2.5 shadow-xs dark:border-[#322960] dark:bg-[#181538]">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Need Help?
                </p>
                <p className="text-[10px] font-medium text-[#4D5072] dark:text-[#9DA6CC]">
                  Triage open tenant tickets &amp; escalations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTab("support")}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#8B5CF6] via-[#663CF6] to-[#4F27E8] px-3 py-2 text-[11px] font-extrabold text-white shadow-xs hover:opacity-95 cursor-pointer"
            >
              <span>Open Support Queue</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            title="Sign Out"
            onClick={handleLogout}
            className="w-full flex items-center justify-center rounded-xl border border-[#D6DBF0] bg-white p-2 text-rose-600 cursor-pointer dark:border-[#2E345B] dark:bg-[#141731]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}

        {!collapsed && (
          <p className="text-center text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            v1.0.0 &nbsp;|&nbsp; © 2026 ScholoNix
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3FC] text-[#1B1D45] flex dark:bg-[#090B1A] dark:text-[#DCE1F9]">
      {/* Desktop Collapsible Lavender Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-[#DFE3F5] bg-gradient-to-b from-[#F4F0FC] via-[#EFEAFD] to-[#EAE3FC] sticky top-0 h-screen transition-all duration-200 dark:border-[#232746] dark:bg-gradient-to-b dark:from-[#0E1026] dark:to-[#111430] ${
          sidebarCollapsed ? "w-[78px]" : "w-64"
        }`}
      >
        {renderSidebarContent(sidebarCollapsed)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-gradient-to-b from-[#F4F0FC] to-[#EAE3FC] h-full shadow-2xl dark:bg-gradient-to-b dark:from-[#0E1026] dark:to-[#111430]">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Top Utility Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#DFE3F5] bg-white/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 dark:border-[#232746] dark:bg-[#0E1026]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden rounded-lg p-1.5 text-[#4D5072] hover:bg-[#FAF8FE] dark:text-[#C5CCF0]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="sr-only">Company Admin Panel</h1>
            <button
              type="button"
              onClick={() => setQuickSearchOpen(true)}
              className="inline-flex items-center justify-between gap-3 rounded-full border border-[#CAD0EB] bg-[#FAF8FE] px-4 py-2 text-xs font-semibold text-[#76799C] hover:border-[#663CF6] w-full sm:w-80 md:w-96 cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#9DA6CC]"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Search schools, users, invoices, tickets...</span>
              </span>
              <kbd className="hidden sm:inline-block rounded-md border border-[#CAD0EB] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#4D5072] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#B4BDD9]">
                Ctrl + K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileMenuOpen(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#272B4D] dark:bg-[#141731] dark:text-[#C5CCF0]"
              >
                <Bell className="h-4 w-4" />
                {alertCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#141731]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 shadow-xl space-y-2.5 z-50 dark:border-[#272B4D] dark:bg-[#141731]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Platform Alerts ({alertCount})
                    </p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-[#76799C] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  {overview.expiringTrials.length === 0 && overview.kpis.openSupportTickets === 0 ? (
                    <p className="py-3 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                      No pending trial expirations or open tickets.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {overview.kpis.openSupportTickets > 0 && (
                        <button
                          type="button"
                          onClick={() => navigateTab("support")}
                          className="w-full text-left rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-bold text-rose-700 cursor-pointer dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          {overview.kpis.openSupportTickets} open support &amp; feedback tickets →
                        </button>
                      )}
                      {overview.expiringTrials.slice(0, 4).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSchoolFromAnywhere(s.id)}
                          className="w-full text-left rounded-xl border border-[#EEF1FA] bg-[#FAF8FE] px-3 py-2 text-xs hover:border-[#663CF6] cursor-pointer dark:border-[#232746] dark:bg-[#10142C]"
                        >
                          <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                            {s.name} trial ends {formatDateShort(s.trialEndsAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <ThemeToggle />

            {/* User Profile Pill Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={profileMenuOpen}
                onClick={() => {
                  setProfileMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-[#D6DBF0] bg-white pl-1.5 pr-3 py-1 hover:border-[#663CF6] cursor-pointer dark:border-[#272B4D] dark:bg-[#141731]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#4F27E8] text-[11px] font-black text-white">
                  {getInitials(adminUser.name)}
                </span>
                <span className="hidden md:block text-left leading-tight">
                  <span className="block text-xs font-extrabold text-[#08093B] max-w-[140px] truncate dark:text-[#F3F5FF]">
                    {adminUser.name}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                    {adminUser.platformRole || "SUPER_ADMIN"}
                  </span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#76799C]" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-[16px] border border-[#D6DBF0] bg-white p-2 shadow-xl space-y-1 z-50 dark:border-[#272B4D] dark:bg-[#141731]">
                  <div className="px-2.5 py-2 border-b border-[#EEF1FA] dark:border-[#232746]">
                    <p className="text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                      {adminUser.name}
                    </p>
                    <p className="text-[10px] text-[#76799C] truncate dark:text-[#9DA6CC]">
                      {adminUser.email || "Company Super Admin"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab("settings")}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-[#1B1D45] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#DCE1F9] dark:hover:bg-[#1B2042]"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#663CF6]" />
                    <span>Settings &amp; Passkeys</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTab("admins")}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-[#1B1D45] hover:bg-[#FAF8FE] cursor-pointer dark:text-[#DCE1F9] dark:hover:bg-[#1B2042]"
                  >
                    <UserCog className="h-3.5 w-3.5 text-[#663CF6]" />
                    <span>Team &amp; 2FA Controls</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-5">
          {toast && (
            <div
              role={toast.type === "error" ? "alert" : "status"}
              className={`flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-xs font-bold ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
              }`}
            >
              <span className="flex items-center gap-2">
                {toast.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{toast.text}</span>
              </span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === "overview" && (
            <PlatformOverviewTab
              overview={overview}
              schools={schools}
              periodDays={periodDays}
              loadingPeriod={loadingPeriod}
              onChangePeriod={handleChangePeriod}
              onRefreshOverview={() => void refreshOverview(periodDays)}
              onSelectSchool={handleSelectSchoolFromAnywhere}
              onNavigateTab={navigateTab}
              onOpenProvision={() => setProvisionModalOpen(true)}
            />
          )}

          {activeTab === "schools" && (
            <PlatformSchoolsTab
              schools={schools}
              selectedSchoolId={selectedSchoolId}
              onSelectSchoolId={setSelectedSchoolId}
              onRefreshSchools={refreshSchools}
              onToast={showToast}
            />
          )}

          {activeTab === "admins" && (
            <PlatformAdminsTab
              currentAdminId={adminUser.id}
              currentPlatformRole={adminUser.platformRole ?? "SUPER_ADMIN"}
              currentTwoFactorEnabled={adminUser.twoFactorEnabled}
              onToast={showToast}
            />
          )}

          {activeTab === "users" && <PlatformUsersTab onToast={showToast} />}

          {activeTab === "billing" && (
            <PlatformBillingTab schools={schools} onToast={showToast} />
          )}

          {activeTab === "support" && <PlatformSupportTab onToast={showToast} />}

          {activeTab === "audit" && <PlatformAuditHealthTab />}

          {activeTab === "announcements" && (
            <PlatformAnnouncementsTab schools={schools} onToast={showToast} />
          )}

          {activeTab === "settings" && (
            <PlatformSettingsTab
              adminUser={adminUser}
              overview={overview}
              onNavigateTab={navigateTab}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Shared Provision Modal for Overview CTA */}
      <PlatformProvisionSchoolModal
        open={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        onToast={showToast}
        onSuccess={async (newSchoolId) => {
          setSelectedSchoolId(newSchoolId);
          await refreshSchools();
        }}
      />

      {/* Ctrl+K Quick Search Modal */}
      {quickSearchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick search registered schools"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-[20px] border border-[#D6DBF0] bg-white p-4 shadow-2xl dark:border-[#272B4D] dark:bg-[#141731] space-y-3">
            <div className="flex items-center gap-2 border-b border-[#EEF1FA] pb-2.5 dark:border-[#232746]">
              <Search className="h-4 w-4 text-[#663CF6]" />
              <input
                type="text"
                autoFocus
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Type School Name, SNX Unique ID, city, or email..."
                className="flex-1 bg-transparent text-xs font-semibold text-[#08093B] focus:outline-none dark:text-[#F3F5FF]"
              />
              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                className="text-xs font-bold text-[#76799C] cursor-pointer"
              >
                Esc
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {quickResults.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                  No matching schools
                </p>
              ) : (
                quickResults.map((e) => (
                  <button
                    key={e.school.id}
                    type="button"
                    onClick={() => handleSelectSchoolFromAnywhere(e.school.id)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-[#FAF8FE] cursor-pointer dark:hover:bg-[#1B2042]"
                  >
                    <div>
                      <p className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                        {e.school.name}
                      </p>
                      <p className="font-mono text-[10px] text-[#663CF6] dark:text-[#A78BFA]">
                        {e.school.uniqueId || e.school.slug} · {e.school.city || "—"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
                      {e.school.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
