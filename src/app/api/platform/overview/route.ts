import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "overview");
    if (!auth.authorized) return auth.response;

    const overview = await platformService.getOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
