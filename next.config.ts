import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

const sentryUrl = process.env.SENTRY_URL || "https://app.glitchtip.com";
const isGlitchTip = sentryUrl.includes("glitchtip");

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // GlitchTip does not implement Sentry's release/artifactbundle v2 upload APIs (causes 404 during next build);
  // keep runtime instrumentation active and upload source maps manually via glitchtip-cli if needed.
  authToken: isGlitchTip ? undefined : process.env.SENTRY_AUTH_TOKEN,
  sentryUrl,
  silent: !process.env.CI,
  telemetry: false,
  release: isGlitchTip
    ? {
        create: false,
        finalize: false,
        setCommits: false,
      }
    : undefined,
  sourcemaps: {
    disable: isGlitchTip || !process.env.SENTRY_AUTH_TOKEN ? true : false,
  },
});
