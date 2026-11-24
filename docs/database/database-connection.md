# Database Connection Architecture & Pooling

## Connection Roles

Production PostgreSQL deployments require careful separation between runtime application queries and administrative schema migrations.

```
┌────────────────────────┐      DATABASE_URL       ┌────────────────────────┐
│  Next.js Server Nodes  │ ──────────────────────> │ Connection Pooler      │ ────┐
│  (Prisma Client)       │                         │ (PgBouncer / RDS Proxy)│     │
└────────────────────────┘                         └────────────────────────┘     │
                                                                                  ▼
┌────────────────────────┐      DIRECT_URL                                  ┌──────────────┐
│  CI/CD Migration Job   │ ───────────────────────────────────────────────> │  PostgreSQL  │
│  (Prisma Migrate)      │                                                  │  Primary DB  │
└────────────────────────┘                                                  └──────────────┘
```

### 1. Application Runtime Role (`school_app`)

- **Connection Variable**: `DATABASE_URL`
- **Permissions**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on tenant tables; no DDL permissions (`CREATE`, `DROP`, `ALTER`).
- **RLS Status**: Subject to PostgreSQL Row-Level Security policies.
- **Pooling**: Routed via transaction-mode connection poolers.

### 2. Migration Role (`school_migrator`)

- **Connection Variable**: `DIRECT_URL`
- **Permissions**: Full DDL permissions (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, etc.).
- **Bypass**: Direct TCP connection without session-level connection pooling.

## Prisma Client Singleton

In Next.js development mode, hot module reloading (HMR) re-evaluates server modules on every file change. Without singleton management, new PrismaClient instances accumulate and exhaust database connection pools.

The singleton pattern in `src/server/database/client.ts`:

```typescript
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

## Health Check & Verification

Database connectivity is verified programmatically using `checkDatabaseHealth()` in `src/server/database/health.ts`:

- Executes `SELECT 1` via Prisma `$queryRaw`.
- Measures roundtrip query latency in milliseconds.
- Reports status and error details to the readiness endpoint (`/api/health`).
