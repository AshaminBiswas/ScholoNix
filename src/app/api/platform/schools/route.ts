import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { provisionSchoolSchema } from "@/modules/platform/schemas";
import { logAuditEvent } from "@/server/security/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "schools");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const uniqueIdParam = url.searchParams.get("uniqueId")?.trim() || "";
    const queryParam = url.searchParams.get("q")?.trim() || "";
    const statusParam = url.searchParams.get("status")?.trim() || "";
    const planParam = url.searchParams.get("plan")?.trim() || "";
    const searchQuery = uniqueIdParam || queryParam;

    const schools = await platformService.listSchools({
      q: searchQuery,
      status: statusParam,
      plan: planParam,
    });

    await logAuditEvent({
      schoolId: "platform",
      actorId: auth.session.user.id,
      action: "PLATFORM_ADMIN_SCHOOL_SEARCH",
      entityType: "School",
      entityId: searchQuery || "*",
      details: { query: searchQuery || "*", resultsCount: schools.length },
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, schools });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "schools:provision");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = provisionSchoolSchema.parse(body);

    const entry = await platformService.provisionSchool(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed,
    );

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
