import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "audit-logs");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const [logs, health] = await Promise.all([
      platformService.listAuditLogs({
        schoolId: url.searchParams.get("schoolId") || undefined,
        q: url.searchParams.get("q") || undefined,
      }),
      platformService.getHealthSnapshot(),
    ]);

    return NextResponse.json({ success: true, logs, health });
  } catch (error) {
    return toErrorResponse(error);
  }
}
