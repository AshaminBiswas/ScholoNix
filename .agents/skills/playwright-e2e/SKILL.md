---
name: playwright-e2e
description: Build robust Playwright end-to-end tests for core workflows.
---

# Playwright E2E Skill

## Workflow
1. Identify critical journeys and create stable test data through supported test setup.
2. Use role- and label-based locators; avoid brittle CSS/XPath selectors.
3. Test desktop and representative mobile viewport behavior.
4. Cover authentication, tenant switching, authorization denial, and key CRUD/financial workflows.
5. Capture traces, screenshots, and logs on failure.
6. Keep tests independent and clean up data safely.

## Guardrails
- Never run destructive E2E tests against production.
- Do not use real student personal data.
- Mock external providers at the boundary.
- Prefer assertions on user-visible outcomes over internal implementation.
