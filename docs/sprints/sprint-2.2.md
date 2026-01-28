# Sprint 2.2: Daily Habit Completion - Project Atlas

**Duration**: Week 5 (5-7 days)  
**Status**: Not Started  
**Theme**: Daily completion tracking tied to the calendar selection.

---

## Overview

Sprint 2.2 delivers daily habit completion: show habits active on the selected day,
allow check/uncheck, and persist completions per habit per date.

**Core Goal**: a signed-in user can mark habits complete for a selected date,
with correctness guarantees and test coverage.

---

## Scope Decisions

### Included

- [ ] Show habits active on selected day
- [ ] Allow checking/unchecking habits
- [ ] Persist habit completion per date
- [ ] Prevent double completion
- [ ] Handle past/future dates correctly
- [ ] Unit tests for completion logic
- [ ] E2E tests for daily completion flow

### Excluded (this sprint)

- [ ] Visual feedback & delight (golden tiles, sounds)
- [ ] Streak analytics (Phase 3)
- [ ] Notifications / reminders
- [ ] Calendar layout overhaul

---

## Testing Policy

After each feature area, add tests:

- **Domain services** -> `src/lib/**/__tests__/*.test.ts`
- **API routes** -> `src/app/api/**/__tests__/*.test.ts`
- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/daily-completion.spec.ts`

CI must remain green.

---

## Phase 1: Completion Logic + API (Days 1-2)

### Tasks (6)

- [x] **Task 1.1**: Define completion rules (date normalization, timezone-safe)
- [x] **Task 1.2**: Implement completion toggle logic (create/delete per habit+date)
- [x] **Task 1.3**: Prevent double completion at the domain layer
- [x] **Task 1.4**: Add API routes/services for daily completion actions
- [x] **Task 1.5**: Enforce auth + validation on completion endpoints
- [x] **Task 1.6**: Unit tests for completion logic

---

## Phase 2: Daily Completion UI (Days 2-4)

### Tasks (5)

- [ ] **Task 2.1**: Render active habits in the selected-day panel
- [ ] **Task 2.2**: Add check/uncheck controls and wire to API
- [ ] **Task 2.3**: Handle past/future dates (disable or message when needed)
- [ ] **Task 2.4**: Surface errors via toast (no inline errors)
- [ ] **Task 2.5**: Add component tests for daily completion UI

---

## Phase 3: E2E Coverage (Days 4-5)

### Tasks (3)

- [ ] **Task 3.1**: E2E: complete a habit for a selected day
- [ ] **Task 3.2**: E2E: uncheck a completion
- [ ] **Task 3.3**: E2E: prevent double completion

---

## Implementation Guidelines

- Preserve the core invariant: habits are weekday-based, not date-based.
- Store completions as `HabitCompletion` rows (habit + date).
- Keep domain logic pure and decoupled from Prisma types.
- Use UTC-normalized dates for persistence.

---

## File Structure (Expected)

- `src/app/calendar/page.tsx`
- `src/components/calendar/*`
- `src/app/api/completions/*` (or equivalent API route)
- `src/lib/api/habits/*` (completion services)
- `src/lib/habits/completions.ts`
- `src/lib/habits/__tests__/*`
- `src/components/calendar/__tests__/*`
- `e2e/daily-completion.spec.ts`

---

## Definition of Done

1. [ ] Selected-day panel lists active habits for that date
2. [ ] User can check/uncheck a habit for the selected date
3. [ ] Completions persist per habit per date
4. [ ] Double completion is prevented
5. [ ] Past/future dates handled correctly
6. [ ] Unit tests cover completion logic
7. [ ] E2E tests cover daily completion flow
8. [ ] CI passes from clean checkout

---
