import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { sendGuardianCommunicationSchema } from "@/modules/parents/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = sendGuardianCommunicationSchema.parse(body);
    const result = await parentService.sendCommunication(resolved.ctx, parsed);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
