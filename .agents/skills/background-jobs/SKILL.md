---
name: background-jobs
description: Design reliable asynchronous jobs, notifications, imports, and scheduled tasks.
---

# Background Jobs Skill

## Use cases
Bulk imports, report generation, email/SMS notifications, recurring fee reminders, exports, file processing, and scheduled reconciliation.

## Requirements
- Use a durable queue when work must survive process restarts; do not rely on in-memory timers in serverless deployments.
- Make jobs idempotent and safe to retry.
- Define retry policy, exponential backoff, dead-letter handling, timeout, concurrency, and rate limits.
- Store job state and provide operational visibility.
- Pass tenant context explicitly and re-check authorization for user-triggered jobs.
- Avoid putting unnecessary student or guardian personal data in queue payloads; use references.
- Ensure duplicate notifications and duplicate financial side effects are prevented.

## Deliverables
Job contract, lifecycle, retry policy, monitoring metrics, and failure recovery runbook.
