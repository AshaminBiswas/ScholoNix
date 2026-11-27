import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformAdminLoginSchema } from "@/modules/platform/schemas";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";
import { getPlatformAdminPath } from "@/server/platform/admin-route-config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const rateCheck = await checkRateLimit(`platform-login:${ipAddress}`, 10, 600);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        "Too many company admin login attempts. Please wait a few minutes.",
      );
    }

    const body = await req.json();
    const parsed = platformAdminLoginSchema.parse(body);

    const authResult = await platformAdminAuthService.authenticateAndCreateSession(
      parsed.email,
      parsed.password,
      { ipAddress, userAgent },
    );

    if (!authResult) {
      await logAuditEvent({
        schoolId: "platform",
        action: "PLATFORM_ADMIN_LOGIN_FAILED",
        entityType: "PlatformAdmin",
        entityId: parsed.email.toLowerCase(),
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid company admin email or password." },
        },
        { status: 401 },
      );
    }

    await logAuditEvent({
      schoolId: "platform",
      actorId: authResult.admin.id,
      action: "PLATFORM_ADMIN_LOGIN_SUCCESS",
      entityType: "PlatformAdmin",
      entityId: authResult.admin.id,
      details: {
        role: authResult.admin.role,
        mustChangePassword: authResult.admin.mustChangePassword,
        twoFactorEnabled: authResult.admin.twoFactorEnabled,
      },
      ipAddress,
      userAgent,
    });

    const hasAnyMfa =
      authResult.admin.twoFactorEnabled || (authResult.admin.passkeyCount ?? 0) > 0;
    const requiresPasswordChange = authResult.admin.mustChangePassword;
    const requiresContactVerification =
      !requiresPasswordChange &&
      (!authResult.admin.emailVerifiedAt || !authResult.admin.phoneVerifiedAt);
    const requiresMfaSetup =
      !requiresPasswordChange && !requiresContactVerification && !hasAnyMfa;
    const requiresMfaChallenge =
      !requiresPasswordChange && !requiresContactVerification && hasAnyMfa;

    const response = NextResponse.json({
      success: true,
      admin: authResult.admin,
      requiresPasswordChange,
      requiresContactVerification,
      requiresMfaSetup,
      requiresMfaChallenge,
      availableMfaMethods: {
        totp: authResult.admin.twoFactorEnabled,
        passkey: (authResult.admin.passkeyCount ?? 0) > 0,
      },
      redirectTo: getPlatformAdminPath(),
    });
    platformAdminAuthService.setSessionCookie(response, authResult.token, authResult.expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
