import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentService } from "@/server/school/student-service";
import { transferStudentSchema } from "@/modules/students/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = transferStudentSchema.parse(body);
    const transfer = await studentService.transferStudent(resolved.ctx, parsed);
    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    return toErrorResponse(error);
  }
}
