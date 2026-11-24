---
name: code-review
description: Perform rigorous, actionable code reviews before merging changes.
---

# Code Review Skill

## Review order
1. Correctness and business invariants.
2. Security, tenant isolation, and authorization.
3. Data integrity, transaction boundaries, and migrations.
4. API compatibility and error handling.
5. Performance and scalability.
6. Accessibility and UX.
7. Maintainability, typing, and tests.

## Output format
- Blockers first, ordered by severity.
- Include file/line references, impact, reproduction scenario, and concrete fix.
- Distinguish confirmed defects from risks and style suggestions.
- Verify tests and relevant commands; never claim commands ran if they did not.
- Avoid nitpicks that do not improve correctness or maintainability.
