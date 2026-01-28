# Sprint 2.1 Test Workflows - Calendar Core

**Status**: In Progress (Phases 1-3)  
**Last Updated**: January 2026

---

## Overview

Sprint 2.1 delivers the calendar core: a monthly view with correct date/weekday mapping,
active-habit day indicators, and navigation into a daily view. This document captures
manual and automated workflows to verify the calendar experience and its supporting logic.

**Key Features Implemented**:

- Calendar page (`/calendar`) with monthly grid and month navigation
- Day selection panel via query param (`?date=YYYY-MM-DD`)
- Date grid logic in `src/lib/habits/calendar.ts`
- Active habit day indicators (based on weekday schedules)
- Unit tests for calendar logic and component rendering
- E2E coverage for calendar navigation

---

## Prerequisites

1. **Database is migrated with Sprint 1.2 schema**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true   # Required for verification-token endpoint and E2E
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

## Technical Details

**Calendar Routes**:

- `GET /calendar` (monthly calendar view)
- `GET /calendar?month=YYYY-MM` (explicit month selection)
- `GET /calendar?month=YYYY-MM&date=YYYY-MM-DD` (opens day panel)
- `GET /calendar/[date]` (legacy daily view fallback)

**Calendar Rules**:

- Month grid uses ISO weekdays (Mon=1 ... Sun=7)
- Week header order follows `User.weekStart` (`sun` or `mon`)
- Days with active habits are derived from weekday schedules

---

## Test Workflows

### Workflow 1: Open calendar month view [x]

1. Sign in to a verified account.
2. Visit `/calendar`.

**Expected**: Calendar page loads with a monthly grid and month label.

---

### Workflow 2: Month navigation updates view [x]

1. On `/calendar`, click **Next** or **Prev** month.
2. Observe the month label and query param update.

**Expected**: Month label changes and URL includes `?month=YYYY-MM`.

---

### Workflow 3: Day click opens side panel [x]

1. On `/calendar`, click an in-month day.
2. Observe the URL update to `?month=YYYY-MM&date=YYYY-MM-DD`.
3. Check the side panel (desktop) or inline panel (mobile).

**Expected**: The selected day label appears and the habit list renders in the panel.

---

### Workflow 4: Active habit day indicator [x]

1. Create a habit with a known weekday schedule (e.g., Monday only).
2. Return to `/calendar` for a month that includes that weekday.

**Expected**: Days matching active weekdays show the indicator dot.

---

### Workflow 5: Week start preference [x]

1. In `/account`, set **Week start** to Sunday and save.
2. Reload `/calendar`.

**Expected**: Weekday header starts with Sunday.

---

### Workflow 6: Auth required for calendar [x]

1. Sign out.
2. Visit `/calendar`.

**Expected**: Redirect to `/sign-in`.

---

## Automated Tests

### Unit Tests

```bash
npm test -- calendar
```

### E2E Tests

```bash
npm run e2e -- e2e/calendar.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Calendar month does not change

**Symptoms**: Month label remains the same after clicking Next/Prev.

**Fixes**:

- Confirm the URL includes `?month=YYYY-MM` after navigation.
- Ensure the calendar page is rendering without server errors.

---

### Issue: Active habit indicator not visible

**Symptoms**: No dots appear on days with scheduled habits.

**Fixes**:

- Ensure the habit is not archived.
- Confirm the habit includes weekdays matching the month view.

---

### Issue: Daily view shows 404

**Symptoms**: `/calendar/YYYY-MM-DD` returns not found.

**Fixes**:

- Ensure the date is valid (e.g., no 2026-02-30).
- Confirm the route exists in `src/app/calendar/[date]/page.tsx`.

---

## Success Criteria

Sprint 2.1 Phase 3 is complete when:

1. Calendar month view renders correctly.
2. Month navigation updates the view and URL.
3. Day click opens the daily view placeholder.
4. Active habit days are indicated.
5. Unit and E2E tests pass in CI.

---

## Additional Resources

- [Sprint 2.1 Plan](../sprints/sprint-2.1.md)
- [Calendar E2E Spec](../../e2e/calendar.spec.ts)
- [Calendar Page](../../src/app/calendar/page.tsx)
- [Daily View Page](../../src/app/calendar/[date]/page.tsx)
- [Calendar Component](../../src/components/calendar/CalendarMonth.tsx)
- [Calendar Logic](../../src/lib/habits/calendar.ts)
- [AGENTS](../../AGENTS.md)
