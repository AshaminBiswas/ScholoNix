import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { bulkUpdateApplicationsSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = bulkUpdateApplicationsSchema.parse(body);
    const applications = await admissionsService.bulkUpdateApplications(resolved.ctx, parsed);

    return NextResponse.json({
      success: true,
      updatedCount: applications.length,
      applications,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
