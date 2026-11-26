import type { Metadata } from "next";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { SchoolHelpView } from "@/modules/school/components/school-help-view";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";
import { buildSchoolShellProps } from "@/modules/school/utils/shell-props";

export const dynamic = "force-dynamic";

interface SchoolHelpPageProps {
  params: Promise<{ schoolSlug: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Help Center | ScholoNix",
    robots: { index: false, follow: false },
  };
}

export default async function SchoolHelpPage({ params }: SchoolHelpPageProps) {
  const { schoolSlug } = await params;
  const access = await resolveTenantRouteAccess(schoolSlug, `/${schoolSlug}/help`);

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
  return <SchoolHelpView school={school} user={user} />;
}
