# Sprint 16.3 Test Workflow - Product Analytics Baseline

**Status**: Planned  
**Last Updated**: February 2026

---

## Overview

Sprint 16.3 validates baseline analytics reliability for conversion decisions:

- Funnel instrumentation from landing to Pro activation
- Client/server event ownership boundaries
- KPI formula correctness
- Admin conversion dashboard usability
- Privacy-safe event handling defaults

This workflow verifies metric trustworthiness and operational readiness.

---

## Prerequisites

1. Required docs and surfaces:
   - `docs/sprints/sprint-16.3.md`
   - analytics contract and KPI helper locations (`src/lib/analytics/*`)
   - admin conversion dashboard surface (target path in admin)

2. Environment configuration:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ANALYTICS_ENABLED=true
   ANALYTICS_PROVIDER=dev
   ANALYTICS_EVENT_SCHEMA_VERSION=v1
   ```

3. Test users and states:
   - Signed-out user journey
   - Newly signed-up user
   - User with first habit + first completion
   - User with successful Pro upgrade (test mode)
   - Admin user for dashboard checks

4. App running:

   ```bash
   npm run dev
   ```

---

## Manual QA Checklist

### Workflow 1: Funnel coverage end-to-end [ ]

1. Execute journey: landing -> sign-up -> first habit -> first completion -> upgrade.
2. Inspect emitted events.

**Expected**:

- Each funnel milestone emits expected event.
- Event ordering and timestamps are coherent.

### Workflow 2: Client/server ownership boundaries [ ]

1. Compare client interaction events and server truth events.

**Expected**:

- Client events represent intent/interactions only.
- Server events represent checkout/entitlement truth.

### Workflow 3: KPI formula validation [ ]

1. Verify dashboard KPI values against raw event samples.

**Expected**:

- KPI calculations match documented formulas.
- No denominator/edge-case errors under low traffic data.

### Workflow 4: Dashboard readability and utility [ ]

1. Open admin conversion dashboard.
2. Review core KPI cards and fallback states.

**Expected**:

- Dashboard clearly communicates funnel health.
- Empty/partial data states are understandable.

### Workflow 5: Privacy-safe payload behavior [ ]

1. Inspect analytics payloads/logging outputs.

**Expected**:

- No raw sensitive PII leaks to analytics events.
- Payload fields follow approved privacy contract.

### Workflow 6: Event validation and dedupe guardrails [ ]

1. Trigger duplicate or malformed event conditions.

**Expected**:

- Invalid events are rejected/sanitized safely.
- Duplicate events do not distort KPI outputs.

### Workflow 7: Weekly review readiness [ ]

1. Run one dry-run KPI review using dashboard output.

**Expected**:

- Owners can explain movement in each north-star KPI.
- Review notes template is usable for recurring cadence.

---

## Automated Tests

### Unit / Service

```bash
npm test -- src/lib/analytics/__tests__
```

### API / Integration

```bash
npm test -- src/app/api/admin/__tests__
```

### E2E (targeted)

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

1. Funnel event coverage is complete from landing through upgrade.
2. Client/server ownership split is reflected in emitted events.
3. KPI formulas are correct and reproducible.
4. Admin dashboard provides usable conversion visibility.
5. Privacy-safe defaults are enforced and validated.
6. Unit/API/E2E checks pass for analytics baseline surfaces.
7. Weekly KPI review cadence can be executed with current artifacts.

---

## References

- [Sprint 16.3 Plan](../sprints/sprint-16.3.md)
- [Sprint 16.1 Plan](../sprints/sprint-16.1.md)
- [Sprint 16.2 Plan](../sprints/sprint-16.2.md)
- [Roadmap](../roadmap.md)
