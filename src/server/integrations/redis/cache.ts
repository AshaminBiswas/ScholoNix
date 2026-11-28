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
const L1_CACHE_MAX_ENTRIES = 500;
const L1_CACHE_MAX_TTL_SECONDS = 10;
const REDIS_CIRCUIT_COOLDOWN_MS = 30_000;

interface L1Entry {
  value: unknown;
  expiresAtMs: number;
}

const globalForCache = globalThis as unknown as {
  __scholonixL1Cache?: Map<string, L1Entry>;
  __scholonixRedisDisabledUntilMs?: number;
};

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
}

function getL1Store(): Map<string, L1Entry> | null {
  if (isTestRuntime()) return null;
  if (!globalForCache.__scholonixL1Cache) {
    globalForCache.__scholonixL1Cache = new Map();
  }
  return globalForCache.__scholonixL1Cache;
}

function getL1Cached<T>(fullKey: string): T | null {
  const store = getL1Store();
  if (!store) return null;
  const entry = store.get(fullKey);
  if (!entry) return null;
  if (entry.expiresAtMs <= Date.now()) {
    store.delete(fullKey);
    return null;
  }
  return entry.value as T;
}

function setL1Cached<T>(fullKey: string, value: T, ttlSeconds: number): void {
  const store = getL1Store();
  if (!store || ttlSeconds <= 0) return;
  const effectiveTtlSec = Math.min(ttlSeconds, L1_CACHE_MAX_TTL_SECONDS);
  if (store.size >= L1_CACHE_MAX_ENTRIES && !store.has(fullKey)) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(fullKey, {
    value,
    expiresAtMs: Date.now() + effectiveTtlSec * 1000,
  });
}

function delL1Cached(fullKey: string): void {
  const store = getL1Store();
  store?.delete(fullKey);
}

function isLocalRedisCircuitOpen(): boolean {
  if (isTestRuntime() || upstashRedis) return false;
  return (globalForCache.__scholonixRedisDisabledUntilMs ?? 0) > Date.now();
}

function tripLocalRedisCircuit(): void {
  if (isTestRuntime() || upstashRedis) return;
  globalForCache.__scholonixRedisDisabledUntilMs = Date.now() + REDIS_CIRCUIT_COOLDOWN_MS;
}

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
  const l1Hit = getL1Cached<T>(fullKey);
  if (l1Hit !== null) {
    return l1Hit;
  }

  try {
    if (upstashRedis) {
      const data = await withFastRedisTimeout(upstashRedis.get<T>(fullKey));
      const parsed = parseUpstashValue<T>(data);
      if (parsed !== null) {
        setL1Cached(fullKey, parsed, L1_CACHE_MAX_TTL_SECONDS);
      }
      return parsed;
    }

    if (process.env.NODE_ENV === "test" || isLocalRedisCircuitOpen()) {
      return null;
    }

    const data = await withFastRedisTimeout(redis.get(fullKey));
    if (data === null) return null;
    const parsed = JSON.parse(data) as T;
    setL1Cached(fullKey, parsed, L1_CACHE_MAX_TTL_SECONDS);
    return parsed;
  } catch {
    tripLocalRedisCircuit();
    return null;
  }
}

async function setCachedByFullKey<T>(
  fullKey: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  setL1Cached(fullKey, value, ttlSeconds);

  try {
    if (upstashRedis) {
      await withFastRedisTimeout(upstashRedis.set(fullKey, value, { ex: ttlSeconds }));
      return;
    }

    if (process.env.NODE_ENV === "test" || isLocalRedisCircuitOpen()) {
      return;
    }

    await withFastRedisTimeout(redis.set(fullKey, JSON.stringify(value), "EX", ttlSeconds));
  } catch {
    tripLocalRedisCircuit();
    // Graceful degradation when cache fails
  }
}

async function delCachedByFullKey(fullKey: string): Promise<void> {
  delL1Cached(fullKey);

  try {
    if (upstashRedis) {
      await withFastRedisTimeout(upstashRedis.del(fullKey));
      return;
    }

    if (process.env.NODE_ENV === "test" || isLocalRedisCircuitOpen()) {
      return;
    }

    await withFastRedisTimeout(redis.del(fullKey));
  } catch {
    tripLocalRedisCircuit();
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

  /**
   * Atomically increments a numeric counter in Redis (or L1 store fallback) and ensures TTL.
   * Used for O(1) cache-namespace version bumping without SCAN/KEYS.
   */
  async incrVersion(key: string, ttlSeconds: number = 86_400): Promise<number> {
    const fullKey = buildSystemCacheKey(key);
    delL1Cached(fullKey);
    try {
      if (upstashRedis) {
        const nextVal = await withFastRedisTimeout(upstashRedis.incr(fullKey));
        await withFastRedisTimeout(upstashRedis.expire(fullKey, ttlSeconds));
        setL1Cached(fullKey, nextVal, Math.min(ttlSeconds, L1_CACHE_MAX_TTL_SECONDS));
        return Number(nextVal) || 1;
      }

      if (process.env.NODE_ENV !== "test" && !isLocalRedisCircuitOpen()) {
        const nextVal = await withFastRedisTimeout(redis.incr(fullKey));
        await withFastRedisTimeout(redis.expire(fullKey, ttlSeconds));
        setL1Cached(fullKey, nextVal, Math.min(ttlSeconds, L1_CACHE_MAX_TTL_SECONDS));
        return Number(nextVal) || 1;
      }
    } catch {
      tripLocalRedisCircuit();
    }

    const fallbackNext = Math.max(2, Math.floor(Date.now() % 1_000_000));
    setL1Cached(fullKey, fallbackNext, Math.min(ttlSeconds, L1_CACHE_MAX_TTL_SECONDS));
    return fallbackNext;
  },
};
