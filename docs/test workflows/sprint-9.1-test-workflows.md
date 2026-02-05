# Sprint 9.1 Test Workflows - Achievements System v1

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 9.1 introduces the Achievements System v1 with a Free baseline catalogue,
Pro-expanded milestones, and a minimalist trophy cabinet UI. This document
covers manual and automated checks to validate unlock logic, Pro preview states,
and timezone-safe rules.

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

## Workflow 1: Free user sees Achievements preview [x]

1. Sign in as a Free user.
2. Visit `/achievements`.

**Expected**:

- Upgrade card is visible.
- Trophy cabinet section renders.
- Pro-tier achievements show a `Pro` badge and locked state.

---

## Workflow 2: Pro user sees full Achievements view [x]

1. Promote a user to Pro using the test endpoint:

   ```bash
   curl -X POST http://localhost:3000/api/pro/debug/grant
   ```

2. Sign in as the Pro user.
3. Visit `/achievements`.

**Expected**:

- Upgrade card is hidden.
- Pro-tier achievements are no longer marked as `Pro` locked.
- Trophy cabinet and milestone timelines render.

---

## Workflow 3: First completion unlocks baseline achievements [x]

1. Sign in as a Free user.
2. Create a habit scheduled for today.
3. Complete today�s habit in the Calendar.
4. Visit `/achievements`.

**Expected**:

- `First Check-In` shows `Unlocked`.
- Progress for `Seven Day Wins` updates to `1 / 7`.

---

## Workflow 4: Milestone timeline updates [x]

1. With the same habit, complete another scheduled day.
2. Return to `/achievements`.

**Expected**:

- The habit�s milestone timeline shows updated completion counts.
- Perfect week milestones remain locked unless a full scheduled week is completed.

---

## Workflow 5: Achievements API response shape [x]

1. Call `/api/achievements` as a Free user.
2. Call `/api/achievements` as a Pro user.

**Expected**:

- Both responses return `200` with `achievements`, `milestones`, and `stats`.
- `isPro` flag matches entitlement.
- Pro-tier achievements are included but have `tier: "pro"`.

---

## Workflow 6: Grace window behavior (optional) [ ]

**Note**: Completion grace window enforcement is not implemented yet, so this workflow
cannot be validated until that feature ships.

1. With a habit scheduled for yesterday, complete it before 02:00 local time.
2. Visit `/achievements`.

**Expected**:

- The completion counts toward achievements and milestones.

---

## Automated Tests

### Unit / API

```bash
npm test -- src/lib/achievements/__tests__/summary.test.ts
npm test -- src/app/api/achievements/__tests__/route.test.ts
```

### E2E

```bash
npm run e2e -- achievements.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Success Criteria

Sprint 9.1 is complete when:

1. Free users see a preview-only achievements experience without errors.
2. Pro users see full achievements without Pro-locked states.
3. Unlock logic updates with completions and milestone progress.
4. Achievements API returns consistent data with correct `isPro` flags.
5. Unit and E2E tests for achievements pass.
6. CI passes from a clean checkout.

---

## References

- [Sprint 9.1 Plan](../sprints/sprint-9.1.md)
- [Achievements API](../../src/app/api/achievements/route.ts)
- [Achievements Summary](../../src/lib/achievements/summary.ts)
- [Achievements Page](../../src/app/achievements/page.tsx)
- [Achievements Components](../../src/components/achievements)
- [AGENTS](../../AGENTS.md)
