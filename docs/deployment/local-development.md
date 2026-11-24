# Local Development Guide

## Quick Start

### 1. Environment Setup

```bash
# Clone and enter directory
cd Saas

# Copy configuration template
cp .env.example .env.local
```

### 2. Infrastructure Startup

Start PostgreSQL and Redis locally using Docker Compose:

```bash
npm run docker:up
```

Verify services:

```bash
docker compose ps
```

### 3. Database Initialization

```bash
# Generate Prisma Client
npm run db:generate

# Apply pending schema migrations
npm run db:migrate

# Seed development fixtures
npm run db:seed
```

### 4. Running the Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The process liveness check is available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Troubleshooting Common Issues

### Port Conflicts

- **Port 5432 in use**: Modify `POSTGRES_PORT` in `.env.local` (e.g. `POSTGRES_PORT=5433`) and update `DATABASE_URL` accordingly.
- **Port 6379 in use**: Modify `REDIS_PORT` in `.env.local` (e.g. `REDIS_PORT=6380`) and update `REDIS_URL`.

### Database Connection Refused

Ensure Docker is running and PostgreSQL container is healthy:

```bash
docker compose logs postgres
```
