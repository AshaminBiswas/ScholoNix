"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  FolderTree,
  GraduationCap,
  Home,
  Layers,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  STUDENT_CARD_SURFACE,
  StudentKpiCard,
} from "@/modules/students/components/student-charts-and-cards";

interface GlobalAcademicsData {
  kpis: {
    totalSchools: number;
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    totalStudents: number;
    totalLinkedGuardians: number;
  };
  schoolSummaries: Array<{
    schoolId: string;
    schoolName: string;
    schoolUniqueId: string | null;
    activeAcademicYear: string;
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    totalStudents: number;
    totalLinkedGuardians: number;
  }>;
}

interface GlobalParentsData {
  kpis: {
    totalSchools: number;
    totalGuardians: number;
    multiChildFamilies: number;
    portalActivated: number;
    portalActivationPct: number;
    restrictedContactsCount: number;
  };
  schoolSummaries: Array<{
    schoolId: string;
    schoolName: string;
    schoolUniqueId: string | null;
    totalGuardians: number;
    linkedHouseholds: number;
    multiChildFamilies: number;
    portalActivated: number;
    portalActivationPct: number;
    restrictedContactsCount: number;
  }>;
}

export function PlatformAcademicsGlobalTab({
  onOpenSchoolAcademics,
  onToast,
}: {
  onOpenSchoolAcademics: (schoolId: string) => void;
  onToast?: (type: "success" | "error", text: string) => void;
}) {
  const [data, setData] = useState<GlobalAcademicsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/academics/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Failed to load global academics overview.");
      }
      setData(json.data);
    } catch (err) {
      onToast?.("error", err instanceof Error ? err.message : "Unable to load academics overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <div className={`${STUDENT_CARD_SURFACE} p-12 flex items-center justify-center gap-2 text-xs font-bold text-[#663CF6] dark:text-[#C4B5FD]`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading cross-school Academics &amp; Curriculum Tree...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#663CF6] dark:text-[#C4B5FD]">
            Clients &gt; Academics &amp; Tree Overview
          </p>
          <h2 className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
            Global Academics, Classes &amp; Subjects
          </h2>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Drill down into any tenant school&apos;s Classes &amp; Subjects &rarr; Sections &rarr; Students &rarr; Parents hierarchy.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#141731] dark:text-[#B4BDD9]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <StudentKpiCard
              label="Registered Schools"
              value={data.kpis.totalSchools}
              icon={<Building2 className="h-5 w-5" />}
              tone="violet"
              subtitle="Across tenants"
            />
            <StudentKpiCard
              label="Total Classes"
              value={data.kpis.totalClasses}
              icon={<GraduationCap className="h-5 w-5" />}
              tone="sky"
              subtitle="Configured grades"
            />
            <StudentKpiCard
              label="Total Sections"
              value={data.kpis.totalSections}
              icon={<Layers className="h-5 w-5" />}
              tone="amber"
              subtitle="Class divisions"
            />
            <StudentKpiCard
              label="Active Subjects"
              value={data.kpis.totalSubjects}
              icon={<BookOpen className="h-5 w-5" />}
              tone="emerald"
              subtitle="School catalogs"
            />
            <StudentKpiCard
              label="Linked Guardians"
              value={data.kpis.totalLinkedGuardians}
              icon={<Users className="h-5 w-5" />}
              tone="pink"
              subtitle={`${data.kpis.totalStudents} students`}
            />
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Tenant School Academic Structures
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-[#DFE3F5] dark:border-[#272B4D]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F6F5FD] text-[10px] font-extrabold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                  <tr>
                    <th className="px-3 py-2.5">School</th>
                    <th className="px-3 py-2.5">Active Session</th>
                    <th className="px-3 py-2.5">Classes</th>
                    <th className="px-3 py-2.5">Subjects</th>
                    <th className="px-3 py-2.5">Sections</th>
                    <th className="px-3 py-2.5">Students</th>
                    <th className="px-3 py-2.5">Parents Linked</th>
                    <th className="px-3 py-2.5 text-right">Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                  {data.schoolSummaries.map((row) => (
                    <tr key={row.schoolId} className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#191D3D]/60">
                      <td className="px-3 py-2.5 font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {row.schoolName}
                        {row.schoolUniqueId && (
                          <p className="font-mono text-[10px] font-normal text-[#76799C] dark:text-[#9DA6CC]">
                            {row.schoolUniqueId}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold">{row.activeAcademicYear}</td>
                      <td className="px-3 py-2.5 font-bold">{row.totalClasses}</td>
                      <td className="px-3 py-2.5 font-bold">{row.totalSubjects}</td>
                      <td className="px-3 py-2.5 font-bold">{row.totalSections}</td>
                      <td className="px-3 py-2.5 font-bold">{row.totalStudents}</td>
                      <td className="px-3 py-2.5 font-bold">{row.totalLinkedGuardians}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenSchoolAcademics(row.schoolId)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#663CF6] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#5B35F5] cursor-pointer"
                        >
                          <FolderTree className="h-3 w-3" />
                          <span>Open Academic Tree</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PlatformParentsGlobalTab({
  onOpenSchoolParents,
  onToast,
}: {
  onOpenSchoolParents: (schoolId: string) => void;
  onToast?: (type: "success" | "error", text: string) => void;
}) {
  const [data, setData] = useState<GlobalParentsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/parents/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Failed to load global parents overview.");
      }
      setData(json.data);
    } catch (err) {
      onToast?.("error", err instanceof Error ? err.message : "Unable to load parents overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <div className={`${STUDENT_CARD_SURFACE} p-12 flex items-center justify-center gap-2 text-xs font-bold text-[#663CF6] dark:text-[#C4B5FD]`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading cross-school Parents &amp; Guardians analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#663CF6] dark:text-[#C4B5FD]">
            Clients &gt; Parents &amp; Guardians
          </p>
          <h2 className="text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
            Global Parents, Households &amp; Portal Activation
          </h2>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Monitor guardian coverage, multi-child sibling households, custody alerts, and Parent Portal onboarding across schools.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#141731] dark:text-[#B4BDD9]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StudentKpiCard
              label="Total Guardians"
              value={data.kpis.totalGuardians}
              icon={<Users className="h-5 w-5" />}
              tone="violet"
              subtitle={`Across ${data.kpis.totalSchools} schools`}
            />
            <StudentKpiCard
              label="Multi-Child Families"
              value={data.kpis.multiChildFamilies}
              icon={<Home className="h-5 w-5" />}
              tone="sky"
              subtitle="Sibling households"
            />
            <StudentKpiCard
              label="Portal Activated"
              value={`${data.kpis.portalActivationPct}%`}
              icon={<BadgeCheck className="h-5 w-5" />}
              tone="emerald"
              subtitle={`${data.kpis.portalActivated} active accounts`}
            />
            <StudentKpiCard
              label="Custody Alerts"
              value={data.kpis.restrictedContactsCount}
              icon={<ShieldAlert className="h-5 w-5" />}
              tone="amber"
              subtitle="Restricted pickup flags"
            />
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Parents &amp; Guardians by School
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-[#DFE3F5] dark:border-[#272B4D]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F6F5FD] text-[10px] font-extrabold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                  <tr>
                    <th className="px-3 py-2.5">School</th>
                    <th className="px-3 py-2.5">Guardians</th>
                    <th className="px-3 py-2.5">Households</th>
                    <th className="px-3 py-2.5">Multi-Child</th>
                    <th className="px-3 py-2.5">Portal Active</th>
                    <th className="px-3 py-2.5">Custody Alerts</th>
                    <th className="px-3 py-2.5 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                  {data.schoolSummaries.map((row) => (
                    <tr key={row.schoolId} className="hover:bg-[#FAF8FE]/70 dark:hover:bg-[#191D3D]/60">
                      <td className="px-3 py-2.5 font-black text-[#08093B] dark:text-[#F3F5FF]">
                        {row.schoolName}
                      </td>
                      <td className="px-3 py-2.5 font-bold">{row.totalGuardians}</td>
                      <td className="px-3 py-2.5 font-bold">{row.linkedHouseholds}</td>
                      <td className="px-3 py-2.5 font-bold">{row.multiChildFamilies}</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-600 dark:text-emerald-300">
                        {row.portalActivated} ({row.portalActivationPct}%)
                      </td>
                      <td className="px-3 py-2.5 font-bold">{row.restrictedContactsCount}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenSchoolParents(row.schoolId)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#663CF6] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#5B35F5] cursor-pointer"
                        >
                          <Users className="h-3 w-3" />
                          <span>Open Parents Workspace</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
