# Sprint 4.1 Test Workflows - Mobile & Responsiveness

**Status**: In Progress (Phases 1-3)  
**Last Updated**: January 2026

---

## Overview

Sprint 4.1 focuses on mobile usability for the calendar: compact grid spacing,
touch-friendly interactions, and a bottom-sheet daily view. This document
captures manual and automated workflows to validate the mobile experience.

**Key Features Implemented**:

- Mobile-optimized calendar grid spacing and typography
- Touch-friendly tap targets and active feedback
- Bottom-sheet daily view on mobile
- Streaks + Daily panels stack below calendar on narrow widths

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

## Test Workflows

### Workflow 1: Calendar grid fits mobile viewport [x]

1. Open `/calendar` on a mobile-sized viewport (e.g., 390x844).

**Expected**: No horizontal scrolling; weekday headers and day tiles are legible.

---

### Workflow 2: Tap targets meet minimum size [x]

1. Tap a day tile.
2. Tap a habit row in the daily panel.

**Expected**: Tap targets feel 44px+ and respond immediately.

---

### Workflow 3: Streaks and Daily panels stack on mobile [x]

1. On a mobile viewport, open `/calendar`.

**Expected**: Calendar is shown first, followed by Streaks, then Daily view.

---

### Workflow 4: Bottom-sheet daily view opens and closes [x]

1. Open `/calendar?month=YYYY-MM&date=YYYY-MM-DD` on a mobile viewport.
2. Tap "View day" if the sheet is closed.
3. Close via the Close button or overlay tap.

**Expected**: The bottom-sheet opens/closes; focus returns to the calendar view.

---

### Workflow 5: Selection persists when sheet closes [x]

1. Select a day and open the sheet.
2. Close the sheet.

**Expected**: The selected day remains highlighted in the calendar.

---

## Automated Tests

### E2E (Suggested)

```bash
npm run e2e -- e2e/mobile.spec.ts
```

### Visual Regression (Suggested)

```bash
npm run e2e -- e2e/calendar-visual.spec.ts --project=chromium
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Bottom-sheet not opening on mobile

**Symptoms**: Tapping "View day" does nothing.

**Fixes**:

- Confirm the URL contains a `date=YYYY-MM-DD` param.
- Verify `MobileDailySheet` is rendered only on mobile (check viewport width).

---

### Issue: Calendar tiles feel too small

**Symptoms**: Hard to tap day tiles or habit rows.

**Fixes**:

- Verify min height classes on calendar tiles (`min-h-[64px]`).
- Ensure touch-manipulation and active feedback are present.

---

## Success Criteria

Sprint 4.1 Phase 3 is complete when:

1. Calendar grid is fully usable on mobile without horizontal scroll.
2. Tap targets are 44px+ and provide feedback.
3. Bottom-sheet daily view opens/closes and preserves selection.
4. Cross-device checks are documented and passing.

---

## Additional Resources

- [Sprint 4.1 Plan](../sprints/sprint-4.1.md)
- [Calendar Page](../../src/app/calendar/page.tsx)
- [Calendar Month Component](../../src/components/calendar/CalendarMonth.tsx)
- [Mobile Daily Sheet](../../src/components/calendar/MobileDailySheet.tsx)
- [Streak Summary Panel](../../src/components/streaks/StreakSummaryPanel.tsx)
- [AGENTS](../../AGENTS.md)
