import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { admissionsService } from "@/server/school/admissions-service";
import {
  parseAdmissionsOverviewFiltersFromSearchParams,
  resolveApiTenantActor,
} from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const url = new URL(req.url);
    const filters = parseAdmissionsOverviewFiltersFromSearchParams(url.searchParams);
    const data = await admissionsService.getOverview(resolved.ctx, filters);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
