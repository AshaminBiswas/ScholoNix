---
name: authentication
description: Implement secure authentication, session lifecycle, and account verification.
---

# Authentication Skill

## Requirements
- Use a maintained authentication library/provider where practical; do not invent cryptography.
- Hash passwords with a modern password-hashing algorithm and safe parameters if password auth is used.
- Use secure, HttpOnly, SameSite cookies; set Secure in production and protect state-changing requests against CSRF as applicable.
- Implement email/phone verification with expiring, single-use, rate-limited tokens or OTPs.
- Store only token hashes where feasible; never log OTPs or verification secrets.
- Never persist runtime auth tokens, verification tokens, sessions, or credentials to git-tracked files or directories (such as `.data/` or `*.tmp.*`). In test environments (`NODE_ENV === 'test'`), operate entirely in-memory. Ensure all local fallback directories and temp files are strictly excluded via `.gitignore`.
- Add login throttling, credential-stuffing defenses, session revocation, password reset, and account recovery.
- Support MFA for privileged roles where feasible.
- Normalize email/phone carefully and define verification states.

## Tests
Expired/reused OTP, brute force, session fixation, logout/revocation, reset token replay, and account enumeration behavior.
