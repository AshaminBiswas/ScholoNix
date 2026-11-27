"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Search,
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
  PlatformSchoolEntry,
  PlatformTab,
} from "@/modules/platform/types";
import { PlatformOverviewTab } from "./platform-overview-tab";
import { PlatformSchoolsTab } from "./platform-schools-tab";
import { PlatformAdminsTab } from "./platform-admins-tab";
import {
  PlatformAnnouncementsTab,
  PlatformAuditHealthTab,
  PlatformBillingTab,
  PlatformSupportTab,
  PlatformUsersTab,
} from "./platform-operations-tabs";

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

const NAV_ITEMS: Array<{ id: PlatformTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Platform Overview", icon: LayoutDashboard },
  { id: "schools", label: "Schools & Data", icon: Building2 },
  { id: "admins", label: "Company Admins", icon: UserCog },
  { id: "users", label: "School Users", icon: Users },
  { id: "billing", label: "SaaS Billing", icon: CreditCard },
  { id: "support", label: "Support & Feedback", icon: LifeBuoy },
  { id: "audit", label: "Audit & Health", icon: Activity },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export function CompanyAdminPanel({
  adminUser,
  initialOverview,
  initialSchools,
}: CompanyAdminPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlatformTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overview, setOverview] = useState<PlatformOverviewData>(initialOverview);
  const [schools, setSchools] = useState<PlatformSchoolEntry[]>(initialSchools);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(
    initialSchools[0]?.school.id ?? null,
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setQuickSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const refreshOverview = async () => {
    try {
      const res = await fetch("/api/platform/overview", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setOverview(json.data);
      }
    } catch {
      // keep current snapshot
    }
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
    void refreshOverview();
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
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <BrandLogo className="h-8" asLink={false} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden rounded-lg p-1 text-[#76799C]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-[14px] border border-[#DDD6FE] bg-[#FAF8FE] px-3 py-2.5 dark:border-[#3B306E] dark:bg-[#1B1740]">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#663CF6] dark:text-[#CBB8FF]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Company Control Center</span>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
            Multi-tenant SaaS Governance
          </p>
        </div>

        <nav aria-label="Company Admin Navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-[12px] px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#663CF6] text-white shadow-xs"
                    : "text-[#4D5072] hover:bg-[#FAF8FE] hover:text-[#08093B] dark:text-[#B4BDD9] dark:hover:bg-[#1B1F3F] dark:hover:text-[#F3F5FF]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === "support" && overview.kpis.openSupportTickets > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {overview.kpis.openSupportTickets}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 border-t border-[#E6E9F6] pt-3 dark:border-[#232746]">
        <div className="px-2">
          <p className="text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
            {adminUser.name}
          </p>
          <p className="text-[10px] text-[#76799C] truncate dark:text-[#9DA6CC]">
            {adminUser.email || "Platform Super Admin"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-rose-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#1B1D45] flex dark:bg-[#090B1A] dark:text-[#DCE1F9]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#D6DBF0] bg-white sticky top-0 h-screen dark:border-[#232746] dark:bg-[#0E1026]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl dark:bg-[#0E1026]">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 dark:border-[#232746] dark:bg-[#0E1026]/95">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden rounded-lg p-1.5 text-[#4D5072] hover:bg-[#FAF8FE] dark:text-[#C5CCF0]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
              Company Admin Panel
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setQuickSearchOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-[10px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs font-semibold text-[#76799C] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#9DA6CC]"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Jump to school...</span>
              <kbd className="rounded border border-[#CAD0EB] px-1 text-[10px] font-bold dark:border-[#343B6B]">
                Ctrl+K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
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
              onSelectSchool={handleSelectSchoolFromAnywhere}
              onNavigateTab={setActiveTab}
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
        </main>
      </div>

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
                className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
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
                <p className="py-6 text-center text-xs text-[#76799C]">No matching schools</p>
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
                    <span className="text-[10px] font-bold text-[#76799C]">{e.school.status}</span>
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
