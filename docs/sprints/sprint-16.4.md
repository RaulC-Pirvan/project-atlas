# Sprint 16.4: UI System Refresh (Theme + Mobile UX) - Project Atlas

**Duration**: TBD (7-10 days)  
**Status**: In Progress  
**Theme**: Establish a token-driven theme system and compact mobile UX profile before mobile/store launch, while preserving Atlas clarity and product invariants.

---

## Overview

Sprint 16.4 modernizes Atlas UI foundations before mobile/store launch.

This sprint is architecture-first: theme behavior must be centralized through
semantic tokens, accent personalization must stay bounded to approved presets,
and mobile layouts must be simplified for tighter screens without reducing core
functionality.

**Core Goal**: ship a consistent, accessible, and mobile-ready UI system that
supports user accent preference and refined dark theme ergonomics.

---

## Locked Decisions (Confirmed)

1. **Theme architecture**: semantic design tokens first; no feature-level hardcoded accent colors.
2. **Accent presets**: user-selectable preset list is fixed to `Gold`, `Green`, `Blue`, `Pink`, `Red` (default `Gold`).
3. **Accent scope**: completion/progress and accent affordances follow active preset; semantic state colors do not.
4. **State color policy**: `error`, `warning`, `success`, and `info` remain fixed and non-user-configurable.
5. **Dark theme policy**: shift from flat pure-black-heavy surfaces to tonal near-black layering (base + elevated surfaces).
6. **Mobile UX policy**: compact viewport uses simpler grouping and reduced nested floating cards.
7. **Desktop policy**: desktop can keep richer floating-card composition where it improves scanability.
8. **Quality gate policy**: accessibility contrast coverage and responsive regression coverage are mandatory.
9. **Domain policy**: no habit-domain invariant or completion-window behavior changes in this sprint.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Add semantic theme tokens for accent/surface/text/border states (no hardcoded feature-level accent colors)
- [ ] Add user-selectable accent presets: Gold, Green, Blue, Pink, Red (default: Gold)
- [ ] Persist accent preference and apply consistently across app shell and product surfaces
- [ ] Keep semantic state colors (`error`, `warning`, `success`, `info`) non-user-configurable
- [ ] Refine dark theme from flat pure black usage to tonal near-black layers (base + elevated surfaces)
- [ ] Define compact mobile layout rules: reduce nested cards, prioritize single-layer list/group patterns
- [ ] Refactor high-traffic mobile screens (Today, Calendar daily panel, Habits, Account) to follow compact rules
- [ ] Add accessibility gates for contrast across all accent presets and both themes
- [ ] Add responsive visual regression + E2E coverage for theme switching and mobile interaction flows

### Excluded (this sprint)

- [ ] Unbounded custom color picker (free-form HEX/RGB input)
- [ ] Typography system overhaul
- [ ] Brand identity rewrite or broad marketing visual redesign
- [ ] Core domain/business-logic changes (habits/completions/grace-window policy)
- [ ] Native iOS/Android UI implementation

---

## UI System Policy (Locked)

### Token Policy

- Accent, surfaces, text, and borders are consumed via semantic tokens.
- Components must not embed one-off accent hex values in feature modules.
- Completion/progress visuals resolve from semantic accent tokens.

### Accent Preset Policy

- Supported presets are fixed to five values in this sprint.
- Invalid/missing preference falls back to `Gold`.
- Preference persistence must survive reloads and route transitions.

### Semantic State Color Policy

- `error`, `warning`, `success`, `info` colors are invariant across accent presets.
- Validation/error affordances remain semantically recognizable regardless of user accent choice.

### Dark Theme Policy

- Dark surfaces use tonal layering with clear separation between base and elevated containers.
- Avoid pure-black dominance that collapses depth and harms readability.
- Maintain high text contrast and predictable hierarchy in both reduced and elevated surfaces.

### Mobile Compact Layout Policy

- Favor single-layer list/group compositions over stacked nested cards.
- Avoid scroll-inside-card patterns on compact viewport.
- Secondary actions should prefer bottom sheets/modals over deep embedded card sections.

---

## Phase 0: Theme Contract + Mobile Layout Rules (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define semantic token dictionary for accent/surface/text/border usage
- [x] **Task 0.2**: Define accent preset contract, fallback behavior, and persistence rules
- [x] **Task 0.3**: Define semantic state color invariants and exception rules
- [x] **Task 0.4**: Define dark theme tonal scale and elevation mapping
- [x] **Task 0.5**: Define compact mobile layout rules and anti-pattern list
- [x] **Task 0.6**: Define contrast and responsive regression acceptance thresholds

### Phase 0 Artifact (Completed 2026-02-27)

- `docs/ops/ui-system-phase-0-contract.md` (Tasks 0.1-0.6)

---

## Phase 1: Theme Infrastructure + Preset Runtime (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Implement semantic token plumbing and remove direct accent hex usage from key surfaces
- [x] **Task 1.2**: Add theme preset selector UI with five approved presets
- [x] **Task 1.3**: Persist user accent preference and ensure stable bootstrap behavior
- [x] **Task 1.4**: Apply preset-aware accent tokens across app shell and shared primitives
- [x] **Task 1.5**: Enforce fixed semantic state colors independent from preset selection
- [x] **Task 1.6**: Implement dark theme tonal near-black layering for base/elevated surfaces
- [x] **Task 1.7**: Add guardrails/tests for invalid preset values and fallback behavior

### Phase 1 Implementation Notes (Current)

- Added shared theme runtime helpers:
  - `src/lib/theme/theme.ts`
- Added accent preset selector + combined theme controls:
  - `src/components/ui/AccentPresetSelect.tsx`
  - `src/components/ui/ThemeControls.tsx`
- Added bootstrap-safe root initialization for theme + accent preset:
  - `src/app/layout.tsx`
- Expanded global token system and dark tonal layering:
  - `src/app/globals.css`
- Wired controls into authenticated and public shell headers:
  - `src/components/layout/AppShell.tsx`
  - `src/components/auth/AuthShell.tsx`
  - `src/components/admin/AdminShell.tsx`
  - `src/components/legal/LegalPageLayout.tsx`
  - `src/components/support/SupportCenter.tsx`
  - `src/components/pro/ProUpgradePage.tsx`
  - `src/components/marketing/MarketingHome.tsx`
- Updated key accent-driven UI surfaces and shared primitives to token-driven accent usage:
  - `src/components/calendar/CalendarMonth.tsx`
  - `src/components/insights/InsightsDashboard.tsx`
  - `src/components/achievements/AchievementsDashboard.tsx`
  - `src/components/achievements/AchievementToast.tsx`
  - `src/components/layout/AppSidebar.tsx`
  - `src/components/admin/AdminSidebar.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Input.tsx`
  - `src/components/ui/Notice.tsx`
  - `src/components/ui/Toast.tsx`
- Added/updated guardrail tests for preset fallback behavior and completion accent behavior:
  - `src/lib/theme/__tests__/theme.test.ts`
  - `src/components/ui/__tests__/AccentPresetSelect.test.tsx`
  - `src/components/calendar/__tests__/CalendarMonth.test.tsx`

---

## Phase 2: Mobile Viewport Refactor (Days 4-6)

### Tasks (6)

- [ ] **Task 2.1**: Refactor `/today` mobile composition to compact single-layer grouping
- [ ] **Task 2.2**: Refactor calendar daily panel mobile layout to reduce nested cards
- [ ] **Task 2.3**: Refactor `/habits` mobile interactions/layout to compact patterns
- [ ] **Task 2.4**: Refactor `/account` mobile settings surfaces to compact grouping
- [ ] **Task 2.5**: Validate mobile spacing, tap targets, and overflow safety across breakpoints
- [ ] **Task 2.6**: Preserve desktop readability and existing information hierarchy

---

## Phase 3: Accessibility + Regression Hardening (Days 6-8)

### Tasks (6)

- [ ] **Task 3.1**: Add automated contrast checks for all presets in light and dark themes
- [ ] **Task 3.2**: Add component tests for token usage and preset propagation
- [ ] **Task 3.3**: Add API/unit tests for preference persistence and fallback behavior
- [ ] **Task 3.4**: Add responsive visual regression for core surfaces and completion states
- [ ] **Task 3.5**: Add E2E flows for theme switching and compact mobile interaction paths
- [ ] **Task 3.6**: Run final CI hardening pass and publish verification notes

---

## Environment and Config

Expected control surface:

- `THEME_PRESET_DEFAULT`
- `THEME_PRESET_SELECTOR_ENABLED`
- `MOBILE_COMPACT_LAYOUT_ENABLED`
- `UI_CONTRAST_GATES_ENABLED`

Names are placeholders; final keys are locked during implementation.

---

## Implementation Guidelines

- Keep UI minimal and consistent with Atlas neutral foundation.
- Keep one active accent at a time; avoid multi-accent visual noise.
- Prefer shared primitives/tokens over one-off component overrides.
- Preserve completion-window/date behavior and other domain constraints.
- Keep tests deterministic and viewport-aware.

---

## File Structure (Expected)

- `docs/sprints/sprint-16.4.md`
- `docs/test workflows/sprint-16.4-test-workflow.md`
- `src/components/ui/*` (theme primitives and selector surfaces)
- `src/components/layout/*` (shell-level token application)
- `src/components/calendar/*` (daily panel and completion accents)
- `src/components/habits/*` (mobile compact refactor)
- `src/components/auth/AccountPanel.tsx`
- `src/app/today/page.tsx`
- `src/app/calendar/page.tsx`
- `src/app/habits/page.tsx`
- `src/app/account/page.tsx`
- `e2e/*` (theme/mobile regression coverage)

---

## Definition of Done

1. [ ] Semantic tokens are the single source for accent/surface/text/border states.
2. [ ] Accent presets (`Gold`, `Green`, `Blue`, `Pink`, `Red`) are selectable and persistent with safe fallback.
3. [ ] Semantic state colors remain fixed across all presets.
4. [ ] Dark theme uses tonal near-black layering with clear readability and hierarchy.
5. [ ] Today/Calendar/Habits/Account mobile surfaces follow compact layout rules.
6. [ ] Contrast gates pass for every preset in both light and dark themes.
7. [ ] Responsive visual regression and E2E coverage pass for theme + mobile flows.
8. [ ] CI quality gates pass for all touched surfaces.

---

## References

- [Sprint 16.3 Plan](./sprint-16.3.md)
- [Sprint 15.3 Plan](./sprint-15.3.md)
- [Sprint 16.4 Test Workflow](../test workflows/sprint-16.4-test-workflow.md)
- [Phase 0 Contract Artifact](../ops/ui-system-phase-0-contract.md)
- [Roadmap](../roadmap.md)
