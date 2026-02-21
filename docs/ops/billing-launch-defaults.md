# Billing Launch Defaults (One-time Pro)

## Launch Defaults

- Product key: `pro_lifetime_v1`
- Plan type: `one_time`
- Primary launch provider: `stripe` (hosted web checkout)
- Entitlement API: `GET /api/pro/entitlement`
- Entitlement authority: server-side projection (`BillingEntitlementProjection`)

## Canonical Provider Values

- `manual`
- `stripe`
- `ios_iap`
- `android_iap`

## Canonical Event Types (launch support)

- `purchase_initiated`
- `purchase_succeeded`
- `purchase_failed`
- `refund_issued`
- `chargeback_opened`
- `chargeback_won`
- `chargeback_lost`
- `entitlement_granted`
- `entitlement_revoked`
- `restore_requested`
- `restore_succeeded`
- `restore_failed`

## Required Runtime Config

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_LIFETIME`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Launch Pricing Guardrails

- Price IDs are external references only; canonical product semantics stay internal (`pro_lifetime_v1`).
- Entitlement state is never accepted from clients.
- Webhook events must pass signature verification before any projection mutation.
- Duplicate webhook deliveries must remain idempotent.

## Legal/Refund Alignment (reviewed)

- Web one-time purchases follow the refund stance published on `/legal/refunds`:
  - 14-day goodwill refund window for direct web purchases.
- App-store purchases follow platform refund policies:
  - Apple App Store
  - Google Play
- Terms and support copy must stay consistent with this behavior:
  - `/legal/terms`
  - `/legal/refunds`
  - `/support`
