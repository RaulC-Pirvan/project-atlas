# Subscription Migration Path (Not Launch-enabled)

## Current State

Atlas launch billing behavior is one-time Pro only.
Subscription UX and purchase flows are explicitly not enabled at launch.

## Forward-compatible Schema

Current billing schema already includes subscription-compatible fields:

- `BillingEntitlementProjection.planType` (`one_time`, `subscription`)
- `BillingEntitlementProjection.periodStart`
- `BillingEntitlementProjection.periodEnd`
- `BillingEntitlementProjection.autoRenew`
- `BillingEntitlementProjection.providerCustomerId`
- `BillingEntitlementProjection.providerAccountId`

## Canonical Event Compatibility Strategy

Current canonical events can represent subscription lifecycle with policy mapping:

- Initial subscription purchase -> `purchase_succeeded` + `entitlement_granted`
- Renewal success -> `purchase_succeeded`
- Renewal failure/grace start -> `purchase_failed` with reason code
- Cancellation/expiry -> `entitlement_revoked`
- Refund/chargeback -> `refund_issued` / chargeback events + revoke policy

If richer subscription semantics are needed later, add new canonical event versioning rather than mutating old semantics.

## Example Projection (Subscription, Future)

```json
{
  "userId": "user_123",
  "productKey": "pro_lifetime_v1",
  "planType": "subscription",
  "status": "active",
  "provider": "stripe",
  "providerCustomerId": "cus_123",
  "providerAccountId": null,
  "periodStart": "2026-04-01T00:00:00.000Z",
  "periodEnd": "2026-05-01T00:00:00.000Z",
  "autoRenew": true
}
```

## Example Canonical Events (Future)

Renewal success example:

```json
{
  "type": "purchase_succeeded",
  "provider": "stripe",
  "productKey": "pro_lifetime_v1",
  "planType": "subscription",
  "providerEventId": "evt_renewal_001",
  "payload": {
    "transactionId": "txn_renewal_001",
    "amountCents": 999,
    "currency": "USD"
  }
}
```

Expiry/revoke example:

```json
{
  "type": "entitlement_revoked",
  "provider": "stripe",
  "productKey": "pro_lifetime_v1",
  "planType": "subscription",
  "providerEventId": "evt_expire_001",
  "payload": {
    "reason": "expiration",
    "effectiveAt": "2026-05-01T00:00:00.000Z"
  }
}
```

## Migration Guardrails

- Do not expose subscription purchase UI until product/legal/pricing sign-off is complete.
- Preserve existing one-time users without entitlement regression.
- Add dedicated tests for renewal, grace, cancellation, and expiry before enabling any subscription UX.
