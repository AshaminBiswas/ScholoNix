# Production Deployment Preparation

## Build & Artifact Strategy

The production build produces a lightweight, containerized standalone Next.js artifact using the multi-stage `Dockerfile`:

1. **`deps` Stage**: Installs dependencies strictly from `package-lock.json` (`npm ci`).
2. **`builder` Stage**: Runs `prisma generate` to produce compiled Prisma Client bindings and executes `npm run build` with `output: "standalone"`.
3. **`runner` Stage**: Minimal Node.js 22 Alpine runtime containing only the standalone server and static assets, running under a non-root `nextjs` user.

## Production Environment Checklist

Before releasing to staging or production:

- [ ] `NODE_ENV=production` set.
- [ ] `DATABASE_URL` configured to high-availability PostgreSQL cluster (with connection pooler).
- [ ] `DIRECT_URL` configured with direct DDL access for running migrations.
- [ ] `REDIS_URL` configured to high-availability Redis cluster (TLS enabled).
- [ ] `AUTH_SECRET` generated with 32+ bytes of high entropy (`openssl rand -base64 32`).
- [ ] `NEXT_PUBLIC_APP_URL` set to production canonical domain (e.g. `https://app.schoolsaas.com`).
- [ ] Security headers verified (HSTS, CSP, X-Frame-Options).
- [ ] Automated database migrations executed via `npm run db:migrate:deploy` as a dedicated pre-release step.
- [ ] Health and readiness probes wired to `/api/health`.

## Database Migration in Production

```bash
# Executed in CI/CD pipeline prior to traffic cutover
npm run db:migrate:deploy
```

Rollback strategy:

- Non-destructive additive migrations are prioritized (forward-compatible).
- Destructive changes (column drops, table drops) require a two-phase rollout to avoid downtime during rolling container deployments.
