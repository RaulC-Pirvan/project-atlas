# Sprint 11.1 Test Workflows - Today View + Ordering

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 11.1 introduces a dedicated Today view, manual habit ordering, and a user
preference for keeping completed habits at the bottom. This document covers
manual and automated checks for routing, ordering, and preference behavior.

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

4. **Test accounts exist**:
   - One verified Free user.

---

## Workflow 1: Today view renders [x]

1. Sign in as a verified user.
2. Visit `/today`.

**Expected**:

- Page title is �Today�.
- Only habits due today are shown.
- Completed habits appear below incomplete habits by default.

---

## Workflow 2: Post-login redirect goes to Today [x]

1. Visit `/sign-in`.
2. Sign in with a verified user.

**Expected**:

- Redirect lands on `/today`.

---

## Workflow 3: Manual ordering on Habits page [x]

1. Visit `/habits`.
2. Create two habits (e.g. �Alpha habit�, �Beta habit�).
3. Click `Up` on the second habit.
4. Refresh the page.

**Expected**:

- The order switches immediately after clicking.
- Order persists after refresh.

---

## Workflow 4: Ordering preference toggle [x]

1. Visit `/account`.
2. Under **Daily ordering**, select �Keep original order�.
3. Click �Update ordering�.

**Expected**:

- Success toast appears.
- Revisit `/account` and the selection remains.

---

## Workflow 5: Today list respects preference [x]

1. Create two habits scheduled for today.
2. Visit `/today` with **Keep completed at bottom** enabled.
3. Complete the top habit.

**Expected**:

- The completed habit moves to the bottom of the list.

4. Switch the preference to **Keep original order**.
5. Complete the top habit again.

**Expected**:

- The completed habit stays in its manual order position.

---

## Workflow 6: Motion safety on small screens [x]

1. Set viewport to a mobile size (e.g. 390x844).
2. Toggle a habit completion on `/today`.
3. Toggle �Reduce motion� in the OS or dev tools and repeat.

**Expected**:

- Animations are subtle on mobile.
- Reduced motion disables transitions without breaking layout.

---

## Automated Tests

### Unit

```bash
npm test -- ordering
```

### E2E

```bash
npm run e2e -- habits.spec.ts
npm run e2e -- auth.spec.ts
```

---

## Success Criteria

Sprint 11.1 is complete when:

1. Today view loads and is the post-login landing page.
2. Manual habit ordering works and persists.
3. Ordering preference can be saved in account settings.
4. Daily habit list respects the preference.
5. Motion behavior is acceptable on small screens and with reduced motion.
6. CI passes from a clean checkout.

---

## References

- [Sprint 11.1 Plan](../sprints/sprint-11.1.md)
- [Today Page](../../src/app/today/page.tsx)
- [Habit Ordering API](../../src/app/api/habits/order/route.ts)
- [Habits Panel](../../src/components/habits/HabitsPanel.tsx)
- [Daily Completion Panel](../../src/components/calendar/DailyCompletionPanel.tsx)
- [Account Panel](../../src/components/auth/AccountPanel.tsx)
- [Account API](../../src/app/api/account/route.ts)
- [AGENTS](../../AGENTS.md)
