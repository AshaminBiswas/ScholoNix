---
name: payments
description: Integrate payment gateways with secure, idempotent financial processing.
---

# Payment Integration Skill

## Requirements
- Use a supported provider SDK and hosted/tokenized payment collection; never store raw card data.
- Create payment intents/orders server-side and calculate amount from authoritative invoice data.
- Verify webhook signatures and fetch provider state where appropriate.
- Make webhook processing idempotent with unique provider event IDs.
- Model pending, authorized, captured, failed, cancelled, refunded, and disputed states as applicable.
- Reconcile gateway settlements with internal payment ledger.
- Never mark an invoice paid solely from a browser redirect.
- Store provider references, not secrets or unnecessary payment details.

## Tests
Invalid signature, replay, duplicate event, out-of-order event, amount mismatch, timeout, and partial refund.
