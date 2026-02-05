# Sprint 9.1: Achievements System v1 - Project Atlas

**Duration**: Week 18-19 (5-7 days)  
**Status**: Not Started  
**Theme**: Pro-friendly achievements and milestones that reinforce habits without heavy gamification.

---

## Overview

Sprint 9.1 delivers the Achievements System v1 with a Free baseline catalogue
and a Pro-expanded set. Achievements must be computed from habit completions,
remain timezone-safe, and never violate the habit invariant.

**Core Goal**: ship a clear, motivating achievements experience that respects
core habit tracking rules and keeps the Free tier fully useful.

---

## Achievements Spec (v1)

### Data Scope

- Use **active habits only** (`archivedAt = null`).
- Achievements are derived from **completion history** and **current schedules**.
- Ignore future dates; respect the **yesterday until 02:00** grace window.
- Normalize dates using the **user's timezone**.

### Catalogue

- **Free baseline**: a small, meaningful set for motivation without gating core usage.
- **Pro extended**: deeper milestones and long-horizon achievements.

### Milestones

- Habit-level timeline for **7/30/100 completions**, **perfect weeks**, and similar.
- Milestones must remain deterministic and timezone-safe.

---

## Scope Decisions

### Included

- [ ] Define achievement catalogue (Free baseline + Pro extended)
- [ ] Implement achievement evaluation engine (pure domain logic)
- [ ] Add achievements UI ("Trophy cabinet")
- [ ] Add milestone timeline per habit (7/30/100 completions, perfect weeks, etc.)
- [ ] Ensure achievements are timezone-safe
- [ ] Unit tests for achievements unlock logic
- [ ] E2E tests for achievement unlock display

### Excluded (this sprint)

- [ ] Social sharing or leaderboards
- [ ] Heavy gamification beyond achievements/milestones
- [ ] Push notification or reminder integrations
- [ ] Store purchase flow integration

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> achievement evaluation engine and timezone normalization
- **API** -> achievement responses and gating (if API is introduced)
- **Components** -> trophy cabinet + milestone timeline rendering
- **E2E** -> unlock visibility for Free vs Pro users

CI must remain green.

---

## Phase 1: Catalogue & Engine (Days 1-2)

### Tasks (3)

- [x] **Task 1.1**: Define achievement catalogue (Free baseline + Pro extended)
- [x] **Task 1.2**: Implement achievement evaluation engine (pure domain logic)
- [x] **Task 1.3**: Ensure achievements are timezone-safe

---

## Phase 2: UI & Milestones (Days 2-4)

### Tasks (2)

- [x] **Task 2.1**: Add achievements UI ("Trophy cabinet")
- [x] **Task 2.2**: Add milestone timeline per habit (7/30/100 completions, perfect weeks, etc.)

---

## Phase 3: Tests & E2E (Days 4-6)

### Tasks (2)

- [x] **Task 3.1**: Unit tests for achievements unlock logic
- [x] **Task 3.2**: E2E tests for achievement unlock display

---

## Implementation Guidelines

- Achievements must not alter the habit invariant (habits remain weekday-based).
- Evaluation logic must be pure, deterministic, and timezone-safe.
- Free tier remains fully useful; Pro expands depth without blocking core flows.
- UI should stay minimalist and aligned with the black/white + gold accent system.

---

## File Structure (Expected)

- `src/lib/achievements/*`
- `src/lib/achievements/__tests__/*`
- `src/components/achievements/*`
- `src/app/achievements/page.tsx`
- `src/app/api/achievements/route.ts` (if API needed)
- `e2e/*`

---

## Definition of Done

1. [ ] Achievement catalogue is documented (Free baseline + Pro extended)
2. [ ] Evaluation engine computes unlocks deterministically
3. [ ] Trophy cabinet and milestone timeline render correctly
4. [ ] Timezone rules and grace window are respected
5. [ ] Unit tests cover unlock logic
6. [ ] E2E covers achievement unlock visibility
7. [ ] CI passes from clean checkout

---
