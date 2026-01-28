# Sprint 1.3 Test Workflows - Habit CRUD

**Status**: In Progress (Phases 1-3)  
**Last Updated**: January 2026

---

## Overview

Sprint 1.3 delivers habit CRUD: creation, editing, deletion, weekday scheduling, and persistence. This document captures manual and automated workflows to verify the habit experience and its supporting APIs.

**Key Features Implemented**:

- Habits page (`/habits`) with create/edit/delete flows
- Weekday selection (ISO weekdays with UI `weekStart`)
- Habit API routes (list/create/update/archive)
- Validation for required title and non-empty weekday selection
- Unit tests for habit services and components
- E2E tests for habit CRUD

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

**Habit API Routes**:

- `GET  /api/habits` (list active habits)
- `POST /api/habits` (create)
- `PUT  /api/habits/[id]` (update)
- `DELETE /api/habits/[id]` (archive via `archivedAt`)

**Weekday Rules**:

- Stored as ISO weekdays (Mon=1 ... Sun=7)
- UI order uses `User.weekStart` (`sun` or `mon`)
- Empty weekday selection is invalid

---

## Test Workflows

### Workflow 1: Create habit with weekdays [x]

1. Sign in to a verified account.
2. Visit `/habits`.
3. Enter a title and optional description.2
4. Toggle weekdays and create the habit.

**Expected**: Habit appears in the list with weekday chips.

---

### Workflow 2: Edit habit title and weekdays [x]

1. On `/habits`, click **Edit** for a habit.
2. Change the title and update weekday toggles.
3. Save changes.

**Expected**: Habit shows updated title and weekday chips.

---

### Workflow 3: Delete habit [x]

1. On `/habits`, click **Delete** for a habit.
2. Confirm deletion in the modal.

**Expected**: Habit disappears from the list and the empty state appears when no habits remain.

---

### Workflow 4: Validation blocks empty weekdays [x]

1. On `/habits`, remove all weekday selections.
2. Attempt to submit.

**Expected**: Toast shows "Select at least one weekday."

---

### Workflow 5: Auth required for habits [x]

1. Sign out.
2. Visit `/habits`.

**Expected**: Redirect to `/sign-in`.

---

### Workflow 6: Week start preference [x]

1. Set the signed-in user's `weekStart` to `sun` in the database.
2. Reload `/habits`.

**Expected**: Weekday selector shows Sunday first.

---

## Automated Tests

### Unit Tests

```bash
npm test -- src/lib/api/habits
npm test -- src/components/habits
```

### E2E Tests

```bash
npm run e2e -- e2e/habits.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: 401 on habit API calls

**Symptoms**: UI shows error toast, `/api/habits` returns 401.

**Fixes**:

- Ensure you are signed in to a verified account.
- Confirm `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set.

---

### Issue: Weekday selector order looks wrong

**Symptoms**: UI does not match expected week start.

**Fixes**:

- Confirm `User.weekStart` is set to `sun` or `mon`.
- Reload `/habits` after updating the user record.

---

## Success Criteria

Sprint 1.3 Phase 3 is complete when:

1. Habit create/edit/delete flows work end-to-end.
2. Weekday validation prevents empty schedules.
3. UI respects `weekStart` preference.
4. Unit and E2E tests pass in CI.

---

## Additional Resources

- [Sprint 1.3 Plan](../sprints/sprint-1.3.md)
- [Habit E2E Spec](../../e2e/habits.spec.ts)
- [Habit API Routes](../../src/app/api/habits)
- [Habits Page](../../src/app/habits/page.tsx)
- [AGENTS](../../AGENTS.md)
