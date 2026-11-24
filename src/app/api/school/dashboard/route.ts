import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await sessionService.getSessionFromRequest(req);
    const url = new URL(req.url);
    const requestedSchoolId = url.searchParams.get("schoolId");
    const isDemo = process.env.NODE_ENV !== "production" && url.searchParams.get("demo") === "true";

    if ((!session || !session.user) && !isDemo) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Unauthorized: Active school session required to access dashboard.",
        },
        { status: 401 }
      );
    }

    // Default to the authenticated user's school, or requested school in demo/admin context
    let targetSchoolId = session?.school?.id || session?.user?.schoolId;

    if (requestedSchoolId) {
      targetSchoolId = requestedSchoolId;
    } else if (isDemo && !targetSchoolId) {
      targetSchoolId = "sch_sunrise_001";
    }

    if (!targetSchoolId) {
      return NextResponse.json(
        {
          authenticated: true,
          error: "No registered school associated with this account.",
        },
        { status: 403 }
      );
    }

    const dashboardData = await schoolDashboardService.getDashboardData(
      targetSchoolId,
      session?.user?.id || "usr_demo"
    );

    const availableSchools = await schoolDashboardService.getAllSchools();

    return NextResponse.json({
      success: true,
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
        id: session?.user?.id || "usr_demo",
        name: session?.user?.name || dashboardData.currentUser.name,
        email: session?.user?.email || null,
        phone: session?.user?.phone || null,
        role: session?.user?.role || dashboardData.currentUser.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
