---
name: analytics-reporting
description: Build accurate dashboards, reports, and analytics for school operations.
---

# Analytics and Reporting Skill

## Workflow
1. Define each metric precisely, including numerator, denominator, time window, timezone, exclusions, and source of truth.
2. Separate operational transactional queries from heavy analytics workloads.
3. Apply tenant and permission scope before aggregation.
4. Define snapshot/freshness expectations and label delayed data.
5. Validate aggregates against source records and finance reconciliation.
6. Provide filters with bounded date ranges and safe query limits.

## Rules
Never invent a KPI definition or silently change historical calculation logic. Version material metric changes and document them.
