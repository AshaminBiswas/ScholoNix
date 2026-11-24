# Folder Structure

This document describes the actual directory layout created in the repository and the ownership rule for every top-level and `src/` folder.

## 1. Naming & Structural Conventions

- **Directories**: lowercase `kebab-case` (e.g., `roles-permissions`, `academic-years`, `data-table`).
- **Files**: lowercase `kebab-case` across TypeScript, React components, routes, and docs (e.g., `student-list.tsx`, `student.service.ts`), matching Next.js App Router and Shadcn UI conventions.
- **Import Alias**: Single consistent path alias `@/*` mapped to `./src/*` in `tsconfig.json`, `vitest.config.ts`, and `components.json`.
- **No Empty Stub Code**: Unimplemented directories currently contain `.gitkeep` markers instead of empty `.ts`/`.tsx` placeholders.

## 2. Root Layout

```text
school-management-saas/
├── .agents/skills/          # Preserved project-local AI agent skills (39 domain skills)
├── .github/
│   ├── workflows/ci.yml     # CI pipeline (validate, lint, typecheck, test, build)
│   └── ISSUE_TEMPLATE/      # Bug report and feature request templates
├── docs/                    # Architecture, DB, API, security, module, testing, deployment docs
├── prisma/
│   ├── schema.prisma        # PostgreSQL datasource & generator foundation
│   ├── migrations/          # Reviewed Prisma SQL migrations (populated per feature)
│   ├── seed.ts              # Guarded development seed entrypoint (synthetic data only)
│   └── seeds/               # Modular domain seeders (added with approved models)
├── public/                  # Static assets: images/, icons/, fonts/
├── scripts/                 # Operational scripts: database/, maintenance/, development/
├── src/                     # Application source code
├── tests/                   # Layered tests: unit/, integration/, api/, e2e/, security/, fixtures/
├── .env.example             # Environment variable contract (no real secrets)
├── .gitignore               # VCS ignore rules
├── AGENTS.md                # Preserved repository-wide engineering governance
├── SKILL-INDEX.md           # Preserved index of .agents/skills/
├── components.json          # Shadcn UI configuration
├── docker-compose.yml       # Local PostgreSQL 16 + Redis 7 (+ optional full-stack profile)
├── Dockerfile               # Multi-stage non-root production container build
├── eslint.config.mjs        # Flat ESLint config with server/client boundary rules
├── next.config.ts           # Standalone output, strict mode, typedRoutes, security headers
├── package.json             # Project scripts and curated dependencies
├── playwright.config.ts     # Playwright E2E test runner config
├── postcss.config.mjs       # Tailwind CSS v4 PostCSS plugin
├── tsconfig.json            # Strict TypeScript config with @/* path alias
├── vitest.config.ts         # Vitest config for unit/integration/api/security suites
└── README.md                # Repository entry documentation
```

## 3. `src/` Layer Breakdown

| Directory           | Responsibility                                                                                                                                                                                                                                                         | Allowed Consumers                                                               |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `src/app/`          | Next.js App Router pages, layouts, route groups, error/loading boundaries, and HTTP Route Handlers (`api/`). Thin transport and composition layer only.                                                                                                                | Next.js runtime                                                                 |
| `src/components/`   | Reusable, domain-agnostic UI primitives (`ui/` for Shadcn), shared widgets (`shared/`), shells (`layout/`), menus (`navigation/`), table primitives (`data-table/`), form controls (`forms/`), chart wrappers (`charts/`), and toast/alert/empty states (`feedback/`). | `src/app/*`, `src/modules/*/components/*`                                       |
| `src/modules/`      | 31 vertical business domain modules. Each module encapsulates its own UI, hooks, schemas, actions, services, repositories, constants, types, and utilities.                                                                                                            | `src/app/*` and explicit cross-module service calls                             |
| `src/server/`       | Privileged, server-only cross-cutting infrastructure: `auth/`, `database/`, `tenant/`, `authorization/`, `services/`, `repositories/`, `jobs/`, `integrations/`, `security/`, plus `server-only.ts`.                                                                   | Server Components, Route Handlers, Server Actions, module services/repositories |
| `src/lib/`          | Pure shared helpers and cross-cutting utilities: `utils/cn.ts`, `constants/`, `formatters/`, `validators/`, `logger/`, and `configuration/env.ts` (server-only).                                                                                                       | Shared (`configuration/env.ts` is server-only)                                  |
| `src/hooks/`        | Shared client-side React hooks (not tied to a single business module).                                                                                                                                                                                                 | Client components                                                               |
| `src/providers/`    | Root and portal React context providers (TanStack Query, theme, etc.).                                                                                                                                                                                                 | `src/app/*/layout.tsx`                                                          |
| `src/stores/`       | Minimal global client UI state (Zustand stores; never authoritative server data).                                                                                                                                                                                      | Client components                                                               |
| `src/types/`        | Shared TypeScript contracts (pagination, API envelopes, session shapes, tenant context).                                                                                                                                                                               | Any layer                                                                       |
| `src/config/`       | Static application configuration (`site.ts`, navigation definitions, feature flags).                                                                                                                                                                                   | Any layer (non-secret values only)                                              |
| `src/middleware.ts` | Edge-compatible request boundary (request ID propagation and coarse routing).                                                                                                                                                                                          | Next.js Edge runtime                                                            |

## 4. Existing Foundation Files Currently Present in `src/`

- `src/app/layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `page.tsx`, `globals.css`
- `src/app/api/health/route.ts`
- `src/config/site.ts`
- `src/lib/utils/cn.ts`
- `src/lib/configuration/env.ts`
- `src/server/server-only.ts`
- `src/middleware.ts`
