import { renderSchoolAcademicsWorkspacePage } from "@/server/school/render-academics-workspace";

export const dynamic = "force-dynamic";

export default async function SchoolAcademicsSectionsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  return renderSchoolAcademicsWorkspacePage({
    schoolSlug: decodeURIComponent(schoolSlug),
    section: "sections",
  });
}
