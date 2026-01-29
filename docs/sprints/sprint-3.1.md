# Sprint 3.1: Streak Logic - Project Atlas

**Duration**: Week 7 (5-7 days)  
**Status**: Not Started  
**Theme**: Streak definitions, timezone-safe calculations, and test coverage.

---

## Overview

Sprint 3.1 delivers streak logic for habits: define the rules, compute current and
longest streaks, and ensure calculations are timezone-safe and well tested.

**Core Goal**: given a habit schedule and completion dates, compute accurate
current and longest streaks as of a specific date.

---

## Scope Decisions

### Included

- [ ] Define streak rules clearly (what breaks a streak)
- [ ] Compute current streak
- [ ] Compute longest streak
- [ ] Handle partial days correctly
- [ ] Timezone-safe logic
- [ ] Unit tests for streak calculations

### Excluded (this sprint)

- [ ] Streak UI (cards, badges, charts)
- [ ] Streak-based notifications or reminders
- [ ] API endpoints specifically for streaks
- [ ] Engagement analytics dashboards

---

## Testing Policy

After each feature area, add tests:

- **Domain services** -> `src/lib/**/__tests__/*.test.ts`

CI must remain green.

---

## Phase 1: Rules & Contracts (Days 1-2)

### Tasks (2)

- [x] **Task 1.1**: Define streak rules (what breaks/continues a streak)
- [x] **Task 1.2**: Specify "as of" semantics and partial-day handling

---

## Streak Rules (Proposed Contract)

These rules define the expected behavior for streak calculations. Keep this
section in sync with implementation and tests.

### Definitions

- **Scheduled day**: A calendar day whose weekday is included in the habit schedule.
- **Completion**: A `HabitCompletion` row for the habit on the scheduled day
  (stored as a UTC date key).
- **Streak**: A count of *consecutive scheduled days* that are completed.

### What counts toward a streak

- Only **scheduled days** count.
- Non-scheduled days are **ignored** and do not break or extend a streak.
- A scheduled day is considered **complete** if there is a completion record for
  that exact UTC date key.

### What breaks a streak

- A streak breaks when a **scheduled day** occurs with **no completion**.
- Missing completions on non-scheduled days **do not** break a streak.

### Current vs Longest

- **Current streak**: the streak ending on the most recent scheduled day **at or
  before** the `asOf` date. If that day is incomplete, current streak is `0`.
- **Longest streak**: the maximum consecutive scheduled-day completions within
  the evaluation range (see "Evaluation window").

### Evaluation window

- Default window is **from the earliest completion date up to `asOf`**.
- If there are no completions, both streaks are `0`.
- If a stricter window is desired later (e.g., last 365 days), make it explicit
  and reflect it in tests.

---

## "As Of" Semantics & Partial Days

These rules define how the `asOf` date is derived and how partial days behave.

- `asOf` is **timezone-normalized** using the user's timezone to a **UTC date**.
- Streak calculations only include **scheduled days on or before** that normalized `asOf` date.
- **Future scheduled days** (after `asOf`) are **ignored**.
- A "partial day" (today in the user's timezone) counts **only if a completion
  exists**; otherwise it does **not** extend the current streak.
- Completion timestamps are not used for streak math; only the **UTC date key**
  matters (time-of-day does not change streak outcomes).

---

## Phase 2: Streak Computation (Days 2-4)

### Tasks (3)

- [ ] **Task 2.1**: Implement current streak calculation
- [ ] **Task 2.2**: Implement longest streak calculation
- [ ] **Task 2.3**: Ensure timezone-safe normalization and weekday filtering

---

## Phase 3: Test Coverage (Days 4-5)

### Tasks (3)

- [ ] **Task 3.1**: Unit tests for current and longest streaks
- [ ] **Task 3.2**: Tests for timezone boundaries and partial days
- [ ] **Task 3.3**: Edge case tests (no schedule, no completions, gaps)

---

## Implementation Guidelines

- Preserve the core invariant: habits are weekday-based, not date-based.
- Treat only scheduled weekdays as streak-relevant; non-scheduled days do not
  break a streak.
- Normalize dates using user timezone; store/compare as UTC date keys.
- Keep the streak logic pure and decoupled from Prisma types.

---

## File Structure (Expected)

- `src/lib/habits/streaks.ts`
- `src/lib/habits/__tests__/streaks.test.ts`
- `src/lib/habits/dates.ts` (if new date helpers are needed)

---

## Definition of Done

1. [ ] Streak rules are documented and unambiguous
2. [ ] Current streak calculation is implemented
3. [ ] Longest streak calculation is implemented
4. [ ] Timezone-safe normalization is enforced
5. [ ] Unit tests cover normal + edge cases
6. [ ] CI passes from clean checkout

---
