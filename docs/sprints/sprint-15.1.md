# Sprint 15.1: Billing Architecture + Entitlement Abstraction - Project Atlas

**Duration**: TBD (6-8 days)  
**Status**: Planned  
**Theme**: Establish a web-first monetization runtime with durable, provider-aware entitlement architecture that keeps one-time Pro as launch default.

---

## Overview

Sprint 15.1 defines the billing and entitlement runtime foundation for Atlas Pro.

This sprint is architecture-first. The goal is to make launch behavior stable
for one-time Pro while keeping a clean migration path for future subscription
support without a rewrite.

**Core Goal**: ship a canonical entitlement model that is provider-aware,
idempotent, auditable, and safe to evolve.

---

## Locked Decisions (Confirmed)

1. **Web-first checkout rail**: Hosted Stripe Checkout.
2. **Launch offer**: One-time Pro remains launch default.
3. **Pricing strategy gate**: Formal launch pricing decision gate is required before release.
4. **Entitlement architecture**: Event ledger + current projection model.
5. **Provider awareness**: `manual`, `stripe`, `ios_iap`, `android_iap`.
6. **Canonical product key**: single internal Pro SKU (`pro_lifetime_v1`) mapped to provider product IDs.
7. **Canonical events + idempotency**: standardized event taxonomy and replay-safe processing are mandatory.
8. **Future subscriptions**: explicitly supported by schema/abstraction design, not enabled in UX this sprint.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Keep one-time Pro as launch default in server-authoritative entitlement logic
- [ ] Add provider-aware entitlement abstractions (`stripe`, `ios_iap`, `android_iap`, `manual`)
- [ ] Define canonical billing/entitlement event taxonomy
- [ ] Define idempotency rules for webhook and command processing
- [ ] Define formal launch pricing decision gate with clear sign-off criteria
- [ ] Document migration path for future subscription support

### Excluded (this sprint)

- [ ] Shipping subscriptions to end users
- [ ] Native iOS/Android in-app purchase implementation
- [ ] Full finance/reconciliation dashboard
- [ ] Tax engine rollout or invoice portal expansion
- [ ] Store-side restore UX implementation

---

## Billing Runtime Policy (Locked)

### Checkout + Provider Policy

- Web purchases use **hosted Stripe Checkout**.
- Internal provider enum values:
  - `manual`
  - `stripe`
  - `ios_iap`
  - `android_iap`
- Entitlements are server-authoritative; clients are read-only consumers.

### Canonical Product Mapping

- Internal product key: `pro_lifetime_v1`.
- Provider mapping examples:
  - Stripe `price_id` -> `pro_lifetime_v1`
  - iOS product identifier -> `pro_lifetime_v1`
  - Android product identifier -> `pro_lifetime_v1`
- Provider IDs are external references, never primary business semantics.

### Canonical Event Taxonomy

The runtime must support these canonical events:

- `purchase_initiated`
- `purchase_succeeded`
- `purchase_failed`
- `refund_issued`
- `chargeback_opened`
- `chargeback_won`
- `chargeback_lost`
- `entitlement_granted`
- `entitlement_revoked`
- `restore_requested`
- `restore_succeeded`
- `restore_failed`

### Idempotency Rules

- Webhook/store inbound dedupe key: `(provider, provider_event_id)` unique.
- API/command dedupe key: `idempotency_key` unique per logical command.
- Event ingestion is append-only in ledger; no destructive mutation of historical events.
- Projection updates must be replay-safe (same event can be processed multiple times without state drift).
- Entitlement grant/revoke operations must be upsert-safe and deterministic.

### Security + Integrity Requirements

- Never trust client-provided entitlement state.
- Signature verification is mandatory for inbound provider webhooks (Stripe now; store verification later).
- Event payloads are stored with provider reference and integrity metadata (for example payload hash).
- Errors returned to clients must be sanitized and non-sensitive.

---

## Formal Launch Pricing Decision Gate (Locked)

Launch pricing is not considered approved until all gate checks are complete:

1. Product sign-off on one-time launch price and currency set.
2. Finance sign-off on revenue model assumptions and refund-impact expectations.
3. Legal sign-off on policy alignment (terms/refunds wording matches billing behavior).
4. Operational sign-off that price identifiers are configured correctly for launch environment.
5. Freeze window defined (no price changes inside the pre-launch freeze period).

**Gate Output**:

- Written decision record with:
  - chosen price
  - supported currencies
  - effective date
  - approvers (`Product`, `Finance`, `Legal`, `Engineering`)

---

## Future Subscription Migration Path (Documented, Not Enabled)

Architecture must be forward-compatible with subscription support by including:

- plan type discriminator (`one_time`, `subscription`)
- optional subscription period fields (`periodStart`, `periodEnd`, `autoRenew`)
- provider customer/account references
- event compatibility for renewals, grace periods, expirations, and cancellations

No subscription purchase, UI, or entitlement behavior is exposed this sprint.

---

## Phase 0: Domain Contract + Event Model (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define provider-aware entitlement domain types
- [x] **Task 0.2**: Define canonical event types and payload contracts
- [x] **Task 0.3**: Define idempotency-key contract for commands/events
- [x] **Task 0.4**: Define projection model shape for current entitlement state
- [x] **Task 0.5**: Document source-of-truth boundaries (provider vs internal runtime)
- [x] **Task 0.6**: Add unit tests for domain/event schema invariants

---

## Phase 1: Data Model + Persistence Foundation (Days 2-4)

### Tasks (7)

- [ ] **Task 1.1**: Add immutable billing event ledger model
- [ ] **Task 1.2**: Add provider-aware fields to entitlement projection model
- [ ] **Task 1.3**: Add uniqueness constraints for event-id and idempotency-key dedupe
- [ ] **Task 1.4**: Add provider/product mapping model for canonical SKU resolution
- [ ] **Task 1.5**: Add migration-safe defaults preserving one-time Pro behavior
- [ ] **Task 1.6**: Add persistence helpers for append + project flow
- [ ] **Task 1.7**: Add tests for dedupe and replay safety

---

## Phase 2: Runtime Integration (Web-first) (Days 4-5)

### Tasks (6)

- [ ] **Task 2.1**: Integrate hosted Stripe Checkout flow into provider abstraction
- [ ] **Task 2.2**: Normalize Stripe lifecycle events into canonical events
- [ ] **Task 2.3**: Apply projection updates from canonical events
- [ ] **Task 2.4**: Preserve compatibility with existing entitlement read API (`/api/pro/entitlement`)
- [ ] **Task 2.5**: Add sanitized error handling and observability hooks
- [ ] **Task 2.6**: Add tests for purchase success/failure/refund path projection

---

## Phase 3: Pricing Gate + Subscription Readiness Documentation (Days 5-6)

### Tasks (6)

- [ ] **Task 3.1**: Create pricing gate checklist and approval artifact template
- [ ] **Task 3.2**: Define launch freeze policy for price/config changes
- [ ] **Task 3.3**: Document one-time launch defaults in ops docs
- [ ] **Task 3.4**: Document subscription migration path with schema/event examples
- [ ] **Task 3.5**: Add explicit non-goal statement in product docs (no subscriptions yet)
- [ ] **Task 3.6**: Review docs for consistency with legal/refund surfaces

---

## Phase 4: Coverage + Stability (Days 6-8)

### Tasks (6)

- [ ] **Task 4.1**: Unit tests for event normalization and projection transitions
- [ ] **Task 4.2**: API tests for entitlement reads under provider-aware projection
- [ ] **Task 4.3**: Tests for idempotent replay and duplicate event handling
- [ ] **Task 4.4**: Regression tests confirming one-time Pro launch behavior unchanged
- [ ] **Task 4.5**: Optional E2E smoke for web checkout -> entitlement visible flow
- [ ] **Task 4.6**: CI stability pass for billing/entitlement changes

---

## Implementation Guidelines

- Keep billing domain logic pure and testable; isolate provider adapters.
- Use append-only ledger semantics for financial/audit-critical events.
- Keep projection writes deterministic and replay-safe.
- Do not expose provider internals directly to UI response contracts.
- Maintain strict TypeScript and avoid `any`.
- Prefer explicit, versioned contracts over implicit behavior.

---

## File Structure (Expected)

- `prisma/schema.prisma` (billing ledger + provider-aware entitlement models)
- `prisma/migrations/*` (billing and entitlement evolution)
- `src/lib/billing/*` (provider adapters, event normalization, idempotency, projection)
- `src/lib/billing/__tests__/*`
- `src/lib/pro/*` (entitlement read compatibility updates)
- `src/app/api/pro/entitlement/route.ts` (read compatibility preserved)
- `src/app/api/pro/*` (runtime integration points as needed)
- `docs/ops/*` (pricing gate, launch freeze, migration notes)
- `docs/sprints/sprint-15.1.md`

---

## Definition of Done

1. [ ] One-time Pro remains launch-default and behaviorally unchanged for users.
2. [ ] Entitlement runtime supports provider-aware sources (`manual/stripe/ios_iap/android_iap`).
3. [ ] Canonical event taxonomy is defined and implemented in domain contracts.
4. [ ] Idempotency and dedupe rules are enforced with tests.
5. [ ] Event ledger + projection architecture is implemented and replay-safe.
6. [ ] Formal launch pricing gate is documented with clear sign-off requirements.
7. [ ] Future subscription path is documented and schema-compatible without enabling subscriptions.
8. [ ] Unit/API regression coverage is in place and CI is green.

---
