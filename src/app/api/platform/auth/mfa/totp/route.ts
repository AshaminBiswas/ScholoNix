import { NextRequest, NextResponse } from "next/server";
import { RateLimitExceededError, toErrorResponse } from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformTotpConfirmSchema } from "@/modules/platform/schemas";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";
import { getPlatformAdminPath } from "@/server/platform/admin-route-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionCtx = await platformAdminAuthService.getSessionFromRequest(req);
    if (!sessionCtx) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        { status: 401 },
      );
    }

    const setup = await platformAdminAuthService.beginTotpSetup(sessionCtx.admin.id);
    return NextResponse.json({
      success: true,
      secret: setup.secret,
      otpauthUri: setup.otpauthUri,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCtx = await platformAdminAuthService.getSessionFromRequest(req);
    if (!sessionCtx) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        { status: 401 },
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const rateCheck = await checkRateLimit(`platform-totp-enroll:${sessionCtx.admin.id}`, 10, 600);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError("Too many 2FA enrollment attempts. Try again later.");
    }

    const body = await req.json();
    const parsed = platformTotpConfirmSchema.parse(body);

    const result = await platformAdminAuthService.confirmTotpSetup(
      sessionCtx.admin.id,
      sessionCtx.token,
      parsed.secret,
      parsed.code,
    );

    await logAuditEvent({
      schoolId: "platform",
      actorId: result.admin.id,
      action: "PLATFORM_ADMIN_TOTP_ENROLLED",
      entityType: "PlatformAdmin",
      entityId: result.admin.id,
      details: { recoveryCodesIssued: result.recoveryCodes.length },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      admin: result.admin,
      recoveryCodes: result.recoveryCodes,
      redirectTo: getPlatformAdminPath(),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
