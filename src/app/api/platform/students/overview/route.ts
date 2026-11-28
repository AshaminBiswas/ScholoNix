import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { studentRepository } from "@/server/school/student-repository";
import { parseStudentFiltersFromUrl } from "@/modules/students/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "students:global:overview");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const filters = parseStudentFiltersFromUrl(url);
    const schoolId = url.searchParams.get("schoolId")?.trim() || "ALL";
    const data = await studentRepository.getGlobalStudentsAnalytics({ ...filters, schoolId });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
