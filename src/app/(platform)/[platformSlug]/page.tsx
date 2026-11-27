import type { Metadata } from "next";
import { renderCompanyAdminPage } from "@/server/platform/render-company-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company Admin Panel | ScholoNix",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ platformSlug: string }>;
}

/**
 * Dynamic catch route for the secret Company Admin Panel slug.
 * The actual slug is validated against `PLATFORM_ADMIN_SLUG` inside
 * `renderCompanyAdminPage()` — any mis-matched slug returns HTTP 404,
 * so this route does not expose the panel at arbitrary paths.
 */
export default async function PlatformSlugPage({ params }: Props) {
  const { platformSlug } = await params;
  return renderCompanyAdminPage(platformSlug);
}
