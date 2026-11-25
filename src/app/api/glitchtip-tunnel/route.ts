import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/server/integrations/redis";
import {
  extractEnvelopeDsn,
  parseGlitchTipDsn,
} from "@/lib/observability/glitchtip-config";

export const dynamic = "force-dynamic";

const MAX_ENVELOPE_BYTES = 512 * 1024; // 512 KB

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * First-party GlitchTip ingest tunnel so browser error reporting works even when ad blockers block sentry/glitchtip domains.
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`glitchtip-tunnel:${clientIp}`, 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many telemetry requests" },
      { status: 429 },
    );
  }

  const configuredDsn = parseGlitchTipDsn(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  );
  if (!configuredDsn) {
    return NextResponse.json({ status: "ignored" }, { status: 202 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_ENVELOPE_BYTES) {
    return NextResponse.json(
      { error: "Telemetry envelope exceeds maximum allowed size" },
      { status: 413 },
    );
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json(
      { error: "Empty telemetry payload" },
      { status: 400 },
    );
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_ENVELOPE_BYTES) {
    return NextResponse.json(
      { error: "Telemetry envelope exceeds maximum allowed size" },
      { status: 413 },
    );
  }

  // Strictly prevent open-relay / SSRF misuse by verifying any envelope DSN targets our configured GlitchTip project
  const envelopeDsn = extractEnvelopeDsn(rawBody);
  if (envelopeDsn) {
    const parsedEnvelopeDsn = parseGlitchTipDsn(envelopeDsn);
    if (
      !parsedEnvelopeDsn ||
      parsedEnvelopeDsn.host !== configuredDsn.host ||
      parsedEnvelopeDsn.projectId !== configuredDsn.projectId
    ) {
      return NextResponse.json(
        { error: "Invalid telemetry destination" },
        { status: 400 },
      );
    }
  }

  try {
    const upstream = await fetch(configuredDsn.ingestUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: rawBody,
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Telemetry upstream rejected payload" },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to forward telemetry payload" },
      { status: 502 },
    );
  }
}
