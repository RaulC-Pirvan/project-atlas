# Sprint 1.2: Core Data Model (Prisma) - Project Atlas

**Duration**: Week 2 (5-7 days)  
**Status**: Not Started  
**Theme**: Habit domain schema, migrations, seeds, and domain logic tests.

---

## Overview

Sprint 1.2 delivers the core habit data model and the domain logic that proves the model works.
This is the foundation for calendar UX, completions, and streaks.

**Core Goal**: define a stable Prisma schema for habits and completions, run the first migration,
and back it with unit-tested domain logic.

---

## Scope Decisions

### Included

- [ ] Habit, HabitSchedule (weekday-based), HabitCompletion, and Streak strategy (derived or stored)
- [ ] Prisma schema update, indices, and constraints
- [ ] Initial migration + seed data
- [ ] Domain logic unit tests (no UI)
- [ ] Weekday -> date mapping validation

### Excluded (this sprint)

- [ ] Calendar UI
- [ ] Habit CRUD UI
- [ ] Notifications or reminders
- [ ] Analytics or dashboards

---

## Testing Policy

After each model or rule is implemented, add tests:

- **Domain services** -> `src/lib/**/__tests__/*.test.ts`
- **No UI or E2E** in this sprint

CI must remain green.

---

## Phase 1: Domain Model Design (Days 1-2)

### Tasks (10)

- [x] **Task 1.1**: Confirm habit invariant: habits are not tied to dates
- [x] **Task 1.2**: Define `Habit` fields (title, description, owner, timestamps, archived state)
- [x] **Task 1.3**: Define `HabitSchedule` with weekday storage strategy
- [x] **Task 1.4**: Define `HabitCompletion` (habitId + date + completion state)
- [x] **Task 1.5**: Decide Streak model (derived vs stored, and why)
- [x] **Task 1.6**: Confirm timezone strategy for date storage
- [x] **Task 1.7**: Define soft-delete strategy (if required)
- [x] **Task 1.8**: Map relationships and cascade rules
- [x] **Task 1.9**: Document model constraints in the sprint doc
- [x] **Task 1.10**: Review with product invariant checklist

### Phase 1 Decisions (Drafted)

#### Habit

- Fields: `id`, `userId`, `title`, `description?`, `archivedAt?`, `createdAt`, `updatedAt`
- Ownership: each habit belongs to exactly one user
- Soft delete: `archivedAt` hides from active views, preserves history

#### HabitSchedule (weekday-based)

- One row per active weekday
- Fields: `id`, `habitId`, `weekday`
- Weekday encoding: ISO 1-7 (Mon=1 ... Sun=7)
- Unique constraint: (`habitId`, `weekday`)

#### HabitCompletion (habit + date)

- A row means "completed" for a specific habit on a specific date
- Fields: `id`, `habitId`, `date`, `completedAt`
- Unique constraint: (`habitId`, `date`)
- Completion is idempotent (no duplicates); delete row to "uncomplete"

#### Streak

- Derived from completions (no table in Sprint 1.2)
- Optional future cache if performance demands it

#### Timezone and date strategy

- Store user timezone (IANA string) on `User`, default to `UTC`
- Store user week start preference on `User` (`weekStart` = `sun` or `mon`)
- Store completion `date` as a date-only value normalized to UTC midnight
- All weekday and streak logic uses the user's timezone
- UI week layout follows `weekStart`, but schedule storage stays ISO (Mon=1 ... Sun=7)

#### Relationships and cascade rules

- `User` -> `Habit` (cascade on delete)
- `Habit` -> `HabitSchedule` (cascade on delete)
- `Habit` -> `HabitCompletion` (cascade on delete)

#### Indices and constraints (Phase 2 targets)

- `Habit`: index on `userId`
- `HabitSchedule`: unique (`habitId`, `weekday`)
- `HabitCompletion`: unique (`habitId`, `date`), index on `date`

---

## Phase 2: Prisma Schema + Migration (Days 2-3)

### Tasks (10)

- [x] **Task 2.1**: Add models to `prisma/schema.prisma`
- [x] **Task 2.2**: Add unique constraints (habit + weekday, habit + date)
- [x] **Task 2.3**: Add indexes for common queries (userId, date, habitId)
- [x] **Task 2.4**: Run `prisma migrate dev` with a clear migration name
- [x] **Task 2.5**: Regenerate Prisma client
- [x] **Task 2.6**: Update `prisma/seed.ts` with sample users and habits
- [x] **Task 2.7**: Seed sample schedules + completions
- [x] **Task 2.8**: Verify migration applies cleanly to empty DB
- [x] **Task 2.9**: Verify migration applies cleanly to Neon
- [x] **Task 2.10**: Add migration notes to docs (if needed)

---

## Migration Notes (Phase 2)

- Migration `20260126095436_habit_core_model` adds `WeekStart` enum, `User.timezone` + `User.weekStart`, and the `Habit`, `HabitSchedule`, `HabitCompletion` tables with indices and constraints.

---

## Phase 3: Domain Logic + Tests (Days 3-5)

### Tasks (12)

- [ ] **Task 3.1**: Implement weekday -> date matching helper
- [ ] **Task 3.2**: Implement "habits for a day" query helper
- [ ] **Task 3.3**: Implement completion create/update rules
- [ ] **Task 3.4**: Implement completion idempotency (no duplicates)
- [ ] **Task 3.5**: Implement streak calculation (derived or stored)
- [ ] **Task 3.6**: Unit tests for weekday mapping logic
- [ ] **Task 3.7**: Unit tests for completion uniqueness
- [ ] **Task 3.8**: Unit tests for streak logic
- [ ] **Task 3.9**: Unit tests for schedule edge cases
- [ ] **Task 3.10**: Verify timezone/date boundary behavior
- [ ] **Task 3.11**: Add fixtures or factories for habit domain tests
- [ ] **Task 3.12**: Confirm no Prisma types leak into pure domain helpers

---

## Implementation Guidelines

- Habits are intent, not instances; dates belong only to completions.
- No per-date habit creation, ever.
- Weekday scheduling must be explicit and queryable.
- Prefer derived streaks unless storage is proven necessary.

---

## File Structure (Expected)

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `prisma/seed.ts`
- `src/lib/habits/*` (domain helpers and types)
- `src/lib/habits/__tests__/*`

---

## Checklist

### Pre-Development

- [ ] Confirm weekday representation strategy
- [ ] Confirm streak strategy (derived vs stored)

### Development

- [ ] Implement Prisma models + migration
- [ ] Update seed data with habits/schedules/completions
- [ ] Add domain logic helpers
- [ ] Add unit tests
- [ ] Confirm `npm run ci` passes

### Post-Sprint

- [ ] Update roadmap docs
- [ ] Prep for Sprint 1.3 (Habit CRUD + API)

---

## Definition of Done

1. [ ] Prisma schema includes Habit, HabitSchedule, and HabitCompletion
2. [ ] Indices and constraints enforce data integrity
3. [ ] Migration applies cleanly
4. [ ] Seed data includes sample users and habits
5. [ ] Weekday -> date mapping is implemented and tested
6. [ ] Streak strategy decided and validated
7. [ ] Unit tests pass in CI

---
