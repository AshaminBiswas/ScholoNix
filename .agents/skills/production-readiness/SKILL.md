---
name: production-readiness
description: Assess whether a feature or release is safe for production.
---

# Production Readiness Audit Skill

## Audit gates
- Functional requirements and acceptance criteria met.
- Authentication, authorization, tenant isolation, and sensitive-data controls verified.
- Schema constraints, migrations, backup, and recovery reviewed.
- Unit, integration, API, E2E, accessibility, and security tests appropriate to risk passed.
- Performance measured with realistic data and concurrency.
- Logs, metrics, alerts, dashboards, and runbooks exist.
- Rate limits, quotas, abuse controls, and failure handling are defined.
- Privacy, retention, consent, and applicable legal review completed.
- Deployment, rollback, feature flags, and customer support plan ready.

## Output
Use PASS / FAIL / NOT VERIFIED for each gate. List evidence, severity, owner, and release blocker status. Never label a release production-ready when critical controls are unverified.
