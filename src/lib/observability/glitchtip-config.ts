export interface ParsedGlitchTipDsn {
  dsn: string;
  protocol: "http:" | "https:";
  host: string;
  projectId: string;
  ingestUrl: string;
}

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
  "proxy-authorization",
]);

function cleanEnvString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Parses and validates a GlitchTip / Sentry DSN string without throwing.
 */
export function parseGlitchTipDsn(rawDsn: string | undefined): ParsedGlitchTipDsn | null {
  const cleaned = cleanEnvString(rawDsn);
  if (!cleaned) {
    return null;
  }

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.username || !parsed.host) {
      return null;
    }

    const projectId = parsed.pathname.replace(/^\/+/, "").split("/")[0]?.trim();
    if (!projectId) {
      return null;
    }

    return {
      dsn: cleaned,
      protocol: parsed.protocol,
      host: parsed.host,
      projectId,
      ingestUrl: `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`,
    };
  } catch {
    return null;
  }
}

/**
 * Reads the envelope header DSN from a Sentry/GlitchTip envelope payload if present.
 */
export function extractEnvelopeDsn(rawBody: string): string | null {
  const firstNewline = rawBody.indexOf("\n");
  const headerLine = (firstNewline === -1 ? rawBody : rawBody.slice(0, firstNewline)).trim();
  if (!headerLine) {
    return null;
  }

  try {
    const parsed = JSON.parse(headerLine) as { dsn?: unknown };
    return typeof parsed.dsn === "string" ? parsed.dsn : null;
  } catch {
    return null;
  }
}

interface ScrubbableTelemetryEvent {
  request?: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    data?: unknown;
  };
  user?: {
    id?: string | number;
    [key: string]: unknown;
  };
}

/**
 * Strips sensitive headers, cookies, and personal user attributes before sending telemetry.
 */
export function scrubTelemetryEvent<T extends ScrubbableTelemetryEvent>(event: T): T {
  if (event.request) {
    if (event.request.headers) {
      const sanitizedHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(event.request.headers)) {
        sanitizedHeaders[key] = SENSITIVE_HEADER_KEYS.has(key.toLowerCase())
          ? "[REDACTED]"
          : value;
      }
      event.request.headers = sanitizedHeaders;
    }

    if (event.request.cookies) {
      delete event.request.cookies;
    }
  }

  if (event.user) {
    event.user = event.user.id !== undefined ? { id: String(event.user.id) } : undefined;
  }

  return event;
}

/**
 * Builds shared, non-secret GlitchTip initialization options for browser, Node.js, and edge runtimes.
 */
export function buildGlitchTipInitOptions(rawDsn: string | undefined) {
  const parsed = parseGlitchTipDsn(rawDsn);
  const sampleRateEnv = Number(process.env.NEXT_PUBLIC_GLITCHTIP_TRACES_SAMPLE_RATE ?? "0.01");
  const tracesSampleRate =
    Number.isFinite(sampleRateEnv) && sampleRateEnv >= 0 && sampleRateEnv <= 1
      ? sampleRateEnv
      : 0.01;

  return {
    dsn: parsed?.dsn,
    enabled: Boolean(parsed) && process.env.NODE_ENV !== "test",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    tracesSampleRate,
    sendDefaultPii: false,
    beforeSend<T extends ScrubbableTelemetryEvent>(event: T): T {
      return scrubTelemetryEvent(event);
    },
  };
}
