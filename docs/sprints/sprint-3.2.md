# Sprint 3.2: Streak UI - Project Atlas

**Duration**: Week 8 (5-7 days)  
**Status**: Not Started  
**Theme**: Surface streaks in the product with clear, minimal UI.

---

## Overview

Sprint 3.2 delivers the streak user experience: display streak statistics in the
dashboard, emphasize continuity, and add friendly empty states. E2E coverage
validates that streaks update when completions change.

**Core Goal**: users can see current and longest streaks at a glance and trust
that the UI updates when they complete habits.

---

## Scope Decisions

### Included

- [ ] Display streak stats in dashboard
- [ ] Visual emphasis on streak continuity
- [ ] Friendly empty states
- [ ] E2E tests for streak updates

### Excluded (this sprint)

- [ ] Streak badges or gamification rewards
- [ ] Streak history charts
- [ ] Notifications or reminders
- [ ] Analytics dashboards

---

## Testing Policy

After each feature area, add tests:

- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/streaks.spec.ts`

CI must remain green.

---

## Phase 1: Dashboard UI (Days 1-2)

### Tasks (3)

- [x] **Task 1.1**: Add dashboard section for streak summary
- [x] **Task 1.2**: Wire streak data from domain helpers to the dashboard
- [x] **Task 1.3**: Add empty states when there are no streaks to show

---

## Dashboard UI Contract (Proposed)

These decisions clarify what "dashboard" means for Sprint 3.2 and how streaks
should be represented in the UI.

### Placement

- Use the **Calendar page** as the dashboard for now (no dedicated dashboard route).
- Add a **Streaks** panel above the selected-day panel or in the left column
  near the calendar header (keep layout clean and minimal).
- If a dedicated dashboard route is added later, move the panel without changing
  the data contract.

### Data Shape

- Streaks are **per habit** (derived from schedule + completions).
- Each row shows:
  - Habit title
  - Current streak
  - Longest streak
- "As of" date is **today** in the user's timezone.

### Empty States

- **No habits**: "Create a habit to start a streak."
- **Habits, no completions**: "Complete a habit to begin your first streak."
- **All streaks zero**: show rows with `0` values (no special error state).

### Visual Emphasis

- Highlight **current streak** more strongly than longest (e.g., weight, size, label).
- Keep styling within the black/white system; gold is optional and subtle.

---

---

## Phase 2: Visual Emphasis (Days 2-4)

### Tasks (2)

- [x] **Task 2.1**: Emphasize continuity (e.g., current streak vs longest)
- [x] **Task 2.2**: Ensure styling stays within black/white + gold accent

---

## Phase 3: E2E Coverage (Days 4-5)

### Tasks (2)

- [x] **Task 3.1**: E2E: streaks update after completion toggle
- [x] **Task 3.2**: E2E: empty state when no completions exist

---

## Implementation Guidelines

- Reuse streak calculations from `src/lib/habits/streaks`.
- Avoid inline form errors; use toasts for user-facing errors.
- Keep UI minimal and readable; emphasize streak continuity without new colors.
- Respect the core invariant: streaks are derived from weekday-based habits.

---

## File Structure (Expected)

- `src/app/dashboard/page.tsx` (or equivalent authenticated dashboard route)
- `src/components/streaks/*`
- `src/components/streaks/__tests__/*`
- `e2e/streaks.spec.ts`

---

## Definition of Done

1. [ ] Streak stats appear in the dashboard
2. [ ] Visual emphasis highlights current vs longest streak
3. [ ] Friendly empty states appear with no streak data
4. [ ] E2E tests cover streak updates
5. [ ] CI passes from clean checkout

---
