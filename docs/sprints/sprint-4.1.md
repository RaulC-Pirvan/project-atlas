# Sprint 4.1: Mobile & Responsiveness - Project Atlas

**Duration**: Week 9 (5-7 days)  
**Status**: Not Started  
**Theme**: Mobile-first calendar experience and touch interactions.

---

## Overview

Sprint 4.1 delivers a mobile-optimized calendar and daily view experience. The
calendar must be usable on small screens, touch interactions must feel natural,
and the selected-day panel should become a bottom-sheet on mobile.

**Core Goal**: the calendar experience is fully usable and pleasant on mobile
devices without sacrificing clarity or correctness.

---

## Scope Decisions

### Included

- [ ] Mobile-optimized calendar view
- [ ] Touch-friendly interactions
- [ ] Bottom-sheet style daily view (mobile)
- [ ] Cross-device testing

### Excluded (this sprint)

- [ ] Mobile-specific redesign of the entire app shell
- [ ] Offline support or PWA work
- [ ] New features outside calendar UX
- [ ] Streak analytics expansion

---

## Testing Policy

After each feature area, add tests:

- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/mobile.spec.ts`
- **Visual regression** -> Playwright snapshot tests (mobile viewport)

CI must remain green.

---

## Phase 1: Mobile Layout (Days 1-2)

### Tasks (3)

- [x] **Task 1.1**: Adjust calendar grid spacing for mobile viewports
- [x] **Task 1.2**: Optimize typography and tap targets for small screens
- [x] **Task 1.3**: Ensure sidebar stacks below calendar on narrow widths

---

## Mobile Layout Contract (Proposed)

These decisions define how the calendar behaves on mobile. Keep this section in
sync with implementation and tests.

### Breakpoints

- **Mobile**: `< 768px` (default, single column)
- **Desktop**: `>= 1024px` (current two-column layout)

### Calendar Grid

- Reduce tile height and internal padding on mobile while preserving readability.
- Weekday headers should remain visible and legible; abbreviate if needed.
- Avoid horizontal scrolling; the grid must fit the viewport width.

### Sidebar Stacking

- On mobile, the Streaks panel and Daily panel stack **below** the calendar.
- Order on mobile: Calendar → Streaks → Daily.

### Tap Targets & Typography

- Tap targets minimum `44px` for day tiles and habit rows.
- Avoid multi-line labels inside day tiles; prioritize the day number and progress indicator.
- Keep the black/white UI system; gold remains reserved for fully completed days.

---

---

## Phase 2: Touch Interactions (Days 2-4)

### Tasks (3)

- [x] **Task 2.1**: Ensure touch targets meet minimum size (44px+)
- [x] **Task 2.2**: Improve touch feedback for calendar tiles and habit rows
- [x] **Task 2.3**: Verify scrolling and focus states on mobile devices

---

## Phase 3: Bottom-Sheet Daily View (Days 4-5)

### Tasks (3)

- [x] **Task 3.1**: Implement bottom-sheet daily view for mobile
- [x] **Task 3.2**: Add open/close gestures or buttons (accessible)
- [x] **Task 3.3**: Preserve calendar selection when sheet closes

---

## Implementation Guidelines

- Keep the black/white UI system; avoid new colors or gradients.
- Maintain the core invariant: habits are weekday-based, not date-based.
- Respect `prefers-reduced-motion` for any mobile transitions.
- Reuse existing calendar and daily panel logic where possible.

---

## File Structure (Expected)

- `src/components/calendar/*`
- `src/components/ui/*` (if bottom-sheet primitives are added)
- `src/components/calendar/__tests__/*`
- `e2e/mobile.spec.ts`

---

## Definition of Done

1. [ ] Calendar is usable on mobile (no horizontal overflow)
2. [ ] Touch targets are appropriately sized and responsive
3. [ ] Daily view is accessible as a bottom-sheet on mobile
4. [ ] Cross-device testing is documented and passing
5. [ ] CI passes from clean checkout

---
