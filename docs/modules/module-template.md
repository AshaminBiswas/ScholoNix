# Standard Business Module Template

Every business domain under `src/modules/<domain>/` follows a consistent internal layout. Create **only** the subdirectories and files actually required by that module — never commit empty stub files.

## Reference Layout (`src/modules/students/`)

```text
src/modules/students/
├── components/                  # Domain UI components (Server or Client as needed)
│   ├── student-list.tsx
│   ├── student-form.tsx
│   ├── student-details.tsx
│   ├── student-filters.tsx
│   └── student-table-columns.tsx
├── hooks/                       # Client-only hooks (e.g., TanStack Query hooks)
│   └── use-students.ts
├── actions/                     # Next.js Server Actions (thin validated entrypoints)
│   └── student.actions.ts
├── services/                    # Business rules, RBAC, tenant enforcement, transactions
│   └── student.service.ts
├── repositories/                # Prisma data-access queries scoped by schoolId
│   └── student.repository.ts
├── schemas/                     # Zod validation schemas shared between forms & server
│   └── student.schema.ts
├── types/                       # Domain DTOs and TypeScript interfaces
│   └── student.types.ts
├── constants/                   # Enumerations, status maps, permission keys
│   └── student.constants.ts
├── utils/                       # Pure domain helper functions
│   └── student.utils.ts
└── index.ts                     # Optional client-safe public exports only
```

## Layer Responsibilities

- **`schemas/`**: Pure Zod schemas and inferred input types. Safe to import in both client forms (React Hook Form via `@hookform/resolvers/zod`) and server actions/routes.
- **`actions/`**: `"use server"` entrypoints that parse inputs with `schemas/`, resolve the authenticated tenant context via `src/server/tenant/`, call `services/`, and revalidate cache tags/paths.
- **`services/`**: Import `"server-only"` (or `@/server/server-only`). Enforce RBAC permissions, tenant boundaries, invariants, audit logging, and transactional orchestration.
- **`repositories/`**: Import `"server-only"`. Require explicit `schoolId` (for tenant-owned data) on every query, use explicit `select` clauses, and enforce pagination ceilings on list queries.
- **`components/` & `hooks/`**: Presentation and client state only. Never import from `services/`, `repositories/`, `@/server/*`, or `@prisma/client` (blocked by ESLint).
- **`index.ts`**: Never re-export server-only files (`services/`, `repositories/`) from a shared barrel imported by Client Components.
