# Sprint 12.1: Completion Grace Window Until 02:00 - Project Atlas

**Duration**: TBD (4-6 days)  
**Status**: In Progress  
**Theme**: Enforce a clear, timezone-safe completion window for Free users across API, UI, and offline flows.

---

## Overview

Sprint 12.1 implements the Free grace window rule end-to-end: users may toggle
completion for yesterday only until 02:00 local time, while future dates remain
blocked. Enforcement must be consistent online and offline.

**Core Goal**: make completion-window behavior deterministic, timezone-safe, and
clearly explained in the UI without breaking existing completion flows.

---

## Completion Window Spec (Locked)

- Applies to both completion directions:
  - checking (`completed: true`)
  - unchecking (`completed: false`)
- Allowed dates:
  - today: allowed
  - yesterday: allowed only before 02:00 local time
- Blocked dates:
  - future dates: always blocked
  - older history (before yesterday): blocked
- Grace boundary:
  - at exactly 02:00 local time, yesterday is no longer allowed
- Timezone source:
  - use the authenticated user's timezone
- Tiering:
  - this rule is Free by policy (not Pro-gated)

---

## Scope Decisions

### Included

- [ ] Implement Free grace window: allow completing "yesterday" until 02:00
- [ ] Keep future-date guard intact
- [ ] Ensure timezone-safe boundary handling
- [ ] Update UI copy to explain grace window
- [ ] Add unit tests + E2E tests for grace window edge cases

### Excluded (this sprint)

- [ ] History backfill beyond the grace window
- [ ] Changes to monetization or entitlement logic
- [ ] Store/mobile push delivery work

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> shared completion-window policy (date validity, grace cutoff, timezone boundaries)
- **API** -> completion toggle enforcement for allowed/blocked dates
- **Components** -> immediate disabled state and explanatory UI copy
- **E2E** -> deterministic cutoff scenarios (`01:59` allow, `02:00` block), plus future-date guard regression

CI must remain green.

---

## Phase 1: Domain + API Enforcement (Days 1-2)

### Tasks (4)

- [x] **Task 1.1**: Add a shared completion-window rule helper (single source of truth)
- [x] **Task 1.2**: Use shared rules in completion API service for both check and uncheck
- [x] **Task 1.3**: Preserve explicit future-date guard behavior
- [x] **Task 1.4**: Add a test-only "now override" for deterministic E2E, enabled only when `ENABLE_TEST_ENDPOINTS=true`

---

## Phase 2: UI + Offline Consistency (Days 2-4)

### Tasks (3)

- [ ] **Task 2.1**: Disable completion toggles immediately when date is outside allowed window
- [ ] **Task 2.2**: Update copy in daily completion surfaces to explain the grace window clearly
- [ ] **Task 2.3**: Ensure offline queue validation uses the same shared rule semantics as API

---

## Phase 3: Coverage + Edge Cases (Days 4-6)

### Tasks (4)

- [ ] **Task 3.1**: Add unit tests for cutoff boundaries and timezone transitions
- [ ] **Task 3.2**: Add API/service tests for blocked history and future dates
- [ ] **Task 3.3**: Add component tests for disabled toggles and grace-window messaging
- [ ] **Task 3.4**: Add E2E tests for deterministic `01:59`/`02:00` behavior and guard regressions

---

## Implementation Guidelines

- Keep one shared policy for date validity to avoid API/offline drift.
- Do not weaken core invariants (habits are weekday-based; completions are habit+date).
- Keep all comparisons timezone-safe and based on normalized UTC date keys.
- Treat `02:00` as cutoff reached (yesterday blocked at and after `02:00`).
- Test-only time override must be ignored outside test mode.
- Keep user-facing validation feedback toast-based (no inline form errors).

---

## File Structure (Expected)

- `src/lib/habits/*` (shared date/window policy + tests)
- `src/lib/api/habits/completions.ts`
- `src/lib/api/habits/__tests__/*`
- `src/app/api/completions/route.ts`
- `src/components/calendar/DailyCompletionPanel.tsx`
- `src/components/calendar/__tests__/DailyCompletionPanel.test.tsx`
- `e2e/daily-completion.spec.ts`
- `e2e/offline-completions.spec.ts`
- `docs/sprints/sprint-12.1.md`

---

## Definition of Done

1. [ ] Grace window rules are enforced identically online and offline
2. [ ] Completion toggle is blocked for dates outside the allowed window (both check/uncheck)
3. [ ] Future-date guard remains intact
4. [ ] UI clearly communicates the grace window and disabled behavior
5. [ ] Unit/API/component tests cover boundary and timezone edge cases
6. [ ] E2E deterministically covers before/at cutoff behavior
7. [ ] CI passes from a clean checkout

---
