# Sprint 15.3 Test Workflow - Mobile Billing Compliance Strategy

**Status**: Planned  
**Last Updated**: February 2026

---

## Overview

Sprint 15.3 validates strategy readiness for mobile billing compliance:

- Store-native mobile billing default policy
- Platform/region compliance decision matrix
- Entitlement reconciliation strategy across Stripe + store purchases
- Fallback behavior for uncertain/disallowed policy states
- Support playbook for billing and entitlement incidents

This workflow verifies documentation completeness, policy consistency, and
operational readiness before store launch.

---

## Prerequisites

1. Latest strategy docs are present:
   - `docs/sprints/sprint-15.3.md`
   - `docs/roadmap.md`
   - legal/refund policy docs for alignment checks

2. Review participants identified:
   - Product
   - Legal
   - Support Operations
   - Engineering

3. Versioned draft artifacts exist for:
   - compliance matrix
   - reconciliation strategy
   - fallback matrix
   - support playbook

---

## Manual QA Checklist

### Workflow 1: Mobile default billing policy is explicit [ ]

1. Open `docs/sprints/sprint-15.3.md`.
2. Review locked decisions and compliance sections.

**Expected**:

- Mobile default is clearly store-native.
- One-time Pro context remains consistent with prior monetization decisions.

### Workflow 2: Platform-region compliance matrix coverage [ ]

1. Review compliance matrix artifact.
2. Validate iOS and Android paths by region/storefront state.

**Expected**:

- Matrix clearly states allowed rails per platform/region.
- Unknown/uncertain states map to safe fallback behavior.
- Ownership and revision policy are documented.

### Workflow 3: Reconciliation algorithm completeness [ ]

1. Review reconciliation strategy doc.
2. Validate union-of-valid-sources rules and conflict handling.

**Expected**:

- Canonical rule for entitlement projection is explicit.
- `reconcile_pending`/retry behavior is defined.
- Revocation confidence threshold is documented.

### Workflow 4: Trigger and retry behavior coverage [ ]

1. Review trigger matrix in reconciliation doc.

**Expected**:

- Triggers include webhook, sign-in, restore, and scheduled sweep.
- Backoff/retry expectations are documented.
- Replay/idempotency intent is explicit.

### Workflow 5: Fallback behavior and feature flags [ ]

1. Review fallback matrix and ops controls.

**Expected**:

- Emergency kill-switch behavior is documented.
- Provider enablement flags are defined conceptually.
- Existing entitlements are protected under provider uncertainty.

### Workflow 6: Support playbook readiness [ ]

1. Review support runbook.
2. Validate incident handling paths.

**Expected**:

- Evidence checklist is explicit (transaction/order references + account identity).
- Escalation levels and handoff rules are defined.
- Manual adjustment policy requires auditability.

### Workflow 7: Cross-document consistency [ ]

1. Compare sprint strategy against:
   - `docs/sprints/sprint-15.1.md`
   - `docs/sprints/sprint-15.2.md`
   - legal/refund policy docs

**Expected**:

- No contradiction in billing model or refund assumptions.
- Terminology is consistent (`one-time Pro`, provider names, reconciliation language).

### Workflow 8: Governance and approval evidence [ ]

1. Validate final review artifact/checklist.

**Expected**:

- Product, Legal, Support, and Engineering approvals are captured.
- Artifact versions and approval dates are recorded.

---

## Suggested Execution Order

1. Validate locked decisions and compliance matrix (Workflows 1-2).
2. Validate reconciliation and fallback strategies (Workflows 3-5).
3. Validate support runbook and incident playbook (Workflow 6).
4. Validate consistency and approval governance (Workflows 7-8).

---

## Automated Validation (Documentation + Consistency)

Use these checks where available:

```bash
npm run lint
npm run typecheck
```

If docs quality scripts/checklists are added:

```bash
npm test -- docs
```

---

## Success Criteria

Sprint 15.3 strategy is considered verified when:

1. Mobile billing default and platform compliance path are explicit and unambiguous.
2. Reconciliation strategy across providers is deterministic and conflict-safe.
3. Region/platform fallback behavior is documented with safety controls.
4. Support playbook is operationally complete and audit-aware.
5. Cross-sprint and legal-policy consistency checks pass.
6. Cross-functional approvals are captured.

---

## References

- [Sprint 15.3 Plan](../sprints/sprint-15.3.md)
- [Sprint 15.2 Plan](../sprints/sprint-15.2.md)
- [Sprint 15.1 Plan](../sprints/sprint-15.1.md)
- [Roadmap](../roadmap.md)
- [Context](../context.md)
- Apple alternative payments/support (EU): https://developer.apple.com/support/apps-using-alternative-payment-providers-in-the-eu
- Apple Developer Program License Agreement: https://developer.apple.com/programs/apple-developer-program-license-agreement/
- Google Play alternative billing: https://developer.android.com/google/play/billing/alternative
- Google user choice billing in-app: https://developer.android.com/google/play/billing/alternative/alternative-billing-with-user-choice-in-app
