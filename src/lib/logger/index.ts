import pino, { type Logger, type LoggerOptions } from "pino";

const isDev = process.env.NODE_ENV === "development";

const pinoOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "password",
      "*.password",
      "secret",
      "*.secret",
      "token",
      "*.token",
      "authorization",
      "headers.authorization",
      "cookie",
      "headers.cookie",
      "creditCard",
      "apiKey",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger: Logger = pino(pinoOptions);

/**
 * Creates a child logger bound to a specific tenant (school) context.
 * Guarantees every log entry emitted includes `schoolId`.
 */
export function createTenantLogger(
  schoolId: string,
  bindings: Record<string, unknown> = {},
): Logger {
  return logger.child({
    schoolId,
    ...bindings,
  });
}

/**
 * Creates a child logger bound to a specific background job.
 */
export function createJobLogger(
  jobName: string,
  jobId: string,
  schoolId?: string,
): Logger {
  return logger.child({
    jobName,
    jobId,
    ...(schoolId ? { schoolId } : {}),
  });
}
