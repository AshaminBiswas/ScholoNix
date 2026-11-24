import "server-only";
import { redis } from "./client";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Sliding/fixed window rate limiter backed by Redis.
 * Useful for auth endpoints (login, forgot password) and public APIs.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
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
    // If Redis is unreachable, fail open in development or return fallback to avoid hard blocking
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }
}
