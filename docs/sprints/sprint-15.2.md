# Sprint 15.2: Stripe Web Billing Integration - Project Atlas

**Duration**: TBD (6-8 days)  
**Status**: Planned  
**Theme**: Deliver production-grade Stripe web billing flows for one-time Pro with secure webhook processing, account billing visibility, and restore/re-sync reliability.

---

## Overview

Sprint 15.2 implements the first live web billing runtime on top of the
architecture from Sprint 15.1.

This sprint is execution-focused: users must be able to purchase Pro on web,
entitlements must update reliably via signed webhooks, and account surfaces
must expose billing history and restore/re-sync capabilities.

**Core Goal**: a user can complete a one-time web checkout and reliably receive
or recover Pro entitlement through secure, idempotent Stripe-backed processing.

---

## Locked Decisions (Confirmed)

1. **Checkout mode**: Hosted Stripe Checkout for one-time Pro web purchase.
2. **Offer type**: One-time Pro only (no subscriptions enabled in UX).
3. **Webhook security**: Stripe signature verification is mandatory.
4. **Webhook reliability**: retry-safe and idempotent processing is mandatory.
5. **Billing history UX**: account page uses Stripe-hosted billing history/invoice access (customer portal/session links).
6. **Restore strategy**: authenticated web restore/re-sync endpoint that re-evaluates provider state and reprojects entitlement safely.
7. **Compatibility**: `/api/pro/entitlement` remains the canonical read API for client gating.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Add Stripe Checkout flow for one-time Pro upgrade on web
- [ ] Implement secure Stripe webhook endpoint with signature verification
- [ ] Add idempotent webhook ingestion + retry-safe projection updates
- [ ] Add account billing history/invoice access links
- [ ] Add web restore/entitlement re-sync flow
- [ ] Add API/unit/E2E coverage for checkout, webhook, and failure recovery

### Excluded (this sprint)

- [ ] Subscription checkout and recurring billing UX
- [ ] Native iOS/Android purchase implementation
- [ ] Full in-app invoice table rendered from Atlas DB
- [ ] Multi-provider billing runtime beyond Stripe execution path
- [ ] Financial reporting/reconciliation dashboard

---

## Billing Integration Policy (Locked)

### Stripe Checkout Policy

- Server creates checkout sessions; client never constructs payment state.
- Checkout session metadata must include canonical user and product references.
- Success/cancel return URLs are controlled server-side.

### Webhook Security Policy

- Webhook endpoint must use raw request body verification with `STRIPE_WEBHOOK_SECRET`.
- Invalid signatures return rejection response and do not mutate state.
- Only supported event types are processed; unknown events are ignored safely.

### Idempotency + Retry Policy

- Event dedupe key: Stripe `event.id` (provider event id).
- Duplicate deliveries must not duplicate grants/revokes.
- Processing must tolerate replay and out-of-order delivery safely.
- On transient processing failure, endpoint returns retriable status for Stripe retries.

### Account Billing UX Policy

- Billing history/invoice access is provided through Stripe-hosted surfaces.
- Atlas account page presents explicit web billing actions:
  - `Manage billing / invoices`
  - `Restore purchase`
- UX copy must remain clear that restore is for previously completed purchases.

### Restore/Re-sync Policy

- Restore/re-sync is authenticated and user-scoped only.
- Flow re-checks provider state and projects entitlement idempotently.
- Restore does not trust client claims and never accepts arbitrary entitlement state.

---

## Phase 0: Contract + Config Foundation (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define Stripe config contract (keys, price IDs, webhook secret, env validation)
- [x] **Task 0.2**: Define checkout request/response API contracts
- [x] **Task 0.3**: Define webhook event allowlist and canonical mapping table
- [x] **Task 0.4**: Define restore/re-sync API contract and response semantics
- [x] **Task 0.5**: Define account billing-link UX contract and copy
- [x] **Task 0.6**: Add tests for config validation and guardrails

---

## Phase 1: Checkout + Entitlement Initiation (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Add web checkout session creation endpoint (server-side)
- [x] **Task 1.2**: Wire `/pro` and relevant upgrade entrypoints to Stripe checkout launch
- [x] **Task 1.3**: Include canonical metadata (`userId`, `productKey`) in checkout session
- [x] **Task 1.4**: Add success/cancel routing behavior and client feedback states
- [x] **Task 1.5**: Ensure pre-check prevents duplicate purchase attempts when already entitled
- [x] **Task 1.6**: Add observability logs for checkout initiation/success/cancel
- [x] **Task 1.7**: Add API/component tests for checkout initiation behavior

---

## Phase 2: Secure Webhook Runtime (Days 4-5)

### Tasks (7)

- [x] **Task 2.1**: Implement Stripe webhook endpoint with signature verification
- [x] **Task 2.2**: Normalize supported Stripe events into canonical billing events
- [x] **Task 2.3**: Persist webhook events with idempotency enforcement
- [x] **Task 2.4**: Apply retry-safe entitlement projection transitions
- [x] **Task 2.5**: Handle refund/dispute paths consistently with entitlement policy
- [x] **Task 2.6**: Ensure sanitized error behavior and no sensitive leakage
- [x] **Task 2.7**: Add tests for signature rejection, duplicate replay, and projection updates

---

## Phase 3: Account Billing UX + Restore/Re-sync (Days 5-6)

### Tasks (6)

- [x] **Task 3.1**: Add account section for web billing history/invoice links
- [x] **Task 3.2**: Add server endpoint to create Stripe billing portal/session link
- [x] **Task 3.3**: Implement authenticated web restore/re-sync endpoint
- [x] **Task 3.4**: Add restore UX states (pending/success/error) with toast-first feedback
- [x] **Task 3.5**: Ensure restore path is idempotent and safe for repeated clicks
- [x] **Task 3.6**: Add component/API tests for billing links and restore flow

---

## Phase 4: Coverage + Stability (Days 6-8)

### Tasks (6)

- [ ] **Task 4.1**: Unit tests for Stripe event normalization and projection transitions
- [ ] **Task 4.2**: API tests for checkout/webhook/restore auth + error paths
- [ ] **Task 4.3**: Replay tests for duplicate webhook deliveries and idempotency
- [ ] **Task 4.4**: Regression tests for entitlement read compatibility (`/api/pro/entitlement`)
- [ ] **Task 4.5**: E2E smoke for checkout start, webhook effect visibility, and restore fallback
- [ ] **Task 4.6**: CI stability pass for new billing runtime surfaces

---

## Environment and Config

Required runtime values:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_LIFETIME`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`

Recommended optional values:

- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
- `BILLING_WEBHOOK_TOLERANCE_SECONDS` (if exposed by adapter layer)

---

## Implementation Guidelines

- Keep provider adapter logic isolated from core entitlement domain logic.
- Verify webhook signatures before parsing domain event semantics.
- Use strict idempotency boundaries before any projection mutation.
- Keep `/api/pro/entitlement` backward-compatible for existing clients.
- Use toast-first UX for billing/restore errors (no inline form errors).
- Preserve strict TypeScript and existing lint/type/test quality gates.

---

## File Structure (Expected)

- `src/app/api/billing/stripe/checkout/route.ts`
- `src/app/api/billing/stripe/webhook/route.ts`
- `src/app/api/billing/stripe/portal/route.ts`
- `src/app/api/pro/restore/route.ts` (or equivalent restore endpoint)
- `src/lib/billing/stripe/*` (checkout, webhook verification, mapping, portal helpers)
- `src/lib/billing/events/*` (canonical event mapping/projection integration)
- `src/components/auth/AccountPanel.tsx` (billing history + restore actions)
- `src/components/auth/__tests__/AccountPanel.test.tsx`
- `src/app/api/billing/__tests__/*`
- `src/lib/billing/__tests__/*`
- `e2e/pro-billing.spec.ts` (or equivalent billing smoke flow)
- `docs/sprints/sprint-15.2.md`

---

## Definition of Done

1. [ ] User can start one-time Pro purchase via hosted Stripe Checkout on web.
2. [ ] Secure webhook verification is enforced and invalid signatures are rejected.
3. [ ] Webhook processing is idempotent and replay-safe under duplicate delivery.
4. [ ] Entitlement projection updates correctly for success/refund/dispute paths.
5. [ ] Account page provides billing history/invoice access links.
6. [ ] Authenticated restore/re-sync flow repairs entitlement state safely.
7. [ ] Checkout/webhook/restore API and component coverage is in place.
8. [ ] E2E smoke for billing flow and restore recovery passes.
9. [ ] CI passes with new billing runtime surfaces.

---
