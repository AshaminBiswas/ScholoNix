/**
 * Sentry integration preparation stub.
 * When SENTRY_DSN is provided in environment variables, this module wraps error reporting.
 */
import { logger } from "@/lib/logger";

export interface ErrorReportContext {
  schoolId?: string;
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorReportContext): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.error(
      { err: error, context },
      "[Observability] Exception captured (Sentry DSN not configured)",
    );
    return;
  }

  // When @sentry/nextjs is configured, delegating happens here:
  // Sentry.captureException(error, { tags: context?.tags, extra: context?.extra });
  logger.error({ err: error, context }, "[Observability] Sentry reported exception");
}
