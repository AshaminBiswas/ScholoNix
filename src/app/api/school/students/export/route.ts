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
    const { filename, csv } = await studentService.exportStudentsCsv(resolved.ctx, filters);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
