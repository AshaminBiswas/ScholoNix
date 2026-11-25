import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { otpService, OtpPurpose } from "@/server/auth/otp-service";

export const dynamic = "force-dynamic";

const statusQuerySchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  phoneToken: z.string().optional(),
  emailToken: z.string().optional(),
  registrationSessionId: z.string().optional(),
  purpose: z.enum(["REGISTRATION", "LOGIN", "PASSWORD_RESET"]).default("REGISTRATION"),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const parsed = statusQuerySchema.parse({
      phone: searchParams.get("phone") || undefined,
      email: searchParams.get("email") || undefined,
      phoneToken: searchParams.get("phoneToken") || searchParams.get("mobileToken") || undefined,
      emailToken: searchParams.get("emailToken") || undefined,
      registrationSessionId: searchParams.get("registrationSessionId") || undefined,
      purpose: searchParams.get("purpose") || "REGISTRATION",
    });

    return await handleStatusCheck(parsed);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = statusQuerySchema.parse({
      phone: body.phone || body.mobile || undefined,
      email: body.email || undefined,
      phoneToken: body.phoneToken || body.mobileVerificationToken || undefined,
      emailToken: body.emailToken || body.emailVerificationToken || undefined,
      registrationSessionId: body.registrationSessionId || undefined,
      purpose: body.purpose || "REGISTRATION",
    });

    return await handleStatusCheck(parsed);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function handleStatusCheck(parsed: {
  phone?: string;
  email?: string;
  phoneToken?: string;
  emailToken?: string;
  registrationSessionId?: string;
  purpose: OtpPurpose;
}) {
  let isMobileVerified = false;
  let mobileVerificationToken: string | null = null;
  let mobileVerifiedAt: string | null = null;

  let isEmailVerified = false;
  let emailVerificationToken: string | null = null;
  let emailVerifiedAt: string | null = null;

  if (parsed.phone) {
    const mobileStatus = await otpService.getVerificationStatus({
      identifier: parsed.phone,
      channel: "SMS",
      purpose: parsed.purpose,
      token: parsed.phoneToken || null,
      registrationSessionId: parsed.registrationSessionId || null,
    });
    isMobileVerified = mobileStatus.isVerified;
    mobileVerificationToken = mobileStatus.verificationToken;
    mobileVerifiedAt = mobileStatus.verifiedAt ? mobileStatus.verifiedAt.toISOString() : null;
  }

  if (parsed.email) {
    const emailStatus = await otpService.getVerificationStatus({
      identifier: parsed.email,
      channel: "EMAIL",
      purpose: parsed.purpose,
      token: parsed.emailToken || null,
      registrationSessionId: parsed.registrationSessionId || null,
    });
    isEmailVerified = emailStatus.isVerified;
    emailVerificationToken = emailStatus.verificationToken;
    emailVerifiedAt = emailStatus.verifiedAt ? emailStatus.verifiedAt.toISOString() : null;
  }

  const allVerified =
    (Boolean(parsed.phone) ? isMobileVerified : true) &&
    (Boolean(parsed.email) ? isEmailVerified : true) &&
    Boolean(parsed.phone || parsed.email);

  return NextResponse.json({
    success: true,
    data: {
      isMobileVerified,
      isEmailVerified,
      mobileVerificationToken,
      emailVerificationToken,
      mobileVerifiedAt,
      emailVerifiedAt,
      allVerified,
    },
  });
}
