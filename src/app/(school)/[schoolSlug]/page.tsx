import type { Metadata } from "next";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { SchoolDashboard } from "@/modules/school/components/school-dashboard";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";

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
    return (
      <TenantUnauthorizedView
        ownSchoolSlug={access.ownSchool.slug}
        ownSchoolName={access.ownSchool.name}
      />
    );
  }

  const { data: dashboardData } = await schoolDashboardService.getDashboardDataFromSession(
    access.school,
    access.session.user,
  );

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
