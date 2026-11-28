import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentService } from "@/server/school/student-service";
import { updateStudentSettingsSchema } from "@/modules/students/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = updateStudentSettingsSchema.parse(body);
    const settings = await studentService.updateSettings(resolved.ctx, parsed);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return toErrorResponse(error);
  }
}
