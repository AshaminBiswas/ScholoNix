# Database Architecture

## 1. Current Repository State

The database layer is initialized at `prisma/` with:

- `prisma/schema.prisma`: Configured for PostgreSQL (`provider = "postgresql"`) with separate `DATABASE_URL` (pooled runtime connection) and `DIRECT_URL` (direct connection for DDL migrations), plus `prisma-client-js` generator.
- `prisma/migrations/`: Empty directory ready for versioned Prisma SQL migrations.
- `prisma/seed.ts` and `prisma/seeds/`: Guarded development seed entrypoint that refuses execution in `production` and enforces synthetic-only fixtures.

No domain tables have been generated yet. Per repository governance, models will be added incrementally after domain modeling and migration review.

## 2. Database Engine & Connection Model

- **Engine**: PostgreSQL 16 (configured in `docker-compose.yml` for local development).
- **ORM**: Prisma ORM with parameterized queries by default.
- **Dual Connection Roles**:
  - `DATABASE_URL` (Application Runtime Role): Non-superuser PostgreSQL role (`NOBYPASSRLS`) subject to Row-Level Security (RLS) policies on all tenant-owned tables.
  - `DIRECT_URL` (Migration Role): Used only during controlled CI/CD migration steps (`prisma migrate deploy`), never exposed to application runtime code.

## 3. Domain Data Ownership Groups

When models are introduced, every table must be explicitly classified as either **Platform/Global** or **Tenant-Owned**:

| Classification        | Planned Domain Groups                                                                                                                                                                                                                                                                                                            | Isolation Mechanism                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Platform / Global** | Platform settings, subscription plans, school registry (`schools`), global user accounts (`users`), authentication credentials/sessions, global permission catalog                                                                                                                                                               | Platform RBAC + explicit membership lookup                                                |
| **Tenant-Owned**      | School memberships & role assignments, academic years/terms, classes, sections, subjects, admissions, students, guardians, teachers, staff, attendance, timetable, examinations, results, fee structures, invoices, payments, receipts, transport, library, hostel, HR, payroll, notifications, communication, tenant audit logs | Non-nullable `school_id` + service authorization + PostgreSQL RLS + composite constraints |

## 4. Multi-Tenant Modeling Standards

1. **Explicit Tenant Ownership**: Every tenant-owned table includes a non-nullable `school_id` column referencing `schools(id)`.
2. **Cross-Tenant Referential Integrity**: Where child records reference another tenant-owned parent (e.g., `enrollments` referencing `students` and `sections`), add composite unique keys `(school_id, id)` and composite foreign keys `(school_id, parent_id)` so PostgreSQL itself rejects cross-tenant links.
3. **PostgreSQL Row-Level Security (RLS)**:
   - Enabled and forced (`ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`) on tenant-owned tables via reviewed SQL migrations.
   - Policies compare `school_id` against a transaction-local session variable (`current_setting('app.current_school_id', true)`), set via `SET LOCAL` inside `prisma.$transaction(...)` so pooled connections never leak tenant state across requests.
4. **Indexing Strategy**:
   - Lead tenant-scoped indexes with `school_id` (e.g., `(school_id, academic_year_id, status)` or `(school_id, created_at DESC)`) to keep queries fast on large student, attendance, and invoice datasets.
   - Use partial unique indexes where soft-deleted or active-only invariants apply (e.g., one active academic year per school).
5. **Financial Integrity**:
   - Store all monetary amounts using integer minor units (`BigInt` / `Int`, e.g., cents/paise) or exact PostgreSQL `NUMERIC`/`DECIMAL` — never floating-point types.
   - Enforce idempotency keys (`UNIQUE (school_id, idempotency_key)`) on payment captures, gateway webhook events, and refunds.
   - Execute invoice adjustments, payment allocations, and refunds inside `prisma.$transaction(...)` with explicit isolation levels and append-only ledger/audit entries.
6. **Time & Timestamps**:
   - Store all instants as `TIMESTAMPTZ` (`@db.Timestamptz(6)`) in UTC; store school timezone on the `schools` record for calendar-date boundaries (attendance dates, due dates, academic term dates).

## 5. Migration Governance

- Never use `prisma db push` in staging or production.
- Every schema change produces a reviewed SQL migration under `prisma/migrations/`.
- Destructive changes (column drops, table drops, constraint tightenings) require explicit review, backfill verification, and a rollback/forward-fix plan before execution.
- Migrations must be tested against both a clean database and an upgraded prior schema snapshot in CI.
