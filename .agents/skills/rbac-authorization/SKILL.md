---
name: rbac-authorization
description: Design role-based and permission-based authorization for school staff and platform users.
---

# RBAC and Authorization Skill

## Workflow
1. Define roles, permissions, resource scope, and allowed actions.
2. Separate platform roles from school roles.
3. Model school membership explicitly; one user may belong to multiple schools if product rules allow.
4. Use permission checks in server-side services, not only navigation visibility.
5. Apply object-level and tenant-level checks to every read and mutation.
6. Define permission inheritance and deny behavior explicitly.
7. Audit privileged role changes and permission grants.

## School role examples
Platform Super Admin, School Owner/Admin, Principal, Teacher, Accountant, Librarian, Transport Manager, HR, Parent, and Student. Treat these as examples; confirm actual permission matrix.

## Deliverables
Role-permission matrix, authorization helper design, protected-route inventory, and negative tests.
