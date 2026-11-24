# Testing Strategy

## 1. Current Test Tooling Configured in This Repository

- **Unit, Integration, API & Security Runner**: Vitest (`vitest.config.ts`) configured with the `@` → `./src` path alias, mock reset hygiene (`restoreMocks: true`, `clearMocks: true`), and scoped npm scripts:
  - `npm run test` (all Vitest suites)
  - `npm run test:unit` (`tests/unit/`)
  - `npm run test:integration` (`tests/integration/`)
  - `npm run test:api` (`tests/api/`)
  - `npm run test:security` (`tests/security/`)
- **End-to-End Runner**: Playwright (`playwright.config.ts`) configured for `tests/e2e/` with Desktop Chrome and Mobile Chrome (`Pixel 7`) projects, CI retries, trace-on-retry, and failure screenshots/video (`npm run test:e2e`).
- **Fixtures Directory**: `tests/fixtures/` for deterministic, 100% synthetic factory data.

No test files exist yet because business modules and schema models are not yet implemented (`passWithNoTests: true` is configured in `vitest.config.ts` so CI passes cleanly on the foundation).

## 2. Layered Testing Architecture

| Layer                           | Directory            | Scope & Dependencies                                 | What Must Be Tested                                                                                                                                                                                         |
| :------------------------------ | :------------------- | :--------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**                        | `tests/unit/`        | Pure TypeScript, zero DB/network                     | Zod schemas, fee/fine/grade calculations (minor-unit arithmetic), timetable conflict detection, formatters, RBAC permission evaluators                                                                      |
| **Integration**                 | `tests/integration/` | Real PostgreSQL (test DB) + Prisma migrations        | Repository queries, compound unique/FK constraints, transactional rollbacks, idempotency keys, Prisma migrations on clean & upgraded DBs                                                                    |
| **API Contract**                | `tests/api/`         | Route Handlers / Server Actions                      | Status codes, error envelopes, validation failures, pagination limits, webhook signature verification, idempotent retries                                                                                   |
| **Security & Tenant Isolation** | `tests/security/`    | Two isolated synthetic tenants (School A & School B) | Cross-tenant read/write/export denial, PostgreSQL RLS enforcement under non-superuser role, RBAC role matrix negative paths, privilege escalation attempts                                                  |
| **End-to-End**                  | `tests/e2e/`         | Running Next.js app + Playwright                     | Critical user journeys across desktop and mobile viewports: school onboarding, admission/enrollment, bulk attendance marking, fee invoice & payment receipt, exam publication, parent/student portal access |

## 3. Non-Negotiable Testing Rules

1. **Synthetic Data Only**: Never copy or seed real student, guardian, or staff PII into `tests/fixtures/` or `prisma/seeds/`.
2. **External Provider Sandboxing**: Never hit live payment gateways, email/SMS providers, or production buckets in automated tests; use deterministic mocks/fakes at the `src/server/integrations/` boundary.
3. **Concurrency & Financial Edge Cases**: Test duplicate webhook deliveries, concurrent fee payments against the same invoice, partial payments, and refund reversals.
4. **No Weakening Assertions**: Fix defective implementations rather than relaxing security or invariant tests.
