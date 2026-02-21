# Sprint 15.2 Test Workflow - Stripe Web Billing Integration

**Status**: Planned  
**Last Updated**: February 2026

---

## Overview

Sprint 15.2 validates production-grade Stripe web billing flows:

- One-time Pro checkout using hosted Stripe Checkout
- Secure webhook verification and retry-safe event processing
- Billing history/invoice access from account
- Web restore/re-sync for entitlement recovery
- Comprehensive API/unit/E2E coverage for purchase and failure recovery

This workflow focuses on security, reliability, and user-facing billing continuity.

---

## Prerequisites

1. Set required environment variables:

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

4. Start Stripe webhook forwarding for local verification:

   ```bash
   stripe listen --forward-to localhost:3000/api/billing/stripe/webhook
   ```

5. Test data:
   - One verified user without Pro
   - One verified user with existing Pro (for regression and restore checks)

---

## Manual QA Checklist

### Workflow 1: Checkout launch from web upgrade entrypoint [ ]

1. Sign in as non-Pro user.
2. Open `/pro`.
3. Trigger upgrade action.

**Expected**:

- User is redirected to hosted Stripe Checkout.
- Atlas app does not render custom card form.

### Workflow 2: Successful checkout grants entitlement [ ]

1. Complete Stripe test payment.
2. Return to app success route.
3. Open Pro-gated surfaces (`/insights`, `/achievements` Pro content paths).

**Expected**:

- Entitlement state is active.
- Pro-gated UI unlocks correctly.
- `/api/pro/entitlement` reflects active state.

### Workflow 3: Canceled checkout does not grant entitlement [ ]

1. Start checkout and cancel before payment completion.
2. Return to app.

**Expected**:

- Entitlement remains unchanged (non-Pro).
- User receives clear non-success UX feedback.

### Workflow 4: Webhook signature verification [ ]

1. Send invalid-signature webhook request to webhook endpoint.

**Expected**:

- Request is rejected.
- No event ledger write/projection mutation occurs.
- Error response/logging remains sanitized.

### Workflow 5: Retry-safe duplicate webhook replay [ ]

1. Replay same Stripe event ID multiple times.
2. Inspect ledger + entitlement state.

**Expected**:

- Duplicate event is deduped.
- No duplicate entitlement grants/revocations.
- Projection remains stable and deterministic.

### Workflow 6: Refund/dispute transition handling [ ]

1. Trigger refund/dispute test path (or simulate canonical mapped event).
2. Inspect entitlement state and event records.

**Expected**:

- Canonical events are recorded.
- Entitlement transitions follow policy.
- Event history remains append-only.

### Workflow 7: Account billing history/invoice link behavior [ ]

1. Sign in as Pro user.
2. Open `/account`.
3. Trigger billing history/manage billing action.

**Expected**:

- Link/session opens Stripe-hosted billing/invoice surface.
- User can access invoice/receipt history where available.

### Workflow 8: Restore/re-sync flow success path [ ]

1. Use account restore/re-sync action after a known successful purchase.
2. Re-run action multiple times.

**Expected**:

- Restore confirms entitlement when purchase exists.
- Repeated restore calls are safe/idempotent.
- UX uses clear toast-based success messaging.

### Workflow 9: Restore/re-sync failure path [ ]

1. Trigger restore for user with no qualifying purchase.

**Expected**:

- No entitlement is incorrectly granted.
- Error/empty-state messaging is clear and non-sensitive.

---

## Automated Tests

### Unit / Service

```bash
npm test -- src/lib/billing/__tests__
npm test -- src/lib/pro/__tests__
```

### API / Integration

```bash
npm test -- src/app/api/billing/__tests__
npm test -- src/app/api/pro/__tests__
```

### Component

```bash
npm test -- src/components/auth/__tests__/AccountPanel.test.tsx
```

### E2E Smoke

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

Full gate:

```bash
npm run ci:full
```

---

## Success Criteria

Sprint 15.2 is considered verified when:

1. Hosted Stripe checkout works for one-time Pro web upgrades.
2. Webhook signature verification is enforced.
3. Webhook replay/duplicate delivery is idempotent and retry-safe.
4. Entitlements update correctly for purchase and recovery scenarios.
5. Account billing history/invoice access works from account surface.
6. Restore/re-sync flow repairs entitlement state without false grants.
7. API/unit/component/E2E coverage passes.
8. Lint/typecheck/CI passes from clean checkout.

---

## References

- [Sprint 15.2 Plan](../sprints/sprint-15.2.md)
- [Sprint 15.1 Plan](../sprints/sprint-15.1.md)
- [Roadmap](../roadmap.md)
- [Context](../context.md)
