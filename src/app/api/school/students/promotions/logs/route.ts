import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import { promotionAuditFilterSchema } from "@/modules/students/promotion-schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const url = new URL(req.url);
    const parsed = promotionAuditFilterSchema.parse({
      module: url.searchParams.get("module") || undefined,
      action: url.searchParams.get("action") || undefined,
      user: url.searchParams.get("user") || undefined,
      status: url.searchParams.get("status") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    const result = await studentPromotionService.getAuditLogs(resolved.ctx, parsed);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
