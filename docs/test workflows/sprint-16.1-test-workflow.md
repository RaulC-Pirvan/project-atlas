# Sprint 16.1 Test Workflow - Pro Upgrade Page Refresh

**Status**: Planned  
**Last Updated**: February 2026

---

## Overview

Sprint 16.1 validates conversion UX quality for Atlas Pro:

- Clear `/pro` information hierarchy
- Explicit Free vs Pro value framing (non-degraded Free)
- Trust-first FAQ/refund messaging parity with legal policy
- Deterministic signed-in/signed-out CTA flows
- Instrumented conversion events from view to entitlement-active

This workflow verifies conversion clarity, legal consistency, and event quality.

---

## Prerequisites

1. Required docs and surfaces exist:
   - `docs/sprints/sprint-16.1.md`
   - `src/app/pro/page.tsx`
   - `src/app/legal/refunds/page.tsx`

2. Test environment setup:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   STRIPE_PRICE_PRO_LIFETIME=...
   ANALYTICS_ENABLED=true
   ```

3. Test users:
   - One signed-out browser session
   - One verified non-Pro account
   - One verified Pro account (for regression checks)

4. App running:

   ```bash
   npm run dev
   ```

---

## Manual QA Checklist

### Workflow 1: Pro page hierarchy clarity [ ]

1. Open `/pro`.
2. Review section order and narrative flow.

**Expected**:

- Benefits are concrete and understandable.
- Page structure is scannable on desktop and mobile.

### Workflow 2: Free value remains explicit [ ]

1. Review Free vs Pro comparison content.

**Expected**:

- Free tier remains clearly useful.
- No coercive or misleading downgrade framing.

### Workflow 3: Trust/refund copy alignment [ ]

1. Compare `/pro` trust/refund copy with `/legal/refunds`.

**Expected**:

- Wording aligns with legal policy.
- No extra guarantee promises beyond legal stance.

### Workflow 4: Signed-out CTA flow [ ]

1. From signed-out session, click upgrade CTA.
2. Complete auth and return flow.

**Expected**:

- User is routed through auth safely.
- Upgrade intent is preserved after auth.

### Workflow 5: Signed-in CTA flow [ ]

1. Sign in as non-Pro user.
2. Trigger upgrade CTA from `/pro`.

**Expected**:

- Checkout initiation path triggers correctly.
- No conflicting CTA state is shown.

### Workflow 6: Conversion event emission quality [ ]

1. Exercise page view, CTA click, checkout start/return.
2. Inspect analytics/event logs.

**Expected**:

- Event names and payload fields follow contract.
- No duplicate spam under normal navigation.

### Workflow 7: Account billing regression guard [ ]

1. Open `/account` and verify billing/restore controls.

**Expected**:

- Existing billing management behavior remains intact.
- No functional regression from Pro page refresh.

---

## Automated Tests

### Component / Unit

```bash
npm test -- src/components/pro/__tests__
```

### API / Integration (if touched)

```bash
npm test -- src/app/api/billing/__tests__
npm test -- src/app/api/pro/__tests__
```

### E2E (targeted)

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

Sprint 16.1 is considered verified when:

1. `/pro` hierarchy and messaging are clear and concrete.
2. Free value remains explicit and non-degraded.
3. FAQ/refund/trust copy aligns with legal policy.
4. Signed-out and signed-in CTA paths are deterministic.
5. Conversion events are emitted correctly with stable payloads.
6. `/account` billing behavior shows no regression.
7. Lint/typecheck/tests and targeted E2E pass.

---

## References

- [Sprint 16.1 Plan](../sprints/sprint-16.1.md)
- [Sprint 15.2 Plan](../sprints/sprint-15.2.md)
- [Roadmap](../roadmap.md)
- [Refund Policy Page](../../src/app/legal/refunds/page.tsx)
