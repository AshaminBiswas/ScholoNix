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
import { platformContactOtpSendSchema } from "@/modules/platform/schemas";
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

    const rateCheck = await checkRateLimit(`platform-contact-send:${sessionCtx.admin.id}`, 12, 600);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        "Too many verification code requests. Please wait a few minutes.",
      );
    }

    const body = await req.json();
    const parsed = platformContactOtpSendSchema.parse(body);

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
        throw new ValidationError(
          "Enter a valid phone number (10 to 15 digits with country code).",
        );
      }
      identifier = normalizePhone(rawPhone);
      await platformAdminAuthService.setUnverifiedPhone(sessionCtx.admin.id, identifier);
    }

    let otpRes;
    try {
      otpRes = await otpService.requestOtp({
        identifier,
        channel: parsed.channel,
        purpose: "REGISTRATION",
        recipientName: sessionCtx.admin.name,
        registrationSessionId: `platform-admin:${sessionCtx.admin.id}`,
        ipAddress,
        userAgent,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code.";
      if (msg.toLowerCase().includes("please wait")) {
        throw new RateLimitExceededError(msg);
      }
      throw new ValidationError(msg);
    }

    await logAuditEvent({
      schoolId: "platform",
      actorId: sessionCtx.admin.id,
      action:
        parsed.channel === "EMAIL"
          ? "PLATFORM_ADMIN_EMAIL_OTP_SENT"
          : "PLATFORM_ADMIN_PHONE_OTP_SENT",
      entityType: "PlatformAdmin",
      entityId: sessionCtx.admin.id,
      details: { destinationMasked: otpRes.destinationMasked },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      channel: parsed.channel,
      destinationMasked: otpRes.destinationMasked,
      cooldownSeconds: otpRes.cooldownSeconds,
      expiresInMinutes: otpRes.expiresInMinutes,
      phone: parsed.channel === "SMS" ? identifier : undefined,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
