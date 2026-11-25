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

const sentryUrl = (process.env.SENTRY_URL || "https://app.glitchtip.com").trim();
const isGlitchTip =
  sentryUrl.toLowerCase().includes("glitchtip") ||
  (!sentryUrl.toLowerCase().includes("sentry.io") &&
    process.env.SENTRY_ENABLE_CLI_RELEASES !== "true");
const disableBuildReleasePlugin = isGlitchTip || !process.env.SENTRY_AUTH_TOKEN?.trim();

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // GlitchTip does not implement Sentry's release/deploy/artifactbundle APIs (which return 404 during next build);
  // keep runtime error instrumentation active via instrumentation/sentry.*.config.ts while disabling
  // build-time Sentry CLI release, deploy, commit-linking, and sourcemap uploads unless targeting Sentry SaaS.
  authToken: disableBuildReleasePlugin ? "" : process.env.SENTRY_AUTH_TOKEN,
  sentryUrl,
  silent: !process.env.CI,
  telemetry: false,
  release: disableBuildReleasePlugin
    ? {
        name: "",
        inject: false,
        create: false,
        finalize: false,
        setCommits: false,
        deploy: false,
      }
    : undefined,
  sourcemaps: {
    disable: disableBuildReleasePlugin,
  },
});
