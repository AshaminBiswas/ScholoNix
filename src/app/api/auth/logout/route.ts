import { NextRequest, NextResponse } from "next/server";
import { sessionService, getSessionCookieName } from "@/server/auth/session-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieName = getSessionCookieName();
  const token = req.cookies.get(cookieName)?.value;

  if (token) {
    try {
      await sessionService.revokeSession(token);
    } catch {
      // Ignore error during revocation
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  sessionService.clearSessionCookie(response);
  return response;
}
