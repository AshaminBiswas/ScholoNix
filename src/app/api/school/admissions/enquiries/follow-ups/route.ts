import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const followUps = await admissionsService.listEnquiryFollowUps(resolved.ctx);
    return NextResponse.json({ success: true, followUps });
  } catch (err) {
    return toErrorResponse(err);
  }
}
