import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { academicsService } from "@/server/school/academics-service";
import { academicMutationSchema } from "@/modules/academics/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const url = new URL(req.url);
    const academicYear = url.searchParams.get("academicYear")?.trim() || undefined;
    const snapshot = await academicsService.getWorkspace(resolved.ctx, academicYear);
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const body = await req.json();
    const parsed = academicMutationSchema.parse(body);
    const snapshot = await academicsService.mutate(resolved.ctx, parsed);
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    return toErrorResponse(error);
  }
}
