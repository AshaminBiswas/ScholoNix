---
name: application-security
description: Review application code for common web security vulnerabilities.
---

# Application Security Review Skill

## Review checklist
- OWASP Top 10: broken access control, cryptographic failures, injection, insecure design, misconfiguration, vulnerable components, authentication failures, integrity failures, logging/monitoring failures, and SSRF.
- Validate and constrain all input; use parameterized database queries.
- Escape output according to context and sanitize rich HTML with a maintained sanitizer.
- Protect file uploads with type/size limits, content inspection, random storage names, private access, and malware scanning where appropriate.
- Prevent SSRF by restricting outbound destinations and validating redirects.
- Set secure headers, CSP, CORS allow-lists, and rate limits.
- Keep secrets in a secret manager/environment; never commit them.
- Never commit runtime data, local state stores, `.data/`, fallback `.json`, or temporary files (`*.tmp.*`) containing tokens, sessions, or credentials to Git. Run automated secret scanning (`node scripts/scan-secrets.js`) to enforce zero secrets in the repository.
- Review dependencies and lockfiles.

## Output
For each finding: severity, affected path, exploit scenario, evidence, remediation, and regression test. Do not claim a security audit is complete without testing.
