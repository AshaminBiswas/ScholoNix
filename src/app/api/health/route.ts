import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Process liveness endpoint used by container health checks and load balancers.
 * Readiness checks (PostgreSQL, Redis) will be exposed separately once database
 * and cache clients are implemented.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "school-management-saas",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
