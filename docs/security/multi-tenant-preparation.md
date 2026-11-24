# Multi-Tenant Architecture & Security Preparation

## Overview

The SaaS platform implements a **Pooled Single-Database, Shared-Process Multi-Tenancy Architecture** with strict logical isolation enforced at multiple defensive layers:

```
[Incoming Request]
        │
        ▼ (Layer 1: Context Resolution)
[Server Tenant Context Resolver]  <── Resolved from trusted session or host header
        │
        ▼ (Layer 2: Application RBAC)
[Authorization Layer]              <── Checks user membership in tenant & specific permission
        │
        ▼ (Layer 3: Repository Scoping)
[Base Tenant Repository]           <── Injects `schoolId = tenantContext.schoolId`
        │
        ▼ (Layer 4: Database Defense-in-Depth)
[PostgreSQL Row-Level Security]    <── Enforces `current_setting('app.current_school_id')`
```

## Status: Implemented vs. Prepared Controls

To maintain total transparency and adhere to project governance:

| Control                                 | Status          | Description                                                                                                                                                                                              |
| :-------------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server-side Tenant Resolution**       | **Implemented** | `src/server/tenant/tenant-context.ts` provides `runWithTenantContext` and `getTenantContext()` using Node's `AsyncLocalStorage`. Resolves tenant from validated credentials, never blind client headers. |
| **Centralized Authorization (RBAC)**    | **Implemented** | `src/server/authorization/permissions.ts` defines comprehensive role-permission matrices and an `authorize()` assertion helper.                                                                          |
| **Tenant-Aware Repository Abstraction** | **Implemented** | `src/server/repositories/base-tenant-repository.ts` provides base patterns ensuring every query is parameterized with the active `schoolId`.                                                             |
| **Tenant-Safe Cache Namespacing**       | **Implemented** | `src/server/integrations/redis/cache.ts` forces tenant-specific key namespacing (`tenant:${schoolId}:${key}`) to prevent cross-tenant cache pollution.                                                   |
| **Tenant-Aware Background Queues**      | **Implemented** | `src/server/jobs/index.ts` validates that every queued job payload contains a mandatory, non-null `schoolId`.                                                                                            |
| **Structured Tenant Audit Trail**       | **Implemented** | `src/server/security/audit-logger.ts` logs structured audit events tagged with actor, tenant, action, and target entity.                                                                                 |
| **PostgreSQL Row-Level Security (RLS)** | **Prepared**    | SQL migration patterns and session variable hooks (`SET LOCAL app.current_school_id`) are documented and scripted. RLS will be activated on database tables during schema migrations.                    |
| **Cross-Tenant Composite Constraints**  | **Prepared**    | Schema design conventions mandate `(id, school_id)` composite keys on tenant tables to prevent cross-tenant foreign key references.                                                                      |

## Threat Model & Invariants

1. **Untrusted Client Inputs**: An attacker can tamper with IDs, URLs (`/schools/TENANT_A/students/STUDENT_OF_TENANT_B`), and request bodies. The server never relies on URL parameters for tenant identity; tenant identity is determined strictly from the cryptographically verified session token.
2. **Zero Default Access**: If a request does not resolve to an active tenant context, any operation touching tenant-owned data throws `TenantNotFoundError` or `AuthorizationError` immediately.
3. **Super-Admin Explicit Scoping**: Platform super-admins wishing to inspect a tenant's workspace must explicitly impersonate or assume tenant context with mandatory audit trail logging.
