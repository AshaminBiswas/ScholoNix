---
name: audit-logging
description: Implement tamper-resistant audit trails for sensitive school and financial actions.
---

# Audit Logging Skill

## Events to capture
Authentication/security events, role changes, student record changes, attendance corrections, fee adjustments, receipts, refunds, exports, imports, and configuration changes.

## Event fields
Actor, tenant, action, resource type/id, timestamp, request/correlation ID, outcome, and minimal before/after diff where legally and operationally appropriate.

## Rules
- Do not log passwords, OTPs, session tokens, payment card data, or unnecessary sensitive personal information.
- Audit records must be append-only for ordinary application roles.
- Restrict audit-log access and log access to audit logs where required.
- Define retention, export, and deletion policy consistent with applicable law and contracts.
- Make system-generated actions distinguishable from human actions.
