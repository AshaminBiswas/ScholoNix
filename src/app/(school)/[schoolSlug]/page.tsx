import type { Metadata } from "next";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { SchoolDashboard } from "@/modules/school/components/school-dashboard";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";
import { captureException } from "@/lib/observability/sentry";
import type { SchoolDashboardData } from "@/modules/school/types";

export const dynamic = "force-dynamic";

interface SchoolWorkspacePageProps {
  params: Promise<{ schoolSlug: string }>;
}

export async function generateMetadata({
  params,
}: SchoolWorkspacePageProps): Promise<Metadata> {
  const { schoolSlug } = await params;
  return {
    title: `${schoolSlug} · School Workspace | ScholoNix`,
    robots: { index: false, follow: false },
  };
}

export default async function SchoolWorkspacePage({ params }: SchoolWorkspacePageProps) {
  const { schoolSlug } = await params;
  const access = await resolveTenantRouteAccess(schoolSlug, `/${schoolSlug}`);

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

  let dashboardData: SchoolDashboardData;
  try {
    const result = await schoolDashboardService.getDashboardDataFromSession(
      access.school,
      access.session.user,
    );
    dashboardData = result.data;
  } catch (err: unknown) {
    captureException(err, {
      schoolId: access.school.id,
      userId: access.session.user.id,
      tags: { area: "SchoolWorkspacePage.getDashboardDataFromSession" },
    });
    dashboardData = schoolDashboardService.getSafeFallbackDashboardData(
      access.school,
      access.session.user,
    );
  }

  return (
    <SchoolDashboard
      initialData={dashboardData}
      user={{
        id: access.session.user.id,
        name: access.session.user.name,
        email: access.session.user.email,
        phone: access.session.user.phone,
        role: access.session.user.role,
      }}
    />
  );
}
