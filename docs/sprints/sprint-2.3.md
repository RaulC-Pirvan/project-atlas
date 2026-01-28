# Sprint 2.3: Visual Feedback & Delight - Project Atlas

**Duration**: Week 6 (5-7 days)  
**Status**: Not Started  
**Theme**: Visual feedback, delight, and polish on the calendar.

---

## Overview

Sprint 2.3 focuses on visual feedback and delight in the calendar experience:
progress indicators on day tiles, a golden state for fully completed days, subtle
completion sounds, and smooth transitions with accessibility in mind.

**Core Goal**: the calendar communicates daily progress clearly and feels rewarding
without sacrificing clarity or accessibility.

---

## Scope Decisions

### Included

- [ ] Day tile progress indicator
- [ ] Fully completed day -> golden state
- [ ] Completion sound (configurable / subtle)
- [ ] Smooth UI transitions
- [ ] Accessibility considerations
- [ ] Visual regression tests (Playwright)

### Excluded (this sprint)

- [ ] Streak analytics (Phase 3)
- [ ] Calendar layout overhaul
- [ ] Notifications / reminders

---

## Testing Policy

After each feature area, add tests:

- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/calendar-visual.spec.ts`
- **Visual regression** -> Playwright snapshot tests

CI must remain green.

---

## Phase 1: Visual Indicators (Days 1-2)

### Tasks (3)

- [x] **Task 1.1**: Add per-day progress indicator (partial completion)
- [x] **Task 1.2**: Add "golden" styling for fully completed days
- [x] **Task 1.3**: Ensure indicators respect black/white visual system

---

## Phase 2: Delight & Motion (Days 2-4)

### Tasks (3)

- [ ] **Task 2.1**: Add subtle completion sound (toggleable)
- [ ] **Task 2.2**: Add smooth transitions for check/uncheck and tile state
- [ ] **Task 2.3**: Ensure motion respects reduced-motion preferences

---

## Phase 3: Accessibility & Visual QA (Days 4-5)

### Tasks (3)

- [ ] **Task 3.1**: Accessibility audit for contrast + focus states
- [ ] **Task 3.2**: Add Playwright visual regression coverage
- [ ] **Task 3.3**: Stabilize snapshots across browsers

---

## Implementation Guidelines

- Keep all styling within the black/white system.
- Avoid heavy decoration or gradients; use tone and contrast subtly.
- Ensure audio is optional and can be disabled globally.
- Respect `prefers-reduced-motion` and avoid forced animations.

---

## File Structure (Expected)

- `src/components/calendar/*`
- `src/components/ui/*` (if shared indicator primitives are needed)
- `e2e/calendar-visual.spec.ts`

---

## Definition of Done

1. [ ] Day tiles show progress indicators
2. [ ] Fully completed days show golden state
3. [ ] Completion sound is subtle and configurable
4. [ ] Transitions are smooth and respect reduced motion
5. [ ] Accessibility checks pass (contrast, focus, semantics)
6. [ ] Visual regression tests are in place
7. [ ] CI passes from clean checkout

---
