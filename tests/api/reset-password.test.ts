import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { POST as sendOtpPost } from "@/app/api/auth/otp/route";
import { POST as verifyOtpPost } from "@/app/api/auth/otp/verify/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { authRepository } from "@/server/auth/auth-repository";
import { setOtpGeneratorForTesting } from "@/server/auth/otp-service";
import { sessionService } from "@/server/auth/session-service";
import { hashPassword, verifyPassword } from "@/server/security/crypto";

async function createSyntheticUser(suffix: string) {
  const email = `reset.tester.${suffix}@scholonix.example`;
  const phone = `+919870${suffix.slice(-6).padStart(6, "0")}`;
  const passwordHash = await hashPassword("MockOld!123");

  return authRepository.createUserWithSchool({
    school: {
      name: `Test Academy ${suffix}`,
      slug: `test-academy-${suffix}`,
      code: `TST-${suffix.slice(-4)}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      pinCode: "110001",
      country: "India",
    },
    user: {
      name: "Synthetic School Admin",
      email,
      phone,
      passwordHash,
      role: "SCHOOL_ADMIN",
      phoneVerified: true,
      emailVerified: true,
    },
  });
}

describe("Forgot Password OTP & /api/auth/reset-password", () => {
  afterEach(() => {
    setOtpGeneratorForTesting(undefined);
  });

  it("resets password via the 3-step email OTP verify -> verificationToken flow, revokes old sessions, and blocks replay", async () => {
    const suffix = `${Date.now().toString().slice(-6)}1`;
    const { user } = await createSyntheticUser(suffix);
    const activeSession = await sessionService.createSession(user);

    setOtpGeneratorForTesting(() => "482913");

    // Step 1: Request PASSWORD_RESET OTP
    const otpReq = new NextRequest("http://localhost/api/auth/otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        purpose: "PASSWORD_RESET",
      }),
    });
    const otpRes = await sendOtpPost(otpReq);
    expect(otpRes.status).toBe(200);

    // Step 2: Verify OTP (consumes the 6-digit OTP and returns verificationToken)
    const verifyReq = new NextRequest("http://localhost/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: user.email,
        channel: "EMAIL",
        purpose: "PASSWORD_RESET",
        code: "482913",
      }),
    });
    const verifyRes = await verifyOtpPost(verifyReq);
    expect(verifyRes.status).toBe(200);
    const verifyJson = await verifyRes.json();
    const verificationToken = verifyJson.data?.verificationToken as string;
    expect(verificationToken).toBeTruthy();

    // Step 3: Reset password using issued verificationToken
    const resetReq = new NextRequest("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient: user.email,
        channel: "email",
        verificationToken,
        password: "MockNew!456",
        confirmPassword: "MockNew!456",
      }),
    });
    const resetRes = await resetPasswordPost(resetReq);
    expect(resetRes.status).toBe(200);
    const resetJson = await resetRes.json();
    expect(resetJson.success).toBe(true);

    // Password actually updated in authRepository
    const updatedUser = await authRepository.findUserByIdentifier(user.email!);
    expect(updatedUser).not.toBeNull();
    await expect(verifyPassword("MockNew!456", updatedUser!.passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("MockOld!123", updatedUser!.passwordHash)).resolves.toBe(false);

    // Prior session was revoked upon password reset
    await expect(sessionService.verifyToken(activeSession.token)).resolves.toBeNull();

    // Replaying the same verificationToken is strictly blocked with 400
    const replayRes = await resetPasswordPost(
      new NextRequest("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: user.email,
          channel: "email",
          verificationToken,
          password: "MockAnother!789",
          confirmPassword: "MockAnother!789",
        }),
      }),
    );
    expect(replayRes.status).toBe(400);
  });

  it("resets password via the 3-step SMS mobile OTP verify -> verificationToken flow and rejects cross-user token reuse", async () => {
    const suffixA = `${Date.now().toString().slice(-6)}2`;
    const suffixB = `${Date.now().toString().slice(-6)}3`;
    const { user: userA } = await createSyntheticUser(suffixA);
    const { user: userB } = await createSyntheticUser(suffixB);

    setOtpGeneratorForTesting(() => "903157");

    // Step 1: Request SMS OTP with "+91 9870..." formatting (matching CountryCodeSelect input)
    const formattedPhone = `+91 ${userA.phone!.replace(/^\+91/, "")}`;
    const otpRes = await sendOtpPost(
      new NextRequest("http://localhost/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          purpose: "PASSWORD_RESET",
        }),
      }),
    );
    expect(otpRes.status).toBe(200);

    // Step 2: Verify SMS OTP
    const verifyRes = await verifyOtpPost(
      new NextRequest("http://localhost/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: formattedPhone,
          channel: "SMS",
          purpose: "PASSWORD_RESET",
          code: "903157",
        }),
      }),
    );
    expect(verifyRes.status).toBe(200);
    const verifyJson = await verifyRes.json();
    const verificationToken = verifyJson.data?.verificationToken as string;
    expect(verificationToken).toBeTruthy();

    // Cross-user token check: cannot reset userB's password using userA's token
    const crossUserRes = await resetPasswordPost(
      new NextRequest("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: userB.phone,
          channel: "phone",
          verificationToken,
          password: "MockNew!456",
          confirmPassword: "MockNew!456",
        }),
      }),
    );
    expect(crossUserRes.status).toBe(400);

    // Valid reset for userA succeeds
    const resetRes = await resetPasswordPost(
      new NextRequest("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: formattedPhone,
          channel: "phone",
          verificationToken,
          password: "MockMobile!789",
          confirmPassword: "MockMobile!789",
        }),
      }),
    );
    expect(resetRes.status).toBe(200);

    const updatedA = await authRepository.findUserByIdentifier(userA.phone!);
    await expect(verifyPassword("MockMobile!789", updatedA!.passwordHash)).resolves.toBe(true);
  });

  it("supports direct single-step /api/auth/reset-password with raw otp and prevents OTP reuse", async () => {
    const suffix = `${Date.now().toString().slice(-6)}4`;
    const { user } = await createSyntheticUser(suffix);

    setOtpGeneratorForTesting(() => "174208");

    await sendOtpPost(
      new NextRequest("http://localhost/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          purpose: "PASSWORD_RESET",
        }),
      }),
    );

    const directResetRes = await resetPasswordPost(
      new NextRequest("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: user.email,
          channel: "email",
          otp: "174208",
          password: "MockDirect!321",
          confirmPassword: "MockDirect!321",
        }),
      }),
    );
    expect(directResetRes.status).toBe(200);

    const reuseRes = await resetPasswordPost(
      new NextRequest("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: user.email,
          channel: "email",
          otp: "174208",
          password: "MockDirect!654",
          confirmPassword: "MockDirect!654",
        }),
      }),
    );
    expect(reuseRes.status).toBe(400);
  });
});
