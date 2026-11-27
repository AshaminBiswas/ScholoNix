import { NextRequest, NextResponse } from "next/server";
import { RateLimitExceededError, toErrorResponse } from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformMfaVerifySchema } from "@/modules/platform/schemas";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";
import { getPlatformAdminPath } from "@/server/platform/admin-route-config";

export const dynamic = "force-dynamic";

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

    const rateCheck = await checkRateLimit(`platform-mfa-verify:${sessionCtx.admin.id}`, 10, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError("Too many 2FA verification attempts. Please wait.");
    }

    const body = await req.json();
    const parsed = platformMfaVerifySchema.parse(body);

    const result = await platformAdminAuthService.verifyTotpOrRecoveryAndMarkSession(
      sessionCtx.admin.id,
      sessionCtx.token,
      parsed.code,
    );

    await logAuditEvent({
      schoolId: "platform",
      actorId: result.admin.id,
      action: "PLATFORM_ADMIN_MFA_VERIFIED",
      entityType: "PlatformAdmin",
      entityId: result.admin.id,
      details: {
        method: result.usedRecoveryCode ? "RECOVERY_CODE" : "TOTP",
        remainingRecoveryCodes: result.remainingRecoveryCodes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      admin: result.admin,
      usedRecoveryCode: result.usedRecoveryCode,
      remainingRecoveryCodes: result.remainingRecoveryCodes,
      redirectTo: getPlatformAdminPath(),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
