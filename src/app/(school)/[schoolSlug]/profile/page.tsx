import type { Metadata } from "next";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { buildSchoolShellProps } from "@/modules/school/utils/shell-props";
import { SchoolProfileView } from "@/modules/school/components/school-profile-view";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "School Profile | ScholoNix",
  robots: { index: false, follow: false },
};

interface SchoolProfilePageProps {
  params: Promise<{ schoolSlug: string }>;
}

export default async function SchoolProfilePage({ params }: SchoolProfilePageProps) {
  const { schoolSlug } = await params;
  const access = await resolveTenantRouteAccess(schoolSlug, `/${schoolSlug}/profile`);

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

  return (
    <SchoolProfileView
      school={school}
      user={user}
      profile={{
        id: access.school.id,
        name: access.school.name,
        slug: access.school.slug,
        uniqueId: access.school.uniqueId ?? null,
        code: access.school.code || "",
        category: access.school.category || "Co-Educational School",
        affiliationBoard: access.school.affiliationBoard || "CBSE",
        contactPhone: access.school.contactPhone ?? null,
        contactEmail: access.school.contactEmail ?? null,
        website: access.school.website ?? null,
        addressLine: access.school.addressLine ?? null,
        city: access.school.city ?? null,
        state: access.school.state ?? null,
        pinCode: access.school.pinCode ?? null,
        country: access.school.country || "India",
        status: access.school.status || "TRIAL",
        plan: access.school.plan ?? null,
      }}
    />
  );
}
