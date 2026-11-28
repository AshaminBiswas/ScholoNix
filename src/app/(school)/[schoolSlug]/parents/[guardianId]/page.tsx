import { renderSchoolParentWorkspacePage } from "@/server/school/render-parent-workspace";

export const dynamic = "force-dynamic";

export default async function SchoolGuardianProfilePage({
  params,
}: {
  params: Promise<{ schoolSlug: string; guardianId: string }>;
}) {
  const { schoolSlug, guardianId } = await params;
  return renderSchoolParentWorkspacePage({
    schoolSlug: decodeURIComponent(schoolSlug),
    section: "profile",
    guardianId: decodeURIComponent(guardianId),
  });
}
