# Application Architecture & Layering Model

## Architecture Paradigm: Modular Monolith

The application is structured as a **Modular Monolith** built on the Next.js App Router. All school business domains are organized into distinct modules under `src/modules/` with strict boundaries, high cohesion, and loose coupling.

```
src/
├── app/                  # Next.js App Router (Layouts, Pages, Routes, Route Handlers)
│   ├── (auth)/           # Authentication flows (login, reset, verify)
│   ├── (school)/         # School administrator & staff workspace
│   ├── (platform)/       # Super-admin multi-tenant control plane
│   ├── (parent)/         # Guardian portal
│   ├── (student)/        # Student self-service portal
│   ├── (marketing)/      # Public marketing landing pages
│   └── api/              # Public REST API & Webhooks
├── components/           # Domain-agnostic UI primitives & design system
│   ├── ui/               # Shadcn UI primitives (Button, Input, Card, etc.)
│   ├── layout/           # Global shells, sidebars, headers
│   └── feedback/         # Modals, toasts, alerts
├── config/               # Global static application configuration
├── hooks/                # Reusable client hooks
├── lib/                  # Shared utilities and foundational libraries
│   ├── configuration/    # Zod-validated environment config
│   ├── errors/           # Standard application error hierarchy
│   ├── formatters/       # Date, currency, string formatters
│   ├── logger/           # Pino structured logging
│   └── utils/            # General helpers (cn, etc.)
├── modules/              # Domain-specific business modules
│   └── [module-name]/    # e.g., students, fees, attendance
│       ├── components/   # Module-scoped UI components
│       ├── hooks/        # Module-scoped React hooks
│       ├── schemas/      # Module-scoped Zod validation schemas
│       ├── services/     # Module business logic and rules
│       ├── repositories/ # Tenant-scoped data access queries
│       └── types/        # Domain type definitions
├── providers/            # React context providers (QueryClientProvider, Theme)
├── server/               # Privileged server-only infrastructure (NEVER in client bundle)
│   ├── auth/             # Session, cookie, and identity management
│   ├── authorization/    # RBAC permissions and access policies
│   ├── database/         # Prisma client singleton and health checks
│   ├── integrations/     # Third-party adapters (Redis, BullMQ, Email)
│   ├── jobs/             # Tenant-scoped background queues
│   ├── repositories/     # Base tenant repository abstraction
│   ├── security/         # Audit logging and threat mitigation
│   └── tenant/           # Tenant context resolution and AsyncLocalStorage
├── stores/               # Zustand client state stores
└── types/                # Global ambient TypeScript declarations
```

## Layer Dependency Direction

To prevent spaghetti dependencies and data leaks, import directions are strictly enforced:

```
[UI Components / Pages]
        │
        ▼ (calls)
[Server Actions / Route Handlers]
        │
        ▼ (invokes)
[Domain Services (src/modules/*/services)]
        │
        ▼ (queries via)
[Tenant Repositories (src/modules/*/repositories)]
        │
        ▼ (accesses)
[Prisma Client / PostgreSQL]
```

### Architectural Guardrails

1. **Client Isolation**: `src/server/**` and `src/lib/configuration/env.ts` must never be imported into client components (`use client`). Enforced via `server-only` package and ESLint `no-restricted-imports`.
2. **Repository Boundary**: Presentation components cannot query repositories directly; all interactions must pass through domain services with explicit validation and authorization checks.
3. **Tenant Invariant**: Every query interacting with tenant-owned tables must filter by the validated `schoolId` obtained from trusted server context.

## State Management Strategy

1. **Server State (Default)**: Leverages React Server Components for initial data retrieval directly from domain services. For interactive client views requiring live revalidation, pagination, or optimistic updates, `@tanstack/react-query` is utilized.
2. **Client State**: Local state is kept in `useState` / `useReducer`. Global shared client state (such as UI drawer state, user preferences, active filters) is managed with lightweight `zustand` stores.
3. **Form State**: Complex forms are managed with `react-hook-form` paired with `zod` validation schemas via `@hookform/resolvers/zod`.
