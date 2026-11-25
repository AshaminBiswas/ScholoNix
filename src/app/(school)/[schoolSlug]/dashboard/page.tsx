import { redirect } from "next/navigation";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";

export const dynamic = "force-dynamic";

interface SchoolDashboardAliasPageProps {
  params: Promise<{ schoolSlug: string }>;
}

export default async function SchoolDashboardAliasPage({
  params,
}: SchoolDashboardAliasPageProps) {
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

  redirect(`/${access.school.slug}`);
}
