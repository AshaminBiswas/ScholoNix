import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendOtpSms,
  verifyFast2SmsOtp,
  verifyMsg91Otp,
  resendMsg91Otp,
} from "@/server/notifications/sms-service";

describe("Fast2SMS Dedicated Send OTP & Verify OTP API", () => {
  const originalEnv = { ...process.env };
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("dispatches OTP via Fast2SMS Send OTP API (https://docs.fast2sms.com/reference/send-otp)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "fast2sms";
    process.env.FAST2SMS_API_KEY = "mock_fast2sms_test_key_12345";
    process.env.FAST2SMS_OTP_ID = "otp_tpl_987";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        return: true,
        status_code: 200,
        request_id: "f2s_req_987654321",
        message: "OTP sent successfully",
      }),
    });

    const result = await sendOtpSms({
      phone: "+91 98765 43210",
      code: "544690",
      purpose: "REGISTRATION",
      expiresInMinutes: 5,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("f2s_req_987654321");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const call = mockFetch.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
    const [url, options] = call;
    expect(url).toBe("https://www.fast2sms.com/dev/otp/send");
    expect(options.method).toBe("POST");
    expect(options.headers.authorization).toBe("mock_fast2sms_test_key_12345");
    expect(options.headers.accept).toBe("application/json");
    expect(options.headers["content-type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      otp_id: "otp_tpl_987",
      mobile: "9876543210", // Clean 10-digit Indian mobile number
      otp: "544690",
      otp_expiry: 5,
      otp_length: 6,
    });
  });

  it("verifies OTP via Fast2SMS Verify OTP API (https://docs.fast2sms.com/reference/verify-otp)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.FAST2SMS_API_KEY = "mock_fast2sms_test_key_12345";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        return: true,
        status_code: 200,
        message: "OTP verified successfully",
      }),
    });

    const result = await verifyFast2SmsOtp({
      phone: "+91 62976 76908",
      code: "544690",
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.message).toBe("OTP verified successfully");

    const call = mockFetch.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
    const [url, options] = call;
    expect(url).toBe("https://www.fast2sms.com/dev/otp/verify");
    expect(options.method).toBe("POST");
    expect(options.headers.authorization).toBe("mock_fast2sms_test_key_12345");
    expect(options.headers.accept).toBe("application/json");
    expect(options.headers["content-type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      mobile: "6297676908",
      otp: "544690",
    });
  });

  it("handles Fast2SMS Send OTP API errors and parses error messages", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "fast2sms";
    process.env.FAST2SMS_API_KEY = "mock_fast2sms_test_key_12345";
    process.env.FAST2SMS_OTP_ID = "otp_tpl_987";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        return: false,
        status_code: 400,
        message: "The otp id field is required.",
      }),
    });

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "654321",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow("The otp id field is required.");
  });

  it("falls back to simulated OTP in development when FAST2SMS_OTP_ID is not set", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.SMS_PROVIDER = "fast2sms";
    process.env.FAST2SMS_API_KEY = "mock_fast2sms_test_key_12345";
    delete process.env.FAST2SMS_OTP_ID;
    delete process.env.FAST2SMS_TEMPLATE_ID;

    const result = await sendOtpSms({
      phone: "+919876543210",
      code: "777888",
      purpose: "REGISTRATION",
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.messageId).toContain("sim_sms_");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("strictly throws in production when FAST2SMS_OTP_ID is missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "fast2sms";
    process.env.FAST2SMS_API_KEY = "mock_fast2sms_test_key_12345";
    delete process.env.FAST2SMS_OTP_ID;
    delete process.env.FAST2SMS_TEMPLATE_ID;

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "777888",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow(/Fast2SMS Send OTP API requires FAST2SMS_OTP_ID/);
  });

  it("strictly throws in production when Fast2SMS API key is missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "fast2sms";
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.SMS_API_KEY;

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "777888",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow("Fast2SMS API key is not configured.");
  });

  it("validates 10-digit Indian phone number extraction and rejects invalid lengths", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "fast2sms";
    process.env.FAST2SMS_API_KEY = "valid_key_123456";

    await expect(
      sendOtpSms({
        phone: "12345", // too short
        code: "112233",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow(/Fast2SMS requires a valid 10-digit Indian mobile number/);
  });
});

describe("MSG91 SendOTP & Verify OTP API Integration", () => {
  const originalEnv = { ...process.env };
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("dispatches OTP via MSG91 SendOTP API (https://docs.msg91.com/otp/sendotp.openapi.yml)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "msg91";
    process.env.MSG91_AUTH_KEY = "live_msg91_authkey_12345";
    process.env.MSG91_OTP_TEMPLATE_ID = "661234567890abcdef";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        type: "success",
        message: "336573706439343336343538",
        request_id: "msg91_req_456789",
      }),
    });

    const result = await sendOtpSms({
      phone: "+91 98765 43210",
      code: "544690",
      purpose: "REGISTRATION",
      expiresInMinutes: 5,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg91_req_456789");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const call = mockFetch.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
    const [url, options] = call;
    expect(url).toContain("https://control.msg91.com/api/v5/otp");
    expect(url).toContain("mobile=919876543210");
    expect(url).toContain("template_id=661234567890abcdef");
    expect(url).toContain("otp=544690");
    expect(url).toContain("otp_expiry=5");
    expect(url).toContain("otp_length=6");

    expect(options.method).toBe("POST");
    expect(options.headers.authkey).toBe("live_msg91_authkey_12345");
    expect(options.headers["content-type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.Param1).toBe("ScholoNix");
  });

  it("verifies OTP via MSG91 Verify OTP API (https://docs.msg91.com/otp/verify-otp.openapi.yml)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.MSG91_AUTH_KEY = "live_msg91_authkey_12345";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        type: "success",
        message: "OTP verified success",
      }),
    });

    const result = await verifyMsg91Otp({
      phone: "+91 62976 76908",
      code: "544690",
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.message).toBe("OTP verified success");

    const call = mockFetch.mock.calls[0] as [string, { method: string; headers: Record<string, string> }];
    const [url, options] = call;
    expect(url).toContain("https://control.msg91.com/api/v5/otp/verify");
    expect(url).toContain("mobile=916297676908");
    expect(url).toContain("otp=544690");
    expect(options.headers.authkey).toBe("live_msg91_authkey_12345");
  });

  it("handles MSG91 wrong OTP response (returns type: error with HTTP 200)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.MSG91_AUTH_KEY = "live_msg91_authkey_12345";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        type: "error",
        message: "OTP not match",
      }),
    });

    const result = await verifyMsg91Otp({
      phone: "+91 62976 76908",
      code: "000000",
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(false);
    expect(result.message).toBe("OTP not match");
  });

  it("handles MSG91 SendOTP error responses in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "msg91";
    process.env.MSG91_AUTH_KEY = "live_msg91_authkey_12345";
    process.env.MSG91_OTP_TEMPLATE_ID = "invalid_tpl";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        type: "error",
        message: "The provided flow ID or template ID is invalid.",
      }),
    });

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "654321",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow("The provided flow ID or template ID is invalid.");
  });

  it("falls back to simulated OTP in development when MSG91 authkey is missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.SMS_PROVIDER = "msg91";
    delete process.env.MSG91_AUTH_KEY;
    delete process.env.SMS_API_KEY;

    const result = await sendOtpSms({
      phone: "+919876543210",
      code: "777888",
      purpose: "REGISTRATION",
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.messageId).toContain("sim_sms_");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
