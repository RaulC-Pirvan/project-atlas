# Sprint 7.1 Test Workflows - Atlas Pro Gating

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 7.1 introduces Atlas Pro gating: a server-side entitlement model, preview
states, and non-intrusive upgrade entry points. This document covers manual and
automated checks to ensure Pro is additive and core habits remain fully usable.

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

## Workflow 1: Free user sees preview states [x]

1. Sign in as a Free user.
2. Visit `/calendar`.
3. Locate the Pro preview card in the sidebar.
4. Visit `/account` and locate the Pro account card.

**Expected**:

- Cards display `Preview`.
- `Upgrade to Pro` link is visible.
- `Restore purchase` button is disabled and shows the placeholder copy.
- Core habit tracking UI remains fully functional.

---

## Workflow 2: Pro user sees active state [x]

1. Promote a user to Pro using SQL:

   ```sql
   SELECT id, email FROM "User" WHERE email = 'pro@example.com';

   INSERT INTO "ProEntitlement" ("userId", "status", "source")
   VALUES ('USER_ID', 'active', 'manual')
   ON CONFLICT ("userId") DO UPDATE
   SET "status" = 'active', "source" = 'manual', "updatedAt" = now();
   ```

2. Sign in as the Pro user.
3. Visit `/calendar`, `/account`, and `/pro`.

**Expected**:

- Cards display `Pro active`.
- Preview cards show the Pro active messaging (no upgrade CTA).
- `/pro` page renders both Pro cards without errors.

---

## Workflow 3: Entitlement API returns correct state [x]

1. Call `/api/pro/entitlement` as a Free user.
2. Call `/api/pro/entitlement` as a Pro user.

**Expected**:

- Free: `{ isPro: false, status: 'none' }`.
- Pro: `{ isPro: true, status: 'active', source: 'manual' }` (with timestamps).

---

## Workflow 4: Core habit flow unaffected [x]

1. Sign in as a Free user.
2. Create a habit with weekday schedule.
3. Mark completion for today.
4. Archive the habit.

**Expected**: All actions succeed without Pro prompts blocking core flows.

---

## Automated Tests

### Unit / API / Component (Suggested)

```bash
npm test -- src/lib/pro/__tests__
npm test -- src/app/api/pro/__tests__
npm test -- src/components/pro/__tests__
```

### Full CI

```bash
npm run ci
```

---

## Success Criteria

Sprint 7.1 is complete when:

1. Free users see preview states without blocked functionality.
2. Pro users see active states across `/calendar`, `/account`, and `/pro`.
3. Entitlement API returns accurate state for both user types.
4. CI passes from a clean checkout.

---

## References

- [Sprint 7.1 Plan](../sprints/sprint-7.1.md)
- [Entitlement API](../../src/app/api/pro/entitlement/route.ts)
- [Entitlement Helper](../../src/lib/pro/entitlement.ts)
- [Pro Components](../../src/components/pro)
- [AGENTS](../../AGENTS.md)
