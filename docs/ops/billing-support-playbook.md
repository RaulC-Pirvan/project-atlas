# Billing Fallback and Support Playbook (Phase 2 Contract)

- Status: Draft for Sprint 15.3 Phase 2
- Last updated: 2026-02-22
- Owners: Support Operations, Engineering, Legal, Product
- Scope: Mobile billing fallback behavior, rollout controls, and incident handling

## Purpose

Define operational behavior for billing fallback and support handling so mobile
billing remains compliant, user-safe, and auditable during uncertainty or
provider incidents.

This artifact implements Sprint 15.3 Phase 2 Tasks 2.1-2.6.

## Platform-Region Fallback Behavior Matrix (Task 2.1)

Fallback behavior is policy-driven and defaults to compliance-safe modes.

| Case | Platform    | Region policy certainty | External billing eligibility | Provider health                | Purchase CTA mode                                                   | Allowed purchase rails                                 | Entitlement handling                                            | Support posture                 |
| ---- | ----------- | ----------------------- | ---------------------------- | ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------- |
| `A`  | iOS         | high                    | eligible and approved        | healthy                        | `store_only`                                                        | `ios_iap`                                              | keep existing + allow new valid grants                          | normal triage                   |
| `B`  | Android     | high                    | eligible and approved        | healthy                        | `store_only` by default; external only when explicit policy flag on | `android_iap` (+ approved external rail where allowed) | keep existing + allow new valid grants                          | normal triage                   |
| `C`  | iOS/Android | medium                  | unknown or partial evidence  | healthy                        | `store_only`                                                        | store-native rail only                                 | keep existing; defer risky state changes                        | proactive policy review         |
| `D`  | iOS/Android | low/unknown             | not approved                 | healthy                        | `hide_purchase_cta` when compliance cannot be guaranteed            | none                                                   | keep existing (`fail_safe_keep_existing`)                       | incident + escalation           |
| `E`  | iOS/Android | any                     | any                          | degraded provider verification | `store_only` or `hide_purchase_cta` per risk                        | minimal compliant rail only                            | no revoke on ambiguity; set `reconcile_pending`                 | incident response + user update |
| `F`  | iOS/Android | high                    | approved                     | emergency kill-switch active   | `hide_purchase_cta` or constrained `store_only`                     | disabled per switch scope                              | existing entitlements remain active unless conclusively revoked | emergency playbook              |

## Feature Flag Keys and Rollback Playbook (Task 2.2)

### Required Control Surface

| Key                                          | Type         | Owner               | Purpose                                                     |
| -------------------------------------------- | ------------ | ------------------- | ----------------------------------------------------------- |
| `BILLING_POLICY_REGION_MATRIX_VERSION`       | string       | Product Ops         | Locks active policy matrix version                          |
| `BILLING_PROVIDER_STRIPE_ENABLED`            | boolean      | Engineering         | Controls Stripe purchase rail availability                  |
| `BILLING_PROVIDER_IOS_IAP_ENABLED`           | boolean      | Engineering         | Controls iOS IAP rail availability                          |
| `BILLING_PROVIDER_ANDROID_IAP_ENABLED`       | boolean      | Engineering         | Controls Android IAP rail availability                      |
| `BILLING_EMERGENCY_KILL_SWITCH`              | boolean      | Engineering on-call | Global emergency stop for purchase initiation               |
| `ENTITLEMENT_RECONCILE_SWEEP_ENABLED`        | boolean      | Engineering         | Pause/resume scheduled reconciliation sweep                 |
| `BILLING_EXTERNAL_IOS_REGION_ALLOWLIST`      | string (CSV) | Product + Legal     | Region allowlist for iOS external billing where allowed     |
| `BILLING_EXTERNAL_ANDROID_REGION_ALLOWLIST`  | string (CSV) | Product + Legal     | Region allowlist for Android external billing where allowed |
| `BILLING_SUPPORT_MANUAL_ADJUSTMENTS_ENABLED` | boolean      | Billing Ops lead    | Hard gate for manual adjustment tooling                     |

### Emergency Rollback Procedure

1. Confirm incident scope:
   - affected platform(s), region(s), provider(s), and symptom type.
2. Freeze risky purchase paths:
   - enable `BILLING_EMERGENCY_KILL_SWITCH=true` if broad risk exists.
   - otherwise disable affected provider key(s) only.
3. Preserve entitlement safety:
   - do not mass-revoke.
   - keep existing entitlements active unless revocation is conclusively verified.
4. Stabilize reconciliation:
   - if provider feed is noisy/broken, temporarily pause sweep only when it
     amplifies failure (`ENTITLEMENT_RECONCILE_SWEEP_ENABLED=false`).
5. Communicate:
   - post internal incident update (Support, Product, Legal, Engineering).
   - apply user-facing status messaging for impacted purchase flow.
6. Recover:
   - re-enable keys incrementally by provider/region after verification.
   - capture post-incident report with root cause and policy impact.

## Support Triage Runbook and Evidence Checklist (Task 2.3)

### Billing Ticket Intake Requirements

Required evidence before entitlement/manual-action decision:

- Atlas account identifier (`userId` or account email)
- platform (`ios`, `android`, `web`)
- storefront region/country at purchase time
- provider order/transaction id
- purchase timestamp (UTC or local + timezone)
- issue type (`missing_pro`, `duplicate_charge`, `refund_question`, `restore_failed`)

If evidence is incomplete, ticket stays `open` with explicit evidence request.

## Triage Workflow

1. L1 Support (`open`):
   - verify identity and collect required evidence.
   - classify case and check known incidents.
2. L2 Billing Ops (`in_progress`):
   - validate provider references and reconciliation diagnostics.
   - confirm whether entitlement action is needed.
3. Resolution (`resolved`):
   - confirm customer-facing outcome.
   - include internal resolution note and any follow-up ownership.

### SLA Baseline

- first response target: within 2 business days
- status update cadence for active incidents: every 2 business days
- high-impact incident updates: same business day via incident channel

## Escalation Criteria and Handoff Templates (Task 2.4)

### Escalation Triggers

Escalate from L1 to L2 when:

- valid evidence exists but entitlement cannot be explained by known policy.
- `reconcile_pending` persists longer than 24h for paid user.
- multiple similar reports indicate provider/system regression.

Escalate from L2 to Engineering when:

- webhook/notification ingestion appears delayed or broken.
- dedupe/idempotency behavior appears incorrect.
- projection outcome contradicts normalized provider evidence.

Escalate Legal/Product involvement when:

- storefront policy interpretation is ambiguous.
- regional purchase rail behavior may violate current policy assumptions.

### Handoff Template: L1 -> L2

| Field                         | Required |
| ----------------------------- | -------- |
| Ticket id                     | yes      |
| User id/email                 | yes      |
| Platform + storefront region  | yes      |
| Provider transaction/order id | yes      |
| Purchase timestamp            | yes      |
| Issue summary + user impact   | yes      |
| Evidence completeness status  | yes      |
| Prior similar incident link   | no       |

### Handoff Template: L2 -> Engineering

| Field                                                              | Required |
| ------------------------------------------------------------------ | -------- |
| Incident id / ticket group                                         | yes      |
| Suspected failure domain (ingestion/projection/policy)             | yes      |
| Correlation ids (`requestId`, `providerEventId`, `reconcileRunId`) | yes      |
| Observed vs expected entitlement decision                          | yes      |
| Blast radius estimate                                              | yes      |
| Temporary mitigation already applied                               | yes      |

## Manual Adjustment Audit Schema Requirements (Task 2.5)

Any manual grant/revoke/fix requires durable audit records.

### Required Fields

| Field                | Type                            | Required | Notes                       |
| -------------------- | ------------------------------- | -------- | --------------------------- |
| `adjustmentId`       | string                          | yes      | unique id                   |
| `ticketId`           | string                          | yes      | support ticket linkage      |
| `userId`             | string                          | yes      | affected account            |
| `productKey`         | string                          | yes      | `pro_lifetime_v1`           |
| `action`             | `grant` \| `revoke` \| `repair` | yes      | adjustment type             |
| `reasonCode`         | string enum                     | yes      | policy-backed reason        |
| `evidenceSummary`    | text                            | yes      | concise evidence statement  |
| `providerReferences` | json                            | yes      | transaction/event ids       |
| `requestedBy`        | string                          | yes      | operator id                 |
| `approvedBy`         | string                          | yes      | second approver for revokes |
| `createdAt`          | datetime                        | yes      | record timestamp            |
| `effectiveAt`        | datetime                        | yes      | adjustment effect time      |
| `rollbackPlan`       | text                            | no       | rollback instruction        |
| `relatedIncidentId`  | string                          | no       | incident linkage            |

### Audit Rules

- No manual adjustment without linked evidence and ticket.
- Revokes require dual control (`requestedBy` and `approvedBy` must differ).
- Every adjustment must emit immutable ledger note for replay traceability.

## Legal and Refund Policy Alignment (Task 2.6)

Playbook behavior must remain aligned with published policy surfaces:

- `src/app/legal/refunds/page.tsx`
- `src/app/legal/terms/page.tsx`
- `docs/ops/billing-legal-consistency-review.md`

### Required Alignment Rules

1. Direct web one-time purchases:
   - honor the 14-day goodwill refund window policy.
2. App store purchases:
   - refunds are processed under Apple/Google channels.
   - support assists with guidance and verification, not policy override.
3. Support response expectations:
   - maintain the 2-business-day first-response target language.
4. No contradiction between support templates and legal wording:
   - update legal consistency review if policy wording changes.

## Operational Notes

- This playbook is strategy-level and does not create new API/runtime behavior.
- Implementation sprint must wire templates and audit schema into tooling.
- Revalidate this playbook before each store release cut.
