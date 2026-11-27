import type { Metadata } from "next";
import { renderCompanyAdminPage } from "@/server/platform/render-company-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company Admin Panel | ScholoNix",
  robots: { index: false, follow: false },
};

export default async function CompanyAdminPage() {
  return renderCompanyAdminPage("admin");
}
