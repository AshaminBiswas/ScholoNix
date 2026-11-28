import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentService } from "@/server/school/student-service";
import { parseStudentFiltersFromUrl } from "@/modules/students/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const filters = parseStudentFiltersFromUrl(new URL(req.url));
    const data = await studentService.getDashboardData(resolved.ctx, filters);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
