import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/server/database/health";
import { checkRedisHealth } from "@/server/integrations/redis/health";

export const dynamic = "force-dynamic";

/**
 * Readiness probe endpoint.
 * Verifies that backing datastores (PostgreSQL and Redis) are connected and responsive.
 */
export async function GET() {
  const [database, redis] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const isReady = database.status === "healthy" && redis.status === "healthy";

  return NextResponse.json(
    {
      status: isReady ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
      },
    },
    { status: isReady ? 200 : 503 },
  );
}
