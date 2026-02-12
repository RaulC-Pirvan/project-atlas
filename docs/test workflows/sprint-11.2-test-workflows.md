# Sprint 11.2 Test Workflows - Offline-first Completions

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 11.2 adds offline-first completion toggles with a persistent queue, automatic
sync on reconnect, and pending sync indicators in Today and Calendar views. This
document covers manual and automated checks for offline queueing, sync behavior,
and UI indicators.

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

4. **Test account exists**:
   - One verified Free user.

---

## Workflow 1: Offline toggle queues and shows pending state [x]

1. Sign in as a verified user.
2. Create a habit scheduled for today.
3. Visit `/calendar` and select today.
4. Set the browser to **Offline** in dev tools.
5. Toggle the habit completion.

**Expected**:

- The checkbox flips to completed immediately.
- The habit row shows a pending sync indicator (spinner).
- The calendar tile for today shows a pending indicator.
- A toast appears: "Saved offline. Will sync when back online."

---

## Workflow 2: Queue persists across reload when the API is blocked [x]

Full offline reloads are not possible in this app because pages are server-rendered
and Firefox shows the browser offline page. Instead, block the completions API
while leaving the page online so a reload is still possible.

1. Open dev tools and **block** requests to `/api/completions` (Network > Request blocking).
2. Toggle a habit completion.
3. Reload the page.
4. Return to the same day in Calendar (or Today).

**Expected**:

- The completion remains checked.
- The pending sync indicator is still visible.

**Note**: If you use full offline mode, reload will show the browser offline page.
In that case, restore connectivity and then reload to validate persistence.

---

## Workflow 3: Sync clears pending indicators on reconnect [x]

1. Switch the browser back to **Online**.
2. Wait a few seconds for sync to run.

**Expected**:

- Pending indicators clear for the habit row and calendar tile.
- Completion remains checked.

3. Reload the page.

**Expected**:

- Completion remains checked after reload.

---

## Workflow 4: Pending indicators on Today view [x]

1. Navigate to `/today`.
2. Set the browser to **Offline**.
3. Toggle a habit completion.

**Expected**:

- The Today list row shows a pending sync indicator.
- The checkbox remains checked.

---

## Workflow 5: Invalid queued item drops with toast [x]

1. Go offline.
2. Toggle a habit completion.
3. In another session (or via admin tooling), archive the habit or change its schedule
   so the day is no longer valid.
4. Return online and wait for sync.

**Expected**:

- The queued item is removed.
- A toast appears explaining the pending completion was removed.

---

## Automated Tests

### Unit

```bash
npm test -- offlineQueue
```

### Component

```bash
npm test -- DailyCompletionPanel
npm test -- CalendarMonth
```

### E2E

```bash
npm run e2e -- offline-completions.spec.ts
```

---

## Success Criteria

Sprint 11.2 is complete when:

1. Offline toggles queue successfully and persist across reloads.
2. Pending sync indicators are visible in Today and Calendar views.
3. Sync clears pending indicators on reconnect.
4. Invalid queued items are dropped with a toast.
5. Unit, component, and E2E tests pass.
6. CI passes from a clean checkout.

---

## References

- [Sprint 11.2 Plan](../sprints/sprint-11.2.md)
- [Offline Queue](../../src/lib/habits/offlineQueue.ts)
- [Offline Sync](../../src/lib/habits/offlineSync.ts)
- [Daily Completion Panel](../../src/components/calendar/DailyCompletionPanel.tsx)
- [Calendar Month Grid](../../src/components/calendar/CalendarMonth.tsx)
- [Offline E2E Spec](../../e2e/offline-completions.spec.ts)
- [AGENTS](../../AGENTS.md)
