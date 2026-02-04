# Sprint 8.1 Test Workflows - Advanced Insights v1

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 8.1 introduces Advanced Insights v1 with privacy-respecting aggregation,
Pro gating, and a minimalist UI. This document covers manual and automated
checks to validate accuracy, access control, and presentation.

---

## Prerequisites

1. **Database is migrated**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set** (local or staging):

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Test accounts**:
   - One verified Free user (no `ProEntitlement` row).
   - One Pro user (with `ProEntitlement.status = active`).

---

## Workflow 1: Free user sees Insights preview [x]

1. Sign in as a Free user.
2. Visit `/insights`.

**Expected**:

- Preview upgrade card is visible.
- Insights dashboard renders with preview copy and muted styling.
- No errors or blocked navigation.

---

## Workflow 2: Pro user sees full Insights dashboard [x]

1. Promote a user to Pro using SQL:

   ```sql
   SELECT id, email FROM "User" WHERE email = 'pro@example.com';

   INSERT INTO "ProEntitlement" ("userId", "status", "source")
   VALUES ('USER_ID', 'active', 'manual')
   ON CONFLICT ("userId") DO UPDATE
   SET "status" = 'active', "source" = 'manual', "updatedAt" = now();
   ```

2. Sign in as the Pro user.
3. Visit `/insights`.

**Expected**:

- Upgrade card is hidden.
- Consistency, weekday, trend, and heatmap sections render.
- No preview labels remain.

---

## Workflow 3: Insights API gating [x]

1. Call `/api/insights` as a Free user.
2. Call `/api/insights` as a Pro user.

**Expected**:

- Free user receives `403` with `forbidden` error.
- Pro user receives `200` with aggregated metrics only.

---

## Workflow 4: Aggregation privacy check [x]

1. Call `/api/insights` as a Pro user.

**Expected**:

- No per-date keys or raw completion records in the response.
- Heatmap returns a 12x7 grid of rates only.

---

## Workflow 5: Empty state [x]

1. Sign in as a Pro user with no completions.
2. Visit `/insights`.

**Expected**:

- Notice explains that insights appear after tracking.
- Metrics show `0%` or `—` without crashes.

---

## Automated Tests

### Unit / API

```bash
npm test -- src/lib/insights/__tests__/summary.test.ts
npm test -- src/app/api/insights/__tests__/route.test.ts
```

### E2E

```bash
npm run e2e -- insights.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Success Criteria

Sprint 8.1 is complete when:

1. Free users see preview-only insights without errors.
2. Pro users see the full Insights dashboard.
3. Insights API is Pro-gated and returns aggregated data only.
4. Unit and E2E tests for insights pass.
5. CI passes from a clean checkout.

---

## References

- [Sprint 8.1 Plan](../sprints/sprint-8.1.md)
- [Insights API](../../src/app/api/insights/route.ts)
- [Insights Summary](../../src/lib/insights/summary.ts)
- [Insights Page](../../src/app/insights/page.tsx)
- [Insights Components](../../src/components/insights)
- [AGENTS](../../AGENTS.md)
