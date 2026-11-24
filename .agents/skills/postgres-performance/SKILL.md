---
name: postgres-performance
description: Optimize PostgreSQL queries, indexes, and connection usage.
---

# PostgreSQL Performance Skill

## Workflow
1. Reproduce the slow path and capture query, parameters shape, row counts, and latency.
2. Inspect `EXPLAIN (ANALYZE, BUFFERS)` in a safe environment.
3. Check indexes, selectivity, join strategy, sort, scans, locks, and table statistics.
4. Optimize query shape and data access before adding caching.
5. Validate improvements with realistic tenant sizes and concurrency.
6. Monitor pool saturation, slow queries, lock waits, table bloat, and replication lag if applicable.

## Rules
- Avoid indexes without a query/use-case justification.
- Consider composite indexes matching tenant filter plus common predicates/order.
- Keep transactions short; never perform network calls inside database transactions.
- Use connection pooling appropriate to the hosting platform.
