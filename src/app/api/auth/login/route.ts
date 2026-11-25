import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { authRepository } from "@/server/auth/auth-repository";
import { getDummyPasswordHash, verifyPassword } from "@/server/security/crypto";
import { sessionService } from "@/server/auth/session-service";
import { otpService, OtpChannel } from "@/server/auth/otp-service";
import { logAuditEvent } from "@/server/security/audit-logger";

export const dynamic = "force-dynamic";

const loginSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("otp"),
    phone: z.string().optional(),
    email: z.string().optional(),
    otpCode: z.string().min(6, "6-digit OTP code required"),
  }),
  z.object({
    method: z.literal("password"),
    identifier: z.string().min(3, "Email address, mobile number or Login ID is required"),
    password: z.string().min(6, "Password is required"),
  }),
]);

// Process-ephemeral bcrypt hash helper used to keep missing-user timing consistent
// without storing any hardcoded hash literal in source control.

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: max 15 login attempts per IP per 10 minutes
    const rateCheck = await checkRateLimit(`login:${ip}`, 15, 600);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        "Too many login attempts. Please wait a few minutes before trying again.",
      );
    }

    const body = await req.json();
    const parsed = loginSchema.parse(body);

    if (parsed.method === "otp") {
      const channel: OtpChannel = parsed.email ? "EMAIL" : "SMS";
      const identifier = parsed.email || parsed.phone;

      if (!identifier) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Either mobile number or email address is required for OTP login" },
          },
          { status: 400 },
        );
      }

      // Verify OTP code
      const verifyResult = await otpService.verifyOtp({
        identifier,
        channel,
        purpose: "LOGIN",
        code: parsed.otpCode,
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

      // Find user account
      const user = await authRepository.findUserByIdentifier(identifier);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "No registered account found with this credential." },
          },
          { status: 404 },
        );
      }

      // Check account status
      if (user.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Account is not active or verification is pending." },
          },
          { status: 403 },
        );
      }

      // Create session
      const { token, expiresAt } = await sessionService.createSession(user, {
        ipAddress: ip,
        userAgent,
      });

      const response = NextResponse.json({
        success: true,
        message: "Login successful via OTP",
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
          },
          school: user.school
            ? {
                name: user.school.name,
                slug: user.school.slug,
                code: user.school.code,
              }
            : null,
        },
      });

      sessionService.setSessionCookie(response, token, expiresAt);
      return response;
    }

    // Password authentication
    const cleanIdentifier = parsed.identifier.trim();
    const user = await authRepository.findUserByIdentifier(cleanIdentifier);

    if (!user) {
      // Run dummy compare to mitigate timing enumeration attacks
      await verifyPassword(parsed.password, await getDummyPasswordHash());
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid credentials. Please verify your mobile/email and password." },
        },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(parsed.password, user.passwordHash);
    if (!isValidPassword) {
      await logAuditEvent({
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        details: { identifier: cleanIdentifier, reason: "INVALID_PASSWORD" },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid credentials. Please verify your mobile/email and password." },
        },
        { status: 401 },
      );
    }

    // Check account status and verification
    if (user.status === "PENDING_VERIFICATION" || (!user.emailVerified && !user.phoneVerified)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Account verification is pending. Both email and mobile verification must be completed.",
          },
        },
        { status: 403 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Your account is currently suspended or inactive. Please contact support." },
        },
        { status: 403 },
      );
    }

    // Create persistent session
    const { token, expiresAt } = await sessionService.createSession(user, {
      ipAddress: ip,
      userAgent,
    });

    await logAuditEvent({
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      details: { identifier: cleanIdentifier, method: "PASSWORD" },
      ipAddress: ip,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        school: user.school
          ? {
              name: user.school.name,
              slug: user.school.slug,
              code: user.school.code,
            }
          : null,
      },
    });

    sessionService.setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
