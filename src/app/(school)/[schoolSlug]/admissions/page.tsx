import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, DatabaseZap } from "lucide-react";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { admissionsService } from "@/server/school/admissions-service";
import { hasPermission } from "@/server/authorization/permissions";
import { ServiceUnavailableError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/observability/sentry";
import { buildSchoolRoute, buildSchoolShellProps } from "@/modules/school/utils/shell-props";
import { SchoolWorkspaceShell } from "@/modules/school/components/school-workspace-shell";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";
import { AdmissionsWorkspace } from "@/modules/school/admissions/components/admissions-workspace";
import type { AdmissionsOverviewData, AdmissionsTab } from "@/modules/school/admissions/types";

export const dynamic = "force-dynamic";

interface SchoolAdmissionsPageProps {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ tab?: string; search?: string }>;
}

const VALID_TABS = new Set<AdmissionsTab>([
  "overview",
  "applications",
  "enquiries",
  "admitted",
  "settings",
]);

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Admissions | ScholoNix",
    robots: { index: false, follow: false },
  };
}

export default async function SchoolAdmissionsPage({
  params,
  searchParams,
}: SchoolAdmissionsPageProps) {
  const [{ schoolSlug }, sp] = await Promise.all([params, searchParams]);
  const tabParam = (sp.tab || "overview").toLowerCase() as AdmissionsTab;
  const activeTab: AdmissionsTab = VALID_TABS.has(tabParam) ? tabParam : "overview";
  const initialSearch = typeof sp.search === "string" ? sp.search.trim() : "";

  const access = await resolveTenantRouteAccess(
    schoolSlug,
    `/${schoolSlug}/admissions${activeTab !== "overview" ? `?tab=${activeTab}` : ""}`,
  );

  if (!access.authorized) {
    if (access.reason === "SERVICE_UNAVAILABLE") {
      return (
        <TenantServiceUnavailableView
          schoolSlug={schoolSlug}
          message={access.message}
        />
      );
    }
    return (
      <TenantUnauthorizedView
        ownSchoolSlug={access.ownSchool.slug}
        ownSchoolName={access.ownSchool.name}
      />
    );
  }

  const { school, user } = buildSchoolShellProps(access.school, access.session.user);
  const canReadAdmissions = hasPermission(
    {
      id: access.session.user.id,
      role: access.session.user.role,
      schoolId: access.school.id,
    },
    "admissions:read",
  );

  if (!canReadAdmissions) {
    return (
      <SchoolWorkspaceShell
        school={school}
        user={user}
        activeNav="admissions"
        activeAdmissionsTab={activeTab}
      >
        <div className="mx-auto max-w-lg rounded-[22px] border border-rose-200 bg-white p-8 text-center shadow-xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-[#08093B]">Admissions Access Restricted</h1>
          <p className="text-xs text-[#4D5072] leading-relaxed">
            Your current role ({user.displayRole}) does not have permission to view student admission
            applications and guardian records for {school.name}.
          </p>
          <Link
            href={buildSchoolRoute(school.slug)}
            className="inline-flex items-center justify-center rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8]"
          >
            Back to Dashboard
          </Link>
        </div>
      </SchoolWorkspaceShell>
    );
  }

  let initialData: AdmissionsOverviewData | null = null;
  let loadErrorMessage: string | null = null;

  try {
    initialData = await admissionsService.getOverview(
      {
        userId: access.session.user.id,
        userName: access.session.user.name,
        role: access.session.user.role,
        schoolId: access.school.id,
        schoolSlug: access.school.slug,
        schoolName: access.school.name,
      },
      initialSearch ? { search: initialSearch } : undefined,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admissions service unavailable.";
    logger.error(
      { schoolId: access.school.id, error: message },
      "[SchoolAdmissionsPage] Failed to load admissions overview",
    );
    captureException(err, {
      schoolId: access.school.id,
      userId: access.session.user.id,
      tags: { area: "SchoolAdmissionsPage.getOverview" },
    });
    loadErrorMessage =
      err instanceof ServiceUnavailableError
        ? err.message
        : "Unable to load admissions data right now. Please try again shortly.";
  }

  if (!initialData) {
    const isMigrationPending = Boolean(
      loadErrorMessage &&
        /migration|tables are not provisioned/i.test(loadErrorMessage),
    );
    return (
      <SchoolWorkspaceShell
        school={school}
        user={user}
        activeNav="admissions"
        activeAdmissionsTab={activeTab}
      >
        <div className="mx-auto max-w-xl rounded-[22px] border border-amber-200 bg-white p-8 text-center shadow-xs space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <DatabaseZap className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-[#08093B]">
            {isMigrationPending
              ? "Admissions Setup Pending Database Migration"
              : "Admissions Data Temporarily Unavailable"}
          </h1>
          <p className="text-xs text-[#4D5072] leading-relaxed">{loadErrorMessage}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href={buildSchoolRoute(school.slug, "admissions")}
              className="inline-flex items-center justify-center rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8]"
            >
              Retry Loading Admissions
            </Link>
            <Link
              href={buildSchoolRoute(school.slug)}
              className="inline-flex items-center justify-center rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </SchoolWorkspaceShell>
    );
  }

  return (
    <AdmissionsWorkspace
      school={school}
      user={user}
      initialData={initialData}
      initialTab={activeTab}
    />
  );
}
