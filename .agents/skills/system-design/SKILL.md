---
name: system-design
description: Design and evolve the end-to-end architecture of a production multi-tenant school management SaaS.
---

# System Design Skill

## When to use
Use before creating a new module, changing cross-module behavior, introducing infrastructure, or making architectural decisions.

## Required workflow
1. Read the existing repository structure, package manifests, environment examples, database schema, and current architecture notes before proposing changes.
2. Identify actors, use cases, system boundaries, trust boundaries, data ownership, integrations, and non-functional requirements.
3. Record assumptions explicitly. Do not invent requirements silently.
4. Prefer modular monolith architecture until measured scale or team boundaries justify services. Keep domain modules independently testable.
5. Define request/data flows, failure modes, consistency needs, background work, and operational dependencies.
6. Compare at least two viable options for high-impact decisions and explain trade-offs.
7. Produce an Architecture Decision Record (ADR) for decisions affecting data, security, deployment, or public APIs.

## Deliverables
- Context/container/component diagrams (Mermaid where useful)
- Module boundaries and dependency direction
- Data-flow and sequence diagrams for critical workflows
- Reliability, scaling, observability, and migration considerations
- ADR with decision, alternatives, consequences, and rollback approach

## Guardrails
- Never introduce microservices, queues, caches, or abstractions without a concrete need.
- Keep business rules out of UI components and transport controllers.
- Avoid circular dependencies and hidden cross-module writes.
- Design for tenant isolation, auditability, accessibility, and mobile-first usage from the start.
