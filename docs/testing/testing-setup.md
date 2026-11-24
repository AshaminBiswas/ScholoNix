# Testing Strategy & Setup

## Testing Architecture

The test suite is organized into distinct, isolated layers using **Vitest** for fast in-memory execution and **Playwright** for browser-level end-to-end testing:

```
tests/
├── unit/           # Fast, pure unit tests (functions, schemas, state logic)
├── integration/    # Database constraints, repositories, service interactions
├── api/            # HTTP Route Handlers, status codes, input validation contracts
├── security/       # Multi-tenant isolation, unauthorized access, RLS, CSRF
├── e2e/            # Full-stack browser smoke tests and critical workflows (Playwright)
└── fixtures/       # Deterministic, synthetic test data and mock generators
```

## Running Tests

### Unit, Integration, API, & Security Tests (Vitest)

```bash
# Run all Vitest suites once
npm run test

# Run tests in watch mode during development
npm run test:watch

# Generate code coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:api
npm run test:security
```

### End-to-End Tests (Playwright)

```bash
# Run Playwright tests against local server (http://localhost:3000)
npm run test:e2e
```

## Critical Testing Standards (AGENTS.md)

1. **Synthetic Data Only**: Never use real student, guardian, or staff PII in tests or fixtures.
2. **Tenant A/B Isolation Tests**: Security tests must create two separate school contexts (`School_A` and `School_B`) and assert that `School_A` credentials cannot read, mutate, or infer data belonging to `School_B`.
3. **Deterministic Fixtures**: All fixtures must be reproducible and isolated; tests must not depend on state left behind by other test suites.
