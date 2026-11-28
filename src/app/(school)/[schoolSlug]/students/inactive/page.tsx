import type { Metadata } from "next";
import { renderSchoolStudentWorkspacePage } from "@/server/school/render-student-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inactive Students | ScholoNix",
  robots: { index: false, follow: false },
};

export default async function SchoolStudentInactivePage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  return renderSchoolStudentWorkspacePage({ schoolSlug, section: "inactive" });
}
