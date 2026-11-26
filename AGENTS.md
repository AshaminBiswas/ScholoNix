# Project-wide agent instructions

- Read the relevant skill before starting work in that domain.
- Inspect existing code and conventions before proposing or editing.
- Do not overwrite working code or change architecture without explaining the reason.
- For every feature, define acceptance criteria, authorization rules, data model impact, API contract, tests, and observability.
- Enforce tenant scope on every tenant-owned read/write, including background jobs, files, exports, caches, and reports.
- Every UI page, layout, component, modal, table, chart, illustration, loading skeleton, and error view MUST implement full **Light and Dark mode** parity using semantic CSS tokens (`src/app/globals.css`), Tailwind `dark:` variants, and `ThemeToggle` in navigation headers—never hardcode light-only colors without dark-mode equivalents, and verify WCAG 2.2 AA contrast in both themes (see `.agents/skills/light-dark-theme/SKILL.md`).
- Financial operations must be transactional, idempotent, auditable, and use exact decimal/minor-unit arithmetic.
- Never use real student/guardian data in development fixtures.
- Never commit runtime data, local stores, `.data/`, fallback `.json` files, tokens, or temporary files (`*.tmp.*`) to Git.
- Auth tokens, verification tokens, sessions, and credentials must never be written to tracked files; automated test suites must use ephemeral in-memory state only (`NODE_ENV === 'test'`).
- Keep `.gitignore` updated for any local cache or data directory; run `node scripts/scan-secrets.js` to ensure zero exposed secrets.
- Run applicable lint, type-check, tests, and build; report exactly what ran and what did not.
- Ask before destructive migrations, production changes, or irreversible data operations.
