import type { Metadata } from "next";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { SchoolHelpView } from "@/modules/school/components/school-help-view";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { buildSchoolShellProps } from "@/modules/school/utils/shell-props";

export const dynamic = "force-dynamic";

interface SchoolHelpPageProps {
  params: Promise<{ schoolSlug: string }>;
}

export async function generateMetadata({ params }: SchoolHelpPageProps): Promise<Metadata> {
  const { schoolSlug } = await params;
  return {
    title: `Help Center · ${schoolSlug} | ScholoNix`,
    robots: { index: false, follow: false },
  };
}

export default async function SchoolHelpPage({ params }: SchoolHelpPageProps) {
  const { schoolSlug } = await params;
  const access = await resolveTenantRouteAccess(schoolSlug, `/${schoolSlug}/help`);

  if (!access.authorized) {
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
