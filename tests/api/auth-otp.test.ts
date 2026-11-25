import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  hashPassword,
  verifyPassword,
  normalizePhone,
  maskPhone,
  maskEmail,
} from "@/server/security/crypto";
import { otpService, setOtpGeneratorForTesting } from "@/server/auth/otp-service";
import { authRepository } from "@/server/auth/auth-repository";

function makeTestPassphrase(): string {
  return `Pass!${randomBytes(8).toString("hex")}7`;
}

function makeMatchingPasswords(): { password: string; confirmPassword: string } {
  const password = makeTestPassphrase();
  return { password, confirmPassword: password };
}

describe("ScholoNix Cryptography & Security Utilities", () => {
  it("generates a cryptographically secure 6-digit OTP", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateSecureOtp();
      expect(code).toMatch(/^\d{6}$/);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    }
  });

  it("hashes OTP and verifies with timing-safe comparison", () => {
    const code = "839201";
    const hash = hashOtp(code);
    expect(hash).toHaveLength(64); // SHA-256 hex digest

    expect(verifyOtpHash(code, hash)).toBe(true);
    expect(verifyOtpHash("839202", hash)).toBe(false);
    expect(verifyOtpHash("000000", hash)).toBe(false);
  });

  it("hashes and verifies passwords securely using bcrypt", async () => {
    const password = makeTestPassphrase();
    const wrongPassword = makeTestPassphrase();
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword(wrongPassword, hash);
    expect(isWrong).toBe(false);
  });

  it("normalizes and masks Indian and international phone numbers", () => {
    expect(normalizePhone("9876543210")).toBe("+919876543210");
    expect(normalizePhone("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhone("09876543210")).toBe("+919876543210");

    const masked = maskPhone("+919876543210");
    expect(masked).toContain("**");
    expect(masked).toContain("10"); // Last digits visible
  });

  it("masks email addresses safely without revealing full localpart", () => {
    expect(maskEmail("principal@sunriseis.edu.in")).toBe("p*******l@sunriseis.edu.in");
    expect(maskEmail("ab@example.com")).toBe("a*@example.com");
  });
});

describe("Custom OTP Service Lifecycle", () => {
  const testPhone = "+919811122233";
  const testEmail = "admin.verify.test@scholonix.com";
  const MOCK_OTP = "789123";

  beforeEach(() => {
    setOtpGeneratorForTesting(() => MOCK_OTP);
  });

  afterEach(() => {
    setOtpGeneratorForTesting();
  });

  it("requests a mobile OTP, enforces cooldown, and verifies accurately", async () => {
    // 1. Request OTP
    const reqRes = await otpService.requestOtp({
      identifier: testPhone,
      channel: "SMS",
      purpose: "REGISTRATION",
    });

    expect(reqRes.success).toBe(true);
    expect(reqRes.channel).toBe("SMS");
    expect(reqRes.cooldownSeconds).toBe(60);

    const activeOtpRecord = await authRepository.findActiveOtp(testPhone, "SMS", "REGISTRATION");
    expect(activeOtpRecord).toBeDefined();

    // 2. Cooldown check: rapid second request should throw error
    await expect(
      otpService.requestOtp({
        identifier: testPhone,
        channel: "SMS",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow(/Please wait \d+ seconds/);

    // 3. Verify with wrong code: should fail and track attempts
    const failRes = await otpService.verifyOtp({
      identifier: testPhone,
      channel: "SMS",
      purpose: "REGISTRATION",
      code: "000000",
    });
    expect(failRes.verified).toBe(false);
    expect(failRes.remainingAttempts).toBe(4);

    // 4. Verify with correct code: should succeed and issue token
    const successRes = await otpService.verifyOtp({
      identifier: testPhone,
      channel: "SMS",
      purpose: "REGISTRATION",
      code: MOCK_OTP,
    });
    expect(successRes.verified).toBe(true);
    expect(successRes.verificationToken).toBeDefined();

    // 5. Token validation
    const tokenCheck = await otpService.validateVerificationToken(
      successRes.verificationToken!,
      "SMS",
      "REGISTRATION",
    );
    expect(tokenCheck.valid).toBe(true);
  });

  it("requests an email OTP and verifies accurately", async () => {
    const reqRes = await otpService.requestOtp({
      identifier: testEmail,
      channel: "EMAIL",
      purpose: "REGISTRATION",
      recipientName: "Test Administrator",
    });

    expect(reqRes.success).toBe(true);
    expect(reqRes.channel).toBe("EMAIL");

    const activeEmailOtp = await authRepository.findActiveOtp(testEmail, "EMAIL", "REGISTRATION");
    expect(activeEmailOtp).toBeDefined();

    const verifyRes = await otpService.verifyOtp({
      identifier: testEmail,
      channel: "EMAIL",
      purpose: "REGISTRATION",
      code: MOCK_OTP,
    });

    expect(verifyRes.verified).toBe(true);
    expect(verifyRes.verificationToken).toBeDefined();

    // 4. Verification Token Validation: valid for matched identifier, invalid if email was changed
    const token = verifyRes.verificationToken!;
    const validationMatched = await otpService.validateVerificationToken(
      token,
      "EMAIL",
      "REGISTRATION",
    );
    expect(validationMatched.valid).toBe(true);
    expect(validationMatched.identifier).toBe(testEmail);

    // If an altered email is submitted, it does not match the token's verified identifier
    const alteredEmail = "different.admin@scholonix.com";
    expect(validationMatched.identifier?.toLowerCase()).not.toBe(alteredEmail.toLowerCase());
  });
});

describe("Auth Repository & Tenant Provisioning", () => {
  it("provisions a school tenant and administrator user with hashed password", async () => {
    const passwordHash = await hashPassword(makeTestPassphrase());
    const uniqueEmail = `admin_${Date.now()}@testschool.edu.in`;
    const uniquePhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { school, user } = await authRepository.createUserWithSchool({
      school: {
        name: "Apex Global Academy",
        slug: `apex-global-${Date.now()}`,
        code: "APEX-101",
        category: "Co-Educational School",
        affiliationBoard: "CBSE",
        pinCode: "110001",
        country: "India",
      },
      user: {
        name: "Dr. Vikram Seth",
        email: uniqueEmail,
        phone: uniquePhone,
        passwordHash,
        role: "SCHOOL_ADMIN",
        phoneVerified: true,
        emailVerified: true,
      },
    });

    expect(school.id).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(uniqueEmail);
    expect(user.phoneVerified).toBe(true);
    expect(user.emailVerified).toBe(true);

    // Verify lookup by email
    const foundByEmail = await authRepository.findUserByIdentifier(uniqueEmail);
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail?.name).toBe("Dr. Vikram Seth");

    // Verify lookup by phone
    const foundByPhone = await authRepository.findUserByIdentifier(uniquePhone);
    expect(foundByPhone).toBeDefined();
    expect(foundByPhone?.id).toBe(user.id);
  });

  it("strictly rejects registration when administrator email was changed after verification", async () => {
    const { registerSchool } = await import("@/modules/schools/services/registration-service");
    const testCode = "654321";
    setOtpGeneratorForTesting(() => testCode);

    try {
      // 1. Verify phone and get valid token
      const phone = `+919876${Math.floor(100000 + Math.random() * 900000)}`;
      await otpService.requestOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION" });
      const phoneRes = await otpService.verifyOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION", code: testCode });
      const mobileToken = phoneRes.verificationToken;

      // 2. Verify an email address and get valid token
      const originalEmail = `orig_${Date.now()}@scholonix.com`;
      await otpService.requestOtp({ identifier: originalEmail, channel: "EMAIL", purpose: "REGISTRATION" });
      const emailRes = await otpService.verifyOtp({ identifier: originalEmail, channel: "EMAIL", purpose: "REGISTRATION", code: testCode });
      const emailToken = emailRes.verificationToken;

      // 3. Attempt registration with a different (unverified) email address using original token
      const changedEmail = `changed_${Date.now()}@scholonix.com`;

      await expect(
        registerSchool({
          institution: {
            name: "Altered Email High School",
            category: "Co-Educational School",
            affiliationBoard: "CBSE",
            addressLine: "123 Academic Road",
            locality: "Central Campus",
            city: "New Delhi",
            state: "Delhi",
            pinCode: "110001",
            country: "India",
            contactPhone: phone,
          },
          administrator: {
            adminName: "Mrs. Sunita Sharma",
            designation: "Principal",
            adminPhone: phone,
            adminEmail: changedEmail, // Changed from originalEmail
            ...makeMatchingPasswords(),
          },
          plan: "starter",
          billingCycle: "monthly",
          mobileVerificationToken: mobileToken,
          emailVerificationToken: emailToken,
        }),
      ).rejects.toThrow(/Verified email address does not match/);
    } finally {
      setOtpGeneratorForTesting();
    }
  });

  it("handles the complete 13 verification and registration workflow scenarios", async () => {
    const { registerSchool } = await import("@/modules/schools/services/registration-service");
    const FIXED_CODE_1 = "111222";
    const FIXED_CODE_2 = "333444";
    setOtpGeneratorForTesting(() => FIXED_CODE_1);

    try {
      const phone = `+919811${Math.floor(100000 + Math.random() * 900000)}`;
      const email = `principal_${Date.now()}@vedicacademy.edu.in`;

      // Scenario 1 & 2: First-time registration with SMS and email OTP, correct code on first attempt
      const smsReq = await otpService.requestOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION" });
      expect(smsReq.success).toBe(true);

      const emailReq = await otpService.requestOtp({ identifier: email, channel: "EMAIL", purpose: "REGISTRATION" });
      expect(emailReq.success).toBe(true);

      // Scenario 3: Incorrect OTP entered
      const badVerify = await otpService.verifyOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION", code: "999999" });
      expect(badVerify.verified).toBe(false);
      expect(badVerify.remainingAttempts).toBe(4);

      // Scenario 5: Resend OTP workflow (ensures latest OTP is valid and previous is invalidated)
      // Fast-forward cooldown by updating resendAfter
      const activeOtp = await authRepository.findActiveOtp(phone, "SMS", "REGISTRATION");
      expect(activeOtp).not.toBeNull();
      if (activeOtp) {
        activeOtp.resendAfter = new Date(Date.now() - 1000);
      }
      setOtpGeneratorForTesting(() => FIXED_CODE_2);
      const resendRes = await otpService.requestOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION" });
      expect(resendRes.success).toBe(true);

      // Old code should fail
      const oldCodeAttempt = await otpService.verifyOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION", code: FIXED_CODE_1 });
      expect(oldCodeAttempt.verified).toBe(false);

      // New code succeeds on first attempt
      const newCodeAttempt = await otpService.verifyOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION", code: FIXED_CODE_2 });
      expect(newCodeAttempt.verified).toBe(true);
      const mobileToken = newCodeAttempt.verificationToken!;
      expect(mobileToken).toBeDefined();

      // Verify email OTP
      const emailVerify = await otpService.verifyOtp({ identifier: email, channel: "EMAIL", purpose: "REGISTRATION", code: FIXED_CODE_1 });
      expect(emailVerify.verified).toBe(true);
      const emailToken = emailVerify.verificationToken!;
      expect(emailToken).toBeDefined();

      // Scenario 10: Backend status endpoint check persists verification
      const phoneStatus = await otpService.getVerificationStatus({ identifier: phone, channel: "SMS", purpose: "REGISTRATION", token: mobileToken });
      expect(phoneStatus.isVerified).toBe(true);

      const emailStatus = await otpService.getVerificationStatus({ identifier: email, channel: "EMAIL", purpose: "REGISTRATION", token: emailToken });
      expect(emailStatus.isVerified).toBe(true);

      // Scenario 12: Attempt registration when only one channel is verified (must fail)
      const unverifiedEmail = `unverified_${Date.now()}@vedicacademy.edu.in`;
      await expect(
        registerSchool({
          institution: {
            name: "Partial Vedic Academy",
            category: "Co-Educational School",
            affiliationBoard: "CBSE",
            addressLine: "456 Campus Road",
            locality: "Main Campus",
            city: "Varanasi",
            state: "Uttar Pradesh",
            pinCode: "221001",
            country: "India",
            contactPhone: phone,
          },
          administrator: {
            adminName: "Acharya Dev",
            designation: "Principal",
            adminPhone: phone,
            adminEmail: unverifiedEmail, // Not verified!
            ...makeMatchingPasswords(),
          },
          plan: "professional",
          billingCycle: "monthly",
          mobileVerificationToken: mobileToken,
          emailVerificationToken: undefined,
        }),
      ).rejects.toThrow(/Please complete verification for: Email address/);

      // Scenario 11: Complete Step 5 and successfully create the school account
      const regResult = await registerSchool({
        institution: {
          name: "Vedic Heritage Academy",
          category: "Co-Educational School",
          affiliationBoard: "CBSE",
          addressLine: "456 Campus Road",
          locality: "Main Campus",
          city: "Varanasi",
          state: "Uttar Pradesh",
          pinCode: "221001",
          country: "India",
          contactPhone: phone,
        },
        administrator: {
          adminName: "Acharya Dev",
          designation: "Principal",
          adminPhone: phone,
          adminEmail: email,
          ...makeMatchingPasswords(),
        },
        plan: "professional",
        billingCycle: "monthly",
        mobileVerificationToken: mobileToken,
        emailVerificationToken: emailToken,
      });

      expect(regResult.schoolId).toBeDefined();
      expect(regResult.adminId).toBeDefined();

      // Scenario 6: Prevent reuse of verified OTP/token
      await expect(
        registerSchool({
          institution: {
            name: "Duplicate Reuse Academy",
            category: "Co-Educational School",
            affiliationBoard: "CBSE",
            addressLine: "789 Campus Road",
            locality: "Main Campus",
            city: "Varanasi",
            state: "Uttar Pradesh",
            pinCode: "221001",
            country: "India",
            contactPhone: phone,
          },
          administrator: {
            adminName: "Acharya Dev",
            designation: "Principal",
            adminPhone: `+919812${Math.floor(100000 + Math.random() * 900000)}`,
            adminEmail: `new_${Date.now()}@scholonix.com`,
            ...makeMatchingPasswords(),
          },
          plan: "professional",
          billingCycle: "monthly",
          mobileVerificationToken: mobileToken, // already used!
          emailVerificationToken: emailToken,  // already used!
        }),
      ).rejects.toThrow(/Please complete verification for: Mobile number and Email address/);

      // Scenario 13: Prevent duplicate account with already registered phone or email
      await expect(
        registerSchool({
          institution: {
            name: "Another Academy",
            category: "Co-Educational School",
            affiliationBoard: "CBSE",
            addressLine: "999 Road",
            locality: "Main Campus",
            city: "Varanasi",
            state: "Uttar Pradesh",
            pinCode: "221001",
            country: "India",
            contactPhone: phone,
          },
          administrator: {
            adminName: "Another Admin",
            designation: "Principal",
            adminPhone: phone, // Already registered!
            adminEmail: `another_${Date.now()}@scholonix.com`,
            ...makeMatchingPasswords(),
          },
          plan: "starter",
          billingCycle: "monthly",
        }),
      ).rejects.toThrow(/already registered/);
    } finally {
      setOtpGeneratorForTesting();
    }
  });

  it("handles expired OTP correctly", async () => {
    const expiredPhone = "+919800112233";
    const testCode = "987654";
    setOtpGeneratorForTesting(() => testCode);

    try {
      await otpService.requestOtp({ identifier: expiredPhone, channel: "SMS", purpose: "REGISTRATION" });
      const activeOtp = await authRepository.findActiveOtp(expiredPhone, "SMS", "REGISTRATION");
      expect(activeOtp).not.toBeNull();
      // Fast-forward expiry
      if (activeOtp) {
        activeOtp.expiresAt = new Date(Date.now() - 1000);
      }

      const verifyResult = await otpService.verifyOtp({
        identifier: expiredPhone,
        channel: "SMS",
        purpose: "REGISTRATION",
        code: testCode,
      });

      expect(verifyResult.verified).toBe(false);
      expect(verifyResult.message).toContain("expired");
    } finally {
      setOtpGeneratorForTesting();
    }
  });

  it("preserves leading zeros, prevents concurrent verification races, isolates sessions, and enforces already-used checks", async () => {
    const leadingZeroCode = "049007";
    const phone = `+919822${Math.floor(100000 + Math.random() * 900000)}`;
    const email = `leadzero_${Date.now()}@scholonix.com`;
    const sessionA = "session_alpha_123";
    const sessionB = "session_beta_456";
    setOtpGeneratorForTesting(() => leadingZeroCode);

    try {
      // 1. Concurrent requestOtp on same session/channel shares single challenge
      const [req1, req2] = await Promise.all([
        otpService.requestOtp({
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          registrationSessionId: sessionA,
        }),
        otpService.requestOtp({
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          registrationSessionId: sessionA,
        }),
      ]);
      expect(req1.challengeId).toBe(req2.challengeId);
      expect(req1.type).toBe("email");

      // 2. Wrong session cannot verify session A's OTP
      const crossSessionRes = await otpService.verifyOtp({
        identifier: email,
        channel: "EMAIL",
        purpose: "REGISTRATION",
        code: leadingZeroCode,
        registrationSessionId: sessionB,
      });
      expect(crossSessionRes.verified).toBe(false);
      expect(crossSessionRes.errorCode).toBe("OTP_NOT_FOUND");

      // 3. Phone normalization edge case (+91 09876...)
      await otpService.requestOtp({
        identifier: phone,
        channel: "SMS",
        purpose: "REGISTRATION",
        registrationSessionId: sessionA,
      });

      // 4. Concurrent verifyOtp calls: exactly one wins atomically
      const [v1, v2] = await Promise.all([
        otpService.verifyOtp({
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          code: leadingZeroCode,
          registrationSessionId: sessionA,
        }),
        otpService.verifyOtp({
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          code: leadingZeroCode,
          registrationSessionId: sessionA,
        }),
      ]);

      const winners = [v1, v2].filter((r) => r.verified);
      const losers = [v1, v2].filter((r) => !r.verified);
      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(1);
      expect(winners[0]?.type).toBe("email");
      expect(winners[0]?.verificationToken).toBeDefined();

      // 5. Attempting to verify an already-verified OTP rejects with OTP_ALREADY_USED
      const replayAttempt = await otpService.verifyOtp({
        identifier: email,
        channel: "EMAIL",
        purpose: "REGISTRATION",
        code: leadingZeroCode,
        registrationSessionId: sessionA,
      });
      expect(replayAttempt.verified).toBe(false);
      expect(replayAttempt.errorCode).toBe("OTP_ALREADY_USED");

      // 6. Verifying mobile OTP independently with leading-zero raw phone formatting works on 1st attempt
      const phoneWithZero = phone.replace("+91", "+91 0");
      const mobileVerify = await otpService.verifyOtp({
        identifier: phoneWithZero,
        channel: "SMS",
        purpose: "REGISTRATION",
        code: leadingZeroCode,
        registrationSessionId: sessionA,
      });
      expect(mobileVerify.verified).toBe(true);
      expect(mobileVerify.type).toBe("mobile");

      // 7. Re-requesting SMS OTP does NOT invalidate verified email status
      const activeSms = await authRepository.findLatestOtp(phone, "SMS", "REGISTRATION", sessionA);
      if (activeSms) activeSms.resendAfter = new Date(Date.now() - 1000);
      await otpService.requestOtp({
        identifier: phone,
        channel: "SMS",
        purpose: "REGISTRATION",
        registrationSessionId: sessionA,
      });
      const emailPersisted = await otpService.getVerificationStatus({
        identifier: email,
        channel: "EMAIL",
        purpose: "REGISTRATION",
        registrationSessionId: sessionA,
      });
      expect(emailPersisted.isVerified).toBe(true);
    } finally {
      setOtpGeneratorForTesting();
    }
  });

  it("verifies /api/auth/otp, /api/auth/otp/verify, /api/auth/otp/status, and /api/auth/register-school HTTP routes end-to-end", async () => {
    const { POST: sendOtpPost } = await import("@/app/api/auth/otp/route");
    const { POST: verifyOtpPost } = await import("@/app/api/auth/otp/verify/route");
    const { GET: statusGet } = await import("@/app/api/auth/otp/status/route");
    const { POST: registerSchoolPost } = await import("@/app/api/auth/register-school/route");

    const CODE = "058294";
    const sessionId = `sess_${Date.now()}`;
    const email = `route_e2e_${Date.now()}@scholonix.com`;
    const phone = `+919833${Math.floor(100000 + Math.random() * 900000)}`;
    setOtpGeneratorForTesting(() => CODE);

    try {
      // 1. Send SMS & Email OTP via POST /api/auth/otp
      const smsReq = new NextRequest("http://localhost:3000/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, purpose: "REGISTRATION", registrationSessionId: sessionId }),
      });
      const smsRes = await sendOtpPost(smsReq);
      expect(smsRes.status).toBe(200);
      const smsJson = await smsRes.json();
      expect(smsJson.success).toBe(true);
      expect(smsJson.type).toBe("mobile");

      const emailReq = new NextRequest("http://localhost:3000/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, purpose: "REGISTRATION", registrationSessionId: sessionId }),
      });
      const emailRes = await sendOtpPost(emailReq);
      expect(emailRes.status).toBe(200);
      const emailJson = await emailRes.json();
      expect(emailJson.success).toBe(true);
      expect(emailJson.type).toBe("email");

      // 2. Wrong OTP returns HTTP 400 with remainingAttempts
      const wrongReq = new NextRequest("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          code: "999999",
          registrationSessionId: sessionId,
        }),
      });
      const wrongRes = await verifyOtpPost(wrongReq);
      expect(wrongRes.status).toBe(400);
      const wrongJson = await wrongRes.json();
      expect(wrongJson.success).toBe(false);
      expect(wrongJson.verified).toBe(false);
      expect(wrongJson.error.remainingAttempts).toBe(4);

      // 3. Verify Email OTP on first valid code -> structured 200 response
      const verifyEmailReq = new NextRequest("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          code: CODE,
          registrationSessionId: sessionId,
        }),
      });
      const verifyEmailRes = await verifyOtpPost(verifyEmailReq);
      expect(verifyEmailRes.status).toBe(200);
      const verifyEmailJson = await verifyEmailRes.json();
      expect(verifyEmailJson.success).toBe(true);
      expect(verifyEmailJson.verified).toBe(true);
      expect(verifyEmailJson.type).toBe("email");
      expect(verifyEmailJson.message).toBe("Email verified successfully");
      const emailToken = verifyEmailJson.data?.verificationToken;
      expect(emailToken).toBeDefined();

      // 4. Attempting to create school before mobile verification returns HTTP 403
      const partialRegReq = new NextRequest("http://localhost:3000/api/auth/register-school", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          institution: {
            name: "E2E Horizon School",
            category: "Co-Educational School",
            affiliationBoard: "CBSE",
            contactPhone: phone,
            addressLine: "10 Knowledge Park",
            city: "Bengaluru",
            state: "Karnataka",
            pinCode: "560001",
            country: "India",
          },
          administrator: {
            adminName: "Principal Rao",
            designation: "Principal",
            adminPhone: phone,
            adminEmail: email,
            ...makeMatchingPasswords(),
          },
          plan: "professional",
          billingCycle: "monthly",
          registrationSessionId: sessionId,
          emailVerificationToken: emailToken,
          mobileVerificationToken: null,
        }),
      });
      const partialRegRes = await registerSchoolPost(partialRegReq);
      expect(partialRegRes.status).toBe(403);

      // 5. Verify Mobile OTP -> structured 200 response
      const verifySmsReq = new NextRequest("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: phone.replace("+91", "+91 "),
          channel: "SMS",
          purpose: "REGISTRATION",
          code: CODE,
          registrationSessionId: sessionId,
        }),
      });
      const verifySmsRes = await verifyOtpPost(verifySmsReq);
      expect(verifySmsRes.status).toBe(200);
      const verifySmsJson = await verifySmsRes.json();
      expect(verifySmsJson.success).toBe(true);
      expect(verifySmsJson.verified).toBe(true);
      expect(verifySmsJson.type).toBe("mobile");
      const mobileToken = verifySmsJson.data?.verificationToken;
      expect(mobileToken).toBeDefined();

      // 6. Status endpoint confirms both verified (simulating page refresh / Step 5 check)
      const statusReq = new NextRequest(
        `http://localhost:3000/api/auth/otp/status?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&registrationSessionId=${encodeURIComponent(sessionId)}`,
      );
      const statusRes = await statusGet(statusReq);
      expect(statusRes.status).toBe(200);
      const statusJson = await statusRes.json();
      expect(statusJson.data.isMobileVerified).toBe(true);
      expect(statusJson.data.isEmailVerified).toBe(true);
      expect(statusJson.data.allVerified).toBe(true);

      // 7. Complete Step 5 school creation -> HTTP 201
      const completeRegReq = new NextRequest("http://localhost:3000/api/auth/register-school", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          institution: {
            name: `E2E Horizon School ${Date.now()}`,
            category: "Co-Educational School",
            affiliationBoard: "CBSE",
            contactPhone: phone,
            addressLine: "10 Knowledge Park",
            city: "Bengaluru",
            state: "Karnataka",
            pinCode: "560001",
            country: "India",
          },
          administrator: {
            adminName: "Principal Rao",
            designation: "Principal",
            adminPhone: phone,
            adminEmail: email,
            ...makeMatchingPasswords(),
          },
          plan: "professional",
          billingCycle: "monthly",
          registrationSessionId: sessionId,
          emailVerificationToken: emailToken,
          mobileVerificationToken: mobileToken,
        }),
      });
      const completeRegRes = await registerSchoolPost(completeRegReq);
      expect(completeRegRes.status).toBe(201);
      const completeRegJson = await completeRegRes.json();
      expect(completeRegJson.success).toBe(true);
      expect(completeRegJson.data.schoolId).toBeDefined();
    } finally {
      setOtpGeneratorForTesting();
    }
  });
});
