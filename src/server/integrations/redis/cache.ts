import "server-only";
import { redis, upstashRedis } from "./client";

/**
 * Tenant-safe Redis cache key namespace generator.
 * Enforces strict isolation: non-system keys MUST include the verified schoolId.
 */
export function buildTenantCacheKey(schoolId: string, resourceKey: string): string {
  if (!schoolId || typeof schoolId !== "string" || schoolId.trim() === "") {
    throw new Error(
      "Invalid tenant cache key: schoolId is required to prevent cross-tenant contamination.",
    );
  }
  return `tenant:${schoolId}:${resourceKey}`;
}

export function buildSystemCacheKey(resourceKey: string): string {
  return `system:${resourceKey}`;
}

/**
 * Tenant-scoped cache helper.
 * Provides safe get/set/del primitives enforcing tenant isolation.
 */
function parseUpstashValue<T>(data: unknown): T | null {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data === "string" && (data.startsWith("{") || data.startsWith("["))) {
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }
  return data as T;
}

const REDIS_OP_TIMEOUT_MS = 1500;

async function withFastRedisTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Redis operation timeout")), REDIS_OP_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function getCachedByFullKey<T>(fullKey: string): Promise<T | null> {
  try {
    if (upstashRedis) {
      const data = await withFastRedisTimeout(upstashRedis.get<T>(fullKey));
      return parseUpstashValue<T>(data);
    }

    if (process.env.NODE_ENV === "test") {
      return null;
    }

    const data = await withFastRedisTimeout(redis.get(fullKey));
    if (data === null) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

async function setCachedByFullKey<T>(
  fullKey: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    if (upstashRedis) {
      await withFastRedisTimeout(upstashRedis.set(fullKey, value, { ex: ttlSeconds }));
      return;
    }

    if (process.env.NODE_ENV === "test") {
      return;
    }

    await withFastRedisTimeout(redis.set(fullKey, JSON.stringify(value), "EX", ttlSeconds));
  } catch {
    // Graceful degradation when cache fails
  }
}

async function delCachedByFullKey(fullKey: string): Promise<void> {
  try {
    if (upstashRedis) {
      await withFastRedisTimeout(upstashRedis.del(fullKey));
      return;
    }

    if (process.env.NODE_ENV === "test") {
      return;
    }

    await withFastRedisTimeout(redis.del(fullKey));
  } catch {
    // Graceful degradation
  }
}

export const tenantCache = {
  async get<T>(schoolId: string, key: string): Promise<T | null> {
    const fullKey = buildTenantCacheKey(schoolId, key);
    return getCachedByFullKey<T>(fullKey);
  },

  async set<T>(
    schoolId: string,
    key: string,
    value: T,
    ttlSeconds: number = 300,
  ): Promise<void> {
    const fullKey = buildTenantCacheKey(schoolId, key);
    await setCachedByFullKey(fullKey, value, ttlSeconds);
  },

  async del(schoolId: string, key: string): Promise<void> {
    const fullKey = buildTenantCacheKey(schoolId, key);
    await delCachedByFullKey(fullKey);
  },
};

/**
 * System-scoped cache helper (for verified session tokens and non-tenant lookup indexes).
 */
export const systemCache = {
  async get<T>(key: string): Promise<T | null> {
    return getCachedByFullKey<T>(buildSystemCacheKey(key));
  },

  async set<T>(key: string, value: T, ttlSeconds: number = 120): Promise<void> {
    await setCachedByFullKey(buildSystemCacheKey(key), value, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await delCachedByFullKey(buildSystemCacheKey(key));
  },
};
