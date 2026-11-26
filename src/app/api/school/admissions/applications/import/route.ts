import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { bulkImportApplicationsSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = bulkImportApplicationsSchema.parse(body);
    const applications = await admissionsService.importApplications(resolved.ctx, parsed);

    return NextResponse.json(
      {
        success: true,
        importedCount: applications.length,
        applications,
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
