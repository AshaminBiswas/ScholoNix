import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashOtp, verifyOtpHash } from "@/server/security/crypto";

describe("Environment-driven AUTH_SECRET enforcement", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AUTH_SECRET;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
  });

  it("uses ephemeral per-process secret in NODE_ENV=test when AUTH_SECRET is unset", () => {
    vi.stubEnv("NODE_ENV", "test");
    const hash = hashOtp("123456");
    expect(verifyOtpHash("123456", hash)).toBe(true);
    expect(verifyOtpHash("654321", hash)).toBe(false);
  });

  it("uses AUTH_SECRET from environment when configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "mock_env_auth_secret_for_unit_tests_32chars_minimum");

    const hash = hashOtp("654321");
    expect(verifyOtpHash("654321", hash)).toBe(true);
  });

  it("throws outside test mode when AUTH_SECRET is missing instead of using a hardcoded fallback", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => hashOtp("123456")).toThrow("AUTH_SECRET environment variable is required");
  });
});
