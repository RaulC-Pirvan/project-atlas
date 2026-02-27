# Sprint 16.4 Test Workflow - UI System Refresh (Theme + Mobile UX)

**Status**: Completed  
**Last Updated**: February 27, 2026

---

## Overview

Sprint 16.4 validates UI-system quality and mobile readiness before store work:

- Semantic token adoption for accent/surface/text/border states
- User-selectable accent presets with persistence and safe fallback
- Dark theme tonal near-black layering (base + elevated surfaces)
- Compact mobile layout behavior for high-traffic authenticated screens
- Accessibility contrast compliance and responsive regression stability

This workflow verifies theme consistency, readability, and compact mobile
usability without domain behavior regressions.

---

## Prerequisites

1. Required docs and implementation surfaces:
   - `docs/sprints/sprint-16.4.md`
   - `docs/ops/ui-system-phase-0-contract.md`
   - `docs/roadmap.md`
   - updated shared UI primitives/theme token surfaces

2. Test environment setup:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ```

3. Test sessions:
   - Signed-out session
   - Verified signed-in user session
   - Optional admin session for dashboard regression checks

4. App running:

   ```bash
   npm run dev
   ```

---

## Manual QA Checklist

### Workflow 1: Accent preset selection and persistence [x]

1. Open `/account`, find the `Theme and accent` section, and select each preset (`Gold`, `Green`, `Blue`, `Pink`, `Red`).
2. Reload and navigate across core routes.

**Expected**:

- Active preset updates accent affordances consistently.
- Selected preset persists after reload/navigation.
- Invalid stored value safely falls back to `Gold`.
- Accent preset selector is only available on `/account`.

### Workflow 2: Accent propagation on completion/progress surfaces [x]

1. Visit `/today` and `/calendar`.
2. Complete/uncomplete habits and inspect completion progress UI.

**Expected**:

- Completion/progress visuals reflect active preset.
- No hardcoded legacy accent color remains on updated surfaces.

### Workflow 3: Semantic state colors remain invariant [x]

1. Trigger validation and error states in representative forms.
2. Repeat across multiple accent presets.

**Expected**:

- `error`, `warning`, `success`, `info` visuals remain semantic and unchanged by preset selection.
- State meanings stay recognizable across light/dark themes.

### Workflow 4: Dark theme tonal layering quality [x]

1. Switch to dark mode.
2. Inspect base backgrounds and elevated surfaces on major screens.

**Expected**:

- Dark surfaces show tonal separation (base vs elevated) instead of flat black blocks.
- Text/readability hierarchy remains clear and stable.

### Workflow 5: Mobile compact layout - Today + Calendar daily panel [x]

1. Use mobile viewport (`390x844` recommended).
2. Validate `/today` and calendar daily panel interactions.

**Expected**:

- Nested floating card density is reduced.
- Grouping is clear with compact list-oriented composition.
- No horizontal overflow or clipped actions.

### Workflow 6: Mobile compact layout - Habits + Account [x]

1. Use mobile viewport on `/habits` and `/account`.
2. Navigate editing and settings actions.

**Expected**:

- Layout remains compact and scannable on tight screens.
- Touch targets remain usable and actions are discoverable.

### Workflow 7: Accessibility contrast matrix [x]

1. Validate contrast on each preset in light and dark themes.
2. Include representative text, icon, and UI boundary states.

**Expected**:

- Text contrast meets WCAG minimum expectations.
- Non-text UI elements maintain distinguishable contrast.

### Workflow 8: Desktop regression guard [x]

1. Re-check key desktop routes after mobile-focused changes.

**Expected**:

- Desktop hierarchy and scanability remain strong.
- No major spacing/visual hierarchy regressions are introduced.

---

## Automated Tests

### Unit / Component (targeted)

```bash
npm test -- src/lib/theme/__tests__/theme.test.ts src/lib/theme/__tests__/contrast.test.ts src/lib/theme/__tests__/globals-css-contract.test.ts src/components/ui/__tests__/ThemeToggle.test.tsx src/components/ui/__tests__/AccentPresetSelect.test.tsx src/components/ui/__tests__/ThemeControls.test.tsx src/components/ui/__tests__/themeTokenUsage.test.ts src/components/calendar/__tests__/CalendarMonth.test.tsx src/components/calendar/__tests__/DailyCompletionPanel.test.tsx src/components/habits/__tests__/HabitForm.test.tsx src/components/auth/__tests__/AccountPanel.test.tsx
```

### Domain / Contract (theme preference and guardrails)

```bash
npm test -- src/lib/**/__tests__
```

### E2E / Visual (targeted)

```bash
npx playwright test e2e/theme-mobile.spec.ts --project=chromium --project=firefox
npx playwright test e2e/ui-system-visual.spec.ts e2e/calendar-visual.spec.ts --project=visual
npx playwright test e2e/daily-completion.spec.ts e2e/habits.spec.ts --project=chromium
```

---

## CI Stability Pass

```bash
npm run lint
npm run typecheck
npm test
npx playwright test e2e/theme-mobile.spec.ts --project=chromium --project=firefox
npx playwright test e2e/ui-system-visual.spec.ts e2e/calendar-visual.spec.ts --project=visual
```

For full gate:

```bash
npm run ci
```

### Final Verification Notes (2026-02-27)

- Contrast gates pass for all 5 accent presets in light and dark themes.
- Token/fallback propagation tests pass for theme bootstrap helpers and UI controls.
- Mobile compact interaction flow passes in Chromium and Firefox.
- Visual baselines pass for:
  - `calendar-visual.spec.ts`
  - `ui-system-visual.spec.ts` (desktop calendar + mobile daily sheet + mobile habits)
- CI hardening gate passed:
  - `npm run ci`

---

## Success Criteria

Sprint 16.4 is considered verified when:

1. Accent presets are selectable, persistent, and fallback-safe.
2. Semantic tokens drive accent/surface/text/border styling consistently.
3. Semantic state colors remain fixed and unaffected by user accent choice.
4. Dark theme tonal layering improves readability and depth.
5. Mobile compact layouts are validated for Today, Calendar daily panel, Habits, and Account.
6. Contrast checks pass across all presets in light and dark themes.
7. Targeted component/unit/E2E and visual checks pass.
8. Lint/typecheck and CI quality gates pass.

---

## References

- [Sprint 16.4 Plan](../sprints/sprint-16.4.md)
- [Phase 0 Contract Artifact](../ops/ui-system-phase-0-contract.md)
- [Sprint 16.3 Plan](../sprints/sprint-16.3.md)
- [Roadmap](../roadmap.md)
