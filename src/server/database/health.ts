import "server-only";
import { db } from "./client";

export interface DatabaseHealthResult {
  status: "healthy" | "unhealthy";
  latencyMs: number;
  error?: string;
}

/**
 * Health check utility to test PostgreSQL connectivity and query execution.
 * Executes a simple lightweight query and records roundtrip latency.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  try {
    await db.$queryRaw`SELECT 1 as healthy;`;
    const latencyMs = Date.now() - startTime;
    return {
      status: "healthy",
      latencyMs,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Database connection failed";
    return {
      status: "unhealthy",
      latencyMs,
      error: message,
    };
  }
}
