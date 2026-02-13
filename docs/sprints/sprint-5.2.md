# Sprint 5.2: Marketing Homepage Expansion - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: In Progress  
**Theme**: Expand the landing page narrative to reflect Atlas as a complete habit platform.

---

## Overview

Sprint 5.2 expands the existing marketing homepage so visitors get a broader,
clearer view of the product: daily workflow, analytics, achievements, reminders,
offline reliability, grace-window rules, and Free vs Pro positioning.

**Core Goal**: improve product understanding and upgrade clarity while preserving
the existing minimalist visual theme.

---

## Scope Decisions

### Included

- [ ] Expand landing page narrative to cover full product breadth
- [ ] Add sections for:
  - Today + Calendar workflow
  - Insights (analytics)
  - Achievements + milestones
  - Reminders
  - Offline-first + sync indicators
  - Grace window rule (yesterday until 02:00)
- [ ] Add clear Free vs Pro comparison block (non-intrusive, value-led)
- [ ] Add Pro-focused callouts without degrading Free value messaging
- [ ] Keep visual theme consistent with existing minimalist black/white system
- [ ] Add/extend component tests for new marketing sections
- [ ] Add/extend E2E coverage for landing page content and CTA flows

### Excluded (this sprint)

- [ ] New product feature development outside marketing surfaces
- [ ] Pricing or payment flow implementation
- [ ] Store launch, mobile wrapper, or native push work

---

## Testing Policy

After each feature area, add tests:

- **Components** -> marketing sections and content rendering
- **E2E** -> homepage narrative, section visibility, and CTA navigation

CI must remain green.

---

## Phase 1: Narrative Expansion (Days 1-2)

### Tasks (2)

- [x] **Task 1.1**: Expand homepage story to cover full product breadth
- [x] **Task 1.2**: Add new feature sections (Today/Calendar, Insights, Achievements, Reminders, Offline-first, Grace window)

---

## Phase 2: Positioning & Messaging (Days 2-4)

### Tasks (2)

- [x] **Task 2.1**: Add a Free vs Pro comparison block with clear, non-intrusive framing
- [x] **Task 2.2**: Add Pro callouts that highlight value without degrading Free-tier messaging

---

## Phase 3: Visual Consistency & Coverage (Days 4-6)

### Tasks (3)

- [x] **Task 3.1**: Keep visual style aligned to existing black/white minimalist system
- [x] **Task 3.2**: Add/extend component tests for expanded marketing sections
- [x] **Task 3.3**: Add/extend E2E coverage for homepage content and CTA flows

---

## Implementation Guidelines

- Preserve the current landing-page visual language and spacing rhythm.
- Keep copy concise, specific, and product-truthful.
- Maintain the habit invariant in all messaging (weekday-based habits, completion per date).
- Present Pro as additional depth, not as a gate for core tracking utility.
- Avoid aggressive upgrade pressure; keep CTA tone value-led.

---

## File Structure (Expected)

- `src/app/page.tsx`
- `src/components/marketing/*`
- `src/components/marketing/__tests__/*`
- `e2e/marketing-homepage.spec.ts`
- `docs/sprints/sprint-5.2.md`

---

## Definition of Done

1. [ ] Landing page presents a broader, accurate product narrative
2. [ ] New sections cover key shipped functionality (workflow, insights, achievements, reminders, offline, grace window)
3. [ ] Free vs Pro comparison is clear and non-intrusive
4. [ ] Pro callouts are value-led and do not weaken Free-tier positioning
5. [ ] Visual style remains consistent with the existing homepage
6. [ ] Component and E2E tests cover the new sections and CTA paths
7. [ ] CI passes from a clean checkout

---
