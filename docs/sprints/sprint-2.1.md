# Sprint 2.1: Calendar Core - Project Atlas

**Duration**: Week 4 (5-7 days)  
**Status**: Not Started  
**Theme**: Calendar foundation, date logic, and navigation.

---

## Overview

Sprint 2.1 delivers the calendar core: a monthly view with accurate date/weekday mapping
and navigation into a daily view.

**Core Goal**: a signed-in user can navigate the monthly calendar and select a day
with correct weekday logic and test coverage.

---

## Scope Decisions

### Included

- [ ] Monthly calendar view
- [ ] Correct date <-> weekday mapping
- [ ] Display which days have active habits
- [ ] Click day -> open daily panel
- [ ] Responsive layout (desktop-first, mobile-safe)
- [ ] Unit tests for calendar date logic
- [ ] E2E tests for calendar navigation

### Excluded (this sprint)

- [ ] Daily habit completion UI (Sprint 2.2)
- [ ] Completion persistence per date (Sprint 2.2)
- [ ] Visual feedback and delight (Sprint 2.3)
- [ ] Streak analytics (Phase 3)

---

## Testing Policy

After each feature area, add tests:

- **Domain services** -> `src/lib/**/__tests__/*.test.ts`
- **API routes** -> `src/app/api/**/__tests__/*.test.ts`
- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/calendar.spec.ts`

CI must remain green.

---

## Phase 1: Date Logic (Days 1-2)

### Tasks (2)

- [x] **Task 1.1**: Correct date <-> weekday mapping
- [x] **Task 1.2**: Unit tests for calendar date logic

---

## Phase 2: Calendar UI (Days 2-4)

### Tasks (4)

- [x] **Task 2.1**: Monthly calendar view
- [x] **Task 2.2**: Display which days have active habits
- [x] **Task 2.3**: Click day -> open daily panel
- [x] **Task 2.4**: Responsive layout (desktop-first, mobile-safe)

---

## Phase 3: E2E Coverage (Days 4-5)

### Tasks (1)

- [x] **Task 3.1**: E2E tests for calendar navigation

---

## Implementation Guidelines

- Preserve the core invariant: habits are weekday-based, not date-based.
- Keep date/weekday logic pure and testable in `src/lib/habits`.
- Reuse existing UI primitives and maintain the black/white design system.

---

## File Structure (Expected)

- `src/app/calendar/page.tsx`
- `src/components/calendar/*`
- `src/lib/habits/dates.ts`
- `src/lib/habits/query.ts`
- `src/lib/habits/__tests__/*`
- `src/components/calendar/__tests__/*`
- `e2e/calendar.spec.ts`

---

## Definition of Done

1. [ ] Monthly calendar view is implemented
2. [ ] Date <-> weekday mapping is correct and unit-tested
3. [ ] Days with active habits are indicated in the calendar
4. [ ] Day click opens the daily view
5. [ ] Layout is responsive (desktop-first, mobile-safe)
6. [ ] E2E tests cover calendar navigation
7. [ ] CI passes from clean checkout

---
