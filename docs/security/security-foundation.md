# Application Security Foundation

## OWASP Top 10 Mitigation Strategy

| Vulnerability                               | Mitigation Strategy in School SaaS Architecture                                                                                                                                                       |
| :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01: Broken Access Control**              | Server-side tenant resolution via trusted session; fine-grained RBAC matrix; base tenant repository automatically scopes queries with `schoolId`. Direct object reference (IDOR) attacks fail closed. |
| **A02: Cryptographic Failures**             | Strict TLS 1.3 in transit; sensitive database columns encrypted at rest; Auth secrets verified via high-entropy environment validation (minimum 32 characters); no custom crypto implementations.     |
| **A03: Injection**                          | Parameterized SQL queries via Prisma ORM; input schema validation on all API endpoints and Server Actions via Zod; typed route params.                                                                |
| **A04: Insecure Design**                    | Threat modeling per module; financial operations designed as idempotent state machines with ledger balance checks and audit logging; isolated student records.                                        |
| **A05: Security Misconfiguration**          | Content Security Policy (CSP) and strict HTTP security headers configured in `next.config.ts`; minimal Alpine Docker images running non-root `nextjs` user.                                           |
| **A06: Vulnerable Components**              | Pinned dependencies in lockfile; automated GitHub Actions dependency audit and Dependabot scanning.                                                                                                   |
| **A07: Identification & Auth Failures**     | Auth.js (NextAuth v5) using secure cookies (`HttpOnly`, `SameSite=Lax`, `Secure`); rate-limited login endpoints via Redis token bucket; session revocation support.                                   |
| **A08: Software & Data Integrity**          | CI/CD pipeline builds immutable Docker artifacts; migrations reviewed in code; audit log hashing.                                                                                                     |
| **A09: Logging & Monitoring Failures**      | Structured Pino logging with automatic redaction of secrets, tokens, passwords, and cookie values; unhandled error tracking via Sentry-ready interfaces.                                              |
| **A10: Server-Side Request Forgery (SSRF)** | Restrict outbound HTTP webhooks to validated domain allowlists; block calls to internal IP ranges (127.0.0.1, 169.254.169.254, RFC 1918).                                                             |

## HTTP Security Headers

Configured in `next.config.ts` for all routes:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Server-Only Boundary Enforcement

To ensure zero database credentials, private keys, or server utilities ever leak to the browser:

1. `import "server-only"` is added to all modules in `src/server/**` and `src/lib/configuration/env.ts`.
2. ESLint `no-restricted-imports` forbids client components and presentation layers from importing anything from `@/server` or `@prisma/client`.
