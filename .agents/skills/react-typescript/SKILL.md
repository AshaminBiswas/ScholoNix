---
name: react-typescript
description: Build reliable React and TypeScript components with strong types and predictable state.
---

# React and TypeScript Engineering Skill

## Workflow
1. Inspect project conventions, component library, TypeScript strictness, and installed React version.
2. Define props and domain types explicitly; avoid `any`, unsafe casts, and duplicated interfaces.
3. Separate presentational components from data orchestration and domain logic.
4. Keep state as close as possible to its owner; derive values rather than duplicating state.
5. Handle loading, empty, error, success, disabled, and permission-denied states.
6. Use stable keys, accessible labels, semantic HTML, and controlled forms where appropriate.

## Standards
- Prefer small components with one clear responsibility.
- Use discriminated unions for complex state and API results.
- Memoize only when profiling or expensive calculations justify it.
- Avoid effect-driven state synchronization when derived state or event handlers suffice.
- Keep reusable components domain-neutral; keep school-specific behavior in feature modules.

## Tests
Test user-visible behavior, validation, keyboard interaction, and failure states. Do not test implementation details unnecessarily.
