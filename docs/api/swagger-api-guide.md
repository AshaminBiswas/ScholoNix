# ScholoNix Swagger & OpenAPI Documentation Guide

This repository provides a complete **OpenAPI 3.0.3 (Swagger)** contract describing all ScholoNix platform, school tenant, admissions, fee ledger, student lifecycle, authentication, and health endpoints.

## Accessing Swagger / OpenAPI Documentation

| Format | Location / URL | Usage |
| :--- | :--- | :--- |
| **Interactive Swagger UI Explorer** | `/api-docs` ([page.tsx](file:///d:/ScholoNix/src/app/api-docs/page.tsx)) | Search endpoints, inspect schemas & RBAC requirements, copy `curl` commands, and test live endpoints with Light/Dark theme support. |
| **Live OpenAPI 3.0.3 JSON Feed** | `GET /api/docs/openapi.json` ([route.ts](file:///d:/ScholoNix/src/app/api/docs/openapi.json/route.ts)) | Connect Postman, Insomnia, Swagger Editor, or SDK generators directly to your running server. |
| **Static OpenAPI Artifact** | `docs/api/openapi.json` ([openapi.json](file:///d:/ScholoNix/docs/api/openapi.json)) | Version-controlled JSON specification imported directly by Swagger UI or CI contract tools. |
| **TypeScript Source of Truth** | `src/modules/docs/openapi-spec.ts` ([openapi-spec.ts](file:///d:/ScholoNix/src/modules/docs/openapi-spec.ts)) | Authoritative spec definition consumed by both the route handler and `/api-docs`. |

## Authentication & Multi-Tenant Security Model

1. **School Portal APIs (`/api/school/...`)**:
   - Authenticated via an HTTP-only signed session cookie (`scholonix_session`) minted on `/api/auth/login` or `/api/auth/register-school`.
   - Every handler enforces both **RBAC permissions** (`src/server/authorization/permissions.ts`) and **PostgreSQL Row-Level Security (`app.current_school_id`)**.
   - Cross-tenant object access returns `403 Forbidden` or `404 Not Found`.

2. **Company Admin / Platform APIs (`/api/platform/...`)**:
   - Authenticated via an HTTP-only MFA-verified platform session (`scholonix_platform_session`).
   - Protected by Super Admin / Governance authorization checks and backed by **Upstash Redis** (`platformCache` / `tenantCache`) for sub-millisecond reads.

3. **Standard Response Envelopes**:
   - Successful reads/mutations return HTTP `200`/`201` with structured JSON (or `text/csv` / `application/pdf` streams for `/export` and `/pdf` endpoints).
   - Errors return structured HTTP `400`, `401`, `403`, `404`, `409`, `429`, or `503` payloads without leaking stack traces or raw SQL errors.

## Keeping OpenAPI Spec Updated

Whenever a new API route is added under `src/app/api/`:
1. Document the endpoint path, query/path params, Zod schema properties, and responses in [openapi-spec.ts](file:///d:/ScholoNix/src/modules/docs/openapi-spec.ts).
2. Regenerate [openapi.json](file:///d:/ScholoNix/docs/api/openapi.json) using:
   ```bash
   npx tsx -e "import { writeFileSync } from 'node:fs'; import { SCHOLONIX_OPENAPI_SPEC } from './src/modules/docs/openapi-spec.ts'; writeFileSync('./docs/api/openapi.json', JSON.stringify(SCHOLONIX_OPENAPI_SPEC, null, 2) + '\n', 'utf8');"
   ```
3. Run unit docs validation: `npx vitest run tests/unit/docs/openapi-and-docs.test.ts`.
