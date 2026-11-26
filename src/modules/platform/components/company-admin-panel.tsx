"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  KeyRound,
  Users,
  FileText,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  LogOut,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export interface AdminSchoolEntry {
  school: {
    id: string;
    name: string;
    slug: string;
    uniqueId: string | null;
    code: string;
    category: string | null;
    affiliationBoard: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    website: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    country: string;
    status: string;
    plan: string | null;
    createdAt: string | Date;
  };
  users: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string | Date;
  }>;
  counts: {
    users: number;
    applications: number;
    enquiries: number;
  };
}

interface CompanyAdminPanelProps {
  adminUser: {
    id: string;
    name: string;
    email: string | null;
  };
  initialSchools: AdminSchoolEntry[];
}

export function CompanyAdminPanel({ adminUser, initialSchools }: CompanyAdminPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<AdminSchoolEntry[]>(initialSchools);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSchools[0]?.school.id ?? null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedEntry =
    schools.find((entry) => entry.school.id === selectedId) ?? schools[0] ?? null;

  const runSearch = async (searchTerm: string) => {
    setSearchError(null);
    setIsSearching(true);
    try {
      const qs = searchTerm.trim()
        ? `?q=${encodeURIComponent(searchTerm.trim())}`
        : "";
      const res = await fetch(`/api/platform/schools${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Unable to search registered schools.");
      }
      const nextSchools: AdminSchoolEntry[] = json.schools || [];
      setSchools(nextSchools);
      setSelectedId(nextSchools[0]?.school.id ?? null);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Failed to search schools.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(query);
  };

  const handleCopy = (key: string, value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#1B1D45] dark:bg-[#090B1A] dark:text-[#DCE1F9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md dark:border-[#232746] dark:bg-[#0E1026]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-8" asLink={false} />
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#EDE7FF] px-2.5 py-1 text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Company Admin Panel</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">{adminUser.name}</p>
              <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                {adminUser.email || "Platform Super Admin"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Search Bar Card */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                School Directory &amp; Unique ID Lookup
              </h1>
              <p className="mt-1 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
                Search any registered school by its Unique School ID (e.g. SNX-2026-XXXXXX), school name, code, or contact email/phone.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-[#FAF8FE] border border-[#D6DBF0] px-3 py-1 text-xs font-bold text-[#663CF6] dark:bg-[#10142C] dark:border-[#2E345B] dark:text-[#C4B5FD]">
              {schools.length} school{schools.length === 1 ? "" : "s"} found
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C] dark:text-[#9DA6CC]" />
              <input
                type="search"
                aria-label="Search by Unique School ID or school details"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Unique School ID (e.g. SNX-2026-7K4M9P), name, or email..."
                className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-[#08093B] placeholder-[#76799C] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder-[#7A83AD] dark:focus:border-[#8B5CF6]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>{isSearching ? "Searching..." : "Search School"}</span>
            </button>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  void runSearch("");
                }}
                className="rounded-[12px] border border-[#CAD0EB] bg-white px-4 py-2.5 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#C5CCF0]"
              >
                Reset
              </button>
            )}
          </form>

          {searchError && (
            <div
              role="alert"
              className="mt-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
            >
              {searchError}
            </div>
          )}
        </section>

        {/* Results Split Grid */}
        {schools.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#D6DBF0] bg-white p-12 text-center dark:border-[#2E345B] dark:bg-[#141731]">
            <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              No matching schools found
            </p>
            <p className="mt-1 text-xs text-[#76799C] dark:text-[#9DA6CC]">
              Double-check the Unique School ID or clear the search filter to view all registered schools.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left List (5 cols) */}
            <section className="lg:col-span-5 space-y-2.5">
              {schools.map((entry) => {
                const isSelected = selectedEntry?.school.id === entry.school.id;
                return (
                  <button
                    key={entry.school.id}
                    type="button"
                    onClick={() => setSelectedId(entry.school.id)}
                    className={`w-full text-left rounded-[16px] border p-4 transition cursor-pointer ${
                      isSelected
                        ? "border-[#663CF6] bg-[#FAF8FE] shadow-sm dark:border-[#8B5CF6] dark:bg-[#1B1740]"
                        : "border-[#D6DBF0] bg-white hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#141731] dark:hover:border-[#663CF6]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                          {entry.school.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs font-bold text-[#663CF6] dark:text-[#A78BFA]">
                          {entry.school.uniqueId || "No Unique ID"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                        {entry.school.status}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                      <span>{entry.school.city || "—"}, {entry.school.state || "—"}</span>
                      <span>·</span>
                      <span>{entry.counts.users} users</span>
                      <span>·</span>
                      <span>{entry.counts.applications} apps</span>
                    </div>
                  </button>
                );
              })}
            </section>

            {/* Right Detail Panel (7 cols) */}
            {selectedEntry && (
              <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xs space-y-6 dark:border-[#272B4D] dark:bg-[#141731]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#DFE3F5] pb-4 dark:border-[#232746]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#663CF6] dark:text-[#A78BFA]" />
                      <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.name}
                      </h2>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#EDE7FF] px-2.5 py-1 font-mono text-xs font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>{selectedEntry.school.uniqueId || "N/A"}</span>
                      </span>
                      {selectedEntry.school.uniqueId && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              selectedEntry.school.id,
                              selectedEntry.school.uniqueId!,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-[8px] border border-[#D6DBF0] px-2 py-1 text-[11px] font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:text-[#C5CCF0]"
                        >
                          {copiedId === selectedEntry.school.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>
                            {copiedId === selectedEntry.school.id ? "Copied" : "Copy ID"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/${selectedEntry.school.slug}` as Route}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4F27E8]"
                  >
                    <span>Open School Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      <Users className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>Users</span>
                    </div>
                    <p className="mt-1 text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {selectedEntry.counts.users}
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      <FileText className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>Applications</span>
                    </div>
                    <p className="mt-1 text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {selectedEntry.counts.applications}
                    </p>
                  </div>
                  <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                      <MessageSquare className="h-3.5 w-3.5 text-[#663CF6]" />
                      <span>Enquiries</span>
                    </div>
                    <p className="mt-1 text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                      {selectedEntry.counts.enquiries}
                    </p>
                  </div>
                </div>

                {/* School Metadata */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Opaque Portal URL</dt>
                    <dd className="mt-0.5 font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      /{selectedEntry.school.slug}/login
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Board &amp; Category</dt>
                    <dd className="mt-0.5 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      {selectedEntry.school.affiliationBoard || "—"} · {selectedEntry.school.category || "—"}
                    </dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#663CF6] mt-0.5 shrink-0" />
                    <div>
                      <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Contact Phone</dt>
                      <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.contactPhone || "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#663CF6] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Contact Email</dt>
                      <dd className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                        {selectedEntry.school.contactEmail || "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe className="h-3.5 w-3.5 text-[#663CF6] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Plan / Code</dt>
                      <dd className="font-bold capitalize text-[#08093B] dark:text-[#F3F5FF]">
                        {selectedEntry.school.plan || "Starter"} · {selectedEntry.school.code || "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#663CF6] mt-0.5 shrink-0" />
                    <div>
                      <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Location</dt>
                      <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {[
                          selectedEntry.school.addressLine,
                          selectedEntry.school.city,
                          selectedEntry.school.state,
                          selectedEntry.school.pinCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </dd>
                    </div>
                  </div>
                </dl>

                {/* Registered Users */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#76799C] mb-2.5 dark:text-[#9DA6CC]">
                    Registered Accounts ({selectedEntry.users.length})
                  </h3>
                  {selectedEntry.users.length === 0 ? (
                    <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">No user accounts found.</p>
                  ) : (
                    <div className="overflow-x-auto school-menu-scrollbar rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                      <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                        <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase tracking-wider text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                          <tr>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Contact</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                          {selectedEntry.users.map((u) => (
                            <tr key={u.id}>
                              <td className="px-3 py-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                {u.name}
                              </td>
                              <td className="px-3 py-2 text-[#4D5072] dark:text-[#C5CCF0]">{u.role}</td>
                              <td className="px-3 py-2 text-[#4D5072] dark:text-[#C5CCF0]">
                                <div>{u.email || "—"}</div>
                                <div className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                                  {u.phone || "—"}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                  {u.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
