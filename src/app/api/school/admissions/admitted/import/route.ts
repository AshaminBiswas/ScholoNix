import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { importAdmittedStudentsSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = importAdmittedStudentsSchema.parse(body);
    const students = await admissionsService.importAdmittedStudents(
      resolved.ctx,
      parsed.students,
    );

    return NextResponse.json(
      { success: true, students, count: students.length },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
