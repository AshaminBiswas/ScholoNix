import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { studentPromotionService } from "@/server/school/student-promotion-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "promotions:global:overview");
    if (!auth.authorized) return auth.response;

    const overview = await studentPromotionService.getPlatformGlobalOverview();
    return NextResponse.json({ success: true, overview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
