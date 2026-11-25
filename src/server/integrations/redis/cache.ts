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

export const tenantCache = {
  async get<T>(schoolId: string, key: string): Promise<T | null> {
    const fullKey = buildTenantCacheKey(schoolId, key);
    try {
      if (upstashRedis) {
        const data = await upstashRedis.get<T>(fullKey);
        return parseUpstashValue<T>(data);
      }

      if (process.env.NODE_ENV === "test") {
        return null;
      }

      const data = await redis.get(fullKey);
      if (data === null) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async set<T>(
    schoolId: string,
    key: string,
    value: T,
    ttlSeconds: number = 300,
  ): Promise<void> {
    const fullKey = buildTenantCacheKey(schoolId, key);
    try {
      if (upstashRedis) {
        await upstashRedis.set(fullKey, value, { ex: ttlSeconds });
        return;
      }

      if (process.env.NODE_ENV === "test") {
        return;
      }

      await redis.set(fullKey, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Graceful degradation when cache fails
    }
  },

  async del(schoolId: string, key: string): Promise<void> {
    const fullKey = buildTenantCacheKey(schoolId, key);
    try {
      if (upstashRedis) {
        await upstashRedis.del(fullKey);
        return;
      }

      if (process.env.NODE_ENV === "test") {
        return;
      }

      await redis.del(fullKey);
    } catch {
      // Graceful degradation
    }
  },
};
