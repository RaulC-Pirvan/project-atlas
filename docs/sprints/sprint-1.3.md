# Sprint 1.3: Habit CRUD - Project Atlas

**Duration**: Week 3 (5-7 days)  
**Status**: Not Started  
**Theme**: Habit creation, editing, deletion, and persistence with test coverage.

---

## Overview

Sprint 1.3 delivers the first end-to-end habit management workflow:
create habits, choose active weekdays, edit, and delete, all persisted in the database.

**Core Goal**: a signed-in user can manage habits from the UI, backed by API routes and tests.

---

## Scope Decisions

### Included

- [ ] Create habit creation UI
- [ ] Select active weekdays (Mon-Sun)
- [ ] Edit / delete habits
- [ ] Persist habits in DB
- [ ] Validate habit rules (no empty weekday selection)
- [ ] Unit tests for habit CRUD
- [ ] E2E tests for habit creation/edit/delete

### Excluded (this sprint)

- [ ] Habit completion tracking UI
- [ ] Calendar views
- [ ] Streak analytics UI
- [ ] Notifications or reminders

---

## Testing Policy

After each feature area, add tests:

- **Domain services** -> `src/lib/**/__tests__/*.test.ts`
- **API routes** -> `src/app/api/**/__tests__/*.test.ts`
- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/habits.spec.ts`

CI must remain green.

---

## Phase 1: API + Persistence (Days 1-2)

### Tasks (10)

- [x] **Task 1.1**: Add habit API routes (list, create, update, delete)
- [x] **Task 1.2**: Enforce auth on habit routes
- [x] **Task 1.3**: Validate payloads (title required, weekdays 1-7, non-empty schedule)
- [x] **Task 1.4**: Use ISO weekday storage (Mon=1 ... Sun=7)
- [x] **Task 1.5**: Persist schedules via `HabitSchedule` rows
- [x] **Task 1.6**: Soft delete habits with `archivedAt`
- [x] **Task 1.7**: Ensure edits update schedule atomically
- [x] **Task 1.8**: Add API error responses consistent with auth APIs
- [x] **Task 1.9**: Add API tests for create/update/delete
- [x] **Task 1.10**: Add API tests for validation failures

---

## Phase 2: Habit UI (Days 2-4)

### Tasks (10)

- [x] **Task 2.1**: Build habits list page (empty + loading states)
- [x] **Task 2.2**: Build create habit form
- [x] **Task 2.3**: Add weekday selector component (Mon-Sun)
- [x] **Task 2.4**: Build edit habit form (pre-filled)
- [x] **Task 2.5**: Add delete flow (confirm intent)
- [x] **Task 2.6**: Hook forms to API routes
- [x] **Task 2.7**: Normalize error handling and messaging
- [x] **Task 2.8**: Ensure UI respects `weekStart` preference
- [x] **Task 2.9**: Add component tests for habit forms
- [x] **Task 2.10**: Ensure styling uses existing UI primitives

---

## Phase 3: E2E Coverage (Days 4-5)

### Tasks (6)

- [x] **Task 3.1**: Add `e2e/habits.spec.ts`
- [x] **Task 3.2**: E2E: create habit with weekdays
- [x] **Task 3.3**: E2E: edit habit title and weekdays
- [x] **Task 3.4**: E2E: delete habit removes it from list
- [x] **Task 3.5**: E2E: validation blocks empty weekday selection
- [x] **Task 3.6**: CI stability check (no flakes)

---

## Implementation Guidelines

- Schedule storage remains ISO weekdays; UI presentation can follow `weekStart`.
- Validation must reject empty weekday selection.
- Avoid Prisma types in UI and domain helpers.

---

## File Structure (Expected)

- `src/app/habits/page.tsx`
- `src/app/api/habits/route.ts`
- `src/app/api/habits/[id]/route.ts`
- `src/components/habits/*`
- `src/lib/habits/*`
- `src/app/api/habits/__tests__/*`
- `src/components/habits/__tests__/*`
- `e2e/habits.spec.ts`

---

## Definition of Done

1. [ ] User can create a habit with selected weekdays
2. [ ] User can edit and delete habits
3. [ ] Habits persist in the database
4. [ ] Validation blocks empty weekday selections
5. [ ] Unit tests cover CRUD rules
6. [ ] E2E tests cover create/edit/delete
7. [ ] CI passes from clean checkout

---
