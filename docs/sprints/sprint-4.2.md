# Sprint 4.2: UX Refinement - Project Atlas

**Duration**: Week 10 (5-7 days)  
**Status**: Not Started  
**Theme**: Polish UX with resilient feedback, input flow, and accessibility.

---

## Overview

Sprint 4.2 focuses on refinement: tighten loading feedback, make completion
interactions feel immediate, and ensure the UI is keyboard- and
accessibility-friendly without changing core behavior.

**Core Goal**: users always understand what is happening, can recover from
errors, and can navigate the app without a mouse.

---

## Scope Decisions

### Included

- [ ] Loading states
- [ ] Optimistic updates
- [ ] Error handling & recovery
- [ ] Keyboard navigation
- [ ] Accessibility pass (ARIA, contrast)

### Excluded (this sprint)

- [ ] Visual redesign or new UI themes
- [ ] New product features outside UX refinement
- [ ] Offline or PWA capabilities
- [ ] Major restructuring of app routes

---

## Testing Policy

After each feature area, add tests:

- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/ux-refinement.spec.ts` (new or existing)
- **A11y smoke** -> Playwright or unit-level checks where appropriate

CI must remain green.

---

## Phase 1: Loading & Optimistic UX (Days 1-2)

### Tasks (2)

- [x] **Task 1.1**: Add loading states for calendar, habits, and completions
- [x] **Task 1.2**: Introduce optimistic updates for completion toggles

---

## UX Contract (Proposed)

Keep these behavioral rules consistent across UI and tests.

### Loading States

- Loading indicators should be subtle and minimal (no new colors).
- Avoid layout shifts; keep spacing stable while content loads.
- Use skeletons or lightweight placeholders where it improves clarity.

### Optimistic Updates

- Toggle completion updates immediately in the UI.
- If a request fails, roll back the change and show a toast.
- Never allow completion on future dates (keep existing guard).

### Error Handling & Recovery

- Use toasts for user-facing errors (no inline form errors).
- Provide a clear recovery path (retry or refresh) where possible.
- Avoid silent failures; the user should always know something went wrong.

### Keyboard Navigation & Accessibility

- All interactive elements must be reachable by keyboard.
- Ensure focus styles are visible and consistent.
- Validate ARIA labels and contrast, especially for calendar tiles and toggles.

---

---

## Phase 2: Error Handling & Recovery (Days 2-4)

### Tasks (1)

- [x] **Task 2.1**: Standardize API error responses and recovery UX

---

## Phase 3: Keyboard & Accessibility (Days 4-5)

### Tasks (2)

- [ ] **Task 3.1**: Add keyboard navigation across calendar and daily panel
- [ ] **Task 3.2**: Accessibility pass (ARIA, contrast, focus management)

---

## Implementation Guidelines

- Keep the black/white UI system; gold stays reserved for fully completed days.
- Avoid inline form errors; use toast notifications for user-facing errors.
- Respect `prefers-reduced-motion` for any new transitions.
- Preserve the core invariant: habits are weekday-based, not date-based.

---

## File Structure (Expected)

- `src/components/calendar/*`
- `src/components/habits/*`
- `src/components/ui/*` (loading/optimistic primitives if needed)
- `src/components/**/__tests__/*`
- `e2e/ux-refinement.spec.ts`

---

## Definition of Done

1. [ ] Loading states are consistent and do not shift layout
2. [ ] Optimistic updates feel immediate and roll back cleanly on failure
3. [ ] Error handling offers recovery paths with clear messaging
4. [ ] Keyboard navigation works across core flows
5. [ ] Accessibility pass validates ARIA and contrast
6. [ ] CI passes from clean checkout

---
