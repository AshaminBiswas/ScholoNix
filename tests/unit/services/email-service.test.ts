import { describe, expect, it } from "vitest";
import {
  isValidEmailAddress,
  getSenderAddress,
  sendOtpEmail,
} from "@/server/notifications/email-service";
import { renderOtpEmailHtml } from "@/server/notifications/email-template";

describe("Email Service & Recipient Validation", () => {
  it("validates compliant email addresses across Gmail, Outlook, Yahoo, and custom business domains", () => {
    const validEmails = [
      "principal@gmail.com",
      "admin.scholonix@outlook.com",
      "director_west@yahoo.com",
      "registrar@sunrise-academy.edu.in",
      "contact+admissions@delhipublicschool.org",
      "info@scholonix.com",
    ];

    for (const email of validEmails) {
      expect(isValidEmailAddress(email)).toBe(true);
    }
  });

  it("strictly rejects malformed or invalid recipient email addresses", () => {
    const invalidEmails = [
      "",
      "plainaddress",
      "@missingusername.com",
      "username@.com",
      "username@com",
      "user name@domain.com",
      "user@domain..com",
    ];

    for (const email of invalidEmails) {
      expect(isValidEmailAddress(email)).toBe(false);
    }
  });

  it("resolves the verified ScholoNix sender address and never uses onboarding@resend.dev", () => {
    const originalEnv = { ...process.env };

    // Case 1: Standard verified production domain default
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_FROM_NAME;
    delete process.env.EMAIL_FROM;
    expect(getSenderAddress()).toBe("ScholoNix <noreply@scholonix.com>");

    // Case 2: Configured RESEND_FROM_EMAIL and RESEND_FROM_NAME
    process.env.RESEND_FROM_NAME = "ScholoNix Cloud";
    process.env.RESEND_FROM_EMAIL = "auth@scholonix.com";
    expect(getSenderAddress()).toBe("ScholoNix Cloud <auth@scholonix.com>");

    // Case 3: Replaces obsolete onboarding@resend.dev with verified domain
    process.env.EMAIL_FROM = "ScholoNix <onboarding@resend.dev>";
    delete process.env.RESEND_FROM_EMAIL;
    expect(getSenderAddress()).not.toContain("onboarding@resend.dev");
    expect(getSenderAddress()).toContain("scholonix.com");

    // Case 4: Handles quoted env values or accidental "Name <email>" inside RESEND_FROM_EMAIL
    process.env.RESEND_FROM_NAME = '"ScholoNix"';
    process.env.RESEND_FROM_EMAIL = '"ScholoNix <noreply@scholonix.com>"';
    expect(getSenderAddress()).toBe("ScholoNix <noreply@scholonix.com>");

    process.env = originalEnv;
  });

  it("renders the responsive ScholoNix OTP email template with 5-minute expiry and brand accents", () => {
    const html = renderOtpEmailHtml({
      code: "847291",
      purpose: "REGISTRATION",
      recipientName: "Dr. Vikram Seth",
      expiresInMinutes: 5,
    });

    // Contains the 6-digit code
    expect(html).toContain("847291");
    // Contains the 5-minute expiry countdown
    expect(html).toContain("5 minutes");
    // Contains brand footer and security advisory
    expect(html).toContain("ScholoNix");
    expect(html).toContain("If you didn't create a ScholoNix account");
    // Contains light-mode enforcement
    expect(html).toContain("color-scheme: light");
  });

  it("throws a clear error when attempting to send an OTP to an invalid recipient email address", async () => {
    await expect(
      sendOtpEmail({
        to: "invalid-email-address",
        code: "123456",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow(/Invalid recipient email address/);
  });

  it("successfully dispatches simulation in test mode for valid external recipients", async () => {
    const result = await sendOtpEmail({
      to: "external.user@gmail.com",
      code: "654321",
      purpose: "REGISTRATION",
      recipientName: "External User",
      expiresInMinutes: 5,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.simulated).toBe(true);
  });
});
