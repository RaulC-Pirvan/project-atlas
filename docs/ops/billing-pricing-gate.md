# Billing Pricing Gate (Launch)

## Purpose

Define the mandatory approval gate for launch pricing of Atlas Pro.
Launch pricing is not approved until every checklist item is complete and recorded.

## Scope

- Launch offer: one-time Pro (`pro_lifetime_v1`) only.
- Providers in scope:
  - `stripe` (web launch path)
  - `ios_iap` and `android_iap` (planned store path, not launch-enabled in UX)

## Gate Checklist

- [ ] Product sign-off on launch price and supported currencies.
- [ ] Finance sign-off on revenue model assumptions and refund-impact expectations.
- [ ] Legal sign-off confirming Terms/Refund policy language matches billing behavior.
- [ ] Engineering sign-off confirming canonical product mapping and event processing behavior.
- [ ] Operations sign-off confirming environment price IDs are configured correctly.
- [ ] Freeze window approved and communicated (see `docs/ops/billing-launch-freeze-policy.md`).
- [ ] Final decision artifact completed and stored in repo/docs.

## Approval Artifact Template

Use this template for every pricing decision.

```md
# Billing Pricing Decision Record

- Decision id: BILLING-PRICING-YYYYMMDD-01
- Decision date (UTC): YYYY-MM-DD
- Effective date (UTC): YYYY-MM-DD
- Environment: production
- Product key: pro_lifetime_v1
- Plan type: one_time

## Price Decision

- Base amount: <number>
- Currency set: [USD, ...]
- Tax handling summary: <short statement>

## Provider Mapping

- stripe:
  - STRIPE_PRICE_PRO_LIFETIME: price_xxx
- ios_iap:
  - product_id placeholder: <id or TBD>
- android_iap:
  - product_id placeholder: <id or TBD>

## Freeze Window

- Freeze start (UTC): YYYY-MM-DDTHH:MM:SSZ
- Freeze end (UTC): YYYY-MM-DDTHH:MM:SSZ
- Emergency exception owner: <role/name>

## Approval Sign-offs

- Product: <name, date, status>
- Finance: <name, date, status>
- Legal: <name, date, status>
- Engineering: <name, date, status>
- Operations: <name, date, status>

## Legal/Refund Consistency Check

- Refund policy (`/legal/refunds`) reviewed: yes/no
- Terms (`/legal/terms`) reviewed: yes/no
- Support guidance (`/support`) reviewed: yes/no
- Notes: <short summary>
```

## Evidence Retention

- Store final decision records in version control under `docs/ops/`.
- Keep prior decisions immutable; create a new record for each change.
