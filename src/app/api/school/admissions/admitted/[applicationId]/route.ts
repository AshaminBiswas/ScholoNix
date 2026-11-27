import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { updateAdmittedEnrollmentSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { applicationId } = await context.params;
    const body = await req.json();
    const parsed = updateAdmittedEnrollmentSchema.parse(body);
    const student = await admissionsService.updateAdmittedEnrollment(
      resolved.ctx,
      applicationId,
      parsed,
    );

    return NextResponse.json({ success: true, student });
  } catch (err) {
    return toErrorResponse(err);
  }
}
