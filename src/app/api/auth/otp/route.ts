import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { otpService, OtpChannel, OtpPurpose } from "@/server/auth/otp-service";

export const dynamic = "force-dynamic";

const sendOtpSchema = z
  .object({
    identifier: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    channel: z.enum(["EMAIL", "SMS"]).optional(),
    type: z.enum(["email", "mobile"]).optional(),
    purpose: z.enum(["REGISTRATION", "LOGIN", "PASSWORD_RESET"]).default("REGISTRATION"),
    recipientName: z.string().optional(),
    registrationSessionId: z.string().max(128).optional(),
  })
  .refine(
    (data) => Boolean(data.identifier || data.phone || data.email),
    { message: "Either identifier, phone, or email is required" },
  );

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: max 10 OTP requests per IP per 5 minutes
    const rateCheck = await checkRateLimit(`otp:${ip}`, 10, 300);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        `Too many OTP requests. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`,
      );
    }

    const body = await req.json();
    const parsed = sendOtpSchema.parse(body);

    // Determine channel and target identifier
    let channel: OtpChannel =
      parsed.channel || (parsed.type === "email" ? "EMAIL" : parsed.type === "mobile" ? "SMS" : "SMS");
    let identifier = parsed.identifier || "";

    if (parsed.email) {
      channel = "EMAIL";
      identifier = parsed.email;
    } else if (parsed.phone) {
      channel = "SMS";
      identifier = parsed.phone;
    } else if (identifier.includes("@")) {
      channel = "EMAIL";
    }

    if (!identifier.trim()) {
      return NextResponse.json(
        { success: false, error: { message: "Valid mobile number or email address is required" } },
        { status: 400 },
      );
    }

    const result = await otpService.requestOtp({
      identifier: identifier.trim(),
      channel,
      purpose: parsed.purpose as OtpPurpose,
      recipientName: parsed.recipientName,
      registrationSessionId: parsed.registrationSessionId,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      type: result.type,
      data: {
        channel: result.channel,
        type: result.type,
        challengeId: result.challengeId,
        destinationMasked: result.destinationMasked,
        cooldownSeconds: result.cooldownSeconds,
        expiresInMinutes: result.expiresInMinutes,
        registrationSessionId: parsed.registrationSessionId || null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Please wait")) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 429 },
      );
    }
    return toErrorResponse(error);
  }
}
