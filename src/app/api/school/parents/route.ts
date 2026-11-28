import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { parseParentFiltersFromUrl } from "@/modules/parents/analytics";
import { createGuardianSchema } from "@/modules/parents/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const filters = parseParentFiltersFromUrl(new URL(req.url));
    const data = await parentService.getDashboardData(resolved.ctx, filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const total = data.filteredGuardians.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const guardians = data.filteredGuardians.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize,
    );

    return NextResponse.json({
      success: true,
      guardians,
      total,
      page: safePage,
      pageSize,
      totalPages,
      analytics: data.analytics,
      households: data.households,
      snapshot: data.snapshot,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = createGuardianSchema.parse(body);
    const guardian = await parentService.createGuardian(resolved.ctx, parsed);
    return NextResponse.json({ success: true, guardian }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
