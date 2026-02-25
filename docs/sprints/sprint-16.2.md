# Sprint 16.2: Landing Walkthrough Narrative - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: In Progress  
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

- [x] **Task 0.1**: Define walkthrough information architecture and step sequence
- [x] **Task 0.2**: Define screenshot capture standards (desktop/mobile, quality, naming)
- [x] **Task 0.3**: Define copy style guide for value-first non-technical language
- [x] **Task 0.4**: Define CTA mapping for signed-out/signed-in states
- [x] **Task 0.5**: Define accessibility baseline (alt text, contrast, reading order)
- [x] **Task 0.6**: Define responsive breakpoints and layout behavior contract

### Phase 0 Implementation Notes (Current)

Phase 0 contract is documented in:

- `docs/ops/landing-walkthrough-phase-0-contract.md`

#### 0.1 Walkthrough IA + Step Sequence

- Canonical sequence is locked to `create -> remind -> complete -> review`.
- Landing walkthrough section will be rendered as an ordered narrative with one clear user outcome per step.
- Each step contract now includes:
  - action surface (where the user acts)
  - value outcome (what improves immediately)
  - daily relevance (why this matters in routine usage)

#### 0.2 Screenshot Capture Standards

- Asset source is locked to real Atlas product surfaces only.
- Capture standards now define viewport sizes, format/compression, naming convention, and source routes.
- Assets are versioned under a dedicated walkthrough path to prevent ad-hoc naming drift.

#### 0.3 Copy Style Guide (Value-First)

- Copy contract now enforces non-technical language and short, concrete outcomes.
- Step copy must always describe user action, user result, and daily impact.
- Internal implementation terms are explicitly excluded from user-facing walkthrough copy.

#### 0.4 CTA Mapping (Auth-Aware)

- Signed-out walkthrough CTAs map to auth entry routes (`/sign-up`, `/sign-in`).
- Signed-in walkthrough CTAs map to in-app action routes (`/today`, `/calendar`) without auth detours.
- CTA wording is aligned with existing Sprint 16.1 conversion language conventions.

#### 0.5 Accessibility Baseline

- Alt text policy, heading order, semantic sequence, keyboard focus behavior, and contrast targets are now defined.
- Walkthrough sequence must remain meaningful in both visual and assistive-tech reading order.
- Reduced-motion fallback behavior is included as baseline requirement.

#### 0.6 Responsive Contract

- Mobile, tablet, and desktop breakpoint behavior is now defined for walkthrough composition.
- Contract includes touch-target minimums, spacing/line-length limits, and screenshot framing expectations.
- Desktop supports side-by-side storytelling; mobile preserves a single-column reading-first flow.

---

## Phase 1: Walkthrough Build (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Implement walkthrough section scaffold on landing
- [x] **Task 1.2**: Add `create` step content + real screenshot pair
- [x] **Task 1.3**: Add `remind` step content + real screenshot pair
- [x] **Task 1.4**: Add `complete` step content + real screenshot pair
- [x] **Task 1.5**: Add `review` step content + real screenshot pair
- [x] **Task 1.6**: Wire CTA actions per auth state
- [x] **Task 1.7**: Add reduced-motion friendly transitions and fallback behavior

### Phase 1 Implementation Notes (Current)

#### 1.1 Walkthrough scaffold

- Landing now includes a dedicated `How Atlas works` section rendered as an ordered 4-step narrative.
- Section structure follows the locked sequence and semantic hierarchy:
  - `h2` section heading
  - `ol` sequence
  - per-step `h3` titles

#### 1.2-1.5 Step content + real screenshot pairs

- Added canonical steps:
  - `create`
  - `remind`
  - `complete`
  - `review`
- Each step now includes:
  - value-first heading and summary
  - explicit `Do / Get / Why` copy contract
  - desktop and mobile real-product screenshot pair
- Asset set added under `public/images/walkthrough/`:
  - `walkthrough-create-habits-desktop-v1.png`
  - `walkthrough-create-habits-mobile-v1.png`
  - `walkthrough-remind-account-desktop-v1.png`
  - `walkthrough-remind-account-mobile-v1.png`
  - `walkthrough-complete-today-desktop-v1.png`
  - `walkthrough-complete-today-mobile-v1.png`
  - `walkthrough-review-calendar-desktop-v1.png`
  - `walkthrough-review-calendar-mobile-v1.png`

#### 1.6 Auth-aware CTA wiring

- Walkthrough CTA block now branches by auth state:
  - signed-out: primary `/sign-up` (`Start free`), secondary `/sign-in` (`Sign in`)
  - signed-in: primary `/today` (`Go to dashboard`), secondary `/calendar` (`Open calendar`)
- Existing hero/footer CTA behavior remains unchanged.

#### 1.7 Reduced-motion support

- Walkthrough section and step cards include motion-safe reveal classes.
- `motion-reduce` fallbacks preserve readability without movement.
- Existing focus-ring and keyboard CTA accessibility behavior is preserved.

---

## Phase 2: Responsive + Content Quality Hardening (Days 4-5)

### Tasks (6)

- [x] **Task 2.1**: Optimize screenshots for loading performance
- [x] **Task 2.2**: Verify mobile readability and touch-safe spacing
- [x] **Task 2.3**: Verify desktop composition and visual hierarchy
- [x] **Task 2.4**: Run copy consistency pass against Sprint 16.1 conversion language
- [x] **Task 2.5**: Add accessibility QA pass (alt text, landmarks, heading order)
- [x] **Task 2.6**: Add observability events for walkthrough section interactions

### Phase 2 Implementation Notes (Current)

#### 2.1 Screenshot loading performance

- Walkthrough screenshot rendering was tuned with explicit `sizes`, `loading='lazy'`, and `decoding='async'` on `next/image`.
- Desktop screenshots are hidden under `sm` and use `sizes` fallback `0px` on mobile widths to avoid unnecessary mobile fetch pressure.
- Asset files remain in `public/images/walkthrough/*` and are now consumed with responsive image policy aligned to the Phase 0 contract.

#### 2.2 Mobile readability + touch-safe spacing

- Added dedicated mobile E2E assertions for:
  - walkthrough section visibility
  - CTA touch target heights (`>=44px`)
  - no horizontal viewport overflow
- Mobile walkthrough flow remains single-column and reading-first.

#### 2.3 Desktop composition + hierarchy

- Added desktop E2E composition assertion that validates side-by-side walkthrough media framing.
- Desktop layout preserves clear story hierarchy: heading -> step context -> paired visuals.

#### 2.4 Copy consistency with Sprint 16.1

- Walkthrough CTA labels remain aligned with established conversion language:
  - signed-out: `Start free`, `Sign in`
  - signed-in: `Go to dashboard`, `Open calendar`
- Copy remains non-coercive and value-first, consistent with Sprint 16.1 trust framing.

#### 2.5 Accessibility QA baseline

- Added component coverage for heading hierarchy (`single h1`, walkthrough `h2`, step `h3`) and non-empty image alternative text.
- Walkthrough section includes stable test ids to support deterministic semantic validation.

#### 2.6 Observability events for interactions

- Added landing walkthrough analytics contract:
  - `landing_walkthrough_view`
  - `landing_walkthrough_cta_click`
- Added source/target parsing with guardrails, auth-state-safe target fallback, and duplicate suppression.
- Added tracked CTA redirect route:
  - `/landing/walkthrough/track`
- Landing page now emits walkthrough view analytics on render; tracked CTA route emits click analytics before redirect.

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
- [Phase 0 Contract Artifact](../ops/landing-walkthrough-phase-0-contract.md)
- [Roadmap](../roadmap.md)
