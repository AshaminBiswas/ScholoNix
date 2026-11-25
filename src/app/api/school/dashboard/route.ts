import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    const ownSchoolId = session.school?.id || session.user.schoolId;

    if (
      requestedSchoolId &&
      session.user.role !== "PLATFORM_SUPER_ADMIN" &&
      requestedSchoolId !== ownSchoolId
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

    const [dashboardData, availableSchools] = await Promise.all([
      schoolDashboardService.getDashboardData(targetSchoolId, session.user.id),
      schoolDashboardService.getSchoolsForUser(session.user, session.school),
    ]);

    return NextResponse.json({
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
  } catch (err) {
    return toErrorResponse(err);
  }
}
