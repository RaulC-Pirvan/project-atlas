# Sprint 3.2 Test Workflows - Streak UI

**Status**: In Progress (Phases 1-3)  
**Last Updated**: January 2026

---

## Overview

Sprint 3.2 delivers the streak user experience: streak stats in the calendar
dashboard, visual emphasis on continuity, and friendly empty states. This
document captures manual and automated workflows to validate the UI.

**Key Features Implemented**:

- Streak summary panel in the calendar page
- Current vs longest streak display per habit
- Friendly empty states for no habits or no completions
- E2E coverage for streak updates

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

### Workflow 1: Streak panel renders in calendar [x]

1. Sign in and open `/calendar`.

**Expected**: The Streaks panel is visible in the sidebar area.

---

### Workflow 2: Empty state with no completions [x]

1. Create a habit but do not complete it.
2. Open `/calendar`.

**Expected**: The panel shows "Complete a habit to begin your first streak."

---

### Workflow 3: Streaks update after completion [x]

1. Open `/calendar?month=YYYY-MM&date=YYYY-MM-DD` for a scheduled day.
2. Complete the habit in the selected-day panel.

**Expected**: Current and longest streak values update in the Streaks panel.

---

### Workflow 4: No habits empty state [x]

1. Ensure there are no active habits.
2. Open `/calendar`.

**Expected**: The panel shows "Create a habit to start a streak."

---

## Automated Tests

### E2E Tests

```bash
npm run e2e -- e2e/streaks.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Empty state text not shown

**Symptoms**: Panel renders but the empty state text is missing.

**Fixes**:

- Confirm there are no completions for the account.
- Check that the streak panel receives `hasCompletions=false`.

---

### Issue: Streak values do not update after completion

**Symptoms**: Completion toggles, but streak values stay the same.

**Fixes**:

- Refresh the page to ensure server data is updated.
- Verify `calculateStreaks` is called with the latest completions.

---

## Success Criteria

Sprint 3.2 Phase 3 is complete when:

1. Streak panel renders consistently in the calendar page.
2. Empty states appear for no habits or no completions.
3. Streak values update after completion toggles.
4. E2E streak tests pass in CI.

---

## Additional Resources

- [Sprint 3.2 Plan](../sprints/sprint-3.2.md)
- [Streaks E2E Spec](../../e2e/streaks.spec.ts)
- [Streak Summary Panel](../../src/components/streaks/StreakSummaryPanel.tsx)
- [Streak Helpers](../../src/lib/habits/streaks.ts)
- [AGENTS](../../AGENTS.md)
