# Sprint 16.3: Product Analytics Baseline - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: Planned  
**Theme**: Establish a privacy-safe, tool-agnostic analytics baseline for conversion funnel visibility and weekly decision cadence.

---

## Overview

Sprint 16.3 defines the first stable analytics contract for growth and
conversion decisions.

This sprint is baseline-focused: event taxonomy, ownership boundaries, KPI
definitions, and a lightweight internal dashboard must be established before
advanced experimentation.

**Core Goal**: produce trustworthy funnel metrics (landing -> signup -> first
habit -> first completion -> upgrade) with privacy-safe defaults and clear
operational ownership.

---

## Locked Decisions (Confirmed)

1. **Analytics contract**: provider/tool-agnostic event schema first; vendor binding second.
2. **Ownership split**: client emits UX intent events; server emits billing/entitlement truth events.
3. **Privacy baseline**: minimal PII, no raw sensitive payloads, no session replay by default.
4. **Consent posture**: baseline implementation is consent-ready for stricter regional gating.
5. **North-star KPIs**: Pro page -> checkout start rate, checkout start -> entitlement active rate, landing -> first habit completion rate.
6. **Dashboard location**: lightweight internal conversion dashboard in admin surface first.
7. **Experiment policy**: no A/B framework rollout in this sprint.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Instrument funnel events (landing -> sign-up -> first habit -> first completion -> upgrade)
- [ ] Add lightweight conversion dashboard
- [ ] Define baseline KPIs and weekly review cadence
- [ ] Ensure privacy-safe defaults and clear user-facing controls
- [ ] Add tests/validation for event contracts and metric calculations

### Excluded (this sprint)

- [ ] Enterprise BI warehouse rollout
- [ ] Attribution modeling and campaign analytics
- [ ] Session replay rollout
- [ ] A/B experiment platform
- [ ] Advanced predictive analytics

---

## Analytics and Privacy Policy (Locked)

### Event Taxonomy Policy

- Events are versioned contracts.
- Naming is consistent across client and server surfaces.
- Event payload fields are explicit, typed, and test-validated.

### Ownership and Truth Policy

- Client events capture user intent and interaction context.
- Server events capture billing and entitlement truth.
- Conversion completion metrics must derive from server-truth where available.

### Privacy Policy

- Do not send raw PII to analytics pipelines.
- Use pseudonymous identifiers where feasible.
- Retention and access should follow least-privilege operations.
- Feature set must remain compatible with stricter consent gating rollout.

### KPI and Review Policy

- KPI definitions must be documented and stable across releases.
- Weekly review cadence with Product + Engineering owner is mandatory.
- KPI changes require versioned definition updates.

---

## Phase 0: Metrics Contract + Governance (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define analytics event taxonomy v1 (funnel + conversion)
- [x] **Task 0.2**: Define client/server event ownership matrix
- [x] **Task 0.3**: Define KPI dictionary and formulas
- [x] **Task 0.4**: Define privacy-safe payload contract and redaction rules
- [x] **Task 0.5**: Define weekly review cadence and owner responsibilities
- [x] **Task 0.6**: Define event versioning and change-control policy

### Phase 0 Implementation Notes (Current)

Phase 0 governance contract is locked in this sprint document.

#### 0.1 Analytics Event Taxonomy v1 (Funnel + Conversion)

All event names use `snake_case` and include `schemaVersion` in payload.

| Funnel Stage | Event | Description | Primary Surface |
| --- | --- | --- | --- |
| Awareness | `landing_page_view` | Landing route rendered for a session. | `/landing` |
| Education | `landing_walkthrough_view` | Walkthrough section viewed. | `/landing` |
| Intent | `landing_walkthrough_cta_click` | Walkthrough CTA click before redirect. | `/landing/walkthrough/track` |
| Acquisition | `auth_sign_up_completed` | Account successfully created and persisted. | `/api/auth/sign-up` |
| Activation | `habit_first_created` | User created first non-archived habit. | `/api/habits` |
| Activation | `habit_first_completion_recorded` | First valid completion persisted. | `/api/completions` |
| Monetization Intent | `pro_page_view` | Pro page render tracked. | `/pro` |
| Monetization Intent | `pro_cta_click` | Upgrade CTA clicked. | `/pro`, `/account`, `/landing` |
| Monetization | `pro_checkout_initiated` | Checkout session created. | `/api/billing/stripe/checkout` |
| Monetization | `pro_checkout_return` | User returned from checkout success/cancel. | `/account` |
| Monetization Truth | `pro_entitlement_active` | Entitlement projection became active. | `/api/billing/stripe/webhook` |

Notes:

- Existing Sprint 16.1 and 16.2 event contracts are preserved.
- New activation events are milestone-only and fire once per user lifecycle.
- Funnel reporting uses unique-user counting by default.

#### 0.2 Client/Server Event Ownership Matrix

| Event | Owner | Truth Class | Emission Rule |
| --- | --- | --- | --- |
| `landing_page_view` | Client | Intent | Emit on route render with dedupe guard. |
| `landing_walkthrough_view` | Client | Intent | Emit once per view window (guardrailed). |
| `landing_walkthrough_cta_click` | Server route | Intent | Emit in tracked redirect route before navigation. |
| `auth_sign_up_completed` | Server | Domain truth | Emit only after user row commit succeeds. |
| `habit_first_created` | Server | Domain truth | Emit when first active habit is persisted. |
| `habit_first_completion_recorded` | Server | Domain truth | Emit when first completion write is committed. |
| `pro_page_view` | Client | Intent | Emit on `/pro` render with duplicate suppression. |
| `pro_cta_click` | Client | Intent | Emit on click with validated source. |
| `pro_checkout_initiated` | Server | Billing truth | Emit only after checkout session creation succeeds. |
| `pro_checkout_return` | Client | Intent | Emit once on return state handoff to account. |
| `pro_entitlement_active` | Server | Billing truth | Emit from webhook projection success path only. |

Decision rule: KPI numerators and funnel "completion" stages must use server
truth events when an equivalent server event exists.

#### 0.3 KPI Dictionary and Formulas

Default reporting window is trailing 7 complete UTC days unless explicitly
overridden in dashboard filters.

| KPI | Formula | Notes |
| --- | --- | --- |
| Landing -> First Completion Rate | `unique_users(habit_first_completion_recorded) / unique_users(landing_page_view)` | North-star activation metric. |
| Pro Page -> Checkout Start Rate | `unique_users(pro_checkout_initiated) / unique_users(pro_page_view)` | North-star monetization intent metric. |
| Checkout Start -> Entitlement Active Rate | `unique_users(pro_entitlement_active) / unique_users(pro_checkout_initiated)` | North-star billing success metric. |
| Signup -> First Habit Rate | `unique_users(habit_first_created) / unique_users(auth_sign_up_completed)` | Activation diagnostic metric. |
| First Habit -> First Completion Rate | `unique_users(habit_first_completion_recorded) / unique_users(habit_first_created)` | Habit quality diagnostic metric. |
| Event Validity Rate | `valid_events / total_received_events` | Pipeline health metric. |

Formula rules:

- `unique_users` means distinct stable actor id in window (`userId` when
  authenticated, pseudonymous session id when anonymous).
- Division by zero returns `null` (not `0%`) and dashboard renders as
  "insufficient data".
- KPI definition changes require policy version bump (see 0.6).

#### 0.4 Privacy-Safe Payload Contract and Redaction Rules

Allowed baseline fields:

- `event`
- `schemaVersion`
- `occurredAt`
- `surface`
- `requestId`
- `authenticated`
- `source` and `target` (enum-only)
- `provider`
- `status`
- `dedupeReason`

Restricted fields (must be transformed before emit):

- `userId` -> stable pseudonymous hash (`sha256(userId + analytics_salt)`).
- `checkoutSessionId` and provider ids -> one-way hash; never raw.
- URL/query inputs -> whitelist enums only; drop all unknown keys.

Forbidden fields (must never be emitted):

- Email addresses, display names, phone numbers, IP address full values.
- Habit titles/descriptions and any free-form user-entered text.
- Auth tokens, cookies, passwords, recovery codes, TOTP secrets.
- Support ticket subject/message and legal acceptance raw payloads.

Operational rules:

- Validator enforces allow-list; unknown fields are rejected and counted in
  `Event Validity Rate`.
- Payload values are bounded (`<=128` chars) unless explicitly typed otherwise.
- Analytics logs follow least-privilege access and environment-level enablement.

#### 0.5 Weekly Review Cadence and Owner Responsibilities

Cadence:

- Weekly analytics review every Monday, 30 minutes, covering the prior complete
  Monday-Sunday UTC window.
- Backup run each Thursday if Monday data quality checks fail.

Roles:

- Product Owner: owns KPI interpretation and prioritization decisions.
- Engineering Owner: owns instrumentation integrity and data quality fixes.
- Analytics DRI (initially Engineering Owner): owns dashboard definitions and
  contract updates.
- Optional attendees: Support lead (for anomaly context), billing owner.

Meeting outputs (required each week):

- KPI snapshot with week-over-week deltas.
- Open anomaly list with owner and due date.
- Decision log entry in sprint or ops artifact with follow-up actions.

#### 0.6 Event Versioning and Change-Control Policy

Version model:

- `schemaVersion` is integer-major per event contract family.
- Additive non-breaking fields keep the current major version.
- Breaking changes (field removal/type change/semantic change) require major
  increment and dual-read support for one sprint minimum.

Change classes:

- Class A (non-breaking): add optional enum/value/field -> docs + tests update.
- Class B (behavioral): redefine event meaning/formula -> version bump + KPI
  changelog update.
- Class C (breaking): rename/remove required fields -> new major + migration
  note + rollback plan.

Approval workflow:

1. PR updates sprint/ops contract docs.
2. PR updates TypeScript contracts, validators, and tests in same change.
3. Product + Engineering approval required before merge.
4. Release notes include effective date and affected KPIs/events.

---

## Phase 1: Instrumentation Runtime (Days 2-4)

### Tasks (7)

- [ ] **Task 1.1**: Instrument landing view + auth CTA events
- [ ] **Task 1.2**: Instrument sign-up/sign-in completion events
- [ ] **Task 1.3**: Instrument first habit creation milestone event
- [ ] **Task 1.4**: Instrument first completion milestone event
- [ ] **Task 1.5**: Instrument Pro conversion events (checkout start/return/entitlement active)
- [ ] **Task 1.6**: Add dedupe and schema validation guardrails for event ingestion
- [ ] **Task 1.7**: Add observability for dropped/invalid events

---

## Phase 2: Dashboard + KPI Reporting (Days 4-5)

### Tasks (6)

- [ ] **Task 2.1**: Add admin conversion dashboard shell
- [ ] **Task 2.2**: Add KPI cards for north-star metrics
- [ ] **Task 2.3**: Add date-range and baseline period comparison controls
- [ ] **Task 2.4**: Add metric definitions tooltip/source-of-truth references
- [ ] **Task 2.5**: Add fallback states for incomplete/partial data
- [ ] **Task 2.6**: Add export-friendly summary view (read-only)

---

## Phase 3: Hardening + Operational Readiness (Days 5-7)

### Tasks (6)

- [ ] **Task 3.1**: Add unit tests for KPI calculations and funnel transitions
- [ ] **Task 3.2**: Add API/integration tests for event contract validation
- [ ] **Task 3.3**: Add E2E smoke for dashboard visibility and core metrics
- [ ] **Task 3.4**: Add privacy review checklist and sign-off record
- [ ] **Task 3.5**: Run weekly review dry-run using baseline data
- [ ] **Task 3.6**: Finalize publish-ready analytics baseline docs

---

## Environment and Config

Expected control surface:

- `ANALYTICS_ENABLED`
- `ANALYTICS_PROVIDER`
- `ANALYTICS_EVENT_SCHEMA_VERSION`
- `ANALYTICS_PRIVACY_MODE`
- `ADMIN_CONVERSION_DASHBOARD_ENABLED`

Names are placeholders; final keys are locked during implementation.

---

## Implementation Guidelines

- Keep event contracts explicit, versioned, and testable.
- Never treat client-only events as conversion truth when server truth exists.
- Keep privacy defaults conservative and auditable.
- Keep dashboard scope lightweight and operational.
- Preserve strict TypeScript and existing quality gates.

---

## File Structure (Expected)

- `docs/sprints/sprint-16.3.md`
- `docs/test workflows/sprint-16.3-test-workflow.md`
- `src/lib/analytics/*` (event contracts, validators, KPI helpers)
- `src/app/api/admin/*` (dashboard data routes as needed)
- `src/components/admin/*` (conversion dashboard panel/components)
- `src/lib/analytics/__tests__/*`
- `e2e/admin.spec.ts` (extended coverage as needed)

---

## Definition of Done

1. [ ] Funnel event taxonomy v1 is documented and instrumented.
2. [ ] Client/server ownership split is enforced in contracts.
3. [ ] North-star KPIs are defined, implemented, and reviewable.
4. [ ] Admin conversion dashboard exposes baseline funnel visibility.
5. [ ] Privacy-safe defaults are implemented and documented.
6. [ ] Unit/API/E2E coverage passes for core analytics flows.
7. [ ] Weekly KPI review cadence and owner model are documented.
8. [ ] CI quality gates pass for touched surfaces.

---

## References

- [Sprint 16.1 Plan](./sprint-16.1.md)
- [Sprint 16.2 Plan](./sprint-16.2.md)
- [Sprint 15.2 Plan](./sprint-15.2.md)
- [Roadmap](../roadmap.md)
