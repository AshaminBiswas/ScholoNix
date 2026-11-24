---
name: schema-design
description: Design normalized, evolvable PostgreSQL schemas for a multi-tenant school SaaS.
---

# Database Schema Design Skill

## Workflow
1. Gather entities, lifecycle, cardinality, invariants, retention, and query patterns.
2. Identify global platform entities versus tenant-owned entities.
3. Define primary keys, foreign keys, unique constraints, check constraints, nullability, and delete behavior.
4. Normalize transactional data; add denormalized read models only for measured query needs.
5. Include tenant ownership on tenant-scoped rows and design composite constraints that prevent cross-tenant references.
6. Define migration and backfill plans for every schema change.

## PostgreSQL standards
- Use explicit types, `timestamptz` for instants, and documented timezone policy.
- Use `numeric`/integer minor units for money; never floating point.
- Add indexes based on query patterns and selectivity.
- Use unique constraints for business invariants, not application checks alone.
- Avoid unbounded JSON blobs for core relational data.

## Deliverables
ERD, data dictionary, constraints/index rationale, migration scripts, and sample queries.
