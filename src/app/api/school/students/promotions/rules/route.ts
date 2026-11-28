import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import { upsertPromotionRulesSchema } from "@/modules/students/promotion-schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = upsertPromotionRulesSchema.parse(body);
    const result = await studentPromotionService.saveRulesAndSettings(resolved.ctx, parsed);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
