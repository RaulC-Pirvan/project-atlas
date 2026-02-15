# Sprint 5.2 Test Workflows - Marketing Homepage Expansion

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 5.2 expands the public marketing homepage to represent Atlas as a full
habit platform. This document covers validation for narrative breadth, Free vs
Pro positioning, value-led Pro messaging, and CTA behavior.

**Key Additions Implemented**:

- Expanded homepage narrative across workflow, insights, achievements, reminders, offline sync, and grace-window policy
- Free vs Pro comparison block with non-intrusive framing
- Value-led Pro callouts that preserve Free-tier utility messaging
- Additional CTA coverage for sign-up, sign-in, and Pro entry path
- Canonical marketing route at `/landing`, with `/` acting as auth-aware router
- Two-way navigation between app and marketing (`Home` in desktop sidebar / mobile More menu, `Go to dashboard` on landing for signed-in users)

---

## Prerequisites

1. **Database client is generated**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Test accounts**:
   - One signed-out browser session
   - One verified signed-in user for redirect checks

---

## Workflow 1: Signed-out narrative coverage renders [x]

1. Sign out (or open a private window).
2. Navigate to `/landing`.
3. Verify these sections are visible:
   - `Today + Calendar workflow`
   - `Insights (analytics)`
   - `Achievements + milestones`
   - `Reminders`
   - `Works even when your signal drops`
   - `Late-night grace window (until 02:00)`

**Expected**: All section headings and supporting copy render without requiring authentication.

---

## Workflow 2: Signed-out root route goes to canonical landing [x]

1. Sign out (or open a private window).
2. Navigate to `/`.

**Expected**: You are redirected to `/landing`.

---

## Workflow 3: Free vs Pro comparison framing is clear [x]

1. On `/landing`, scroll to `Free vs Pro at a glance`.
2. Verify table headers: `Feature area`, `Free`, `Pro`.
3. Verify core tracking rows show Free as fully usable (for example core tracking, daily check-ins + monthly view, streaks + late-night grace window, works offline).
4. Verify Pro rows are additive (insights depth, expanded achievements, smarter reminders).

**Expected**: Messaging is value-led and non-aggressive, with Free clearly complete for core tracking.

---

## Workflow 4: Pro callouts preserve Free value [x]

1. On `/landing`, scroll to `Pro adds depth when you want it`.
2. Confirm callout cards:
   - `Advanced insights depth`
   - `Expanded achievements catalogue`
   - `Smarter reminder intelligence`
3. Confirm baseline messaging is present:
   - `Core tracking remains complete in Free...`
   - `Free always includes the complete daily tracking workflow...`

**Expected**: Pro is presented as optional depth, not a gate for core habits/completions.

---

## Workflow 5: Marketing CTA navigation paths [x]

1. On `/landing`, click `Create your account`.
2. Go back and click `Sign in`.
3. Go back and click `See Atlas Pro`.

**Expected**:

- `Create your account` routes to `/sign-up`
- `Sign in` routes to `/sign-in`
- `See Atlas Pro` routes signed-out users to `/sign-in` (Pro page is auth-protected)

---

## Workflow 6: Signed-in root redirect remains correct [x]

1. Sign in as a verified user.
2. Navigate to `/`.

**Expected**: User is redirected to `/today`.

---

## Workflow 7: Signed-in users can still view marketing page [x]

1. Sign in as a verified user.
2. Navigate to `/landing`.

**Expected**: Landing page content is visible and URL stays on `/landing`.

---

## Workflow 8: Two-way navigation between app and landing [x]

1. Sign in as a verified user and open any authenticated page (for example `/today`).
2. On desktop, click `Home` in the left sidebar.
3. On mobile, open `More` in the bottom bar and tap `Home`.
4. On `/landing`, click `Go to dashboard`.

**Expected**: Home routes to `/landing`, and `Go to dashboard` routes back to `/today`.

---

## Workflow 9: Responsive and visual consistency pass [x]

1. Check `/landing` on mobile width (<= 390px) and desktop width (>= 1280px).
2. Verify no horizontal overflow from the Free/Pro table.
3. Verify visual language remains black/white minimalist with consistent borders, spacing, and typography.

**Expected**: Layout remains clean and consistent with existing marketing style on both breakpoints.

---

## Automated Tests

### Component

```bash
npm test -- src/components/marketing/__tests__/MarketingHome.test.tsx
```

### E2E

```bash
npm run e2e -- e2e/marketing-homepage.spec.ts
```

If `localhost:3000` is already in use by a running dev server, run:

```powershell
$env:PLAYWRIGHT_REUSE_SERVER='true'; npm run e2e -- e2e/marketing-homepage.spec.ts
```

### Type Safety

```bash
npm run typecheck
```

### Optional Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: `See Atlas Pro` does not open `/pro` when signed out

**Symptoms**: Clicking Pro CTA lands on `/sign-in`.

**Expected Behavior**: `/pro` is auth-protected; signed-out users are redirected to `/sign-in`.

---

### Issue: Playwright fails due to port 3000 already in use

**Symptoms**: Playwright exits with webServer port conflict.

**Fixes**:

- Reuse existing server:

  ```powershell
  $env:PLAYWRIGHT_REUSE_SERVER='true'; npm run e2e -- e2e/marketing-homepage.spec.ts
  ```

- Or stop the existing process on port 3000 and rerun.

---

## Success Criteria

Sprint 5.2 verification is complete when:

1. Expanded marketing narrative sections render for signed-out visitors.
2. Free vs Pro block is clear, accurate, and non-intrusive.
3. Pro callouts are additive and do not weaken Free-tier positioning.
4. CTA paths behave correctly for signed-out and signed-in states.
5. Component tests, E2E tests, and typecheck pass.

---

## References

- [Sprint 5.2 Plan](../sprints/sprint-5.2.md)
- [Root Router](../../src/app/page.tsx)
- [Canonical Landing Route](../../src/app/landing/page.tsx)
- [Marketing Layout](../../src/components/marketing/MarketingHome.tsx)
- [Marketing Component Test](../../src/components/marketing/__tests__/MarketingHome.test.tsx)
- [Marketing E2E](../../e2e/marketing-homepage.spec.ts)
- [AGENTS](../../AGENTS.md)
