import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import { promotionFilterQuerySchema } from "@/modules/students/promotion-schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const url = new URL(req.url);
    const parsed = promotionFilterQuerySchema.parse({
      academicYear: url.searchParams.get("academicYear") || undefined,
      fromGrade: url.searchParams.get("fromGrade") || undefined,
      toGrade: url.searchParams.get("toGrade") || undefined,
      section: url.searchParams.get("section") || undefined,
      status: url.searchParams.get("status") || undefined,
      search: url.searchParams.get("search") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    const overview = await studentPromotionService.getOverview(resolved.ctx, {
      academicYear: parsed.academicYear,
      fromGrade: parsed.fromGrade,
      toGrade: parsed.toGrade,
      section: parsed.section,
      status: parsed.status,
      search: parsed.search,
    });

    return NextResponse.json({ success: true, overview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
