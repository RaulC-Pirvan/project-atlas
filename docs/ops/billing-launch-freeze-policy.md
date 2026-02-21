# Billing Launch Freeze Policy

## Purpose

Prevent last-minute billing configuration drift that can break checkout, refunds, or entitlement mapping near launch.

## Freeze Scope

During freeze, these changes are blocked unless exception-approved:

- `STRIPE_PRICE_PRO_LIFETIME` value changes.
- `BillingProductMapping` edits for `pro_lifetime_v1`.
- Canonical event mapping changes for checkout/refund flows.
- Refund wording changes in legal pages tied to billing behavior.

## Standard Freeze Window

- Starts: 7 calendar days before launch.
- Ends: 48 hours after launch.

If launch date shifts, freeze dates must be recalculated and re-approved.

## Allowed Changes During Freeze

- Non-billing UI copy changes unrelated to pricing/refunds.
- Observability-only improvements with zero billing behavior impact.
- Fixes for production incidents with approved emergency path.

## Emergency Exception Path

All emergency billing changes require:

1. Engineering incident summary and rollback plan.
2. Product + Engineering + Operations approval.
3. Legal approval when refund/terms behavior changes.
4. Post-change validation checklist execution.

## Post-change Validation Checklist

- [ ] Stripe checkout session creates successfully in target environment.
- [ ] Webhook signature verification remains enforced.
- [ ] `/api/pro/entitlement` still returns expected state for a test user.
- [ ] Refund and support legal copy remains accurate.
- [ ] Decision log updated with reason, approvers, and timestamp.
