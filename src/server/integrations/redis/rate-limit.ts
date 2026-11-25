import "server-only";
import { redis } from "./client";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

const memoryWindows = new Map<string, { count: number; expiresAt: number }>();

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryWindows.get(key);
  if (!existing || existing.expiresAt <= now) {
    memoryWindows.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetInSeconds: windowSeconds,
    };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetInSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
  };
}

/**
 * Sliding/fixed window rate limiter backed by Redis with fast fail-over
 * to per-worker in-memory tracking when Redis is unconfigured or closed.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const isUnconfiguredLocal =
    process.env.NODE_ENV === "test" ||
    ((Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) &&
      (!process.env.REDIS_URL ||
        process.env.REDIS_URL.includes("localhost") ||
        process.env.REDIS_URL.includes("127.0.0.1")));

  if (isUnconfiguredLocal || redis.status === "end") {
    return checkMemoryRateLimit(redisKey, limit, windowSeconds);
  }

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    const ttl = await redis.ttl(redisKey);

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    return checkMemoryRateLimit(redisKey, limit, windowSeconds);
  }
}
