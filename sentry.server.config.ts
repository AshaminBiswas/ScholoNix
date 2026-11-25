import * as Sentry from "@sentry/nextjs";
import { buildGlitchTipInitOptions } from "@/lib/observability/glitchtip-config";

Sentry.init(
  buildGlitchTipInitOptions(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  ),
);
