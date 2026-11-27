import { NextRequest, NextResponse } from "next/server";
import {
  getPlatformAdminCookieName,
  platformAdminAuthService,
} from "@/server/platform/platform-admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(getPlatformAdminCookieName())?.value;
  await platformAdminAuthService.revokeToken(token);

  const response = NextResponse.json({ success: true });
  platformAdminAuthService.clearSessionCookie(response);
  return response;
}
