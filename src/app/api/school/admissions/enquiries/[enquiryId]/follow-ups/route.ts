import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import {
  createEnquiryFollowUpSchema,
  updateEnquiryFollowUpSchema,
} from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ enquiryId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { enquiryId } = await context.params;
    const body = await req.json();
    const parsed = createEnquiryFollowUpSchema.parse(body);
    const followUp = await admissionsService.createEnquiryFollowUp(
      resolved.ctx,
      enquiryId,
      parsed,
    );

    return NextResponse.json({ success: true, followUp }, { status: 201 });
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
    const parsed = updateEnquiryFollowUpSchema.parse(body);
    const followUp = await admissionsService.updateEnquiryFollowUp(
      resolved.ctx,
      enquiryId,
      parsed,
    );

    return NextResponse.json({ success: true, followUp });
  } catch (err) {
    return toErrorResponse(err);
  }
}
