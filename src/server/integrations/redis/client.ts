import "server-only";
import Redis, { type RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

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
