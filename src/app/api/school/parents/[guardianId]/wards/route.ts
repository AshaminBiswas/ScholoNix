import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { unlinkWardSchema, wardLinkInputSchema } from "@/modules/parents/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ guardianId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { guardianId } = await context.params;
    const body = await req.json();
    const parsed = wardLinkInputSchema.parse(body);
    const guardian = await parentService.linkOrUpdateWard(resolved.ctx, guardianId, parsed);
    return NextResponse.json({ success: true, guardian });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ guardianId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { guardianId } = await context.params;
    const body = await req.json();
    const parsed = unlinkWardSchema.parse(body);
    const guardian = await parentService.unlinkWard(resolved.ctx, guardianId, parsed.studentId);
    return NextResponse.json({ success: true, guardian });
  } catch (error) {
    return toErrorResponse(error);
  }
}
