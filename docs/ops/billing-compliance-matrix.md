# Mobile Billing Compliance Matrix (Phase 0 Contract)

- Status: Draft for Sprint 15.3 Phase 0
- Last updated: 2026-02-22
- Owners: Product, Legal, Engineering
- Scope: Mobile billing purchase-rail policy by platform and storefront region

## Purpose

Define a single policy contract for platform-region billing behavior so Atlas can
ship compliant defaults, deterministic fallbacks, and auditable policy changes.

This artifact implements Sprint 15.3 Phase 0 Tasks 0.1-0.6.

## Policy Matrix Template (Task 0.1)

Every policy version must provide rows in this shape:

| policy_version  | effective_from_utc     | platform           | storefront_region                        | policy_certainty                   | default_purchase_mode | allowed_rails                                        | prohibited_rails | external_program_gate                                | purchase_cta_mode                                        | entitlement_behavior                 | evidence_refs                 | reviewed_by |
| --------------- | ---------------------- | ------------------ | ---------------------------------------- | ---------------------------------- | --------------------- | ---------------------------------------------------- | ---------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------ | ----------------------------- | ----------- |
| `vYYYY.MM.DD.N` | ISO-8601 UTC timestamp | `ios` or `android` | ISO country code or grouped region label | `high`, `medium`, `low`, `unknown` | `store_native_only`   | comma-separated (`ios_iap`, `android_iap`, `stripe`) | comma-separated  | policy flag or program id required for external rail | `store_only`, `store_plus_external`, `hide_purchase_cta` | `fail_safe_keep_existing` (required) | links to official policy/docs | name + role |

### Required Value Notes

- `policy_certainty` drives fallback strictness.
- `default_purchase_mode` is always store-native on mobile unless explicitly
  approved for a platform-region/program combination.
- `entitlement_behavior` remains `fail_safe_keep_existing` for uncertain states.

## Decision Inputs and Ownership (Task 0.2)

### Required Inputs

- Platform rules and latest policy docs (Apple/Google official sources).
- Product monetization intent (`pro_lifetime_v1`, one-time Pro).
- Legal interpretation and storefront risk assessment.
- Engineering feasibility and release controls (feature flags, kill switches).

### Ownership Model

| Decision area                                 | DRI team           | Required approvers   | Notes                                                           |
| --------------------------------------------- | ------------------ | -------------------- | --------------------------------------------------------------- |
| Platform/storefront compliance interpretation | Legal              | Product, Engineering | Legal controls rule interpretation and risk language.           |
| Purchase rail activation/deactivation         | Product            | Legal, Engineering   | Product owns rollout intent within legal/technical constraints. |
| Runtime guardrails and fail-closed behavior   | Engineering        | Product, Legal       | Engineering owns implementation and rollback safety.            |
| Policy version publication                    | Product Operations | Legal, Engineering   | Publication blocked unless all approvals are recorded.          |

## Compliant Default Behavior States (Task 0.3)

These states are mandatory defaults for mobile purchase UI behavior:

| state_id                 | Trigger                                                                    | Purchase behavior                                         | Entitlement behavior                                                               |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `STORE_NATIVE_ENFORCED`  | Normal operation, high-certainty policy                                    | Show store-native purchase rail only                      | Existing entitlement unchanged; new grants via valid provider source               |
| `STORE_NATIVE_FALLBACK`  | Medium/low certainty or missing external eligibility proof                 | Restrict UI to store-native only                          | Existing entitlement unchanged                                                     |
| `PURCHASE_CTA_SUSPENDED` | Unknown/disallowed state where even storefront path cannot be safely shown | Hide/disable purchase CTA temporarily                     | Existing entitlement unchanged (`fail_safe_keep_existing`)                         |
| `RECONCILE_PENDING`      | Provider state conflict/ambiguity                                          | Do not present unsupported rail claims; keep safe UI mode | Mark reconciliation pending; retry with backoff; do not revoke in same transaction |

## Revalidation Cadence (Task 0.4)

Policy revalidation is required for every mobile release cut:

1. T-14 days before release: Legal + Product + Engineering policy review.
2. T-7 days before release: finalize matrix version and flag plan.
3. T-2 days before release: freeze policy version and capture approval artifact.
4. Release day: confirm no blocking policy changes since freeze.
5. Post-release (within 5 business days): incident review and adjustments backlog.

Any material platform-policy update after freeze forces a revalidation cycle and
may block release.

## Audit Requirements for Policy Changes (Task 0.5)

Each policy version change must record:

- `change_id` (unique)
- `policy_version`
- `changed_by` (operator id)
- `change_reason_code` (enumerated)
- `summary_of_change`
- `risk_assessment`
- `approvals` (Product, Legal, Engineering with timestamps)
- `effective_from_utc`
- `rollback_version`
- linked evidence (`ticket`, `doc`, or official policy URL)

Minimum retention: keep all policy change records for the lifetime of the
product plus any legal retention requirement.

## Unresolved-Policy Handling Path (Task 0.6)

Use this path when policy certainty is `low` or `unknown`, or required evidence
is missing:

1. Enter safe mode immediately:
   - Force `STORE_NATIVE_FALLBACK` or `PURCHASE_CTA_SUSPENDED`.
   - Keep existing entitlements active until confirmed revocation.
2. Open a compliance incident:
   - Assign owner in Product Operations.
   - Attach policy references and storefront/region impact list.
3. Escalate for decision:
   - Legal assesses policy ambiguity.
   - Engineering confirms safe runtime behavior.
   - Product decides go/no-go for affected storefronts.
4. Resolve with explicit outcome:
   - `approved_with_constraints`, `defer_external`, or `block_release`.
5. Publish patched matrix version and record approvals/audit fields before
   enabling changed behavior.

No unresolved-policy state may ship with external billing enabled.

## Source Validation References

- Apple App Store compliance references:
  - https://developer.apple.com/support/apps-using-alternative-payment-providers-in-the-eu
  - https://developer.apple.com/support/communicating-about-alternative-purchase-options/
- Google Play compliance references:
  - https://developer.android.com/google/play/billing/alternative
  - https://developer.android.com/google/play/billing/alternative/alternative-billing-with-user-choice-in-app
  - https://developer.android.com/google/play/billing/alternative/alternative-billing-only-in-app

Policy links were last rechecked on 2026-02-22. Recheck before every release.
