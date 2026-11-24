---
name: fees-finance
description: Build accurate fee plans, invoices, collections, receipts, concessions, refunds, and dues.
---

# Fees and Financial Integrity Skill

## Core concepts
Fee heads, fee structures, student fee assignments, installments, invoices/demand notices, payments, allocations, receipts, concessions, waivers, refunds, and outstanding balances.

## Non-negotiable rules
- Use integer minor units or PostgreSQL `numeric`; never floating point for money.
- Define currency and rounding policy.
- Keep invoices, payments, allocations, and refunds as separate immutable or controlled lifecycle records.
- Do not calculate balance from client input; calculate on the server from authoritative ledger entries.
- Use database transactions and idempotency keys for payment posting.
- Never edit a posted receipt silently; use reversal/refund/adjustment workflows with audit trail.
- Reconcile gateway callbacks using signature verification and server-side status checks.
- Support partial payments and allocation across fee heads/installments only with explicit rules.

## Deliverables
Ledger model, state machine, reconciliation flow, reports, and tests for duplicate callbacks and concurrent payments.
