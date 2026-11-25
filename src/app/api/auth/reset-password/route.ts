import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { otpService, OtpChannel } from "@/server/auth/otp-service";
import { authRepository } from "@/server/auth/auth-repository";
import { hashPassword, maskEmail, maskPhone, normalizePhone } from "@/server/security/crypto";
import { logAuditEvent } from "@/server/security/audit-logger";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z
  .object({
    recipient: z.string().min(3, "Recipient required"),
    channel: z.enum(["phone", "email"]).default("phone"),
    verificationToken: z.string().min(16).optional(),
    otp: z.string().length(6, "Valid 6-digit verification code required").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => Boolean(data.verificationToken || data.otp), {
    message: "Verification proof (token or 6-digit OTP) is required.",
    path: ["verificationToken"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function normalizeResetIdentifier(raw: string, channel: OtpChannel): string {
  return channel === "EMAIL" ? raw.trim().toLowerCase() : normalizePhone(raw);
}

function maskResetIdentifier(normalized: string, channel: OtpChannel): string {
  return channel === "EMAIL" ? maskEmail(normalized) : maskPhone(normalized);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const rateCheck = await checkRateLimit(`reset-pw:${ip}`, 10, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        "Too many password reset attempts. Please wait a few minutes.",
      );
    }

    const body = await req.json();
    const data = resetPasswordSchema.parse(body);

    const channel: OtpChannel =
      data.channel === "email" || data.recipient.includes("@") ? "EMAIL" : "SMS";
    const normalizedRecipient = normalizeResetIdentifier(data.recipient, channel);
    const maskedRecipient = maskResetIdentifier(normalizedRecipient, channel);

    let tokenToConsume: string | undefined;

    // 1. Validate verification proof: prefer the verificationToken issued in Step 2 (/api/auth/otp/verify)
    //    to avoid re-consuming the already-used 6-digit OTP; also allow direct single-step otp submissions.
    if (data.verificationToken) {
      const tokenValidation = await otpService.validateVerificationToken(
        data.verificationToken,
        channel,
        "PASSWORD_RESET",
      );

      if (!tokenValidation.valid || !tokenValidation.identifier) {
        logger.warn(
          { event: "PASSWORD_RESET_TOKEN_INVALID", channel, destinationMasked: maskedRecipient },
          "[ResetPassword] Verification token invalid, expired, or already used",
        );
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VERIFICATION_EXPIRED",
              message:
                "Your verification session has expired or was already used. Please request a new OTP.",
            },
          },
          { status: 400 },
        );
      }

      const tokenIdentifier = normalizeResetIdentifier(tokenValidation.identifier, channel);
      if (tokenIdentifier !== normalizedRecipient) {
        logger.warn(
          { event: "PASSWORD_RESET_RECIPIENT_MISMATCH", channel, destinationMasked: maskedRecipient },
          "[ResetPassword] Verification token recipient mismatch",
        );
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VERIFICATION_MISMATCH",
              message: "Verification token does not match the requested mobile number or email.",
            },
          },
          { status: 400 },
        );
      }

      tokenToConsume = data.verificationToken;
    } else if (data.otp) {
      const verifyResult = await otpService.verifyOtp({
        identifier: data.recipient,
        channel,
        purpose: "PASSWORD_RESET",
        code: data.otp,
        ipAddress: ip,
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

      tokenToConsume = verifyResult.verificationToken;
    }

    // 2. Find user account
    const user = await authRepository.findUserByIdentifier(normalizedRecipient);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: "No registered account found for this recipient.",
          },
        },
        { status: 404 },
      );
    }

    // 3. Atomically consume the verification token so concurrent or repeated resets cannot replay it
    if (tokenToConsume) {
      const consumed = await otpService.consumeVerificationToken(tokenToConsume);
      if (!consumed) {
        logger.warn(
          { event: "PASSWORD_RESET_TOKEN_REPLAY", channel, destinationMasked: maskedRecipient },
          "[ResetPassword] Verification token already consumed",
        );
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VERIFICATION_ALREADY_USED",
              message:
                "This password reset verification has already been used. Please request a new OTP.",
            },
          },
          { status: 400 },
        );
      }
    }

    // 4. Hash new password, update user record, and revoke existing sessions
    const newHash = await hashPassword(data.password);
    await authRepository.updateUserPassword(user.id, newHash);
    await authRepository.revokeAllUserSessions(user.id);

    // 5. Log audit event
    await logAuditEvent({
      action: "PASSWORD_RESET_SUCCESS",
      entityType: "User",
      entityId: user.id,
      details: { identifier: normalizedRecipient, channel },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
