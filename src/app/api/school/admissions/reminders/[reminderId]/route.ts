import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { updateReminderSchema } from "@/modules/school/admissions/schemas";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ reminderId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { reminderId } = await context.params;
    const body = await req.json();
    const parsed = updateReminderSchema.parse(body);
    const reminder = await admissionsService.toggleReminder(
      resolved.ctx,
      reminderId,
      parsed.isCompleted,
    );

    return NextResponse.json({ success: true, reminder });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ reminderId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { reminderId } = await context.params;
    await admissionsService.deleteReminder(resolved.ctx, reminderId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
