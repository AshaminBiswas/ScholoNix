# School Management SaaS

A production-oriented **Multi-Tenant School Management SaaS** foundation built on a **Modular Monolith** architecture using Next.js App Router, strict TypeScript, Tailwind CSS, Shadcn UI, PostgreSQL, Prisma, Redis, Vitest, and Playwright.

## Technology Stack

- **Framework & UI**: Next.js (App Router), React, TypeScript (strict mode), Tailwind CSS v4, Shadcn UI
- **Data & Persistence**: PostgreSQL 16, Prisma ORM, Redis 7
- **Validation, Forms & State**: Zod, React Hook Form, TanStack Query, Zustand
- **Testing**: Vitest (unit, integration, API, security) + Playwright (E2E)
- **Infrastructure**: Docker multi-stage standalone build, Docker Compose, GitHub Actions CI

## Architecture Overview

- **Modular Monolith (`src/modules/`)**: 31 isolated business domains covering platform administration, multi-tenant school setup, academics, admissions, students, guardians, staff, attendance, timetable, exams/results, fees/invoices/payments, optional operations (transport, library, hostel, HR, payroll), communication, reports, analytics, and SaaS subscriptions.
- **Privileged Server Core (`src/server/`)**: Server-only infrastructure (`auth`, `database`, `tenant`, `authorization`, `services`, `repositories`, `jobs`, `integrations`, `security`) guarded by `server-only` and ESLint boundary rules.
- **Portal Route Groups (`src/app/`)**: `(marketing)`, `(auth)`, `(platform)`, `(school)`, `(parent)`, `(student)`, and `api/`.

### Architecture Documentation

- [System Architecture](docs/architecture/system-architecture.md)
- [Folder Structure](docs/architecture/folder-structure.md)
- [Module Boundaries](docs/architecture/module-boundaries.md)
- [Module Template](docs/modules/module-template.md)
- [Database Architecture](docs/database/database-architecture.md)
- [Tenant Isolation](docs/security/tenant-isolation.md)
- [RBAC Architecture](docs/security/rbac-architecture.md)
- [API Architecture](docs/api/api-architecture.md)
- [Testing Strategy](docs/testing/testing-strategy.md)
- [Deployment Architecture](docs/deployment/deployment-architecture.md)

## Local Setup Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
3. **Start local PostgreSQL and Redis**:
   ```bash
   docker compose up -d postgres redis
   ```
4. **Validate Prisma & run quality checks**:
   ```bash
   npm run db:validate
   npm run db:generate
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```

## Agent Skills & Engineering Governance

This repository includes project-local Agent Skills under `.agents/skills/` (indexed in [SKILL-INDEX.md](SKILL-INDEX.md)) and project-wide rules in [AGENTS.md](AGENTS.md).

### Operating Rules

- Read the relevant skill in `.agents/skills/` before starting work in any domain.
- Skills are guidance, not proof that generated code is secure or correct.
- Require reviewed migrations, automated tests, and security review for schema, RBAC, tenant-isolation, or financial changes.
- Use exclusively synthetic student/guardian/staff data in development and testing.
- Do not deploy to production until tenant isolation, financial integrity, backups, and restore procedures are verified.
