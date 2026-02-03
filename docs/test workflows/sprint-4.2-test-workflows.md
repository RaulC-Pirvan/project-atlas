# Sprint 4.2 Test Workflows - UX Refinement

**Status**: In Progress (Phases 1-3)  
**Last Updated**: February 2026

---

## Overview

Sprint 4.2 tightens feedback loops and accessibility across the app: loading
states, optimistic completion toggles, standardized error messaging, and
keyboard-first navigation. This document captures manual and automated
workflows to validate the UX refinement scope.

**Key Features Implemented**:

- Calendar and habits loading skeletons
- Optimistic completion toggles with rollback on failure
- Standardized API error recovery hints
- Keyboard navigation for calendar days and daily habit list
- Focus management for mobile daily sheet + improved contrast on completed days

---

## Prerequisites

1. **Database is migrated with Sprint 1.2+ schema**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Seed data (optional)**:

   ```bash
   npm run prisma:seed
   ```

---

## Test Workflows

### Workflow 1: Calendar loading skeletons [x]

1. Navigate to `/calendar` from another page (e.g., `/habits`).

**Expected**: Skeleton grid appears briefly; layout does not jump once data loads.

---

### Workflow 2: Habits loading skeletons [x]

1. Navigate to `/habits` from another page.

**Expected**: Skeleton form + list appear; spacing remains stable.

---

### Workflow 3: Optimistic completion toggles [x]

1. Open `/calendar?date=YYYY-MM-DD` for a past or current date.
2. Toggle a habit completion on.

**Expected**: Toggle updates immediately, then persists after the request finishes.

---

### Workflow 4: Optimistic rollback on failure [x]

1. Open `/calendar?date=YYYY-MM-DD`.
2. Simulate a network failure (devtools offline) and toggle a habit.

**Expected**: Toggle updates immediately, then rolls back and shows a toast.

---

### Workflow 5: Error recovery messaging [x]

1. Trigger a rate-limited or failed request (devtools throttling or invalid input).

**Expected**: Toast includes a clear recovery hint (retry, update input, sign in).

---

### Workflow 6: Calendar keyboard navigation [x]

1. Focus a day tile on `/calendar`.
2. Use arrow keys, Home, End.

**Expected**: Focus moves between days predictably; selected/today states remain visible.

---

### Workflow 7: Daily panel keyboard navigation [x]

1. Focus a habit row in the daily panel.
2. Use ArrowUp/ArrowDown, Home/End.

**Expected**: Focus moves between habit toggles; toggles remain operable via Space/Enter.

---

### Workflow 8: Mobile sheet focus management [x]

1. On mobile viewport, open a day to show the sheet.
2. Close the sheet (Close button or Esc).

**Expected**: Focus moves into the sheet on open and returns to the previous element on close.

---

## Automated Tests

### Unit (Suggested)

```bash
npm test -- src/components/calendar/__tests__/CalendarMonth.test.tsx
npm test -- src/components/calendar/__tests__/DailyCompletionPanel.test.tsx
```

### E2E (Suggested)

```bash
npm run e2e -- e2e/ux-refinement.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Keyboard navigation does not move focus

**Symptoms**: Arrow keys do nothing on day tiles or habit rows.

**Fixes**:

- Confirm focus is on a day tile or habit button before using arrow keys.
- Verify the component is using the updated client-side logic.

---

### Issue: Optimistic toggle does not roll back

**Symptoms**: Toggle remains selected after a failed request.

**Fixes**:

- Confirm the request failed (network offline or server error).
- Verify the response includes `{ ok: false }` and a status code.

---

## Success Criteria

Sprint 4.2 Phase 3 is complete when:

1. Loading skeletons appear without layout shift.
2. Optimistic toggles update immediately and roll back on failure.
3. Error toasts provide a clear recovery hint.
4. Calendar and daily panel can be fully navigated by keyboard.
5. Focus is managed correctly for mobile sheet interactions.
6. CI passes from clean checkout.

---

## Additional Resources

- [Sprint 4.2 Plan](../sprints/sprint-4.2.md)
- [Calendar Page](../../src/app/calendar/page.tsx)
- [Calendar Month Component](../../src/components/calendar/CalendarMonth.tsx)
- [Daily Completion Panel](../../src/components/calendar/DailyCompletionPanel.tsx)
- [Mobile Daily Sheet](../../src/components/calendar/MobileDailySheet.tsx)
- [AGENTS](../../AGENTS.md)
