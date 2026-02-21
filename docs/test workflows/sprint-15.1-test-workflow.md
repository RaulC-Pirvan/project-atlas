# Sprint 15.1 Test Workflow - Billing Architecture + Entitlement Abstraction

**Status**: Planned  
**Last Updated**: February 2026

---

## Overview

Sprint 15.1 establishes monetization runtime foundations for Atlas Pro:

- Web-first purchase rail via hosted Stripe Checkout
- One-time Pro as launch default
- Provider-aware entitlement abstraction (`manual`, `stripe`, `ios_iap`, `android_iap`)
- Canonical billing/entitlement event model
- Idempotent event ingestion and projection updates
- Durable event ledger + current entitlement projection
- Formal launch pricing decision gate
- Documented migration path for future subscriptions (not enabled)

This workflow verifies architecture correctness, security boundaries, and operational stability.

---

## Prerequisites

1. Set required environment values:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   STRIPE_PRICE_PRO_LIFETIME=...
   ```

2. Apply migrations and generate client:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   ```

3. Start app:

   ```bash
   npm run dev
   ```

4. Test accounts:
   - One verified regular user
   - Optional admin user for ops visibility checks

5. Stripe test mode is enabled with webhook forwarding in local/dev as needed.

---

## Manual QA Checklist

### Workflow 1: One-time Pro remains launch default [x]

1. Review `/pro` and purchase initiation flow.
2. Confirm there is no subscription plan surfaced in launch UX.

**Expected**:

- Purchase UX communicates one-time Pro only.
- No monthly/yearly subscription offer is visible.

### Workflow 2: Hosted Stripe Checkout redirect flow [x]

1. From `/pro`, trigger checkout.
2. Confirm redirect goes to Stripe-hosted checkout (test mode).

**Expected**:

- User is redirected to Stripe hosted page.
- No custom card-entry form is rendered in Atlas app.

### Workflow 3: Provider-aware entitlement projection [x]

1. Complete a successful Stripe test checkout.
2. Query entitlement API and DB projection.

**Expected**:

- Entitlement source/provider is `stripe`.
- Internal canonical product key resolves to `pro_lifetime_v1`.
- Existing entitlement read path remains compatible for client/UI.

### Workflow 4: Canonical event capture on purchase lifecycle [x]

1. Trigger purchase success and failure scenarios in test mode.
2. Inspect billing event ledger rows.

**Expected**:

- Events are stored using canonical event names.
- Ledger rows preserve provider references and timestamps.
- Event payload mapping is consistent and version-safe.

### Workflow 5: Idempotency on duplicate webhook delivery [x]

1. Replay the same Stripe webhook event (same provider event id) multiple times.
2. Inspect ledger + projection.

**Expected**:

- Duplicate inbound event is deduped.
- Entitlement projection does not drift or duplicate grants.
- Processing is replay-safe.

### Workflow 6: Refund/chargeback-driven entitlement transitions [x]

1. Trigger refund (or simulated canonical refund event).
2. Validate projection transition and audit trail.

**Expected**:

- Canonical refund/chargeback events are recorded.
- Entitlement projection transitions follow policy.
- No destructive mutation of historical events.

### Workflow 7: Security and failure-path hardening [x]

1. Send invalid webhook signature request.
2. Trigger malformed payload request.

**Expected**:

- Invalid signatures are rejected.
- Errors are sanitized (no sensitive internals leaked to clients).
- Failure observability logs include route/status/error code.

### Workflow 8: Pricing decision gate artifacts [x]

1. Review pricing gate documentation and approval record template.
2. Confirm required sign-off fields are present.

**Expected**:

- Gate requires Product, Finance, Legal, and Engineering sign-off.
- Record includes chosen launch price, currencies, effective date, and freeze policy.

### Workflow 9: Subscription migration path documentation [x]

1. Review migration design notes.

**Expected**:

- Plan discriminator (`one_time`, `subscription`) is documented.
- Future fields (`periodStart`, `periodEnd`, `autoRenew`) are defined.
- Explicit note states subscription UX is out of scope for this sprint.

---

## Automated Tests

### Unit / Service

```bash
npm test -- src/lib/billing/__tests__
npm test -- src/lib/pro/__tests__
```

### API / Integration

```bash
npm test -- src/app/api/pro/__tests__
npm test -- src/app/api/billing/__tests__
```

### Targeted E2E (Optional Smoke)

```bash
npm run e2e -- e2e/pro-billing.spec.ts --project=chromium
```

---

## CI Stability Pass

```bash
npm run lint
npm run typecheck
npm test
npm run e2e -- e2e/pro-billing.spec.ts --project=chromium
```

For full gate:

```bash
npm run ci:full
```

---

## Success Criteria

Sprint 15.1 is considered verified when:

1. One-time Pro remains launch default behavior.
2. Stripe hosted checkout flow works end-to-end in test mode.
3. Provider-aware entitlement projection is correct and client-compatible.
4. Canonical event taxonomy is persisted and consistently applied.
5. Duplicate event replay is idempotent with no state drift.
6. Failure paths remain sanitized and secure.
7. Pricing gate documentation is complete and actionable.
8. Subscription migration path is documented without enabling subscriptions.
9. Lint, typecheck, tests, and optional billing smoke pass.

---

## References

- [Sprint 15.1 Plan](../sprints/sprint-15.1.md)
- [Roadmap](../roadmap.md)
- [Context](../context.md)
- [Existing Pro Entitlement API](../../src/app/api/pro/entitlement/route.ts)
