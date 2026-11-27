import { NextRequest, NextResponse } from "next/server";
import {
  RateLimitExceededError,
  ValidationError,
  toErrorResponse,
} from "@/lib/errors";
import { checkRateLimit } from "@/server/integrations/redis";
import { otpService } from "@/server/auth/otp-service";
import { normalizePhone } from "@/server/security/crypto";
import { logAuditEvent } from "@/server/security/audit-logger";
import { platformContactOtpVerifySchema } from "@/modules/platform/schemas";
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

    if (sessionCtx.admin.mustChangePassword) {
      throw new ValidationError(
        "Update your initial password before verifying your email and phone number.",
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const rateCheck = await checkRateLimit(`platform-contact-verify:${sessionCtx.admin.id}`, 15, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError("Too many OTP attempts. Please request a new code.");
    }

    const body = await req.json();
    const parsed = platformContactOtpVerifySchema.parse(body);

    let identifier = "";
    if (parsed.channel === "EMAIL") {
      if (sessionCtx.admin.emailVerifiedAt) {
        throw new ValidationError("Your company email is already verified.");
      }
      identifier = sessionCtx.admin.email;
    } else {
      if (sessionCtx.admin.phoneVerifiedAt) {
        throw new ValidationError("Your phone number is already verified.");
      }
      const rawPhone = parsed.phone?.trim() || sessionCtx.admin.phone || "";
      const digits = rawPhone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        throw new ValidationError("Missing valid phone number for SMS verification.");
      }
      identifier = normalizePhone(rawPhone);
    }

    const verifyResult = await otpService.verifyOtp({
      identifier,
      channel: parsed.channel,
      purpose: "REGISTRATION",
      code: parsed.code,
      registrationSessionId: `platform-admin:${sessionCtx.admin.id}`,
      ipAddress,
      userAgent,
    });

    if (!verifyResult.verified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: verifyResult.errorCode || "OTP_INVALID",
            message: verifyResult.message,
            remainingAttempts: verifyResult.remainingAttempts,
          },
        },
        { status: 400 },
      );
    }

    const updated = await platformAdminAuthService.markContactVerified(
      sessionCtx.admin.id,
      parsed.channel,
      parsed.channel === "SMS" ? identifier : undefined,
    );

    await logAuditEvent({
      schoolId: "platform",
      actorId: updated.id,
      action:
        parsed.channel === "EMAIL"
          ? "PLATFORM_ADMIN_EMAIL_VERIFIED"
          : "PLATFORM_ADMIN_PHONE_VERIFIED",
      entityType: "PlatformAdmin",
      entityId: updated.id,
      details: {
        emailVerified: Boolean(updated.emailVerifiedAt),
        phoneVerified: Boolean(updated.phoneVerifiedAt),
      },
      ipAddress,
      userAgent,
    });

    const requiresContactVerification = !updated.emailVerifiedAt || !updated.phoneVerifiedAt;
    const hasAnyMfa = updated.twoFactorEnabled || (updated.passkeyCount ?? 0) > 0;

    return NextResponse.json({
      success: true,
      admin: updated,
      requiresContactVerification,
      requiresMfaSetup: !requiresContactVerification && !hasAnyMfa,
      requiresMfaChallenge: !requiresContactVerification && hasAnyMfa && !sessionCtx.mfaVerified,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
