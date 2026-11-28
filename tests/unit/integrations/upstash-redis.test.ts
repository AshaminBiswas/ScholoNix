import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mockUpstashState = {
  constructorCalls: [] as Array<{ url: string; token: string }>,
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
  ping: vi.fn(),
  pipelineIncr: vi.fn(),
  pipelineTtl: vi.fn(),
  pipelineExec: vi.fn(),
};

vi.mock("@upstash/redis", () => {
  class MockUpstashRedis {
    constructor(config: { url: string; token: string }) {
      mockUpstashState.constructorCalls.push(config);
    }

    get(key: string) {
      return mockUpstashState.get(key);
    }

    set(key: string, value: unknown, opts?: { ex?: number }) {
      return mockUpstashState.set(key, value, opts);
    }

    del(key: string) {
      return mockUpstashState.del(key);
    }

    expire(key: string, seconds: number) {
      return mockUpstashState.expire(key, seconds);
    }

    ping() {
      return mockUpstashState.ping();
    }

    pipeline() {
      const chain = {
        incr: (key: string) => {
          mockUpstashState.pipelineIncr(key);
          return chain;
        },
        ttl: (key: string) => {
          mockUpstashState.pipelineTtl(key);
          return chain;
        },
        exec: () => mockUpstashState.pipelineExec(),
      };
      return chain;
    }
  }

  return { Redis: MockUpstashRedis };
});

function clearGlobalRedisCache() {
  const globalStore = globalThis as {
    redisClient?: unknown;
    upstashRedisClient?: unknown;
  };
  delete globalStore.redisClient;
  delete globalStore.upstashRedisClient;
}

describe("Upstash Redis integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    clearGlobalRedisCache();
    mockUpstashState.constructorCalls = [];
    mockUpstashState.get = vi.fn();
    mockUpstashState.set = vi.fn().mockResolvedValue("OK");
    mockUpstashState.del = vi.fn().mockResolvedValue(1);
    mockUpstashState.expire = vi.fn().mockResolvedValue(1);
    mockUpstashState.ping = vi.fn().mockResolvedValue("PONG");
    mockUpstashState.pipelineIncr = vi.fn();
    mockUpstashState.pipelineTtl = vi.fn();
    mockUpstashState.pipelineExec = vi.fn().mockResolvedValue([1, -1]);
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearGlobalRedisCache();
    process.env = { ...originalEnv };
  });

  it("reads UPSTASH_REDIS_REST_* and KV_REST_API_* env vars with quote trimming", async () => {
    const clientModule = await import("@/server/integrations/redis/client");

    expect(clientModule.isUpstashConfigured()).toBe(false);
    expect(clientModule.createUpstashRedisClient()).toBeNull();

    process.env.UPSTASH_REDIS_REST_URL = ' "https://mock-primary.upstash.io" ';
    process.env.UPSTASH_REDIS_REST_TOKEN = ' "mock_upstash_token_value" ';

    expect(clientModule.isUpstashConfigured()).toBe(true);
    expect(clientModule.getUpstashRedisConfig()).toEqual({
      url: "https://mock-primary.upstash.io",
      token: "mock_upstash_token_value",
    });

    const created = clientModule.createUpstashRedisClient();
    expect(created).not.toBeNull();
    expect(mockUpstashState.constructorCalls).toEqual([
      {
        url: "https://mock-primary.upstash.io",
        token: "mock_upstash_token_value",
        enableAutoPipelining: true,
        readYourWrites: true,
      },
    ]);

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.KV_REST_API_URL = "https://mock-kv-fallback.upstash.io";
    process.env.KV_REST_API_TOKEN = "mock_kv_token_value";

    expect(clientModule.getUpstashRedisConfig()).toEqual({
      url: "https://mock-kv-fallback.upstash.io",
      token: "mock_kv_token_value",
    });
  });

  it("keeps module-level upstashRedis disabled during NODE_ENV=test and returns null for invalid URLs", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock_upstash_token_value");

    const clientModule = await import("@/server/integrations/redis/client");
    expect(clientModule.upstashRedis).toBeNull();
    expect(mockUpstashState.constructorCalls).toHaveLength(0);

    expect(
      clientModule.createUpstashRedisClient({
        url: "not-a-valid-url",
        token: "mock_upstash_token_value",
      }),
    ).toBeNull();
  });

  it("caches and retrieves tenant-scoped data with Upstash REST options and preserves falsy values", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-cache.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock_upstash_token_value");

    const { tenantCache } = await import("@/server/integrations/redis/cache");

    await tenantCache.set("school_123", "settings", { timezone: "Asia/Kolkata" }, 600);
    expect(mockUpstashState.set).toHaveBeenCalledWith(
      "tenant:school_123:settings",
      { timezone: "Asia/Kolkata" },
      { ex: 600 },
    );

    mockUpstashState.get.mockResolvedValueOnce({ timezone: "Asia/Kolkata" });
    await expect(
      tenantCache.get<{ timezone: string }>("school_123", "settings"),
    ).resolves.toEqual({ timezone: "Asia/Kolkata" });

    mockUpstashState.get.mockResolvedValueOnce(false);
    await expect(tenantCache.get<boolean>("school_123", "feature_flag")).resolves.toBe(
      false,
    );

    mockUpstashState.get.mockResolvedValueOnce(0);
    await expect(tenantCache.get<number>("school_123", "retry_count")).resolves.toBe(0);

    mockUpstashState.get.mockResolvedValueOnce('{"serialized":true}');
    await expect(
      tenantCache.get<{ serialized: boolean }>("school_123", "legacy_json"),
    ).resolves.toEqual({ serialized: true });

    mockUpstashState.get.mockRejectedValueOnce(new Error("Upstash network failure"));
    await expect(tenantCache.get("school_123", "settings")).resolves.toBeNull();

    await tenantCache.del("school_123", "settings");
    expect(mockUpstashState.del).toHaveBeenCalledWith("tenant:school_123:settings");
  });

  it("enforces rate limits via Upstash pipeline and falls back cleanly on errors", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-ratelimit.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock_upstash_token_value");

    const { checkRateLimit } = await import("@/server/integrations/redis/rate-limit");

    mockUpstashState.pipelineExec.mockResolvedValueOnce([1, -1]);
    const first = await checkRateLimit("otp:user-1", 5, 300);
    expect(mockUpstashState.pipelineIncr).toHaveBeenCalledWith("ratelimit:otp:user-1");
    expect(mockUpstashState.pipelineTtl).toHaveBeenCalledWith("ratelimit:otp:user-1");
    expect(mockUpstashState.expire).toHaveBeenCalledWith("ratelimit:otp:user-1", 300);
    expect(first).toEqual({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetInSeconds: 300,
    });

    mockUpstashState.pipelineExec.mockResolvedValueOnce([6, 120]);
    const blocked = await checkRateLimit("otp:user-1", 5, 300);
    expect(blocked).toEqual({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetInSeconds: 120,
    });

    mockUpstashState.pipelineExec.mockRejectedValueOnce(new Error("Upstash timeout"));
    const fallback = await checkRateLimit("otp:user-fallback", 3, 60);
    expect(fallback).toEqual({
      allowed: true,
      limit: 3,
      remaining: 2,
      resetInSeconds: 60,
    });
  });

  it("reports Upstash health status and unconfigured test status without TCP dials", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const testHealthModule = await import("@/server/integrations/redis/health");
    const testHealth = await testHealthModule.checkRedisHealth();
    expect(testHealth.status).toBe("unhealthy");
    expect(testHealth.provider).toBe("unconfigured");

    vi.resetModules();
    clearGlobalRedisCache();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-health.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock_upstash_token_value");

    const prodHealthModule = await import("@/server/integrations/redis/health");
    mockUpstashState.ping.mockResolvedValueOnce("PONG");
    const healthy = await prodHealthModule.checkRedisHealth();
    expect(healthy.status).toBe("healthy");
    expect(healthy.provider).toBe("upstash");

    mockUpstashState.ping.mockRejectedValueOnce(new Error("Unauthorized"));
    const unhealthy = await prodHealthModule.checkRedisHealth();
    expect(unhealthy).toMatchObject({
      status: "unhealthy",
      provider: "upstash",
      error: "Unauthorized",
    });
  });

  it("validates Upstash environment variables cleanly in Zod schema", async () => {
    const envModule = await import("@/lib/configuration/env");
    const upstashEnvSchema = envModule.serverEnvSchema.pick({
      UPSTASH_REDIS_REST_URL: true,
      UPSTASH_REDIS_REST_TOKEN: true,
      KV_REST_API_URL: true,
      KV_REST_API_TOKEN: true,
    });

    const valid = upstashEnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    });
    expect(valid.success).toBe(true);

    const validWithHttps = upstashEnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "https://mock-env.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "mock_upstash_token_value",
      KV_REST_API_URL: "https://mock-kv.upstash.io",
      KV_REST_API_TOKEN: "mock_kv_token_value",
    });
    expect(validWithHttps.success).toBe(true);

    const invalid = upstashEnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "ftp://invalid.example.com",
    });
    expect(invalid.success).toBe(false);
    expect(invalid.error).toBeInstanceOf(z.ZodError);
  });
});
