/**
 * Deterministic database seed entrypoint.
 *
 * Governance rules (see AGENTS.md):
 * - NEVER use real student, guardian, or staff PII in development fixtures.
 * - Keep all seed scripts idempotent (safe to re-run via upsert).
 * - Split domain seeders into `prisma/seeds/` as approved schema models land.
 */

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run development seed script in production.");
  }

  console.info(
    "[seed] Prisma schema foundation initialized. Add domain seeders under prisma/seeds/ after approving initial models.",
  );
}

main().catch((error: unknown) => {
  console.error("[seed] Seed execution failed:", error);
  process.exitCode = 1;
});
