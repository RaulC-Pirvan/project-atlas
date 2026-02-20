# Sprint 14.2 Test Workflow - Trust & Policy Surfaces

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 14.2 adds and hardens:

- Public legal pages: `/legal/privacy`, `/legal/terms`, `/legal/refunds`, `/legal/changes`
- Shared legal layout with policy metadata (`Version`, `Effective date`, `Last updated`)
- Policy content for privacy, terms, refunds, and support expectations
- Cross-surface legal/support discoverability on landing and account
- Governance content on `/legal/changes` (change log, update procedure, release-note fields)
- Publish blockers and production build enforcement hook for unresolved legal placeholders

---

## Prerequisites

1. Set required env vars in `.env`:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ENFORCE_LEGAL_PUBLISH_READY=false
   ```

2. Prepare app:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   npm run dev
   ```

3. Test accounts:
   - One verified regular user
   - One verified admin user (optional for broader shell checks)

---

## Manual QA Checklist

### Workflow 1: Public legal route access [x]

1. While signed out, open:
   - `/legal/privacy`
   - `/legal/terms`
   - `/legal/refunds`
   - `/legal/changes`

**Expected**:

- No redirect to `/sign-in`.
- Each page renders its title.
- Metadata block is visible on every page:
  - `Version`
  - `Effective date`
  - `Last updated`

### Workflow 2: Privacy policy content correctness [x]

1. Open `/legal/privacy`.

**Expected**:

- Includes account deletion hard-delete wording (irreversible, non-restorable).
- Includes support response expectation wording (target first response in 2 business days).
- Includes "how to get help faster" guidance.
- Includes children/age policy note (under 16 not directed; underage removal clause).

### Workflow 3: Terms policy locked clauses [x]

1. Open `/legal/terms`.

**Expected**:

- Romania governing law clause is present.
- Consumer carve-out clauses are present:
  - Mandatory protections of country of residence remain applicable.
  - Nothing limits mandatory consumer rights.
- Age eligibility clause is present (`16+`) with underage-removal language.
- Hard-delete account behavior language aligns with actual backend behavior.

### Workflow 4: Refund policy locked clauses [x]

1. Open `/legal/refunds`.

**Expected**:

- 14-day goodwill refund for direct web purchases is present.
- Apple App Store carve-out is present.
- Google Play carve-out is present.
- Support guidance for billing requests is present.

### Workflow 5: `/legal/changes` governance coverage [x]

1. Open `/legal/changes`.

**Expected**:

- Change log has dated, short-form entries.
- Baseline publication entries exist for initial launch.
- Procedure note appears: `Draft -> review -> legal sign-off -> publish`.
- Release-note template fields appear:
  - `Approver`
  - `Date`
  - `Policy version`
- Pre-publish placeholder guard checklist is visible.
- Publish status displays `Blocked` while placeholders remain.

### Workflow 6: Landing footer discoverability [x]

1. Open `/landing` signed out.
2. Scroll to footer legal/support area.
3. Click:
   - `Privacy policy`
   - `Terms of service`
   - `Refund policy`
   - `Support center`

**Expected**:

- Links route to correct pages.
- Labels are explicit and accessibility-friendly.

### Workflow 7: Pro page remains focused (no legal/support block) [x]

1. Sign in and open `/pro`.
2. Inspect the Pro card content.

**Expected**:

- No dedicated `Legal and support` block is shown on `/pro`.
- Pro page remains focused on upgrade/restore actions.
- Support remains discoverable from global app navigation (sidebar/topbar).

### Workflow 8: Account page legal/support section [x]

1. Sign in and open `/account`.

**Expected**:

- `Legal and support` section is visible.
- Links for `Privacy policy`, `Terms of service`, `Refund policy`, and `Support center` are visible.
- "Open the Support Center" guidance link is visible.

### Workflow 9: Sidebar support + legal navigation [x]

1. Sign in and inspect desktop sidebar.
2. On mobile viewport, open `More`.

**Expected**:

- Sidebar contains `Support` and `Legal` routes.
- `Support` routes to `/support#contact-form` (contact form section).
- `Legal` routes to `/legal/changes` (legal/trust hub).
- Sidebar does not add legal page links (`Privacy policy`, `Terms of service`, `Refund policy`).

### Workflow 10: Mobile and desktop parity [x]

1. Repeat Workflows 6-8 on desktop and mobile viewport.

**Expected**:

- Legal/support discoverability is available on both form factors.
- Link labels remain explicit and consistent.

### Workflow 11: Production guard behavior (placeholder enforcement) [x]

1. Ensure placeholders are still unresolved (default sprint state).
2. Run a production build with enforcement on:

   ```powershell
   $env:NODE_ENV="production"
   $env:ENFORCE_LEGAL_PUBLISH_READY="true"
   npm run build
   ```

**Expected**:

- Build fails with legal publish blocker error due unresolved placeholders.

3. Reset for normal local usage:

   ```powershell
   $env:ENFORCE_LEGAL_PUBLISH_READY="false"
   ```

---

## Automated Tests

### Route / Component / Policy Tests

```bash
npm test -- src/app/legal/__tests__/pages.test.tsx
npm test -- src/app/legal/__tests__/routes-metadata.test.tsx
npm test -- src/components/legal/__tests__/LegalPageLayout.test.tsx
npm test -- src/lib/legal/__tests__/governance.test.ts
npm test -- src/lib/legal/__tests__/policies.test.ts
npm test -- src/lib/legal/__tests__/publishGuard.test.ts
npm test -- src/lib/legal/__tests__/publishEnforcement.test.ts
```

### Cross-Surface Link Coverage

```bash
npm test -- src/components/marketing/__tests__/MarketingHome.test.tsx
npm test -- src/components/pro/__tests__/ProCards.test.tsx
npm test -- src/components/auth/__tests__/AccountPanel.test.tsx
npm test -- src/components/layout/__tests__/AppSidebar.test.tsx
```

### E2E Smoke

```bash
npm run e2e -- e2e/legal.spec.ts
```

### CI Stability Pass

```bash
npm run ci
```

---

## Success Criteria

Sprint 14.2 legal/trust rollout is considered verified when:

1. All legal routes are publicly accessible and render canonical metadata.
2. Policy text matches locked legal/product decisions and current behavior.
3. Landing/account legal-support discoverability works on mobile and desktop.
4. Sidebar remains support-only (no legal link overload).
5. `/legal/changes` includes baseline entries, governance procedure, and release-note fields.
6. Placeholder publish blockers are visible in docs/UI and enforceable in production builds.
7. Route/component/E2E/CI test runs pass.

---

## References

- [Sprint 14.2 Plan](../sprints/sprint-14.2.md)
- [Privacy Page](../../src/app/legal/privacy/page.tsx)
- [Terms Page](../../src/app/legal/terms/page.tsx)
- [Refunds Page](../../src/app/legal/refunds/page.tsx)
- [Changes Page](../../src/app/legal/changes/page.tsx)
- [Legal Layout](../../src/components/legal/LegalPageLayout.tsx)
- [Legal Links Component](../../src/components/legal/LegalSupportLinks.tsx)
- [Legal Policies](../../src/lib/legal/policies.ts)
- [Legal Governance](../../src/lib/legal/governance.ts)
- [Publish Guard](../../src/lib/legal/publishGuard.ts)
- [Publish Enforcement](../../src/lib/legal/publishEnforcement.ts)
- [Legal E2E](../../e2e/legal.spec.ts)
