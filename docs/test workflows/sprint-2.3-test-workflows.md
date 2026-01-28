# Sprint 2.3 Test Workflows - Visual Feedback & Delight

**Status**: In Progress (Phases 1-3)  
**Last Updated**: January 2026

---

## Overview

Sprint 2.3 focuses on visual feedback and delight in the calendar: per-day progress indicators,
completed-day styling, and motion that respects accessibility preferences.
This document captures manual and automated workflows to validate the experience.

**Key Features Implemented**:

- Day tile progress indicator (partial completion)
- Fully completed day styling (black/white only)
- Motion-safe transitions for check/uncheck + tile states
- Reduced-motion fallback
- Visual regression coverage via Playwright snapshots

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

### Workflow 1: Progress indicator renders for active days [x]

1. Create at least two habits scheduled for the same weekday.
2. Open `/calendar?month=YYYY-MM` and click a matching day.
3. Complete one habit in the selected-day panel.

**Expected**: The day tile shows a partial progress bar (not full).

---

### Workflow 2: Fully completed day uses filled styling [x]

1. Complete all habits for the selected day.
2. Return focus to the calendar grid.

**Expected**: The day tile switches to a golden filled state with white text.

---

### Workflow 3: Progress updates after completion [x]

1. Complete a habit in the selected-day panel.
2. Observe the calendar tile for the selected day.

**Expected**: The progress bar updates immediately after the completion toggle.

---

### Workflow 4: Motion respects reduced-motion [x]

1. Enable reduced-motion in the OS or browser.
2. Toggle a habit completion.

**Expected**: No motion/animation is visible; state changes are instant.

---

### Workflow 5: Focus states are visible and contrast is acceptable [x]

1. Use keyboard navigation to reach the completion buttons.
2. Verify focus ring is visible in both incomplete and completed states.

**Expected**: Focus indicator is visible and readable in black/white UI.

---

## Automated Tests

### Unit Tests

```bash
npm test -- CalendarMonth
npm test -- DailyCompletionPanel
```

### Visual Regression (Playwright)

```bash
npm run e2e -- e2e/calendar-visual.spec.ts --update-snapshots
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Visual snapshot diffs across browsers

**Symptoms**: Snapshots fail in Firefox but pass in Chromium.

**Fixes**:

- Confirm reduced-motion is applied.
- Ensure animations are disabled via injected styles.
- Re-run with `--update-snapshots` only after confirming UI is correct.

---

### Issue: Progress bar does not update

**Symptoms**: The completion state changes, but the calendar tile does not update.

**Fixes**:

- Refresh the page to confirm server state is updated.
- Verify the completion call succeeded in the network tab.

---

## Success Criteria

Sprint 2.3 Phase 3 is complete when:

1. Progress indicators reflect partial completion.
2. Completed days use golden filled styling with white text.
3. Reduced-motion preferences are respected.
4. Playwright visual snapshots pass across browsers.

---

## Additional Resources

- [Sprint 2.3 Plan](../sprints/sprint-2.3.md)
- [Calendar Visual E2E Spec](../../e2e/calendar-visual.spec.ts)
- [Calendar Month Component](../../src/components/calendar/CalendarMonth.tsx)
- [Daily Completion Panel](../../src/components/calendar/DailyCompletionPanel.tsx)
- [AGENTS](../../AGENTS.md)
