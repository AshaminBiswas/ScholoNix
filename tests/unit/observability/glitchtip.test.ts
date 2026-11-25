import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGlitchTipInitOptions,
  extractEnvelopeDsn,
  parseGlitchTipDsn,
  scrubTelemetryEvent,
} from "@/lib/observability/glitchtip-config";

const mockScope = {
  setTag: vi.fn(),
  setUser: vi.fn(),
  setExtras: vi.fn(),
};

const mockSentry = {
  withScope: vi.fn((callback: (scope: typeof mockScope) => void) => callback(mockScope)),
  captureException: vi.fn(),
};

vi.mock("@sentry/nextjs", () => ({
  withScope: mockSentry.withScope,
  captureException: mockSentry.captureException,
}));

const MOCK_DSN = "https://mock_key_value@app.glitchtip.example/99999";

describe("GlitchTip / Sentry SDK configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_GLITCHTIP_TRACES_SAMPLE_RATE;
    mockScope.setTag = vi.fn();
    mockScope.setUser = vi.fn();
    mockScope.setExtras = vi.fn();
    mockSentry.withScope = vi.fn((cb: (scope: typeof mockScope) => void) => cb(mockScope));
    mockSentry.captureException = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("parses valid GlitchTip DSN strings and rejects invalid ones", () => {
    expect(parseGlitchTipDsn(undefined)).toBeNull();
    expect(parseGlitchTipDsn("")).toBeNull();
    expect(parseGlitchTipDsn("https://app.glitchtip.example/99999")).toBeNull();
    expect(parseGlitchTipDsn("ftp://mock_key@app.glitchtip.example/99999")).toBeNull();

    const parsed = parseGlitchTipDsn(` "${MOCK_DSN}" `);
    expect(parsed).toEqual({
      dsn: MOCK_DSN,
      protocol: "https:",
      host: "app.glitchtip.example",
      projectId: "99999",
      ingestUrl: "https://app.glitchtip.example/api/99999/envelope/",
    });
  });

  it("extracts envelope header DSN safely", () => {
    const validEnvelope = `${JSON.stringify({ event_id: "123", dsn: MOCK_DSN })}\n{"type":"event"}\n{}`;
    expect(extractEnvelopeDsn(validEnvelope)).toBe(MOCK_DSN);
    expect(extractEnvelopeDsn("not-json\n{}")).toBeNull();
    expect(extractEnvelopeDsn("")).toBeNull();
  });

  it("scrubs sensitive request headers, cookies, and user PII before sending", () => {
    const sanitized = scrubTelemetryEvent({
      request: {
        headers: {
          authorization: "Bearer secret_token_value",
          cookie: "session=abc",
          "user-agent": "ScholoNixTest/1.0",
        },
        cookies: { session: "abc" },
      },
      user: {
        id: "user_1",
        email: "admin@school.example",
        username: "principal",
        ip_address: "203.0.113.10",
      },
    });

    expect(sanitized.request?.headers).toEqual({
      authorization: "[REDACTED]",
      cookie: "[REDACTED]",
      "user-agent": "ScholoNixTest/1.0",
    });
    expect(sanitized.request?.cookies).toBeUndefined();
    expect(sanitized.user).toEqual({ id: "user_1" });
  });

  it("builds low-overhead options disabled in test and enabled with valid DSN in prod", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(buildGlitchTipInitOptions(MOCK_DSN).enabled).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    const prodOptions = buildGlitchTipInitOptions(MOCK_DSN);
    expect(prodOptions.enabled).toBe(true);
    expect(prodOptions.dsn).toBe(MOCK_DSN);
    expect(prodOptions.tracesSampleRate).toBe(0.01);
    expect(prodOptions.sendDefaultPii).toBe(false);
  });

  it("reports exceptions to GlitchTip with tenant-safe tags outside test mode", async () => {
    const { captureException } = await import("@/lib/observability/sentry");

    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SENTRY_DSN", MOCK_DSN);
    captureException(new Error("test-only error"), { schoolId: "school_1" });
    expect(mockSentry.captureException).not.toHaveBeenCalled();

    vi.stubEnv("NODE_ENV", "production");
    const runtimeError = new Error("upstream failure");
    captureException(runtimeError, {
      schoolId: "school_1",
      userId: "user_42",
      tags: { module: "otp" },
    });

    expect(mockScope.setTag).toHaveBeenCalledWith("schoolId", "school_1");
    expect(mockScope.setTag).toHaveBeenCalledWith("module", "otp");
    expect(mockScope.setUser).toHaveBeenCalledWith({ id: "user_42" });
    expect(mockSentry.captureException).toHaveBeenCalledWith(runtimeError);
  });

  it("handles GlitchTip tunnel validation, SSRF protection, size limits, and forwarding", async () => {
    const { POST } = await import("@/app/api/glitchtip-tunnel/route");

    const ignoredReq = new NextRequest("http://localhost/api/glitchtip-tunnel", {
      method: "POST",
      body: "{}",
    });
    const ignoredRes = await POST(ignoredReq);
    expect(ignoredRes.status).toBe(202);

    vi.stubEnv("SENTRY_DSN", MOCK_DSN);

    const mismatchedEnvelope = `${JSON.stringify({
      dsn: "https://other_key@evil.example/111",
    })}\n{"type":"event"}`;
    const ssrfRes = await POST(
      new NextRequest("http://localhost/api/glitchtip-tunnel", {
        method: "POST",
        body: mismatchedEnvelope,
      }),
    );
    expect(ssrfRes.status).toBe(400);

    const oversizedRes = await POST(
      new NextRequest("http://localhost/api/glitchtip-tunnel", {
        method: "POST",
        body: "x".repeat(513 * 1024),
      }),
    );
    expect(oversizedRes.status).toBe(413);

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const validEnvelope = `${JSON.stringify({ event_id: "evt_1", dsn: MOCK_DSN })}\n{"type":"event"}`;
    const okRes = await POST(
      new NextRequest("http://localhost/api/glitchtip-tunnel", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.2" },
        body: validEnvelope,
      }),
    );
    expect(okRes.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.glitchtip.example/api/99999/envelope/",
      expect.objectContaining({
        method: "POST",
        body: validEnvelope,
      }),
    );
  });
});
