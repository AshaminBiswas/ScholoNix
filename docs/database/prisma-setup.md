# Prisma ORM Setup & Workflow

## Overview

The database layer uses **Prisma ORM** connecting to **PostgreSQL 16**. Prisma provides compile-time type generation, schema declarative definitions, and migration tooling.

## File Organization

```
prisma/
├── schema.prisma       # Primary schema definition, datasource, and models
├── migrations/         # Version-controlled SQL migration directory
├── seed.ts             # Deterministic seed entry point
└── seeds/              # Domain-specific seed files (e.g., initial tenants, roles)
```

## Datasource Configuration

`prisma/schema.prisma` defines two database connection URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- **`url` (`DATABASE_URL`)**: Connection string for pooled connections used by application runtime queries. When connecting through a connection pooler (e.g. PgBouncer, Supabase Pooler, AWS RDS Proxy), Prisma executes non-prepared queries safely.
- **`directUrl` (`DIRECT_URL`)**: Direct connection to the PostgreSQL database bypassing connection poolers, required for running DDL statements during migrations (`prisma migrate dev` and `prisma migrate deploy`).

## Migration Workflow

### Development Migrations

When changing `prisma/schema.prisma`:

```bash
# Generate SQL migration file, apply it locally, and update Prisma Client
npm run db:migrate -- --name <migration_name>
```

### Production Migrations

In CI/CD and production environments:

```bash
# Apply pending migrations strictly from the versioned migrations directory
npm run db:migrate:deploy
```

> [!WARNING]
> Never use `prisma db push` in production. All schema modifications must be captured as versioned SQL migration files and code-reviewed before deployment.

## Deterministic Seeding

Development seed scripts are executed via:

```bash
npm run db:seed
```

Rules:

1. **Never use real student or guardian PII** in fixtures.
2. Use deterministic UUIDs or slugs so runs are idempotent.
3. Seeding will automatically fail in production (`NODE_ENV === "production"`).
