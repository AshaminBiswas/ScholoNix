import "server-only";
import { isUpstashConfigured, redis, upstashRedis } from "./client";

export interface RedisHealthResult {
  status: "healthy" | "unhealthy";
  latencyMs: number;
  provider?: "upstash" | "ioredis" | "unconfigured";
  error?: string;
}

/**
 * Health check utility to test Redis connectivity and roundtrip latency.
 */
export async function checkRedisHealth(): Promise<RedisHealthResult> {
  const startTime = Date.now();
  const activeProvider: "upstash" | "ioredis" | "unconfigured" = upstashRedis
    ? "upstash"
    : process.env.NODE_ENV === "test" ||
        (Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) &&
          (!process.env.REDIS_URL ||
            process.env.REDIS_URL.includes("localhost") ||
            process.env.REDIS_URL.includes("127.0.0.1")))
      ? "unconfigured"
      : "ioredis";

  if (activeProvider === "unconfigured") {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - startTime,
      provider: "unconfigured",
      error: isUpstashConfigured()
        ? "Upstash Redis client is disabled in test mode"
        : "No Redis backend configured",
    };
  }

  try {
    const pong = upstashRedis
      ? await upstashRedis.ping()
      : await (async () => {
          if (redis.status === "wait") {
            await redis.connect();
          }
          return redis.ping();
        })();
    const latencyMs = Date.now() - startTime;
    if (pong === "PONG") {
      return {
        status: "healthy",
        latencyMs,
        provider: activeProvider,
      };
    }
    return {
      status: "unhealthy",
      latencyMs,
      provider: activeProvider,
      error: `Unexpected ping response: ${pong}`,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Redis connection failed";
    return {
      status: "unhealthy",
      latencyMs,
      provider: activeProvider,
      error: message,
    };
  }
}
