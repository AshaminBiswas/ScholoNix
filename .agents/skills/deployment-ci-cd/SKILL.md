---
name: deployment-ci-cd
description: Create reproducible build, test, migration, and deployment pipelines.
---

# Deployment and CI/CD Skill

## Pipeline
- Install from lockfile.
- Lint, type-check, unit/integration tests, build, and security/dependency checks.
- Build immutable artifacts and promote the same artifact between environments where possible.
- Run reviewed database migrations as a controlled deployment step.
- Use health checks and smoke tests after release.
- Define rollback and forward-fix strategy, including database compatibility.

## Guardrails
- Never print secrets in CI logs.
- Require approvals for production and destructive migrations.
- Keep staging representative but use synthetic data.
- Pin action/tool versions where practical.
