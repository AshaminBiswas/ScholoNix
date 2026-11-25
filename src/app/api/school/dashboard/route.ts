import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { toErrorResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const session = await sessionService.getSessionFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Unauthorized: Active school session required to access dashboard.",
        },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const requestedSchoolId = url.searchParams.get("schoolId")?.trim();
    const requestedSlug = url.searchParams.get("schoolSlug")?.trim().toLowerCase();
    const ownSchoolId = session.school?.id || session.user.schoolId;
    const isSuperAdmin = session.user.role === "PLATFORM_SUPER_ADMIN";

    if (
      !isSuperAdmin &&
      ((requestedSchoolId && requestedSchoolId !== ownSchoolId) ||
        (requestedSlug && session.school && requestedSlug !== session.school.slug.toLowerCase()))
    ) {
      return NextResponse.json(
        {
          authenticated: true,
          error: "Forbidden: Cross-tenant school access is prohibited.",
        },
        { status: 403 },
      );
    }

    const targetSchoolId = requestedSchoolId || ownSchoolId;
    if (!targetSchoolId) {
      return NextResponse.json(
        { error: "No registered school is associated with this account." },
        { status: 404 },
      );
    }

    let dashboardData;
    let availableSchools;
    let cacheHit = false;

    if (!isSuperAdmin && session.school && session.school.id === targetSchoolId) {
      const fastResult = await schoolDashboardService.getDashboardDataFromSession(
        session.school,
        session.user,
      );
      dashboardData = fastResult.data;
      cacheHit = fastResult.cacheHit;
      availableSchools = [session.school];
    } else {
      [dashboardData, availableSchools] = await Promise.all([
        schoolDashboardService.getDashboardData(targetSchoolId, session.user.id),
        schoolDashboardService.getSchoolsForUser(session.user, session.school),
      ]);
    }

    const durationMs = Date.now() - startedAt;
    logger.info(
      {
        event: "SCHOOL_DASHBOARD_API_LOADED",
        schoolId: dashboardData.school.id,
        cacheHit,
        durationMs,
      },
      "[DashboardAPI] Loaded tenant dashboard",
    );

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      data: dashboardData,
      availableSchools: availableSchools.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        code: s.code,
        city: s.city,
        state: s.state,
      })),
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        role: session.user.role,
      },
    });
    response.headers.set("Server-Timing", `dash;dur=${durationMs}`);
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
