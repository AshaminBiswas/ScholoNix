import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { autoLinkHouseholdsSchema } from "@/modules/parents/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json().catch(() => ({}));
    const parsed = autoLinkHouseholdsSchema.parse(body);
    const result = await parentService.autoLinkHouseholds(resolved.ctx, parsed.mode);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
