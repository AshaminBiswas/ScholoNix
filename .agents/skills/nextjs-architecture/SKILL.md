---
name: nextjs-architecture
description: Apply maintainable Next.js App Router architecture and rendering patterns.
---

# Next.js Architecture Skill

## Workflow
1. Inspect the installed Next.js version and existing conventions; follow the version actually in use.
2. Use App Router conventions and colocate route-specific components, schemas, and tests sensibly.
3. Default to Server Components. Add `use client` only for interactivity, browser APIs, or client state.
4. Keep secrets, database access, and privileged operations in server-only modules.
5. Use Server Actions or Route Handlers intentionally; validate every untrusted input at the boundary.
6. Define loading, error, not-found, empty, and unauthorized states for each significant route.
7. Use caching only after classifying data as static, tenant-scoped, user-scoped, or volatile. Never allow cached responses to cross tenant or user boundaries.

## Standards
- Separate domain services, data-access code, schemas, and presentation.
- Use typed route params and centralized URL/query parsing.
- Avoid giant page components; extract domain-focused components.
- Keep metadata, canonical URLs, sitemap and robots behavior intentional.
- Document runtime requirements for Node/Edge; do not move database code to Edge without verifying driver support.

## Review checklist
- No client bundle contains secrets or privileged database logic.
- No accidental dynamic rendering or caching regressions.
- All mutations have authorization, validation, error handling, and tests.
