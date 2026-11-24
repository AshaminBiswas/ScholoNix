import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { otpService, OtpChannel } from "@/server/auth/otp-service";
import { authRepository } from "@/server/auth/auth-repository";
import { hashPassword } from "@/server/security/crypto";
import { logAuditEvent } from "@/server/security/audit-logger";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z
  .object({
    recipient: z.string().min(3, "Recipient required"),
    channel: z.enum(["phone", "email"]).default("phone"),
    otp: z.string().length(6, "Valid 6-digit verification code required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

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

    const channel: OtpChannel = data.channel === "email" ? "EMAIL" : "SMS";

    // 1. Verify OTP code
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
            message: verifyResult.message,
            remainingAttempts: verifyResult.remainingAttempts,
          },
        },
        { status: 400 },
      );
    }

    // 2. Find user
    const user = await authRepository.findUserByIdentifier(data.recipient);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "No registered account found for this recipient." },
        },
        { status: 404 },
      );
    }

    // 3. Hash new password and update in repository
    const newHash = await hashPassword(data.password);
    await authRepository.updateUserPassword(user.id, newHash);

    // 4. Log audit event
    await logAuditEvent({
      action: "PASSWORD_RESET_SUCCESS",
      entityType: "User",
      entityId: user.id,
      details: { identifier: data.recipient, channel },
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
