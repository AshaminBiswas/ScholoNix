import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { createReminderSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = createReminderSchema.parse(body);
    const reminder = await admissionsService.createReminder(resolved.ctx, parsed);

    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
