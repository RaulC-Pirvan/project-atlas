# Store Launch Billing Compliance Checklist (Phase 3)

- Status: Draft for Sprint 15.3 Phase 3
- Last updated: 2026-02-22
- Owners: Product, Legal, Support Operations, Engineering
- Scope: Store-launch readiness validation and hardening for mobile billing

## Purpose

Provide a release-gate checklist that converts Sprint 15.3 strategy outputs into
publish-ready, auditable launch controls.

This artifact implements Sprint 15.3 Phase 3 Tasks 3.1-3.6.

## 1) Store-Launch Compliance Gate (Task 3.1)

Mark each item before mobile release cut:

- [ ] Active policy matrix version is set and approved:
  - `BILLING_POLICY_REGION_MATRIX_VERSION`
  - Ref: `docs/ops/billing-compliance-matrix.md`
- [ ] Platform default purchase behavior is store-native for iOS and Android.
- [ ] External/alternative billing rails are region-gated and explicitly approved.
- [ ] Emergency controls are configured and tested:
  - `BILLING_EMERGENCY_KILL_SWITCH`
  - provider enable/disable flags
- [ ] Reconciliation trigger paths are enabled and validated:
  - webhook/server notifications
  - sign-in recheck
  - explicit restore
  - scheduled sweep
- [ ] Support runbook and escalation templates are published:
  - Ref: `docs/ops/billing-support-playbook.md`
- [ ] Legal/refund wording remains aligned with billing behavior:
  - `src/app/legal/refunds/page.tsx`
  - `src/app/legal/terms/page.tsx`

## 2) Policy Matrix + Fallback Test Scenarios (Task 3.2)

Run these scenarios before launch sign-off:

| Scenario ID | Input state                                     | Expected outcome                                                    |
| ----------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `PM-01`     | iOS, high certainty, approved store-only region | Show store-native purchase CTA only                                 |
| `PM-02`     | Android, high certainty, approved region        | Show store-native CTA; external rail only if allowlist flag enabled |
| `PM-03`     | iOS, medium certainty, partial evidence         | Fallback to `store_only`; no unsupported CTA                        |
| `PM-04`     | Android, low/unknown certainty                  | `hide_purchase_cta` or strict store fallback per policy             |
| `PM-05`     | Provider flag disabled for platform             | Corresponding purchase rail not rendered                            |
| `PM-06`     | Global kill-switch active                       | Purchase initiation blocked per playbook                            |
| `PM-07`     | Existing entitled user under uncertain policy   | Entitlement remains active                                          |
| `PM-08`     | New user in uncertain/disallowed state          | No disallowed purchase path shown                                   |

### Validation Notes

- Record policy version, flag values, and observed UI behavior.
- Attach screenshot or log reference for each scenario outcome.

## 3) Reconciliation Conflict Simulation Set (Task 3.3)

Use reconciliation simulation cases to validate conflict-safety:

| Scenario ID | Source-state setup                                     | Expected result                                      |
| ----------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `RC-01`     | `stripe=active`, stores unknown                        | Projection `active`                                  |
| `RC-02`     | `stripe=revoked`, `ios_iap=active`                     | Projection remains `active` (union-of-valid-sources) |
| `RC-03`     | `android_iap=pending(low)` and no other active sources | `reconcile_pending`, retry scheduled                 |
| `RC-04`     | Duplicate provider event replay                        | No projection drift; dedupe reason captured          |
| `RC-05`     | Refund/dispute update arrives out of order             | Deterministic resolution; no same-tx false revoke    |
| `RC-06`     | Provider verification timeout                          | `reconcile_pending`; existing entitlement preserved  |
| `RC-07`     | All sources conclusively non-entitled and verified     | Projection `revoked` allowed                         |
| `RC-08`     | Pending state >72h                                     | Billing ops escalation triggered; no auto-revoke     |

### Required Artifacts

- Reconcile run logs with correlation ids (`requestId`, `reconcileRunId`).
- Decision evidence (`active`, `revoked`, `reconcile_pending`, `no_change`).
- Incident references for any failed scenario.

## 4) Documentation Quality + Ownership Sign-off Checks (Task 3.4)

### Documentation Quality Checklist

- [ ] Terminology is consistent across sprint + ops docs (`one-time Pro`, providers, reconciliation terms).
- [ ] Policy/trigger/fallback behavior has no contradiction across:
  - `docs/ops/billing-compliance-matrix.md`
  - `docs/ops/billing-reconciliation.md`
  - `docs/ops/billing-support-playbook.md`
  - `docs/sprints/sprint-15.3.md`
- [ ] Legal/refund statements align with current public policy surfaces.
- [ ] All docs include update date and clear ownership.
- [ ] Test workflow doc references current artifact set.

### Ownership Sign-off Table

| Function           | Owner | Status  | Date | Notes                                                                  |
| ------------------ | ----- | ------- | ---- | ---------------------------------------------------------------------- |
| Product            | TBD   | Pending | TBD  | Policy rollout approval required                                       |
| Legal              | TBD   | Pending | TBD  | Storefront compliance confirmation required                            |
| Support Operations | TBD   | Pending | TBD  | Escalation and manual-adjustment process approval required             |
| Engineering        | TBD   | Pending | TBD  | Runtime safety controls and reconciliation readiness approval required |

## 5) Cross-Functional Review Record (Task 3.5)

Review execution mode: asynchronous artifact review + sign-off capture.

### Review Packet

- `docs/sprints/sprint-15.3.md`
- `docs/ops/billing-compliance-matrix.md`
- `docs/ops/billing-reconciliation.md`
- `docs/ops/billing-support-playbook.md`
- `docs/ops/store-launch-billing-checklist.md`
- `docs/test workflows/sprint-15.3-test-workflow.md`

### Review Outcomes Log

| Date       | Function           | Outcome     | Follow-up                                                |
| ---------- | ------------------ | ----------- | -------------------------------------------------------- |
| 2026-02-22 | Engineering        | Draft-ready | Waiting on Product/Legal/Support approvals               |
| TBD        | Product            | Pending     | Confirm release-region rollout plan                      |
| TBD        | Legal              | Pending     | Confirm storefront policy interpretation and constraints |
| TBD        | Support Operations | Pending     | Confirm staffing and escalation coverage                 |

## 6) Publish-Ready Artifact Manifest (Task 3.6)

Final artifact set for Sprint 15.3:

- `docs/sprints/sprint-15.3.md`
- `docs/ops/billing-compliance-matrix.md`
- `docs/ops/billing-reconciliation.md`
- `docs/ops/billing-support-playbook.md`
- `docs/ops/store-launch-billing-checklist.md`
- `docs/test workflows/sprint-15.3-test-workflow.md`

### Publish Conditions

- [ ] All required sign-offs recorded in this checklist.
- [ ] No open contradiction with legal/refund policy surfaces.
- [ ] Phase 3 scenario outcomes recorded and reviewed.
- [ ] Release gate owner confirms checklist closure.

Do not mark Sprint 15.3 publish-ready until all publish conditions are checked.
