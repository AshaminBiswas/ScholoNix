import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { toErrorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await sessionService.getSessionFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schools =
      session.user.role !== "PLATFORM_SUPER_ADMIN" && session.school
        ? [session.school]
        : await schoolDashboardService.getSchoolsForUser(session.user, session.school);

    return NextResponse.json({
      success: true,
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        uniqueId: s.uniqueId ?? null,
        code: s.code,
        city: s.city,
        state: s.state,
        affiliationBoard: s.affiliationBoard,
      })),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
