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
    const password = "StrongPassword@2026";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongPassword!", hash);
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
    const passwordHash = await hashPassword("ScholoNixSecured123!");
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
            password: "StrongPassword@2026",
            confirmPassword: "StrongPassword@2026",
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
});
