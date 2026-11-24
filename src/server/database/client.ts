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

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "stdout", level: "error" }],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
