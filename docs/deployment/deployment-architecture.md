# Deployment & Infrastructure Architecture

## 1. Current Infrastructure Files in This Repository

- **`Dockerfile`**: Multi-stage production container build on `node:22-alpine`:
  1. `deps`: Installs dependencies cleanly (`npm ci` when `package-lock.json` exists).
  2. `builder`: Runs `npx prisma generate` and `npm run build` producing Next.js standalone output (`output: "standalone"` in `next.config.ts`).
  3. `runner`: Minimal runtime image running as non-root user `nextjs` (UID 1001) with a built-in `HEALTHCHECK` against `http://127.0.0.1:3000/api/health`.
- **`docker-compose.yml`**: Local reproducibility stack with:
  - `postgres` (`postgres:16-alpine`) with persistent volume `postgres_data` and `pg_isready` health check.
  - `redis` (`redis:7-alpine`, AOF persistence enabled) with persistent volume `redis_data` and `redis-cli ping` health check.
  - Optional `app` service under `profiles: ["full"]` for testing the production container locally.
- **`.github/workflows/ci.yml`**: Automated CI pipeline triggered on `main` and `develop` pushes/PRs running:
  1. `npm ci`
  2. `npm run db:validate`
  3. `npm run db:generate`
  4. `npm run lint`
  5. `npm run typecheck`
  6. `npm run test:unit`
  7. `npm run build`
- **`.env.example`**: Complete environment variable contract separating build-time/public (`NEXT_PUBLIC_*`) and runtime server secrets.

## 2. Deployment Targets

The architecture supports both **Vercel** and **containerized Node.js platforms** (ECS, Cloud Run, Kubernetes, Railway, Render):

| Component              | Vercel Deployment Model                                                                                                            | Containerized Deployment Model                                     |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **Next.js Web & API**  | Vercel serverless/Node functions (Edge for `src/middleware.ts`, Node runtime for DB/API routes)                                    | `Dockerfile` standalone image behind TLS-terminating load balancer |
| **PostgreSQL**         | Managed PostgreSQL (Neon, Supabase, RDS, Cloud SQL) with connection pooling (`DATABASE_URL`) + direct migration URL (`DIRECT_URL`) | Managed PostgreSQL with private VPC networking + PgBouncer         |
| **Redis**              | Managed Redis (Upstash / Redis Cloud / ElastiCache)                                                                                | Managed Redis with TLS + persistence                               |
| **Background Workers** | Durable queue provider (e.g., BullMQ worker service on container host, QStash, or Trigger/Inngest)                                 | Dedicated Node worker process running from the same image/repo     |
| **Object Storage**     | S3-compatible bucket (AWS S3 / Cloudflare R2 / GCS) with tenant-prefixed keys                                                      | S3-compatible bucket with private ACLs and signed URLs             |

## 3. Release & Migration Workflow

1. **Pre-Release Verification**: CI must pass lint, type-check, Prisma validation, unit/integration/security tests, and production build.
2. **Controlled Database Migrations**: Run `npm run db:migrate:deploy` using `DIRECT_URL` as an explicit deployment gate before routing production traffic to code that requires new schema columns. Prefer expand-and-contract migrations so rollbacks remain safe.
3. **Post-Release Verification**: Confirm `/api/health` (and future `/api/ready`) return HTTP 200 and run smoke checks before marking a release healthy.
4. **Backups & Disaster Recovery**: Configure automated daily PostgreSQL backups + Point-in-Time Recovery (PITR) and verify restore drills on staging before onboarding production schools.

## 4. Environment & Security Hygiene

- Never bake `.env.local` or production secrets into Docker images.
- Never print environment variables or secrets in CI logs.
- Keep staging isolated from production credentials and populated exclusively with synthetic school data.
