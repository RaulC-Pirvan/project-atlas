# Billing Source-of-Truth Boundaries

## Goal

Define ownership boundaries between external billing providers and Atlas billing runtime.
This keeps entitlement decisions deterministic, auditable, and replay-safe.

## System of Record by Concern

| Concern                                                             | Source of truth                  | Notes                                                                       |
| ------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| Canonical entitlement state shown to product APIs                   | Atlas entitlement projection     | `/api/pro/entitlement` and feature gates must read Atlas projection only.   |
| Financial lifecycle facts from providers                            | Provider events + signatures     | Stripe/store systems are authoritative for provider event occurrence.       |
| Canonical billing event history                                     | Atlas append-only billing ledger | Atlas stores normalized canonical events and never mutates historical rows. |
| Product semantics (`pro_lifetime_v1`)                               | Atlas product mapping            | Provider IDs are external references only.                                  |
| Provider raw identifiers (`price_id`, store product IDs, event IDs) | Provider payloads                | Stored as references, never as internal product semantics.                  |

## Runtime Boundary Rules

1. Inbound webhook/store payloads are untrusted until signature verification passes.
2. Provider payloads are normalized into canonical Atlas events before projection updates.
3. Projection updates are deterministic and replay-safe; duplicate events must not drift state.
4. Client apps are read-only consumers of entitlement state and cannot write entitlement truth.
5. Idempotency is enforced separately for webhook events and internal commands:
   - Webhooks/store callbacks: unique `(provider, provider_event_id)`
   - Internal commands: unique `idempotency_key`

## Provider vs Internal Responsibilities

- Provider responsibilities:
  - Generate and sign billing lifecycle events.
  - Own provider-side transaction identifiers and dispute/refund statuses.
- Atlas responsibilities:
  - Verify signatures and sanitize errors.
  - Persist immutable canonical events with integrity metadata (payload hash).
  - Project current entitlement state used by product authorization.
  - Preserve one-time Pro launch behavior while supporting subscription-compatible schema fields.

## One-Time Launch Default

- Launch product key: `pro_lifetime_v1`
- Launch plan type: `one_time`
- Subscription fields (`periodStart`, `periodEnd`, `autoRenew`) stay nullable and unused until subscription rollout.
