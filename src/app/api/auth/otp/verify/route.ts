import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { otpService, OtpChannel, OtpPurpose } from "@/server/auth/otp-service";

export const dynamic = "force-dynamic";

const verifyOtpSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    channel: z.enum(["EMAIL", "SMS"]).optional(),
    type: z.enum(["email", "mobile"]).optional(),
    purpose: z.enum(["REGISTRATION", "LOGIN", "PASSWORD_RESET"]).default("REGISTRATION"),
    code: z.string().optional(),
    otp: z.string().optional(),
    registrationSessionId: z.string().max(128).optional(),
  })
  .refine(
    (data) => Boolean((data.identifier || data.email || data.phone || "").trim().length >= 3),
    { message: "Identifier (phone or email) is required" },
  )
  .refine(
    (data) => /^\d{6}$/.test(String(data.code ?? data.otp ?? "").trim()),
    { message: "Verification code must be 6 digits" },
  );

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    const channel = (searchParams.get("channel") || "SMS") as OtpChannel;
    const purpose = (searchParams.get("purpose") || "REGISTRATION") as OtpPurpose;
    const registrationSessionId = searchParams.get("registrationSessionId") || undefined;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "Verification token is required" } },
        { status: 400 },
      );
    }

    const validation = await otpService.validateVerificationToken(
      token,
      channel,
      purpose,
      registrationSessionId,
    );
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid, expired, or already used verification token" } },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        identifier: validation.identifier,
        channel,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

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

    let channel: OtpChannel =
      parsed.channel ||
      (parsed.type === "email" ? "EMAIL" : parsed.type === "mobile" ? "SMS" : parsed.email ? "EMAIL" : "SMS");
    const rawIdentifier = (parsed.identifier || parsed.email || parsed.phone || "").trim();
    if (!parsed.channel && !parsed.type && rawIdentifier.includes("@")) {
      channel = "EMAIL";
    }
    const rawCode = String(parsed.code ?? parsed.otp ?? "").trim();

    const result = await otpService.verifyOtp({
      identifier: rawIdentifier,
      channel,
      purpose: parsed.purpose as OtpPurpose,
      code: rawCode,
      registrationSessionId: parsed.registrationSessionId,
      ipAddress: ip,
      userAgent,
    });

    if (!result.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          type: result.type,
          error: {
            code: result.errorCode || "OTP_INVALID",
            message: result.message,
            remainingAttempts: result.remainingAttempts,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      type: result.type,
      message: result.message,
      data: {
        verified: true,
        type: result.type,
        challengeId: result.challengeId,
        verificationToken: result.verificationToken,
        channel,
        registrationSessionId: parsed.registrationSessionId || null,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
