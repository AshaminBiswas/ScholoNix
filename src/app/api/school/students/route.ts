import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentService } from "@/server/school/student-service";
import { parseStudentFiltersFromUrl } from "@/modules/students/analytics";
import { createStudentSchema } from "@/modules/students/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const filters = parseStudentFiltersFromUrl(new URL(req.url));
    const data = await studentService.getDashboardData(resolved.ctx, filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const total = data.filteredStudents.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const students = data.filteredStudents.slice((safePage - 1) * pageSize, safePage * pageSize);

    return NextResponse.json({
      success: true,
      students,
      total,
      page: safePage,
      pageSize,
      totalPages,
      analytics: data.analytics,
      snapshot: data.snapshot,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = createStudentSchema.parse(body);
    const student = await studentService.createStudent(resolved.ctx, parsed);
    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
