import { NextRequest, NextResponse } from "next/server";
import { RateLimitExceededError, toErrorResponse } from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformChangePasswordSchema } from "@/modules/platform/schemas";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";

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

    const rateCheck = await checkRateLimit(`platform-chpwd:${sessionCtx.admin.id}`, 10, 600);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError("Too many password change attempts. Try again later.");
    }

    const body = await req.json();
    const parsed = platformChangePasswordSchema.parse(body);

    const updated = await platformAdminAuthService.changeInitialPassword(
      sessionCtx.admin.id,
      parsed.currentPassword,
      parsed.newPassword,
    );

    await logAuditEvent({
      schoolId: "platform",
      actorId: updated.id,
      action: "PLATFORM_ADMIN_PASSWORD_CHANGED",
      entityType: "PlatformAdmin",
      entityId: updated.id,
      details: { mustChangePassword: updated.mustChangePassword },
      ipAddress,
      userAgent,
    });

    const hasAnyMfa = updated.twoFactorEnabled || (updated.passkeyCount ?? 0) > 0;
    const requiresContactVerification = !updated.emailVerifiedAt || !updated.phoneVerifiedAt;
    return NextResponse.json({
      success: true,
      admin: updated,
      requiresContactVerification,
      requiresMfaSetup: !requiresContactVerification && !hasAnyMfa,
      requiresMfaChallenge:
        !requiresContactVerification && hasAnyMfa && !sessionCtx.mfaVerified,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
