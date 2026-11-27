import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getConfiguredPlatformAdminSlug } from "@/server/platform/admin-route-config";
import { renderCompanyAdminPage } from "@/server/platform/render-company-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company Admin Panel | ScholoNix",
  robots: { index: false, follow: false },
};

export default async function ConfiguredPlatformAdminSubPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; adminSubPath: string[] }>;
}) {
  const { schoolSlug, adminSubPath } = await params;
  const configuredAdminSlug = getConfiguredPlatformAdminSlug();
  if (!configuredAdminSlug || schoolSlug.trim().toLowerCase() !== configuredAdminSlug) {
    notFound();
  }
  return renderCompanyAdminPage(configuredAdminSlug, adminSubPath);
}
