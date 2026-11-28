import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentService } from "@/server/school/student-service";
import { updateStudentSchema } from "@/modules/students/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { studentId } = await context.params;
    const student = await studentService.getStudentDetail(resolved.ctx, studentId);
    return NextResponse.json({ success: true, student });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { studentId } = await context.params;
    const body = await req.json();
    const parsed = updateStudentSchema.parse(body);
    const student = await studentService.updateStudent(resolved.ctx, studentId, parsed);
    return NextResponse.json({ success: true, student });
  } catch (error) {
    return toErrorResponse(error);
  }
}
