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
    const { csv, filename } = await admissionsService.exportApplicationsCsv(resolved.ctx, filters);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
