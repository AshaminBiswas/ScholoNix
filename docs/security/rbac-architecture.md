# RBAC & Authorization Architecture

## 1. Core Principles

- **Separate Platform and School Scopes**: Platform-level roles (e.g., Super Admin) are modeled independently from school-level memberships and roles.
- **Server-Side Enforcement Only**: Hiding navigation items or buttons in UI portals (`(platform)`, `(school)`, `(parent)`, `(student)`) is UX convenience only. Every Server Component read, Server Action, and Route Handler MUST verify authorization inside `src/server/authorization/` and the owning module's `services/` layer.
- **Deny by Default**: Access is denied unless an explicit permission grant and matching tenant/object scope are satisfied.
- **Auditability**: All role assignments, permission edits, and privileged platform actions must emit tamper-resistant audit records.

## 2. Planned Role Hierarchy & Scope Model

| Scope                       | Example Roles                                                                            | Data Visibility Boundary                                                                                                                                           |
| :-------------------------- | :--------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Platform**                | `PLATFORM_SUPER_ADMIN`, `PLATFORM_SUPPORT`                                               | Global platform settings, school provisioning, SaaS subscriptions; tenant data access only via explicit audited support workflow                                   |
| **School Administration**   | `SCHOOL_OWNER`, `SCHOOL_ADMIN`, `PRINCIPAL`                                              | All permitted operational records within their assigned `schoolId`                                                                                                 |
| **School Functional Staff** | `TEACHER`, `ACCOUNTANT`, `LIBRARIAN`, `TRANSPORT_MANAGER`, `HR_MANAGER`, `HOSTEL_WARDEN` | Domain-restricted permissions within their assigned `schoolId` (e.g., teachers scoped to assigned sections/subjects; accountants scoped to fees/invoices/payments) |
| **External School Members** | `PARENT` (Guardian)                                                                      | Strictly limited to linked students (`student_guardians` relationship) within their `schoolId`                                                                     |
| **Student**                 | `STUDENT`                                                                                | Strictly limited to their own profile, timetable, attendance, and published results within their `schoolId`                                                        |

_Note: Exact permission matrices must be confirmed per module before implementation; these roles reflect the architectural actors defined for the platform._

## 3. Permission Format & Evaluation

Permissions follow a resource-action convention: `<domain>:<resource>:<action>` (for example, `students:profile:read`, `attendance:register:mark`, `fees:invoice:issue`, `fees:payment:refund`).

Every protected service entrypoint follows a 4-step authorization gate:

1. **Authenticate**: Verify session via `src/server/auth/`.
2. **Resolve Tenant Membership**: Load active membership and assigned roles for the target `schoolId` via `src/server/tenant/`.
3. **Check Capability Permission**: Confirm the caller's role/permission set includes the required capability via `src/server/authorization/`.
4. **Enforce Object-Level Scope**: Verify ownership or assignment constraints (e.g., teacher is assigned to section X; guardian is linked to student Y; student matches self).

## 4. Module & File Locations

- `src/server/authorization/`: Centralized permission evaluator, policy helpers, and typed `ForbiddenError` / `UnauthorizedError` primitives (to be implemented with the auth & RBAC foundation).
- `src/modules/roles-permissions/`: Role and permission management UI, schemas, services, and repositories.
- `src/modules/users/`: User accounts and multi-school membership management.
- `tests/security/`: Negative authorization tests verifying every role boundary (401 unauthenticated, 403 unauthorized role, 403/404 cross-tenant and cross-object access).
