import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionContext = await sessionService.getSessionFromRequest(req);
    if (!sessionContext) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionContext.user.id,
        name: sessionContext.user.name,
        email: sessionContext.user.email,
        phone: sessionContext.user.phone,
        role: sessionContext.user.role,
      },
      school: sessionContext.school
        ? {
            id: sessionContext.school.id,
            name: sessionContext.school.name,
            slug: sessionContext.school.slug,
            code: sessionContext.school.code,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
