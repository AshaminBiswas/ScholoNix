import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { createApplicationSchema } from "@/modules/school/admissions/schemas";
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
    const overview = await admissionsService.getOverview(resolved.ctx, filters);

    return NextResponse.json({
      success: true,
      applications: overview.applications,
      pagination: overview.pagination,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = createApplicationSchema.parse(body);
    const application = await admissionsService.createApplication(resolved.ctx, parsed);

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
