import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import { executePromotionBatchSchema } from "@/modules/students/promotion-schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = executePromotionBatchSchema.parse(body);
    const result = await studentPromotionService.executeBatch(resolved.ctx, parsed);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
