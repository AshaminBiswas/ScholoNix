# API & Application Entrypoint Architecture

## 1. Current Repository State

- `src/app/api/health/route.ts`: Minimal `GET /api/health` liveness endpoint (`dynamic = "force-dynamic"`) returning HTTP 200 with `{ status, service, timestamp }` for container health checks and uptime monitors.
- `src/middleware.ts`: Attaches/propagates an `x-request-id` correlation header on incoming requests.
- Business API routes and Server Actions are intentionally not implemented yet.

## 2. Entrypoint Strategy (Server Actions vs. Route Handlers)

The architecture deliberately supports **two thin server entrypoints** that both delegate to the exact same `src/modules/<domain>/services/` layer so business rules are never duplicated:

| Entrypoint              | Location                                    | Use For                                                                                                                                        |
| :---------------------- | :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Actions**      | `src/modules/<domain>/actions/*.actions.ts` | First-party web mutations initiated from Next.js App Router portals (`(platform)`, `(school)`, `(parent)`, `(student)`)                        |
| **HTTP Route Handlers** | `src/app/api/v1/.../route.ts`               | Future mobile applications, third-party webhooks (Stripe/Razorpay), health/readiness probes, file downloads/exports, and external integrations |

## 3. Versioned REST Contract Standards (`src/app/api/v1/`)

To support future mobile apps cleanly without breaking clients:

1. **URI Versioning**: Place public/mobile-facing business endpoints under `src/app/api/v1/<resource>/route.ts`. Operational endpoints (`/api/health`, `/api/ready`) remain unversioned.
2. **Input Validation**: Validate query parameters, path params, and JSON bodies with shared Zod schemas from `src/modules/<domain>/schemas/` before invoking any service.
3. **Standard Response Envelopes**:
   - **Success**: `{ "data": ..., "meta": { "requestId": "...", "pagination": ... } }`
   - **Error**: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...], "requestId": "..." } }`
4. **HTTP Status Semantics**:
   - `200 OK` / `201 Created` / `204 No Content` for successful reads and mutations
   - `400 Bad Request` / `422 Unprocessable Entity` for Zod validation failures
   - `401 Unauthorized` for missing/expired sessions
   - `403 Forbidden` for RBAC or tenant/object scope violations
   - `404 Not Found` for absent resources (or masked cross-tenant probes where appropriate)
   - `409 Conflict` for duplicate unique invariants or state-transition conflicts
   - `429 Too Many Requests` for Redis-backed rate limits
   - `500 Internal Server Error` with sanitized error message and `requestId` (never leak stack traces or raw Prisma errors)
5. **Pagination, Filtering & Sorting**:
   - Never return unbounded `findMany` results.
   - Prefer cursor pagination for large datasets (students, attendance logs, invoices, audit logs); enforce explicit `limit` ceilings (e.g., max 100 per page).
   - Allow-list sortable and filterable columns in Zod schemas.
6. **Idempotency & Webhooks**:
   - Require `Idempotency-Key` headers on payment creation, fee collection, refund, and bulk import endpoints.
   - Verify payment/provider webhooks using raw request body bytes and timing-safe HMAC verification before parsing or deduplicating on provider event ID.
7. **DTO Projection**: Map Prisma entities to explicit response DTOs in `types/`; never return raw database rows containing internal fields or credential hashes.
