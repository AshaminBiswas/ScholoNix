---
name: prisma-engineering
description: Use Prisma safely and efficiently with PostgreSQL.
---

# Prisma Engineering Skill

## Workflow
1. Inspect Prisma version, generator, datasource, schema conventions, and deployment migration process.
2. Model relations and constraints explicitly; name compound unique constraints clearly.
3. Use `select` to fetch only required fields and avoid accidental over-fetching.
4. Detect N+1 patterns; use relation loading or purpose-built queries appropriately.
5. Use `$transaction` for atomic multi-step writes and choose isolation levels based on invariants.
6. Use parameterized raw SQL only when Prisma cannot express a justified query safely.
7. Generate migrations, review SQL, test upgrade from a realistic prior schema, and verify rollback/recovery strategy.

## Guardrails
- Never use `db push` as the production migration strategy.
- Never edit generated Prisma client code.
- Do not catch and suppress database errors.
- Avoid unbounded `findMany`; require pagination for collection endpoints.
