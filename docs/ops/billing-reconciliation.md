# Billing Reconciliation Strategy (Phase 1 Contract)

- Status: Draft for Sprint 15.3 Phase 1
- Last updated: 2026-02-22
- Owners: Engineering, Product, Legal
- Scope: Deterministic entitlement reconciliation for `pro_lifetime_v1` across `stripe`, `ios_iap`, `android_iap`

## Purpose

Define the canonical reconciliation runtime contract for mobile-era multi-provider
billing, while preserving current replay-safe billing ledger and projection rules.

This artifact implements Sprint 15.3 Phase 1 Tasks 1.1-1.7.

## Provider State Normalization Contract (Task 1.1)

All provider inputs must normalize into a shared source-state shape before any
entitlement resolution.

### Canonical Source-State Shape

| Field                   | Type                                            | Required | Notes                                 |
| ----------------------- | ----------------------------------------------- | -------- | ------------------------------------- |
| `userId`                | string                                          | yes      | Atlas user id                         |
| `productKey`            | `pro_lifetime_v1`                               | yes      | Canonical product key                 |
| `provider`              | `stripe` \| `ios_iap` \| `android_iap`          | yes      | Source provider                       |
| `providerState`         | `active` \| `revoked` \| `pending` \| `unknown` | yes      | Normalized current state              |
| `confidence`            | `high` \| `medium` \| `low`                     | yes      | Revocation/grant confidence gate      |
| `stateObservedAt`       | datetime (UTC)                                  | yes      | Provider state observation timestamp  |
| `eventOccurredAt`       | datetime (UTC)                                  | no       | Provider event time if available      |
| `providerEventId`       | string \| null                                  | no       | Used for dedupe and traceability      |
| `providerTransactionId` | string \| null                                  | no       | Purchase/refund/dispute id            |
| `reasonCode`            | string \| null                                  | no       | Provider-specific reason              |
| `verificationStatus`    | `verified` \| `unverified`                      | yes      | Signature/server-verification outcome |
| `rawReference`          | string \| null                                  | no       | Pointer to raw payload record         |

### Normalization Rules

1. Unverified provider payloads must not produce `active` or `revoked`; they map
   to `pending` or `unknown`.
2. Missing required IDs (`providerEventId` and/or transaction identifiers for
   known event classes) lowers confidence to `low`.
3. Unsupported provider event types are ignored for projection updates and logged
   as diagnostics.
4. Normalization is append-only at the ledger layer and replay-safe by
   `(provider, providerEventId)` and `idempotencyKey` where applicable.

## Union-of-Valid-Sources Projection Algorithm (Task 1.2)

Entitlement is derived from normalized source states, not from any single source.

### Canonical Resolution Rule

- Let `S` be the set of source states for user + `pro_lifetime_v1`.
- A source contributes a valid grant when:
  - `providerState = active`
  - `verificationStatus = verified`
  - confidence is `high` or `medium`
- User is Pro when at least one source contributes a valid grant.

### Deterministic Resolution Steps

1. Build latest source snapshot per provider (`stripe`, `ios_iap`, `android_iap`)
   using event-time ordering, then received-time tiebreaker.
2. Evaluate valid grants set `G`.
3. If `G` is non-empty, projection status resolves to `active`.
4. If `G` is empty, evaluate revocation confidence gates (Task 1.5).
5. If revocation gates are unmet or any source is `pending/unknown`, do not
   revoke in the same transaction; resolve to `reconcile_pending`.
6. If revocation gates are met and no valid grants remain, resolve to `revoked`.

### Compatibility Mapping to Current Projection

Current `BillingEntitlementProjection` stores a single `status` and `provider`.
Until per-source projection storage is added:

- `status=active` when union result is active.
- `status=revoked` only when revocation gates pass conclusively.
- On `reconcile_pending`, keep prior `status` unchanged and emit diagnostics.
- `provider` is the deterministic primary source from active grants using:
  - newest `stateObservedAt`
  - provider precedence tiebreaker: `ios_iap` > `android_iap` > `stripe`

## `reconcile_pending` + Retry/Backoff Behavior (Task 1.3)

`reconcile_pending` is a reconciliation state, not an immediate entitlement
revocation state.

### Enter `reconcile_pending` When

- Provider verification is unavailable or times out.
- Source states conflict (for example grant vs revoke race).
- Required provider evidence is incomplete.
- Provider API/server notifications are temporarily degraded.

### Retry Policy

| Attempt window | Delay strategy                      |
| -------------- | ----------------------------------- |
| Attempts 1-3   | exponential backoff: 30s, 90s, 270s |
| Attempts 4-8   | exponential backoff capped at 15m   |
| Attempts 9-16  | fixed 30m intervals                 |
| Attempts 17+   | fixed 6h intervals (sweep-assisted) |

### Pending Guardrails

- Pending must never revoke active entitlement in the same transaction.
- Pending older than 72h triggers billing-ops alert and support visibility.
- Pending states are retried by both event-driven workers and scheduled sweep.

## Deterministic Trigger Matrix (Task 1.4)

| Trigger                              | Scope                 | Priority | Expected behavior                                                           |
| ------------------------------------ | --------------------- | -------- | --------------------------------------------------------------------------- |
| Provider webhook/server notification | Single provider event | High     | Normalize event, append ledger, run reconciliation once per event           |
| Authenticated sign-in                | User-level sync       | Medium   | Re-evaluate latest source snapshots and clear stale pending where possible  |
| Explicit restore/re-sync action      | User-requested sync   | High     | Force provider lookups and reconciliation run; record restore events        |
| Scheduled reconciliation sweep       | Batch/user set        | Low      | Retry unresolved `reconcile_pending`, recover missed provider notifications |

### Trigger Ordering Rules

1. Webhook/server notifications process first when present.
2. Concurrent trigger runs for the same user/product must coalesce by lock key:
   `reconcile:{userId}:{productKey}`.
3. Repeated runs with no new source state must be no-op safe.

## Revocation Confidence Requirements (Task 1.5)

Revocation requires explicit confidence checks to prevent false negatives.

Revocation is allowed only when all are true:

1. No valid grant source remains in union snapshot.
2. Every provider in scope is either:
   - conclusively `revoked` with verified evidence, or
   - conclusively `none/not purchased` from verified lookup.
3. No provider remains in `pending` or `unknown`.
4. Last successful reconciliation across providers is within freshness SLA:
   - event-driven path: within 15 minutes
   - sweep-only path: within 24 hours

If any requirement fails, result is `reconcile_pending` and entitlement remains
fail-safe.

## Observability Contract (Task 1.6)

Every reconciliation run must emit structured diagnostics fields:

| Field            | Type                                                           | Description                                    |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `reconcileRunId` | string                                                         | Unique run correlation id                      |
| `requestId`      | string \| null                                                 | API request correlation when applicable        |
| `userId`         | string                                                         | User being reconciled                          |
| `productKey`     | string                                                         | Canonical product key                          |
| `trigger`        | `webhook` \| `sign_in` \| `restore` \| `sweep`                 | Reconcile trigger type                         |
| `providersSeen`  | string[]                                                       | Providers considered in snapshot               |
| `sourceStates`   | object                                                         | Provider->state/confidence summary (sanitized) |
| `decision`       | `active` \| `revoked` \| `reconcile_pending` \| `no_change`    | Final resolver output                          |
| `changed`        | boolean                                                        | Whether projection changed                     |
| `dedupeReason`   | `event_id` \| `provider_event_id` \| `idempotency_key` \| null | Ingestion dedupe reason                        |
| `attempt`        | number                                                         | Retry attempt number                           |
| `nextRetryAt`    | datetime \| null                                               | Planned retry timestamp                        |
| `latencyMs`      | number                                                         | End-to-end reconcile duration                  |
| `errorCode`      | string \| null                                                 | Failure classification if any                  |

### Logging and Privacy Rules

- Never log full payment payload or raw PII beyond ids already required for ops.
- Preserve enough provider identifiers for support escalation traceability.
- Emit explicit metrics for pending-age buckets and revocation decisions.

## Scenario Tables (Task 1.7)

### Success Paths

| Scenario                              | Input                                             | Expected result                                        |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Stripe purchase success               | `stripe=active(high,verified)`, stores unset      | Projection `active`; source `stripe`                   |
| iOS restore success after webhook lag | `ios_iap=active(high,verified)`, `stripe=unknown` | Projection `active`; pending cleared once iOS verified |
| Android purchase plus Stripe revoked  | `android_iap=active`, `stripe=revoked`            | Projection remains `active` (union-of-valid-sources)   |

### Conflict Paths

| Scenario                                                   | Input                              | Expected result                      |
| ---------------------------------------------------------- | ---------------------------------- | ------------------------------------ |
| Refund event arrives while another provider remains active | `stripe=revoked`, `ios_iap=active` | Stay `active`; no revoke             |
| Provider event missing transaction id                      | `android_iap=pending(low)`         | `reconcile_pending`, retry scheduled |
| Out-of-order event replay                                  | duplicate provider event id        | No state drift; dedupe path recorded |

### Outage/Degradation Paths

| Scenario                                | Input                           | Expected result                                     |
| --------------------------------------- | ------------------------------- | --------------------------------------------------- |
| Provider verification endpoint timeout  | latest state cannot be verified | `reconcile_pending`; keep existing entitlement      |
| Missed notifications recovered by sweep | stale pending > sweep interval  | Sweep retries and converges state deterministically |
| Prolonged unresolved pending (>72h)     | repeated retries exhausted      | Escalate to billing ops/support; do not auto-revoke |

## Implementation Notes

- Strategy aligns with existing canonical events, idempotency rules, and
  append-only ledger contracts in Sprint 15.1/15.2.
- Current runtime already supports replay-safe append+project behavior; this
  document defines multi-provider reconciliation behavior for mobile launch.
- Any schema changes required for explicit per-source persisted snapshots are
  implementation-sprint scope, not this strategy sprint.
