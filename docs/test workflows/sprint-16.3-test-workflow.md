# Sprint 16.3 Test Workflow - Product Analytics Baseline

**Status**: Completed  
**Last Updated**: February 26, 2026

---

## Overview

Sprint 16.3 validates analytics baseline reliability for conversion reporting:

- Funnel event instrumentation across landing, auth, activation, and Pro conversion
- Admin conversion dashboard visibility and KPI calculations
- Privacy-safe analytics payload behavior and guardrail handling
- Weekly reporting readiness with baseline comparison and export summary

---

## Prerequisites

1. Required docs and implementation surfaces:
   - `docs/sprints/sprint-16.3.md`
   - `src/lib/analytics/funnel.ts`
   - `src/lib/admin/conversion.ts`
   - `src/app/api/admin/conversion/route.ts`
   - `src/components/admin/AdminConversionPanel.tsx`

2. Test environment setup:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ANALYTICS_ENABLED=true
   ANALYTICS_FUNNEL_ENABLED=true
   BILLING_CONVERSION_TRACKING_ENABLED=true
   ```

3. Test sessions:
   - Signed-out user session
   - Verified user session
   - Verified admin session (2FA-capable for admin route access)

4. App running:

   ```bash
   npm run dev
   ```

---

## Manual QA Checklist

### Workflow 1: Landing/auth funnel signals [x]

1. Open `/landing`.
2. Trigger signed-out auth CTAs (`Create your account`, `Sign in`).

**Expected**:

- `landing_page_view` and `landing_auth_cta_click` analytics events are emitted.
- Invalid source/target inputs fall back safely in tracked auth CTA route.

### Workflow 2: Auth and activation milestones [x]

1. Complete sign-up and sign-in flow.
2. Create first habit.
3. Record first completion.

**Expected**:

- `auth_sign_up_completed` and `auth_sign_in_completed` emit on successful paths.
- `habit_first_created` and `habit_first_completion_recorded` emit once on first milestones.

### Workflow 3: Admin conversion dashboard visibility [x]

1. Open `/admin`.
2. Navigate to `Conversion` section.

**Expected**:

- KPI cards render for all three north-star metrics.
- Transition table and event totals sections are visible.
- Export summary textarea contains structured CSV-like output.

### Workflow 4: Range/baseline controls and fallback behavior [x]

1. Apply custom start/end dates.
2. Toggle baseline comparison off/on.
3. Use an empty range (no analytics activity).

**Expected**:

- API accepts valid ranges and rejects invalid ranges.
- Baseline comparison updates KPI baseline fields.
- Empty/partial coverage surfaces explicit fallback notices.

### Workflow 5: Privacy-safe payload and redaction behavior [x]

1. Inspect analytics logs and admin activity metadata in dev/test.
2. Verify metadata keys are allow-listed.

**Expected**:

- Allowed keys (`event`, `surface`, `source`, `target`, etc.) persist.
- Raw PII/free-form payload keys are not persisted in admin log metadata.

---

## Automated Tests

### Unit / Contract

```bash
npm test -- src/lib/analytics/__tests__/funnel.test.ts src/lib/admin/__tests__/conversion.test.ts src/lib/observability/__tests__/adminLogStore.test.ts
```

### API / Integration

```bash
npm test -- src/app/api/admin/__tests__/conversion.route.test.ts src/app/landing/auth/track/__tests__/route.test.ts src/app/api/auth/__tests__/sign-in.route.test.ts src/app/api/auth/__tests__/sign-in-two-factor-verify.route.test.ts src/app/api/completions/__tests__/route.test.ts
```

### Admin Component

```bash
npm test -- src/components/admin/__tests__/AdminPanels.test.tsx src/components/admin/__tests__/AdminShellSidebar.test.tsx
```

### E2E Smoke

```bash
npm run e2e -- e2e/admin.spec.ts --project=chromium
```

---

## CI Stability Pass

```bash
npm run lint
npm run typecheck
npm test
npm run e2e -- e2e/admin.spec.ts --project=chromium
```

For full gate:

```bash
npm run ci:full
```

---

## Success Criteria

Sprint 16.3 is considered verified when:

1. Funnel events are emitted with validated contracts and dedupe guardrails.
2. Admin conversion dashboard renders KPI cards and core transition/event metrics.
3. Date-range and baseline controls are functional and validated by API tests.
4. Privacy-safe metadata handling is covered by tests and review artifact.
5. Fallback states are explicit for incomplete/partial data windows.
6. Targeted unit/API/component tests and admin E2E smoke pass.
7. Lint/typecheck pass for touched surfaces.

---

## References

- [Sprint 16.3 Plan](../sprints/sprint-16.3.md)
- [Roadmap](../roadmap.md)
