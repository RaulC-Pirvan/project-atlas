# Sprint 16.1: Pro Upgrade Page Refresh - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: In Progress  
**Theme**: Deliver a high-clarity Pro conversion surface without app clutter, while preserving Free value and trust-first billing messaging.

---

## Overview

Sprint 16.1 defines the conversion UX contract for Atlas Pro upgrade surfaces.

This sprint focuses on message clarity and purchase intent quality: the upgrade
experience must be concrete, trustable, and measurable, without degrading Free
utility or introducing dark patterns.

**Core Goal**: users clearly understand Pro value, trust the purchase flow, and
can upgrade through a deterministic path with instrumented conversion events.

---

## Locked Decisions (Confirmed)

1. **Route strategy**: `/pro` is retained as a conversion landing surface; `/account` remains the transactional billing/restore management surface.
2. **User flow**: authenticated users can start upgrade directly; signed-out users are routed through auth and return to upgrade intent.
3. **Messaging policy**: Free remains explicit and useful; no manipulative downgrade framing.
4. **Trust policy**: refund/guarantee wording must align with legal pages (`/legal/refunds`) with no extra promises.
5. **CTA instrumentation**: Pro conversion funnel events are required from page view through checkout start/return.
6. **Experiment policy**: no A/B testing in this sprint; baseline instrumentation first.

---

## Scope Decisions (Locked for this sprint)

### Included

- [x] Redesign `/pro` with clearer feature hierarchy and concrete examples
- [x] Keep Free value explicit and non-degraded in all Pro messaging
- [x] Add upgrade FAQ, guarantee/refund copy, and trust details
- [x] Instrument Pro CTA and conversion events
- [ ] Add responsive/component/E2E coverage for Pro conversion experience

### Excluded (this sprint)

- [ ] Subscription offer UX
- [ ] Multi-variant experimentation/A-B framework rollout
- [ ] New pricing model changes
- [ ] Native mobile purchase UI
- [ ] External BI dashboard implementation

---

## Pro Conversion UX Policy (Locked)

### Surface Strategy Policy

- `/pro` is a focused conversion page with product narrative and trust context.
- `/account` remains the canonical place for billing management and restore.
- App shell primary navigation does not add a persistent cluttered Pro destination.

### Messaging Policy

- Pro value must be concrete (examples, outcomes, feature clarity).
- Free value must remain explicit and non-degraded.
- Comparisons must be factual and non-coercive.

### Trust Copy Policy

- FAQ and refund language must match legal policy:
  - direct web purchases: 14-day goodwill refund window
  - app-store purchases: Apple/Google refund channels
- No wording may imply broader refund guarantees than legal documents.

### CTA + Tracking Policy

- Track conversion events from:
  - Pro page view
  - CTA click
  - checkout initiated
  - checkout return (success/cancel)
  - entitlement active
- Server-side truth events remain authoritative for conversion completion.

---

## Phase 0: Conversion Contract + Content Framework (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define canonical `/pro` information architecture
- [x] **Task 0.2**: Define Free vs Pro comparison contract (non-degraded Free framing)
- [x] **Task 0.3**: Define FAQ/refund/trust copy contract aligned with legal
- [x] **Task 0.4**: Define CTA intent flow for signed-in vs signed-out users
- [x] **Task 0.5**: Define conversion event taxonomy for Pro surface
- [x] **Task 0.6**: Add content review checklist (Product/Legal alignment)

### Phase 0 Implementation Notes (Current)

#### 0.1 Canonical `/pro` IA

- Header (minimal nav + theme toggle)
- Hero (one-time purchase framing + primary/secondary CTA)
- Concrete outcomes section (`Pattern clarity`, `Longer motivation loop`, `Reminder depth`)
- Free vs Pro comparison matrix (explicit Free completeness)
- FAQ + trust section (legal-parity refund copy, support links)

#### 0.2 Free vs Pro Contract

- Free remains explicitly complete for core tracking (habits/schedules/completions/calendar/streaks/grace window).
- Pro messaging focuses on additive depth (insights/milestones/reminders), not Free degradation.
- Comparison wording is factual (`Full`, `Preview`, `Baseline`, `Expanded`) and non-coercive.

#### 0.3 FAQ/Refund/Trust Contract

- Direct web purchases: `14-day goodwill refund window from purchase date`.
- App-store purchases: Apple/Google refund processes.
- No additional guarantee language beyond legal policy.
- Trust routes are visible from `/pro`: `/legal/refunds`, `/legal/terms`, `/support#contact-form`.

#### 0.4 CTA Intent Flow Contract

- `/pro` is public.
- All upgrade CTAs route through `/pro/upgrade?source=...` for deterministic instrumentation.
- Signed-in users are redirected to `/api/billing/stripe/checkout?source=...`.
- Signed-out users are redirected to `/sign-in` with preserved `from=/pro?intent=upgrade&source=...`.
- Sign-in now supports a safe post-auth redirect path and returns users to preserved upgrade intent.

#### 0.5 Conversion Event Taxonomy (v1)

- `pro_page_view`
- `pro_cta_click`
- `pro_checkout_initiated`
- `pro_checkout_return`
- `pro_entitlement_active`

Event contract is centralized in `src/lib/analytics/proConversion.ts` with source parsing (`direct|hero|comparison|faq`) and schema versioning.

#### 0.6 Content Review Checklist

- [x] Free usefulness remains explicit on `/pro`.
- [x] Refund/app-store copy matches `/legal/refunds`.
- [x] No urgency/dark-pattern language introduced.
- [x] Signed-in and signed-out CTA flows are deterministic.
- [x] Event taxonomy is centralized and reused across Pro/checkout/account/webhook surfaces.

---

## Phase 1: Pro Surface Build (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Implement redesigned `/pro` layout with clear section hierarchy
- [x] **Task 1.2**: Add concrete feature examples and outcomes
- [x] **Task 1.3**: Add explicit Free value and transparent comparison block
- [x] **Task 1.4**: Add FAQ and trust section with legal-parity refund language
- [x] **Task 1.5**: Ensure CTA states for signed-in/signed-out paths are deterministic
- [x] **Task 1.6**: Preserve `/account` as transactional billing management surface
- [x] **Task 1.7**: Add accessibility and reduced-motion coverage for new sections

### Phase 1 Implementation Notes (Current)

#### 1.1 Layout + hierarchy

- `/pro` now renders a dedicated conversion surface (no `/account` redirect).
- Section order is explicit: Hero -> Outcomes -> Free vs Pro -> FAQ/Trust.
- App-shell navigation remains unchanged; no persistent Pro clutter added to authenticated nav.

#### 1.2 Concrete examples + outcomes

- Outcome cards now include practical examples:
  - detecting weekday/weekend completion imbalance
  - milestone progression across 30/100 completion horizons
  - reminder timing + quiet hours concrete setup example

#### 1.3 Free value + transparent comparison

- Free is described as complete for core daily tracking.
- Comparison matrix remains factual and non-coercive (`Full`, `Preview`, `Baseline`, `Expanded`).

#### 1.4 FAQ + trust copy

- FAQ refund language mirrors `/legal/refunds`:
  - 14-day goodwill window for direct web purchases
  - Apple/Google refund-channel ownership for app-store purchases

#### 1.5 Deterministic CTA states

- Signed-out users: CTA -> `/pro/upgrade` -> `/sign-in?from=...`.
- Signed-in users: CTA -> `/pro/upgrade` -> `/api/billing/stripe/checkout?source=...`.
- Pro-active users: CTA switches to `/account#pro` management entry.

#### 1.6 `/account` transactional preservation

- `/account` remains canonical for billing management and restore controls.
- Checkout return and billing toasts continue to resolve on `/account`.

#### 1.7 Accessibility + reduced motion

- Added semantic section labeling (`aria-labelledby`) and comparison table labeling.
- Added reduced-motion-safe reveal treatment (`motion-safe` animation with `motion-reduce` fallback).
- Added component tests for semantics and motion class presence.

---

## Phase 2: Conversion Instrumentation + Validation (Days 4-5)

### Tasks (6)

- [x] **Task 2.1**: Instrument Pro page view and CTA click events
- [x] **Task 2.2**: Instrument checkout start and return outcomes
- [x] **Task 2.3**: Connect entitlement-active event for conversion truth
- [x] **Task 2.4**: Add guardrails against duplicate/invalid client event spam
- [x] **Task 2.5**: Validate event payload contracts with tests
- [x] **Task 2.6**: Add observability logs for conversion flow diagnostics

### Phase 2 Implementation Notes (Current)

#### 2.1 Pro page view + CTA click

- `pro_page_view` emitted from `/pro` server page render.
- `pro_cta_click` emitted from `/pro/upgrade` entry route before redirect branching.
- Event contract source: `src/lib/analytics/proConversion.ts`.

#### 2.2 Checkout start + return outcomes

- `pro_checkout_initiated` emitted at `/api/billing/stripe/checkout`.
- `pro_checkout_return` emitted on `/account` when `checkout=success|cancel` query is present.
- Source attribution (`direct|hero|comparison|faq`) is propagated into checkout return URLs.

#### 2.3 Entitlement-active truth event

- `pro_entitlement_active` emitted only on webhook projection write when:
  - billing event is appended, and
  - resulting projection status is `active`.
- Dedupe replay events do not emit conversion completion.

#### 2.4 Guardrails for duplicate/invalid spam

- Invalid `source` query values are normalized to `direct` and recorded as:
  - `analytics.pro_conversion.guardrail` with `reason=invalid_source_fallback`.
- Duplicate high-frequency conversion events are suppressed in-memory for selected events:
  - `pro_page_view`
  - `pro_cta_click`
  - `pro_checkout_return`
- Suppression emits guardrail diagnostics with `reason=duplicate_event_suppressed`.

#### 2.5 Event payload contract validation

- Added/extended tests for:
  - source parsing + reason metadata
  - duplicate suppression behavior
  - disabled analytics no-op behavior
  - invalid-source fallback diagnostics on upgrade/checkout routes
  - entitlement-active emit vs dedupe-no-emit behavior in webhook route.

#### 2.6 Observability diagnostics

- Conversion analytics payloads now include `schemaVersion` and `requestId` (API routes).
- Added webhook projection diagnostic log:
  - `billing.webhook.projected` with append/dedupe/projection status context.

---

## Phase 3: Coverage + Hardening (Days 5-7)

### Tasks (6)

- [ ] **Task 3.1**: Add component tests for hierarchy, comparison, and trust copy
- [ ] **Task 3.2**: Add E2E for signed-out -> auth -> upgrade intent return
- [ ] **Task 3.3**: Add E2E for signed-in CTA -> checkout start path
- [ ] **Task 3.4**: Add regression tests for `/account` billing actions unaffected
- [ ] **Task 3.5**: Run legal/product copy consistency review
- [ ] **Task 3.6**: Finalize publish-ready conversion artifact set

---

## Environment and Config

Expected control surface:

- `ANALYTICS_ENABLED`
- `BILLING_CONVERSION_TRACKING_ENABLED`
- `NEXTAUTH_URL`
- `STRIPE_PRICE_PRO_LIFETIME`

Names are placeholders; final keys are locked during implementation.

---

## Implementation Guidelines

- Keep copy truthful, specific, and legally consistent.
- Keep Free tier usefulness explicit across all comparison surfaces.
- Avoid dark patterns (forced urgency, hidden tradeoffs, misleading defaults).
- Keep conversion event contracts versioned and testable.
- Preserve strict TypeScript and current lint/type/test gates.

---

## File Structure (Expected)

- `docs/sprints/sprint-16.1.md`
- `docs/test workflows/sprint-16.1-test-workflow.md`
- `src/app/pro/page.tsx`
- `src/components/pro/*`
- `src/components/pro/__tests__/*`
- `src/lib/analytics/*` (or equivalent event contract location)
- `e2e/pro-billing.spec.ts` (extended coverage as needed)

---

## Definition of Done

1. [ ] `/pro` presents a clear, concrete, trustable upgrade narrative.
2. [ ] Free value remains explicit and non-degraded.
3. [ ] FAQ/refund/trust copy is legally aligned.
4. [ ] Signed-in and signed-out CTA flows are deterministic.
5. [ ] Conversion events are instrumented from view to entitlement-active.
6. [ ] Component and E2E coverage passes for key conversion paths.
7. [ ] No regression to `/account` billing management behavior.
8. [ ] CI quality gates pass for touched surfaces.

---

## References

- [Sprint 16.2 Plan](./sprint-16.2.md)
- [Sprint 16.3 Plan](./sprint-16.3.md)
- [Sprint 15.2 Plan](./sprint-15.2.md)
- [Roadmap](../roadmap.md)
- [Refund Policy Page](../../src/app/legal/refunds/page.tsx)
