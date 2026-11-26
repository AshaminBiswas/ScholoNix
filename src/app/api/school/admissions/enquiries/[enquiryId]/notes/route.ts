import { NextRequest, NextResponse } from "next/server";
import { ValidationError, toErrorResponse } from "@/lib/errors";
import {
  createEnquiryNoteSchema,
  updateEnquiryNoteSchema,
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
    const parsed = createEnquiryNoteSchema.parse(body);
    const note = await admissionsService.createEnquiryNote(resolved.ctx, enquiryId, parsed);

    return NextResponse.json({ success: true, note }, { status: 201 });
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
    const parsed = updateEnquiryNoteSchema.parse(body);
    const note = await admissionsService.updateEnquiryNote(resolved.ctx, enquiryId, parsed);

    return NextResponse.json({ success: true, note });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ enquiryId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { enquiryId } = await context.params;
    const url = new URL(req.url);
    const noteId = url.searchParams.get("noteId")?.trim();
    if (!noteId) {
      throw new ValidationError("noteId query parameter is required.");
    }

    await admissionsService.deleteEnquiryNote(resolved.ctx, enquiryId, noteId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
