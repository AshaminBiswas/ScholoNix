import "server-only";
import Redis, { type RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const options: RedisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 10) {
        return null; // Stop retrying after 10 attempts
      }
      return Math.min(times * 100, 3000); // Exponential backoff capped at 3s
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
