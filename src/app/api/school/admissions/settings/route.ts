import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { updateAdmissionsSettingsSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const overview = await admissionsService.getOverview(resolved.ctx);
    return NextResponse.json({ success: true, settings: overview.settings });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = updateAdmissionsSettingsSchema.parse(body);
    const settings = await admissionsService.updateSettings(resolved.ctx, parsed);

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return toErrorResponse(err);
  }
}
