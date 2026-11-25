import { NextRequest, NextResponse } from "next/server";
import { completeRegistrationSchema } from "@/modules/schools/schemas/registration";
import { registerSchool } from "@/modules/schools/services/registration-service";
import { checkRateLimit } from "@/server/integrations/redis";
import { toErrorResponse, RateLimitExceededError } from "@/lib/errors";
import { authRepository } from "@/server/auth/auth-repository";
import { sessionService } from "@/server/auth/session-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: max 10 registrations per IP per hour
    const rateCheck = await checkRateLimit(`register:${ip}`, 10, 3600);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        "Too many registration attempts. Please try again later.",
      );
    }

    const body = await req.json();
    const validatedInput = completeRegistrationSchema.parse(body);

    const result = await registerSchool(validatedInput, {
      ipAddress: ip,
      userAgent,
    });

    // Create session for newly registered school admin
    const user = await authRepository.findUserById(result.adminId);
    const response = NextResponse.json(
      {
        success: true,
        message: "School registered and activated successfully",
        data: {
          ...result,
          redirectTo: `/${result.slug}?onboarding=true`,
        },
      },
      { status: 201 },
    );

    if (user) {
      const { token, expiresAt } = await sessionService.createSession(user, {
        ipAddress: ip,
        userAgent,
      });
      sessionService.setSessionCookie(response, token, expiresAt);
    }

    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
