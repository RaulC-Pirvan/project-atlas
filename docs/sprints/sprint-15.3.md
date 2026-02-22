# Sprint 15.3: Mobile Billing Compliance Strategy - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: In review  
**Theme**: Finalize store-compliant mobile billing policy and operational reconciliation strategy before App Store / Google Play launch.

---

## Overview

Sprint 15.3 defines policy, guardrails, and operations for mobile billing
compliance and entitlement consistency across providers.

This is a strategy and readiness sprint. It locks compliance behavior before
store submission and documents exactly how entitlements are reconciled across
Stripe and store purchases.

**Core Goal**: ensure mobile monetization behavior is compliant, deterministic,
and supportable under real-world billing edge cases.

---

## Locked Decisions (Confirmed)

1. **Mobile default billing mode**: store-native billing only on mobile.
2. **Alternative/external billing rollout**: region-gated, policy-engine controlled, opt-in only where explicitly allowed.
3. **Apple storefront behavior**: do not mix disallowed IAP/external purchase promotion patterns in the same storefront.
4. **Google Play behavior**: use official Google alternative billing APIs only where eligible.
5. **Entitlement reconciliation model**: union-of-valid-sources projection (`stripe`, `ios_iap`, `android_iap`).
6. **Reconciliation triggers**: provider notifications, sign-in, explicit restore, and scheduled sweep.
7. **Fallback behavior**: compliance-safe fail-closed for purchase UI, fail-safe for existing entitlements.
8. **Support playbook**: evidence-based, audit-backed manual handling with explicit escalation paths.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Define Apple and Google mobile billing compliance path pre-launch
- [ ] Define canonical reconciliation rules across Stripe and store providers
- [ ] Define region/platform fallback matrix for uncertain/disallowed billing states
- [ ] Define support operations playbook for billing/entitlement incidents
- [ ] Define configuration/feature-flag controls for compliant rollout
- [ ] Define validation checklist for store-launch readiness

### Excluded (this sprint)

- [ ] Shipping new mobile purchase UI
- [ ] Implementing native SDK billing flows
- [ ] Subscription rollout
- [ ] Finance analytics dashboard implementation
- [ ] Automated legal-policy ingestion

---

## Compliance Policy (Locked)

### Mobile Purchase Policy

- iOS mobile app: Apple-compliant store-native path by default.
- Android mobile app: Google Play-compliant store-native path by default.
- Web Stripe remains a web channel and is not treated as default mobile purchase rail.

### Alternative Billing Policy

- Alternative/external billing options are controlled by platform+region policy flags.
- Unsupported or uncertain policy state must default to compliant store-native behavior.
- Policy docs must be revalidated before each store release cut.

### Platform-Specific Compliance Constraints

- Apple: no disallowed mixing of IAP and external-purchase promotion within a storefront/policy scope.
- Google Play: use current official Google alternative billing APIs only where program rules permit.

---

## Entitlement Reconciliation Policy (Locked)

### Canonical Resolution Rule

- User is entitled when at least one valid, non-revoked purchase source grants `pro_lifetime_v1`.
- Projection merges provider states without double-grant side effects.
- Reconciliation is idempotent and replay-safe.

### Conflict/Uncertainty Rule

- Never remove entitlement on ambiguous provider state in the same transaction.
- Mark uncertain state as `reconcile_pending`, retry with backoff, and surface internal diagnostics.
- Only revoke when provider state is conclusively non-entitled under policy.

### Reconciliation Triggers

- Provider webhook/server notification events
- Authenticated sign-in
- Explicit user restore/re-sync action
- Scheduled background reconciliation sweep

---

## Region/Platform Fallback Policy (Locked)

### Fallback Matrix Principle

- If platform-region policy certainty is high: show permitted purchase rail(s).
- If certainty is low or rules are unmet: show store-native only (or temporarily no purchase CTA if required).
- Existing entitlements remain active unless a confirmed revocation event is processed.

### Runtime Safety Controls

- Feature flags for:
  - provider enablement by platform and region
  - emergency kill-switch by provider
  - restore/reconciliation job pause/resume
- Rollback procedure must be documented and tested.

---

## Support Playbook Policy (Locked)

### Evidence Requirements

- Required identifiers for manual investigation:
  - app account id/email
  - provider order/transaction id
  - purchase timestamp and storefront/platform context

### Manual Intervention Rules

- No manual grant/revoke without evidence and audit note.
- Every manual adjustment requires reason code and operator id.
- Escalation path:
  - L1 support triage
  - L2 billing operations
  - engineering escalation for provider/system faults

### SLA/Comms Baseline

- Define acknowledgement and resolution targets.
- Use standardized user-facing templates for pending/verified/unresolvable cases.

---

## Phase 0: Compliance Contract + Policy Matrix (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define platform-region billing policy matrix template
- [x] **Task 0.2**: Define policy decision inputs and ownership (Product/Legal/Engineering)
- [x] **Task 0.3**: Define compliant default behavior states
- [x] **Task 0.4**: Define revalidation cadence before each store release
- [x] **Task 0.5**: Define audit requirements for policy changes
- [x] **Task 0.6**: Document unresolved-policy handling path

### Phase 0 Artifacts (Completed 2026-02-22)

- `docs/ops/billing-compliance-matrix.md` (Tasks 0.1-0.6)

---

## Phase 1: Reconciliation Strategy Specification (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Define provider state normalization contract
- [x] **Task 1.2**: Define union-of-valid-sources projection algorithm
- [x] **Task 1.3**: Define `reconcile_pending` and retry/backoff behavior
- [x] **Task 1.4**: Define deterministic trigger matrix (webhook/sign-in/restore/sweep)
- [x] **Task 1.5**: Define revocation confidence requirements
- [x] **Task 1.6**: Define observability fields for reconciliation diagnostics
- [x] **Task 1.7**: Add scenario tables for success/conflict/outage paths

### Phase 1 Artifacts (Completed 2026-02-22)

- `docs/ops/billing-reconciliation.md` (Tasks 1.1-1.7)

---

## Phase 2: Fallback + Support Operations (Days 4-5)

### Tasks (6)

- [x] **Task 2.1**: Document platform-region fallback behavior matrix
- [x] **Task 2.2**: Define feature flag keys and emergency rollback playbook
- [x] **Task 2.3**: Document support triage runbook and evidence checklist
- [x] **Task 2.4**: Define escalation criteria and handoff templates
- [x] **Task 2.5**: Define manual adjustment audit schema requirements
- [x] **Task 2.6**: Align support playbook with refund and legal policies

### Phase 2 Artifacts (Completed 2026-02-22)

- `docs/ops/billing-support-playbook.md` (Tasks 2.1-2.6)

---

## Phase 3: Readiness Validation + Hardening (Days 5-7)

### Tasks (6)

- [x] **Task 3.1**: Create store-launch billing compliance checklist
- [x] **Task 3.2**: Add test scenarios for policy matrix and fallback behavior
- [x] **Task 3.3**: Add reconciliation simulation tests for multi-provider conflicts
- [x] **Task 3.4**: Add documentation quality checks and ownership sign-off
- [x] **Task 3.5**: Run cross-functional review (Product/Legal/Support/Engineering)
- [x] **Task 3.6**: Finalize publish-ready compliance artifacts

### Phase 3 Artifacts (Completed 2026-02-22)

- `docs/ops/store-launch-billing-checklist.md` (Tasks 3.1-3.6)
- `docs/test workflows/sprint-15.3-test-workflow.md` (Phase 3 scenario coverage updates)

---

## Environment and Config (Strategy Baseline)

Expected control surface:

- `BILLING_POLICY_REGION_MATRIX_VERSION`
- `BILLING_PROVIDER_STRIPE_ENABLED`
- `BILLING_PROVIDER_IOS_IAP_ENABLED`
- `BILLING_PROVIDER_ANDROID_IAP_ENABLED`
- `BILLING_EMERGENCY_KILL_SWITCH`
- `ENTITLEMENT_RECONCILE_SWEEP_ENABLED`

Names are placeholders; final env/flag keys are locked during implementation sprints.

---

## Implementation Guidelines

- Treat compliance policy as versioned configuration, not hard-coded assumptions.
- Keep reconciliation deterministic and idempotent.
- Prefer conservative entitlement revocation rules under uncertainty.
- Keep support playbook operationally realistic and auditable.
- Revalidate platform policy assumptions at every release milestone.

---

## File Structure (Expected)

- `docs/sprints/sprint-15.3.md`
- `docs/test workflows/sprint-15.3-test-workflow.md`
- `docs/ops/billing-compliance-matrix.md`
- `docs/ops/billing-reconciliation.md`
- `docs/ops/billing-support-playbook.md`
- `docs/ops/store-launch-billing-checklist.md`

---

## Definition of Done

1. [ ] Mobile billing default path is explicitly store-native and documented.
2. [ ] Apple/Google compliance path is defined with region/platform guardrails.
3. [ ] Reconciliation strategy across Stripe + stores is specified and conflict-safe.
4. [ ] Fallback behavior matrix is documented with feature-flag controls.
5. [ ] Support playbook is documented with evidence rules and escalation workflow.
6. [ ] Launch-readiness checklist is complete and reviewed cross-functionally.
7. [ ] Strategy artifacts are approved by Product, Legal, Support, and Engineering.

---

## References

- Apple alternative payments/support (EU): https://developer.apple.com/support/apps-using-alternative-payment-providers-in-the-eu
- Apple Developer Program License Agreement: https://developer.apple.com/programs/apple-developer-program-license-agreement/
- Google Play alternative billing: https://developer.android.com/google/play/billing/alternative
- Google user choice billing in-app: https://developer.android.com/google/play/billing/alternative/alternative-billing-with-user-choice-in-app
