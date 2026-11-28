import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { portalInviteSchema } from "@/modules/parents/schemas";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ guardianId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { guardianId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const parsed = portalInviteSchema.parse(body);
    const targets = parsed.guardianIds && parsed.guardianIds.length > 0
      ? parsed.guardianIds
      : [guardianId];
    const result = await parentService.updatePortalAccess(resolved.ctx, targets, parsed.action);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
