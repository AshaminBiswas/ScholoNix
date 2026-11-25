import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { parseGlitchTipDsn } from "@/lib/observability/glitchtip-config";

export interface ErrorReportContext {
  schoolId?: string;
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

/**
 * Reports an application exception to GlitchTip (when DSN is configured) and logs via Pino.
 */
export function captureException(error: unknown, context?: ErrorReportContext): void {
  const configuredDsn = parseGlitchTipDsn(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  );

  if (!configuredDsn || process.env.NODE_ENV === "test") {
    logger.error(
      { err: error, context },
      "[Observability] Exception captured (GlitchTip DSN not configured)",
    );
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.schoolId) {
      scope.setTag("schoolId", context.schoolId);
    }
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });

  logger.error({ err: error, context }, "[Observability] GlitchTip reported exception");
}
