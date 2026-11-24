---
name: testing-strategy
description: Create a layered test strategy and reliable automated test suite.
---

# Testing Strategy Skill

## Layers
- Unit tests for pure domain rules and validation.
- Integration tests for database constraints, transactions, repositories, and authorization.
- API tests for contracts and error behavior.
- End-to-end tests for critical user journeys.
- Visual/accessibility tests for key screens where valuable.

## Critical school SaaS scenarios
Tenant A/B isolation, role permissions, admission, attendance bulk marking, fee collection, duplicate payment callbacks, refunds, exam publication, and exports.

## Rules
- Use deterministic fixtures and isolated test tenants.
- Avoid tests that depend on production data or real payment/SMS providers.
- Test negative paths and concurrency-sensitive behavior.
- Run migrations against a clean database and an upgrade database.
- Do not weaken tests to make a failing implementation pass.
