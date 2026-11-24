---
name: caching-strategy
description: Design safe caching and invalidation for tenant-scoped SaaS data.
---

# Caching Strategy Skill

## Workflow
Classify each dataset by freshness, scope, sensitivity, and invalidation events before caching.

## Rules
- Include tenant and relevant authorization scope in cache keys.
- Never cache private data in a shared key.
- Define TTL, invalidation, stale behavior, and failure fallback.
- Invalidate after mutations that affect cached aggregates.
- Do not cache balances, payment status, attendance, or permissions without an explicit consistency design.
- Treat Next.js route/data cache and Redis as separate layers with documented behavior.

## Tests
Prove tenant separation, permission changes, mutation invalidation, and cache outage behavior.
