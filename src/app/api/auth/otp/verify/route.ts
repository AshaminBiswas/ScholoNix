import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { otpService, OtpChannel, OtpPurpose } from "@/server/auth/otp-service";

export const dynamic = "force-dynamic";

const verifyOtpSchema = z.object({
  identifier: z.string().min(3, "Identifier (phone or email) is required"),
  channel: z.enum(["EMAIL", "SMS"]),
  purpose: z.enum(["REGISTRATION", "LOGIN", "PASSWORD_RESET"]).default("REGISTRATION"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: max 20 verify attempts per IP per 5 minutes
    const rateCheck = await checkRateLimit(`otp_verify:${ip}`, 20, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        "Too many verification attempts. Please wait before trying again.",
      );
    }

    const body = await req.json();
    const parsed = verifyOtpSchema.parse(body);

    const result = await otpService.verifyOtp({
      identifier: parsed.identifier,
      channel: parsed.channel as OtpChannel,
      purpose: parsed.purpose as OtpPurpose,
      code: parsed.code,
      ipAddress: ip,
      userAgent,
    });

    if (!result.verified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: result.message,
            remainingAttempts: result.remainingAttempts,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        verified: true,
        verificationToken: result.verificationToken,
        channel: parsed.channel,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
