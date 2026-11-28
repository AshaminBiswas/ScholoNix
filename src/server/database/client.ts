import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Global singleton pattern for PrismaClient.
 * Prevents multiple instances being created during Next.js Hot Module Reloading (HMR)
 * in development, which would exhaust PostgreSQL connection limits.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildResolvedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  const isServerless = Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
  // In persistent local/container Node servers, connection_limit=1 serializes concurrent
  // SSR/auth/dashboard Prisma calls over remote poolers and can cause 10s timeouts.
  if (!isServerless && /[?&]connection_limit=1(?:&|$)/i.test(raw)) {
    return raw.replace(/([?&])connection_limit=1(&|$)/i, "$1connection_limit=5$2");
  }
  return raw;
}

const resolvedDatabaseUrl = buildResolvedDatabaseUrl();

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedDatabaseUrl
      ? { datasources: { db: { url: resolvedDatabaseUrl } } }
      : {}),
    transactionOptions: {
      maxWait: 10_000,
      timeout: 25_000,
    },
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "stdout", level: "error" }],
  });

// Cache PrismaClient across module reloads and warm serverless container invocations
globalForPrisma.prisma = db;
