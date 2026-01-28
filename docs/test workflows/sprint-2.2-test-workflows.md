# Sprint 2.2 Test Workflows - Daily Habit Completion

**Status**: In Progress (Phases 1-3)  
**Last Updated**: January 2026

---

## Overview

Sprint 2.2 delivers daily habit completion: showing active habits in the selected-day panel,
checking/unchecking, and persisting completion per habit per date. This document captures
manual and automated workflows to verify the daily completion experience.

**Key Features Implemented**:

- Selected-day panel renders active habits
- Check/uncheck controls wired to `/api/completions`
- Completion persistence (habit + date) with idempotency
- Future dates blocked for completion
- Unit tests for completion logic and component behavior
- E2E coverage for daily completion flow

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

**Completion API**:

- `GET  /api/completions?date=YYYY-MM-DD` (list completions for date)
- `POST /api/completions` (toggle completion)

**Completion Rules**:

- Date is stored as UTC date-only (`YYYY-MM-DD`)
- One completion per habit per date (idempotent)
- Future dates cannot be completed
- Habit must be active on selected weekday

---

## Test Workflows

### Workflow 1: Show active habits in day panel [x]

1. Create a habit with a known weekday schedule (e.g., Monday only).
2. Open `/calendar?month=YYYY-MM&date=YYYY-MM-DD` matching that weekday.

**Expected**: Habit appears in the selected-day panel.

---

### Workflow 2: Complete a habit [x]

1. In the selected-day panel, click a habit row.
2. Observe the row reflects completion.

**Expected**: Completion is persisted and the habit shows as completed.

---

### Workflow 3: Uncheck a completion [x]

1. Click a completed habit again.
2. Observe the completion state clears.

**Expected**: Completion is removed and habit shows as incomplete.

---

### Workflow 4: Prevent double completion [x]

1. Click a habit twice quickly (or repeat completion request via API).
2. Observe only one completion record persists.

**Expected**: The completion is idempotent (no duplicates).

---

### Workflow 5: Block future dates [x]

1. Open `/calendar` with a future `date` param.
2. Try to complete a habit.

**Expected**: Completion is blocked and a toast message appears.

---

### Workflow 6: Auth required for completions [x]

1. Sign out.
2. Attempt to call `/api/completions` or open `/calendar`.

**Expected**: Redirect to `/sign-in` or 401 from the API.

---

## Automated Tests

### Unit Tests

```bash
npm test -- completions
npm test -- DailyCompletionPanel
```

### E2E Tests

```bash
npm run e2e -- e2e/daily-completion.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Completion toggle fails

**Symptoms**: Toast shows a request error; completion does not update.

**Fixes**:

- Confirm the habit is scheduled for the selected weekday.
- Ensure the date is not in the future.
- Verify the API is reachable and authenticated.

---

### Issue: No habits appear for the selected day

**Symptoms**: Panel shows "No habits scheduled for this day."

**Fixes**:

- Confirm the habit schedule includes the selected weekday.
- Ensure the habit is not archived.

---

## Success Criteria

Sprint 2.2 Phase 3 is complete when:

1. Active habits render for the selected day.
2. Check/uncheck persists correctly.
3. Duplicate completions are prevented.
4. Future dates are blocked with a clear message.
5. Unit and E2E tests pass in CI.

---

## Additional Resources

- [Sprint 2.2 Plan](../sprints/sprint-2.2.md)
- [Daily Completion E2E Spec](../../e2e/daily-completion.spec.ts)
- [Completions API Route](../../src/app/api/completions/route.ts)
- [Daily Completion Panel](../../src/components/calendar/DailyCompletionPanel.tsx)
- [Completion Logic](../../src/lib/api/habits/completions.ts)
- [AGENTS](../../AGENTS.md)
