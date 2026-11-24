---
name: performance-optimization
description: Measure and improve frontend, API, and database performance.
---

# Performance Optimization Skill

## Workflow
1. Establish baseline metrics before changing code.
2. Profile the actual slow user journey and identify bottleneck.
3. Set budgets for route load, interaction latency, API p95/p99, query latency, and bundle size.
4. Optimize data fetching, payload size, indexes, rendering, and asset delivery based on evidence.
5. Re-measure under realistic data volume and concurrency.

## Requirements
- Paginate large lists and use server-side filtering.
- Avoid fetching full records for table views.
- Use caching only with correct tenant/user cache keys and invalidation.
- Avoid waterfalls and duplicate requests.
- Use virtualization only when list size and profiling justify it.
- Keep performance improvements covered by regression checks.
