---
name: node-api
description: Implement secure, maintainable backend services and HTTP APIs.
---

# Node.js API Engineering Skill

## Workflow
1. Inspect runtime, framework, module system, validation library, and existing API conventions.
2. Keep route/controller layers thin; delegate business rules to application/domain services.
3. Validate params, query, headers, and body at the boundary.
4. Authenticate first, resolve tenant context, authorize the action, then execute the use case.
5. Use consistent response and error contracts with request/correlation IDs.
6. Apply pagination, filtering, sorting allow-lists, rate limits, and payload limits.
7. Use transactions for multi-record invariants and idempotency for retryable operations.

## Security
- Never trust client-supplied `schoolId`, role, price, balance, or ownership.
- Do not expose stack traces, SQL, secrets, or internal identifiers unnecessarily.
- Enforce object-level authorization for every record operation.
- Log security-relevant events without logging passwords, tokens, or sensitive personal data.
