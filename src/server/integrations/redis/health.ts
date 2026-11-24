import "server-only";
import { redis } from "./client";

export interface RedisHealthResult {
  status: "healthy" | "unhealthy";
  latencyMs: number;
  error?: string;
}

/**
 * Health check utility to test Redis connectivity and roundtrip latency.
 */
export async function checkRedisHealth(): Promise<RedisHealthResult> {
  const startTime = Date.now();
  try {
    if (redis.status === "wait") {
      await redis.connect();
    }
    const pong = await redis.ping();
    const latencyMs = Date.now() - startTime;
    if (pong === "PONG") {
      return {
        status: "healthy",
        latencyMs,
      };
    }
    return {
      status: "unhealthy",
      latencyMs,
      error: `Unexpected ping response: ${pong}`,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Redis connection failed";
    return {
      status: "unhealthy",
      latencyMs,
      error: message,
    };
  }
}
