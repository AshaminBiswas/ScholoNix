import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { updateEnquirySchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ enquiryId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { enquiryId } = await context.params;
    const dossier = await admissionsService.getEnquiryDossier(resolved.ctx, enquiryId);

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ enquiryId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { enquiryId } = await context.params;
    const body = await req.json();
    const parsed = updateEnquirySchema.parse(body);
    const result = await admissionsService.updateOrConvertEnquiry(resolved.ctx, enquiryId, parsed);

    return NextResponse.json({
      success: true,
      enquiry: result.enquiry,
      ...(result.createdApplication ? { application: result.createdApplication } : {}),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
