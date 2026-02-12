# Sprint 11.2: Offline-first Completions - Project Atlas

**Duration**: TBD (5-7 days)
**Status**: Planned
**Theme**: Reliable daily completions under flaky or offline networks.

---

## Overview

Sprint 11.2 introduces offline-first support for completion toggles. Users should be
able to mark habits complete while offline, see a clear pending state, and have
changes sync safely once connectivity returns.

**Core Goal**: completion toggles remain fast, correct, and transparent even when
the network is unavailable.

---

## Scope Decisions (Locked)

- Offline support applies only to completion toggles (not habit CRUD or ordering).
- Queue only actions that are valid under online rules (today and yesterday within
  the 02:00 grace window, timezone-safe).
- Future dates remain blocked both online and offline.
- IndexedDB is the persistence layer for the queue.
- Queue dedupes by habit+date and applies last-write-wins.
- Sync runs on network return and on app startup if pending items exist.
- When sync cannot apply an item (archived habit or schedule change), the item is
  dropped with a user-facing toast.

---

## Included

- Offline queue for completion toggle actions.
- Sync engine that drains the queue on network return.
- Pending sync UI indicators.
- Unit tests for queue logic and validation rules.
- E2E coverage for flaky or offline network scenarios.

---

## Excluded

- Offline habit creation, editing, archiving, or ordering.
- Background sync via service worker.
- Offline access to insights, achievements, or reminders.

---

## UX Decisions

- Completion toggles succeed instantly and show a pending sync state when offline.
- Pending state is visible in Today and the Calendar daily panel.
- Calendar month tiles reflect pending completion state for affected days.
- Errors on sync are surfaced with a toast and clear recovery guidance.

---

## Data Model Impact

- No database schema changes.
- Client-only queue persisted in IndexedDB.
- Single in-memory source of truth for pending sync state, shared by Today and
  Calendar views.

---

## Implementation Plan

### Phase 1: Offline Queue

- [x] Define queue item schema (habitId, date, intended state, createdAt).
- [x] Implement IndexedDB storage and hydration on app load.
- [x] Enforce local validation (future-date guard, grace window, timezone-safe).
- [x] Collapse duplicate entries by habit+date (last-write-wins).

### Phase 2: Sync Engine

- [x] Attempt sync on network return and at startup when queue is non-empty.
- [x] Apply retry strategy with backoff for transient failures.
- [x] On server rejection (archived habit or schedule mismatch), drop item and
      surface a toast.

### Phase 3: UI Indicators

- [x] Show pending sync state in Today list rows.
- [x] Show pending sync state in Calendar daily panel rows.
- [x] Reflect pending days in calendar tiles and progress indicators.

### Phase 4: Testing

- [x] Unit tests for queue logic, dedupe, and validation.
- [x] Component tests for pending sync UI indicators.
- [x] E2E tests that toggle offline mode, queue actions, and verify sync on return.

---

## Testing Policy

- Unit tests cover queue persistence, dedupe, and validation edge cases.
- Component tests cover pending UI state across Today and Calendar surfaces.
- E2E tests simulate offline and flaky networks, verifying end-to-end sync.

---

## File Structure (Expected)

- `src/lib/habits/offlineQueue.ts`
- `src/lib/habits/offlineQueue.test.ts`
- `src/lib/api/habits/completions.ts`
- `src/components/calendar/DailyCompletionPanel.tsx`
- `src/components/today/*`
- `src/components/calendar/CalendarMonth.tsx`
- `e2e/*`

---

## Definition of Done

1. Completion toggles can be queued offline and persist across reloads.
2. Queue syncs automatically when the network returns.
3. Deduping ensures only the latest intent per habit+date is applied.
4. Invalid queued items are dropped with a toast and do not block sync.
5. Pending sync indicators appear in Today and Calendar surfaces.
6. Unit, component, and E2E tests cover offline and flaky network scenarios.
7. CI passes from a clean checkout.
