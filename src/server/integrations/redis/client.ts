import "server-only";
import Redis, { type RedisOptions } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
  upstashRedisClient: UpstashRedis | undefined;
};

export interface UpstashRedisConfig {
  url: string;
  token: string;
}

function sanitizeEnvValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^(['"])(.*)\1$/, "$2").trim();
  return unquoted.length > 0 ? unquoted : undefined;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Resolves Upstash REST credentials from UPSTASH_REDIS_REST_* or Vercel KV aliases.
 */
export function getUpstashRedisConfig(
  overrides?: Partial<UpstashRedisConfig>,
): UpstashRedisConfig | null {
  const url =
    sanitizeEnvValue(overrides?.url) ??
    sanitizeEnvValue(process.env.UPSTASH_REDIS_REST_URL) ??
    sanitizeEnvValue(process.env.KV_REST_API_URL);
  const token =
    sanitizeEnvValue(overrides?.token) ??
    sanitizeEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN) ??
    sanitizeEnvValue(process.env.KV_REST_API_TOKEN);

  if (!url || !token || !isValidHttpUrl(url)) {
    return null;
  }

  return { url, token };
}

export function isUpstashConfigured(): boolean {
  return getUpstashRedisConfig() !== null;
}

/**
 * Creates a stateless HTTP-based Upstash Redis client for serverless runtimes.
 */
export function createUpstashRedisClient(
  overrides?: Partial<UpstashRedisConfig>,
): UpstashRedis | null {
  const config = getUpstashRedisConfig(overrides);
  if (!config) {
    return null;
  }

  return new UpstashRedis({
    url: config.url,
    token: config.token,
  });
}

export const upstashRedis: UpstashRedis | null =
  process.env.NODE_ENV === "test"
    ? null
    : process.env.NODE_ENV === "development"
      ? (globalForRedis.upstashRedisClient ?? createUpstashRedisClient())
      : createUpstashRedisClient();

if (process.env.NODE_ENV === "development" && upstashRedis) {
  globalForRedis.upstashRedisClient = upstashRedis;
}

export { UpstashRedis };

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const hasExplicitRedis = Boolean(
    process.env.REDIS_URL && !process.env.REDIS_URL.includes("localhost") && !process.env.REDIS_URL.includes("127.0.0.1"),
  );
  const disableRetry =
    process.env.NODE_ENV === "test" ||
    (Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) && !hasExplicitRedis);

  const options: RedisOptions = {
    lazyConnect: true,
    connectTimeout: 1500,
    maxRetriesPerRequest: disableRetry ? 0 : 1,
    enableReadyCheck: true,
    enableOfflineQueue: !disableRetry,
    retryStrategy(times) {
      if (disableRetry || times > 2) {
        return null; // Fail fast instead of blocking serverless invocations for seconds
      }
      return Math.min(times * 150, 1000);
    },
  };

  const client = new Redis(redisUrl, options);

  client.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.info("[redis] Connected to Redis server");
    }
  });

  client.on("ready", () => {
    if (process.env.NODE_ENV === "development") {
      console.info("[redis] Redis client ready");
    }
  });

  client.on("error", (error: Error) => {
    // Avoid unhandled crashes in dev when Redis is not running
    if (process.env.NODE_ENV === "development") {
      console.warn("[redis] Redis connection warning:", error.message);
    } else {
      console.error("[redis] Redis connection error:", error);
    }
  });

  client.on("close", () => {
    if (process.env.NODE_ENV === "development") {
      console.info("[redis] Connection to Redis closed");
    }
  });

  return client;
}

export const redis: Redis = globalForRedis.redisClient ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redis;
}

/**
 * Graceful shutdown hook for the Redis client.
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis.status === "ready" || redis.status === "connecting") {
    await redis.quit();
  }
}
