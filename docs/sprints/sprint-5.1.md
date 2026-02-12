# Sprint 5.1: Marketing Homepage - Project Atlas

**Duration**: Week 11 (5-7 days)  
**Status**: In Progress  
**Theme**: Public-facing landing page with clear value and seamless auth-aware entry.

---

## Overview

Sprint 5.1 delivers the marketing homepage: a clear explanation of Project Atlas,
key benefits, and direct calls to action. Logged-in users should bypass the
marketing page and land directly on `/today`.

**Core Goal**: new users understand the product immediately, while existing
users reach their dashboard without friction.

---

## Scope Decisions

### Included

- [x] Define clear value prop and hero section
- [x] Explain core benefits (schedule-based habits, daily completion, streaks)
- [x] Add primary CTA (sign up / sign in)
- [x] Auth-aware redirect: logged-in users go to `/today`
- [x] Keep styling aligned with minimalist black/white system

### Excluded (this sprint)

- [ ] Pricing or subscription plan content
- [ ] Blog, FAQs, or long-form content
- [ ] New product features outside landing page
- [ ] Analytics or tracking setup

---

## Testing Policy

After each feature area, add tests:

- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> `e2e/marketing-homepage.spec.ts` (new or existing)

CI must remain green.

---

## Phase 1: Homepage Content & Layout (Days 1-3)

### Tasks (3)

- [x] **Task 1.1**: Build hero section with value prop + CTA
- [x] **Task 1.2**: Add benefits section that explains the habit model
- [x] **Task 1.3**: Ensure layout is responsive and readable across devices

---

## Phase 2: Auth-Aware Routing (Days 3-4)

### Tasks (1)

- [x] **Task 2.1**: Redirect authenticated users from `/` to `/today`

---

## Phase 3: Polish & Accessibility (Days 4-5)

### Tasks (2)

- [x] **Task 3.1**: Accessibility pass (headings, contrast, keyboard flow)
- [x] **Task 3.2**: Final UI polish within the black/white system

---

## Implementation Guidelines

- Keep the black/white UI system; gold stays reserved for completed days only.
- Copy should be concise, confidence-building, and product-specific.
- Avoid heavy decoration or gradients; rely on whitespace and typography.
- Preserve the core invariant: habits are weekday-based, not date-based.

---

## File Structure (Expected)

- `src/app/page.tsx` (marketing homepage)
- `src/components/marketing/*` (if new sections are extracted)
- `src/components/**/__tests__/*`
- `e2e/marketing-homepage.spec.ts`

---

## Definition of Done

1. [x] Homepage clearly communicates value and key benefits
2. [x] Primary CTA routes users to sign up or sign in
3. [x] Authenticated users are redirected to `/today`
4. [x] Accessibility checks pass for headings and focus flow
5. [ ] CI passes from clean checkout

---
