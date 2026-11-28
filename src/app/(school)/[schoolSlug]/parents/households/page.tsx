import { renderSchoolParentWorkspacePage } from "@/server/school/render-parent-workspace";

export const dynamic = "force-dynamic";

export default async function SchoolParentsHouseholdsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  return renderSchoolParentWorkspacePage({
    schoolSlug: decodeURIComponent(schoolSlug),
    section: "households",
  });
}
