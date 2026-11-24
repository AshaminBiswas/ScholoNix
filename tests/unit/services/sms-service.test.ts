import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendOtpSms,
  verifyMsg91Otp,
} from "@/server/notifications/sms-service";

describe("Renflair SMS API Integration (https://sms.renflair.in/V1.php)", () => {
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

  it("dispatches OTP via Renflair SMS API with valid parameters", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "renflair";
    process.env.RENFLAIR_API_KEY = "mock_renflair_test_key_12345";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: "success",
          msg: "SMS sent successfully",
          request_id: "rf_req_987654321",
        }),
    });

    const result = await sendOtpSms({
      phone: "+91 98765 43210",
      code: "544690",
      purpose: "REGISTRATION",
      expiresInMinutes: 5,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("rf_req_987654321");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const call = mockFetch.mock.calls[0] as [string, { method: string }];
    const [url, options] = call;
    const parsedUrl = new URL(url);

    expect(parsedUrl.origin).toBe("https://sms.renflair.in");
    expect(parsedUrl.pathname).toBe("/V1.php");
    expect(parsedUrl.searchParams.get("API")).toBe("mock_renflair_test_key_12345");
    expect(parsedUrl.searchParams.get("PHONE")).toBe("9876543210");
    expect(parsedUrl.searchParams.get("OTP")).toBe("544690");
    expect(options.method).toBe("GET");
  });

  it("handles plain text success response from Renflair API", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "renflair";
    process.env.RENFLAIR_API_KEY = "mock_renflair_test_key_12345";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "SMS sent successfully. Message ID: 123456",
    });

    const result = await sendOtpSms({
      phone: "+91 62976 76908",
      code: "544690",
      purpose: "LOGIN",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain("renflair_");
  });

  it("handles Renflair API JSON error responses", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "renflair";
    process.env.RENFLAIR_API_KEY = "mock_renflair_test_key_12345";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          status: "error",
          message: "Invalid API Key provided",
        }),
    });

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "654321",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow("Invalid API Key provided");
  });

  it("handles Renflair API plain text error responses", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "renflair";
    process.env.RENFLAIR_API_KEY = "mock_renflair_test_key_12345";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Error: Gateway Timeout or Route Down",
    });

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "654321",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow(/Gateway Timeout/);
  });

  it("falls back to simulated OTP in development when RENFLAIR_API_KEY is not configured", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.SMS_PROVIDER = "renflair";
    delete process.env.RENFLAIR_API_KEY;
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

  it("strictly throws in production when Renflair API key is missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "renflair";
    delete process.env.RENFLAIR_API_KEY;
    delete process.env.SMS_API_KEY;

    await expect(
      sendOtpSms({
        phone: "+919876543210",
        code: "777888",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow("Renflair API key is not configured.");
  });

  it("validates 10-digit Indian phone number extraction and rejects invalid lengths", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.SMS_PROVIDER = "renflair";
    process.env.RENFLAIR_API_KEY = "mock_renflair_test_key_12345";

    await expect(
      sendOtpSms({
        phone: "12345", // too short
        code: "112233",
        purpose: "REGISTRATION",
      }),
    ).rejects.toThrow(/Renflair requires a valid 10-digit Indian mobile number/);
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
    process.env.MSG91_AUTH_KEY = "mock_msg91_authkey_12345";
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
    expect(options.headers.authkey).toBe("mock_msg91_authkey_12345");
    expect(options.headers["content-type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.Param1).toBe("ScholoNix");
  });

  it("verifies OTP via MSG91 Verify OTP API (https://docs.msg91.com/otp/verify-otp.openapi.yml)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.MSG91_AUTH_KEY = "mock_msg91_authkey_12345";

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
    expect(options.headers.authkey).toBe("mock_msg91_authkey_12345");
  });

  it("handles MSG91 wrong OTP response (returns type: error with HTTP 200)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.MSG91_AUTH_KEY = "mock_msg91_authkey_12345";

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
    process.env.MSG91_AUTH_KEY = "mock_msg91_authkey_12345";
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
