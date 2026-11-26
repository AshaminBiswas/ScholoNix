import { NextRequest, NextResponse } from "next/server";
import { ValidationError, toErrorResponse } from "@/lib/errors";
import {
  createEnquirySourceSchema,
  updateEnquirySourceSchema,
} from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const sources = await admissionsService.listEnquirySources(resolved.ctx);
    return NextResponse.json({ success: true, sources });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = createEnquirySourceSchema.parse(body);
    const source = await admissionsService.createEnquirySource(resolved.ctx, parsed);
    return NextResponse.json({ success: true, source }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = updateEnquirySourceSchema.parse(body);
    const source = await admissionsService.updateEnquirySource(resolved.ctx, parsed);
    return NextResponse.json({ success: true, source });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const url = new URL(req.url);
    const sourceId = url.searchParams.get("sourceId")?.trim();
    if (!sourceId) {
      throw new ValidationError("sourceId query parameter is required.");
    }
    await admissionsService.deleteEnquirySource(resolved.ctx, sourceId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
