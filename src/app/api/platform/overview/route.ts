import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import type { PlatformOverviewPeriodDays } from "@/modules/platform/types";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = new Set<PlatformOverviewPeriodDays>([7, 30, 90, 365]);

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "overview");
    if (!auth.authorized) return auth.response;

    const rawDays = Number(new URL(req.url).searchParams.get("days") || "30");
    const periodDays: PlatformOverviewPeriodDays = ALLOWED_DAYS.has(
      rawDays as PlatformOverviewPeriodDays,
    )
      ? (rawDays as PlatformOverviewPeriodDays)
      : 30;

    const overview = await platformService.getOverview(periodDays);
    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
