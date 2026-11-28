import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentPromotionService } from "@/server/school/student-promotion-service";

export const dynamic = "force-dynamic";

const testNotificationSchema = z.object({
  templateName: z.string().trim().min(1).max(120),
  channel: z.string().trim().min(1).max(40),
  recipient: z.string().trim().max(160).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = testNotificationSchema.parse(body);
    const result = await studentPromotionService.sendTestNotification(resolved.ctx, parsed);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
