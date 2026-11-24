# Technology Stack Architecture

## Overview

The School Management SaaS application is designed as a secure, high-performance, multi-tenant modular monolith. It leverages modern TypeScript across the full stack with strict boundary enforcement, predictable data flow, and defense-in-depth isolation.

## Core Stack Matrix

| Layer                    | Technology                                | Version / Spec                | Primary Responsibility                                           |
| :----------------------- | :---------------------------------------- | :---------------------------- | :--------------------------------------------------------------- |
| **Frontend Framework**   | Next.js App Router                        | ^15.3                         | Server Components, streaming rendering, typed routing            |
| **UI Library**           | React                                     | ^19.1                         | Declarative component UI and concurrent rendering                |
| **Language**             | TypeScript                                | ^5.8                          | Strict type safety (`strict: true`, `noUncheckedIndexedAccess`)  |
| **Styling**              | Tailwind CSS                              | ^4.1                          | Utility-first responsive design and design tokens                |
| **Component Primitives** | Shadcn UI & Lucide Icons                  | New York / Slate              | Accessible UI primitives and consistent design system            |
| **Server State**         | TanStack Query                            | ^5.72                         | Client-side data synchronization and optimistic caching          |
| **Client State**         | Zustand                                   | ^5.0                          | Shared client-only interaction state                             |
| **Form Handling**        | React Hook Form & Zod                     | ^7.55 / ^3.24                 | Schema validation, accessible forms, error handling              |
| **Backend & Routing**    | Next.js Server Actions & Route Handlers   | Node.js Runtime               | Domain orchestration, input validation, mutations                |
| **ORM & Data Layer**     | Prisma ORM                                | ^6.6                          | Type-safe query generation, schema migrations                    |
| **Database**             | PostgreSQL                                | 16-alpine                     | ACID relational storage, constraints, Row-Level Security (RLS)   |
| **Caching & Queuing**    | Redis & BullMQ                            | Redis 7 / BullMQ ^5.44        | Ephemeral caching, rate limiting, reliable async jobs            |
| **Structured Logging**   | Pino                                      | ^9.6                          | Low-overhead JSON structured logs with redaction                 |
| **Authentication**       | Auth.js (NextAuth.js v5 beta)             | ^5.0.0-beta.25                | Standard session management, secure cookies, CSRF protection     |
| **Testing**              | Vitest, React Testing Library, Playwright | Vitest ^3.1, Playwright ^1.51 | Unit, integration, API contract, and browser E2E tests           |
| **Containerization**     | Docker & Docker Compose                   | Multi-stage Dockerfile        | Local development consistency and reproducible production builds |

## Architecture Decisions & Rationale

### 1. Next.js App Router & Server Components Default

- **Decision**: Default to React Server Components (RSC) for all presentation; client components (`use client`) are restricted to interactive leaves.
- **Rationale**: Eliminates data waterfall requests, keeps database logic and sensitive keys completely out of browser bundles, and minimizes client JavaScript footprint.

### 2. PostgreSQL with Prisma ORM

- **Decision**: PostgreSQL with Prisma ORM utilizing separate pooled application connections and direct migration connections.
- **Rationale**: PostgreSQL offers robust transactional guarantees (ACID), composite unique constraints preventing cross-tenant leakage, and Row-Level Security (RLS). Prisma provides compile-time query type safety and versioned migrations.

### 3. Redis & BullMQ for Asynchronous Jobs

- **Decision**: Redis backing BullMQ for durable asynchronous operations (e.g. notifications, report generation, bulk import processing).
- **Rationale**: Decouples CPU-intensive or high-latency operations from synchronous request-response cycles, preventing API timeouts and supporting automatic retries with exponential backoff.

### 4. Auth.js (NextAuth v5) vs Custom Auth vs External BaaS

- **Decision**: Auth.js with Prisma adapter and secure session cookies.
- **Rationale**: Avoids inventing proprietary cryptography or custom token security (OWASP recommendation). Provides defense-in-depth cookie attributes (`HttpOnly`, `SameSite=Lax`, `Secure`), built-in CSRF defenses, and runs natively in the application without per-user subscription fees or third-party vendor lock-in.

### 5. Pino Structured Logging

- **Decision**: Pino structured JSON logger with tenant and user contextualization.
- **Rationale**: Asynchronous, highly performant logging suitable for high-throughput containerized environments with automatic redaction of sensitive credentials, tokens, and PII.
