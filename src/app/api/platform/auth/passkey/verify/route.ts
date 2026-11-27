import { NextRequest, NextResponse } from "next/server";
import { RateLimitExceededError, toErrorResponse } from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformPasskeyVerifySchema } from "@/modules/platform/schemas";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";
import { resolveWebAuthnContext } from "@/server/platform/platform-mfa-crypto";
import { getPlatformAdminPath } from "@/server/platform/admin-route-config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const rateCheck = await checkRateLimit(`platform-passkey-verify:${ipAddress}`, 15, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError("Too many passkey sign-in attempts. Please wait.");
    }

    const body = await req.json();
    const parsed = platformPasskeyVerifySchema.parse(body);
    const { expectedOrigins, expectedRpIds } = resolveWebAuthnContext(req);
    const existingSession = await platformAdminAuthService.getSessionFromRequest(req);

    const result = await platformAdminAuthService.verifyPasskeyAndCreateOrMarkSession({
      ...parsed,
      expectedOrigins,
      expectedRpIds,
      existingSessionToken: existingSession?.token ?? null,
      meta: { ipAddress, userAgent },
    });

    await logAuditEvent({
      schoolId: "platform",
      actorId: result.admin.id,
      action: "PLATFORM_ADMIN_PASSKEY_VERIFIED",
      entityType: "PlatformAdmin",
      entityId: result.admin.id,
      details: {
        mode: existingSession ? "MFA_STEP_UP" : "PASSWORDLESS_PASSKEY",
        mustChangePassword: result.admin.mustChangePassword,
      },
      ipAddress,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      admin: result.admin,
      requiresPasswordChange: result.admin.mustChangePassword,
      redirectTo: getPlatformAdminPath(),
    });
    platformAdminAuthService.setSessionCookie(response, result.token, result.expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
