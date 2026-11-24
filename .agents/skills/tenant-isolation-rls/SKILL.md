---
name: tenant-isolation-rls
description: Enforce tenant isolation using application authorization and PostgreSQL RLS.
---

# Multi-Tenant Isolation and RLS Skill

## Threat model
Assume a malicious tenant user can alter IDs, URLs, request bodies, filters, and client state to access another school's records.

## Required controls
1. Resolve the authenticated user and active tenant from trusted server-side membership records.
2. Never trust a `schoolId` supplied by the browser as proof of access.
3. Enforce tenant membership and role permissions in the service layer for every operation.
4. Apply PostgreSQL Row-Level Security to tenant-owned tables where supported by the connection model.
5. Set tenant context transaction-locally; prevent pooled connections from retaining another request's tenant context.
6. Use composite foreign keys/unique constraints to prevent records in one tenant referencing another tenant's rows.
7. Keep platform-admin bypass explicit, tightly scoped, audited, and unavailable to ordinary tenant users.
8. Test direct object references, list endpoints, exports, background jobs, caches, storage paths, and realtime channels.

## Critical caveat
RLS is defense in depth, not a replacement for application authorization. Verify that the database role used by the application does not bypass RLS unintentionally.

## Required tests
Create two schools and prove School A cannot read, update, delete, export, or infer School B's data through any route or side channel.
