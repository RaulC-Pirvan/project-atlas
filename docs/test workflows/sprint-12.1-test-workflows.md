# Sprint 12.1 Test Workflows - Completion Grace Window Until 02:00

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 12.1 enforces completion-window rules for Free users:

- Today is allowed.
- Yesterday is allowed only before 02:00 local time.
- Future dates are blocked.
- Dates older than yesterday are blocked.

This document covers manual and automated validation for API enforcement, UI lock
states, and deterministic cutoff coverage.

---

## Prerequisites

1. **Database client is generated**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set** (local or staging):

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

4. **Test account exists**:
   - One verified Free user.

---

## Workflow 1: Future dates are disabled in UI [x]

1. Sign in and open `/calendar`.
2. Select a future date tile.

**Expected**:

- Daily habit toggles are disabled.
- Message is visible: `Future dates cannot be completed yet.`
- Guidance copy is visible: `You can complete today and yesterday until 2:00 AM local time.`

---

## Workflow 2: Older history dates are disabled in UI [x]

1. Sign in and open `/calendar`.
2. Select a date older than yesterday.

**Expected**:

- Daily habit toggles are disabled.
- Message is visible: `Past dates cannot be completed.`
- Guidance copy is visible: `You can complete today and yesterday until 2:00 AM local time.`

---

## Workflow 3: Yesterday cutoff message after 02:00 local time [x]

1. After 02:00 local time, open `/calendar`.
2. Select yesterday.

**Expected**:

- Daily habit toggles are disabled.
- Message is visible: `Yesterday can only be completed until 2:00 AM.`

---

## Workflow 4: Deterministic API cutoff behavior (01:59 allow, 02:00 block) [x]

Use the automated E2E test that injects test time via `x-atlas-test-now`:

```bash
npm run e2e -- e2e/daily-completion.spec.ts --project=chromium
```

**Expected**:

- Test `allows yesterday at 01:59 and blocks uncheck at 02:00` passes.
- API allows completion at `01:59`.
- API rejects completion toggle at `02:00` with `invalid_request`.

---

## Workflow 5: Guard regressions remain blocked (future + older history) [x]

Run the same deterministic E2E spec:

```bash
npm run e2e -- e2e/daily-completion.spec.ts --project=chromium
```

**Expected**:

- Test `keeps future-date guard and blocked-history guard with deterministic test time` passes.
- Future completion attempts return `invalid_request`.
- Older-history completion attempts return `invalid_request`.

---

## Workflow 6: Visual regression setup compatibility [x]

Run the visual suite:

```bash
npm run e2e -- e2e/calendar-visual.spec.ts --project=visual
```

**Expected**:

- Visual setup completions succeed with deterministic test-time override.
- Screenshot assertion passes.

---

## Automated Tests

### Unit / Service / Component

```bash
npm test -- src/lib/habits/__tests__/completionWindow.test.ts
npm test -- src/lib/api/habits/__tests__/completions.test.ts
npm test -- src/components/calendar/__tests__/DailyCompletionPanel.test.tsx
npm test -- src/app/api/completions/__tests__/route.test.ts
```

### Targeted E2E

```bash
npm run e2e -- e2e/daily-completion.spec.ts --project=chromium
npm run e2e -- e2e/calendar-visual.spec.ts --project=visual
```

### Full E2E

```bash
npm run e2e
```

---

## Success Criteria

Sprint 12.1 is complete when:

1. Completion-window rules are enforced consistently online and offline.
2. Future and blocked-history dates are disabled in UI.
3. Grace-window guidance copy is visible in daily completion surfaces.
4. Deterministic cutoff tests (`01:59` vs `02:00`) pass.
5. Visual regression test setup remains stable under grace-window rules.
6. Unit, component, API, and E2E tests pass.
7. CI passes from a clean checkout.

---

## References

- [Sprint 12.1 Plan](../sprints/sprint-12.1.md)
- [Completion Window Rules](../../src/lib/habits/completionWindow.ts)
- [Completions API Service](../../src/lib/api/habits/completions.ts)
- [Completions API Route](../../src/app/api/completions/route.ts)
- [Daily Completion Panel](../../src/components/calendar/DailyCompletionPanel.tsx)
- [Daily Completion E2E](../../e2e/daily-completion.spec.ts)
- [Calendar Visual E2E](../../e2e/calendar-visual.spec.ts)
- [AGENTS](../../AGENTS.md)
