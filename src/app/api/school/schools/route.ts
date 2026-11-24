import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await sessionService.getSessionFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schools = await schoolDashboardService.getAllSchools();
    return NextResponse.json({
      success: true,
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        code: s.code,
        city: s.city,
        state: s.state,
        affiliationBoard: s.affiliationBoard,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
