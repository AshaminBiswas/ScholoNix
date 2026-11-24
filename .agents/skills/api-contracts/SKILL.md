---
name: api-contracts
description: Design consistent, versionable REST API contracts.
---

# API Contract Engineering Skill

## Standards
- Use resource-oriented, predictable route names and HTTP semantics.
- Define request/response schemas and examples for every endpoint.
- Standardize validation errors, not-found, conflict, forbidden, rate-limit, and server errors.
- Use cursor pagination for large or rapidly changing collections where appropriate; otherwise document offset pagination.
- Allow-list sort and filter fields; cap page sizes.
- Make mutation semantics explicit and support idempotency keys for payments, imports, and retryable jobs.
- Avoid leaking database schema directly as the public API.

## Deliverables
OpenAPI specification or equivalent typed contract, endpoint matrix, authorization matrix, and contract tests.
