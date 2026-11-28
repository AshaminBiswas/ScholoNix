import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { updateGuardianSchema } from "@/modules/parents/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ guardianId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { guardianId } = await context.params;
    const dossier = await parentService.getGuardianDossier(resolved.ctx, guardianId);
    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ guardianId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { guardianId } = await context.params;
    const body = await req.json();
    const parsed = updateGuardianSchema.parse(body);
    const guardian = await parentService.updateGuardian(resolved.ctx, guardianId, parsed);
    return NextResponse.json({ success: true, guardian });
  } catch (error) {
    return toErrorResponse(error);
  }
}
