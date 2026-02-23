# Sprint 16.2: Landing Walkthrough Narrative - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: Planned  
**Theme**: Ship a guided, value-first landing walkthrough using real product surfaces to improve activation and upgrade intent quality.

---

## Overview

Sprint 16.2 defines the narrative flow on landing that explains how Atlas works:
create -> remind -> complete -> review.

This sprint emphasizes clarity for first-time users: the walkthrough must feel
concrete, simple, and credible, using real product imagery rather than mockups.

**Core Goal**: users understand the product flow quickly and move to meaningful
next actions (sign up, first habit, first completion) with reduced confusion.

---

## Locked Decisions (Confirmed)

1. **Narrative structure**: guided walkthrough uses real flow sequence (`create -> remind -> complete -> review`).
2. **Asset policy**: use real product screenshots (desktop + mobile), not concept mockups.
3. **Copy policy**: language remains non-technical and value-first.
4. **CTA policy**: signed-out users get auth CTA; signed-in users get dashboard/action CTA.
5. **Design policy**: preserve Atlas minimalist black/white system with existing gold-only accent.
6. **Validation policy**: responsive behavior and E2E coverage are required.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Add guided `how Atlas works` walkthrough on landing
- [ ] Use real UI examples/screenshots (`create -> remind -> complete -> review`)
- [ ] Keep language non-technical and value-first
- [ ] Add responsive and E2E coverage for walkthrough content + CTA flow
- [ ] Preserve current navigation and auth-aware route behavior

### Excluded (this sprint)

- [ ] Full marketing site redesign outside walkthrough sections
- [ ] Video production pipeline
- [ ] Multilingual copy rollout
- [ ] Paid acquisition campaign infrastructure
- [ ] A/B experimentation framework

---

## Walkthrough Experience Policy (Locked)

### Storytelling Policy

- Each walkthrough step must answer:
  - what the user does
  - what the user gets
  - why it matters daily
- Copy must avoid implementation jargon and internal technical language.

### Asset Policy

- Screenshots must come from real current product screens.
- Include both desktop and mobile references where relevant.
- Assets must be optimized for web performance and accessibility.

### CTA Policy

- Signed-out landing users: primary CTA to sign-up/sign-in.
- Signed-in landing users: CTA to dashboard or relevant in-app surface.
- CTA copy must remain consistent with Sprint 16.1 conversion language.

---

## Phase 0: Narrative Contract + Asset Plan (Days 1-2)

### Tasks (6)

- [ ] **Task 0.1**: Define walkthrough information architecture and step sequence
- [ ] **Task 0.2**: Define screenshot capture standards (desktop/mobile, quality, naming)
- [ ] **Task 0.3**: Define copy style guide for value-first non-technical language
- [ ] **Task 0.4**: Define CTA mapping for signed-out/signed-in states
- [ ] **Task 0.5**: Define accessibility baseline (alt text, contrast, reading order)
- [ ] **Task 0.6**: Define responsive breakpoints and layout behavior contract

---

## Phase 1: Walkthrough Build (Days 2-4)

### Tasks (7)

- [ ] **Task 1.1**: Implement walkthrough section scaffold on landing
- [ ] **Task 1.2**: Add `create` step content + real screenshot pair
- [ ] **Task 1.3**: Add `remind` step content + real screenshot pair
- [ ] **Task 1.4**: Add `complete` step content + real screenshot pair
- [ ] **Task 1.5**: Add `review` step content + real screenshot pair
- [ ] **Task 1.6**: Wire CTA actions per auth state
- [ ] **Task 1.7**: Add reduced-motion friendly transitions and fallback behavior

---

## Phase 2: Responsive + Content Quality Hardening (Days 4-5)

### Tasks (6)

- [ ] **Task 2.1**: Optimize screenshots for loading performance
- [ ] **Task 2.2**: Verify mobile readability and touch-safe spacing
- [ ] **Task 2.3**: Verify desktop composition and visual hierarchy
- [ ] **Task 2.4**: Run copy consistency pass against Sprint 16.1 conversion language
- [ ] **Task 2.5**: Add accessibility QA pass (alt text, landmarks, heading order)
- [ ] **Task 2.6**: Add observability events for walkthrough section interactions

---

## Phase 3: Coverage + Launch Readiness (Days 5-7)

### Tasks (6)

- [ ] **Task 3.1**: Add component tests for walkthrough presence/order/content
- [ ] **Task 3.2**: Add E2E coverage for signed-out walkthrough + CTA path
- [ ] **Task 3.3**: Add E2E coverage for signed-in walkthrough + CTA path
- [ ] **Task 3.4**: Add responsive regression checks for key breakpoints
- [ ] **Task 3.5**: Run copy/legal consistency review
- [ ] **Task 3.6**: Finalize publish-ready walkthrough artifacts

---

## Environment and Config

Expected control surface:

- `ANALYTICS_ENABLED`
- `LANDING_WALKTHROUGH_ENABLED`
- `NEXTAUTH_URL`

Names are placeholders; final keys are locked during implementation.

---

## Implementation Guidelines

- Prioritize clarity and credibility over visual novelty.
- Use only real product imagery; no placeholder mockups in final render.
- Keep layout clean and consistent with existing Atlas design language.
- Maintain accessibility and reduced-motion support.
- Keep tests deterministic and auth-state aware.

---

## File Structure (Expected)

- `docs/sprints/sprint-16.2.md`
- `docs/test workflows/sprint-16.2-test-workflow.md`
- `src/app/landing/page.tsx`
- `src/components/marketing/*`
- `src/components/marketing/__tests__/*`
- `public/images/walkthrough/*` (or equivalent asset path)
- `e2e/marketing-homepage.spec.ts`

---

## Definition of Done

1. [ ] Landing includes a guided, clear walkthrough narrative.
2. [ ] Walkthrough uses real current-product screenshots.
3. [ ] Copy remains non-technical and value-first.
4. [ ] CTA behavior is correct for signed-out and signed-in users.
5. [ ] Responsive and accessibility quality is validated.
6. [ ] Component and E2E coverage passes for walkthrough and CTA flows.
7. [ ] CI quality gates pass for touched surfaces.

---

## References

- [Sprint 16.1 Plan](./sprint-16.1.md)
- [Sprint 16.3 Plan](./sprint-16.3.md)
- [Sprint 5.2 Plan](./sprint-5.2.md)
- [Roadmap](../roadmap.md)
