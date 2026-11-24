---
name: domain-driven-design
description: Model school-management domains and enforce clear module boundaries.
---

# Domain-Driven Design Skill

## Workflow
1. Identify business capabilities and bounded contexts: Identity, Tenant/School Setup, Academics, Students, Staff, Attendance, Fees, Exams, Timetable, Communication, Transport, Library, HR/Payroll, Reporting, and Platform Billing.
2. Define ubiquitous language with the user; resolve ambiguous terms such as class, grade, section, session, term, invoice, receipt, and guardian.
3. Identify aggregate roots, invariants, lifecycle transitions, and ownership of writes.
4. Keep cross-context integration explicit through application services, domain events, or stable interfaces.
5. Avoid duplicating authoritative data. Use references or read models where appropriate.

## Deliverables
- Context map
- Glossary
- Aggregate and entity definitions
- Invariants and lifecycle diagrams
- Ownership matrix for tables and APIs

## Guardrails
- Do not create a generic `status` or `type` field without enumerated meaning.
- Do not allow modules to update another module's tables arbitrarily.
- Prefer explicit domain operations over generic CRUD for financial and academic workflows.
