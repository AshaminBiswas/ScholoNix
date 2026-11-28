import type { Metadata } from "next";
import { renderSchoolStudentWorkspacePage } from "@/server/school/render-student-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Dossier | ScholoNix",
  robots: { index: false, follow: false },
};

export default async function SchoolStudentProfileDetailPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; studentId: string }>;
}) {
  const { schoolSlug, studentId } = await params;
  return renderSchoolStudentWorkspacePage({
    schoolSlug,
    section: "profile",
    studentId: decodeURIComponent(studentId),
  });
}
