---
name: notifications-communication
description: Build reliable email, SMS, push, and in-app communication workflows.
---

# Notifications and Communication Skill

## Requirements
- Separate notification intent, template, recipient resolution, delivery attempt, and provider response.
- Use tenant-specific templates and sender configuration with safe defaults.
- Respect consent, opt-out, quiet hours, and applicable messaging rules.
- Queue bulk sends; apply provider rate limits, retries, deduplication, and delivery status tracking.
- Avoid exposing recipients to each other in bulk messages.
- Keep secrets out of logs and provide delivery diagnostics.
- Use template variables with escaping and preview before sending.

## Tests
Duplicate sends, invalid recipients, provider outage, retry storms, opt-out, and tenant template isolation.
