# Billing vs Legal Consistency Review

- Review date: 2026-02-21
- Reviewer: Engineering (Sprint 15.1 Phase 3)
- Scope: Billing runtime docs vs published legal/support surfaces

## Surface Cross-check

| Surface             | Billing expectation                                                     | Current wording status | Action                    |
| ------------------- | ----------------------------------------------------------------------- | ---------------------- | ------------------------- |
| `/legal/refunds`    | Web one-time refunds and store-refund ownership are explicit            | Aligned                | None                      |
| `/legal/terms`      | Completion and service boundaries do not conflict with billing behavior | Aligned                | None                      |
| `/support`          | Billing help path exists and is user-facing                             | Aligned                | None                      |
| Sprint billing docs | Formal pricing gate and freeze control required                         | Aligned                | Added docs in `docs/ops/` |

## Findings

- No contradiction found between billing launch defaults and legal refund policy wording.
- App-store refund ownership remains correctly delegated to Apple/Google policy.
- Support path remains valid for billing escalation and refund requests.

## Follow-up Requirements

- Any future pricing/plan change must include legal re-review before release.
- If subscription UX is enabled later, this consistency review must be re-run.
