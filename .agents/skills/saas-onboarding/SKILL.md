---
name: saas-onboarding
description: Design secure school registration, tenant provisioning, verification, and onboarding.
---

# SaaS School Onboarding Skill

## Workflow
- Collect only necessary school and owner details.
- Verify phone; make email optional or required according to the product's stated policy.
- Normalize and validate identifiers; avoid duplicate tenant creation under concurrent requests.
- Create school, owner membership, default academic settings, and onboarding state transactionally or through an idempotent provisioning workflow.
- Keep tenant inactive or limited until required verification/approval is complete.
- Use expiring single-use verification challenges and rate limits.
- Provide clear recovery for interrupted provisioning.

## Security
Never let a public registration payload assign platform roles, subscription entitlements, verified flags, or arbitrary tenant IDs.
