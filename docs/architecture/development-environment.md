# Development Environment Setup Guide

## System Prerequisites

- **Node.js**: `>= 20.18.0` (Recommended: Node 22+ LTS or Node 24)
- **Package Manager**: `npm` (`>= 10.0.0`)
- **Docker**: Docker Engine & Docker Compose v2 (recommended for PostgreSQL and Redis services)
- **Git**: For version control

## Initial Setup Steps

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd Saas
npm install
```

### 2. Configure Environment Variables

Copy the example environment configuration to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your connection strings:

- `DATABASE_URL`: Application pooled connection (e.g., `postgresql://school_app:replace_me@localhost:5432/school_saas?schema=public`)
- `DIRECT_URL`: Direct DDL connection for Prisma migrations (e.g., `postgresql://school_migrator:replace_me@localhost:5432/school_saas?schema=public`)
- `REDIS_URL`: Redis connection URL (e.g., `redis://localhost:6379`)
- `AUTH_SECRET`: Random 32+ character string (generate with `openssl rand -base64 32`)

### 3. Start Local Infrastructure via Docker

If Docker is available:

```bash
# Start PostgreSQL and Redis in the background with persistent volumes
npm run docker:up

# Verify services are healthy
docker compose ps
```

If Docker is not installed:

- Install PostgreSQL 16 locally, create database `school_saas` and user `school_app`.
- Install Redis locally and start on port 6379.
- Update `DATABASE_URL` and `REDIS_URL` in `.env.local`.

### 4. Initialize Database & Generate Prisma Client

```bash
# Generate the Prisma Client
npm run db:generate

# Run initial migrations
npm run db:migrate

# Seed development fixtures
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

## Available npm Scripts

| Command                     | Purpose                                         |
| :-------------------------- | :---------------------------------------------- |
| `npm run dev`               | Launch Next.js dev server with Turbopack        |
| `npm run build`             | Compile production standalone build             |
| `npm run start`             | Run compiled production server                  |
| `npm run lint`              | Run ESLint with architectural boundary rules    |
| `npm run typecheck`         | Run TypeScript compiler in strict no-emit mode  |
| `npm run format`            | Format all source files with Prettier           |
| `npm run format:check`      | Check source code formatting                    |
| `npm run test`              | Run all Vitest unit, integration, and API tests |
| `npm run test:watch`        | Run Vitest in interactive watch mode            |
| `npm run test:coverage`     | Run tests and generate code coverage report     |
| `npm run test:e2e`          | Run Playwright end-to-end browser tests         |
| `npm run db:generate`       | Regenerate Prisma Client                        |
| `npm run db:validate`       | Validate Prisma schema syntax and connections   |
| `npm run db:migrate`        | Apply new schema migrations in development      |
| `npm run db:migrate:deploy` | Apply pending migrations in production          |
| `npm run db:seed`           | Run deterministic database seeders              |
| `npm run db:studio`         | Launch visual Prisma Studio UI                  |
| `npm run docker:up`         | Start local Docker containers (Postgres, Redis) |
| `npm run docker:down`       | Stop local Docker containers                    |
