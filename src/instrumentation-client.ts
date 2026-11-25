import * as Sentry from "@sentry/nextjs";
import { buildGlitchTipInitOptions } from "@/lib/observability/glitchtip-config";

const baseOptions = buildGlitchTipInitOptions(process.env.NEXT_PUBLIC_SENTRY_DSN);

Sentry.init({
  ...baseOptions,
  tunnel: "/api/glitchtip-tunnel",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
