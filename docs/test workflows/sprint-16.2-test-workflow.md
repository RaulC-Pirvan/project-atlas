# Sprint 16.2 Test Workflow - Landing Walkthrough Narrative

**Status**: Completed  
**Last Updated**: February 25, 2026

---

## Overview

Sprint 16.2 validates landing walkthrough quality and activation clarity:

- Guided `create -> remind -> complete -> review` narrative
- Live code-rendered preview usage (no static screenshots)
- Non-technical, value-first language
- Auth-aware CTA behavior
- Responsive and E2E coverage for walkthrough interactions

This workflow verifies messaging clarity, asset realism, and route correctness.

---

## Prerequisites

1. Required docs and surfaces:
   - `docs/sprints/sprint-16.2.md`
   - `docs/ops/landing-walkthrough-phase-0-contract.md`
   - `src/app/landing/page.tsx`
   - walkthrough assets in `public/images/walkthrough/*` (or chosen path)

2. Test environment:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ```

3. Test sessions:
   - Signed-out session
   - Signed-in non-Pro session

4. App running:

   ```bash
   npm run dev
   ```

---

## Manual QA Checklist

### Workflow 1: Walkthrough structure is present and ordered [x]

1. Open `/landing`.
2. Review walkthrough sequence.

**Expected**:

- Steps appear in order: `create`, `remind`, `complete`, `review`.
- Narrative is coherent and easy to scan.

### Workflow 2: Live preview authenticity [x]

1. Inspect walkthrough previews across steps.

**Expected**:

- Previews are rendered from component code, not static image files.
- Preview structures reflect real Atlas UI patterns.
- Preview layout adapts cleanly across viewport sizes.

### Workflow 3: Copy quality and readability [x]

1. Review walkthrough text and headings.

**Expected**:

- Copy is non-technical and value-first.
- Claims are clear, concrete, and consistent.

### Workflow 4: Signed-out CTA behavior [x]

1. Use primary CTA from walkthrough as signed-out user.

**Expected**:

- Route goes to auth entrypoint.
- No broken or ambiguous action targets.

### Workflow 5: Signed-in CTA behavior [x]

1. Repeat CTA action while signed in.

**Expected**:

- Route goes to dashboard/app-intended destination.
- CTA label and action remain context-correct.

### Workflow 6: Responsive behavior [x]

1. Validate walkthrough on mobile viewport.
2. Validate walkthrough on tablet viewport.
3. Validate walkthrough on desktop viewport.

**Expected**:

- Layout is readable and stable across mobile/tablet/desktop.
- Live preview panel remains readable at each breakpoint.
- Preview framing and text hierarchy remain clean.

### Workflow 7: Accessibility baseline [x]

1. Verify image alt text and heading order.
2. Verify keyboard focus movement through CTA elements.

**Expected**:

- Landmarks/headings are semantically valid.
- Walkthrough remains usable via keyboard and assistive tech patterns.

---

## Automated Tests

### Component / Unit

```bash
npm test -- src/components/marketing/__tests__ src/lib/analytics/__tests__/landingWalkthrough.test.ts src/app/landing/walkthrough/track/__tests__/route.test.ts
```

### E2E

```bash
npm run e2e -- e2e/marketing-homepage.spec.ts --project=chromium
npm run e2e -- e2e/marketing-homepage.spec.ts --project=firefox
```

---

## CI Stability Pass

```bash
npm run lint
npm run typecheck
npm test
npm run e2e -- e2e/marketing-homepage.spec.ts --project=chromium
```

For full gate:

```bash
npm run ci:full
```

---

## Success Criteria

Sprint 16.2 is considered verified when:

1. Walkthrough sequence is present and clear.
2. Live preview components are used consistently.
3. Copy remains value-first and non-technical.
4. Signed-out and signed-in CTA flows behave correctly.
5. Mobile and desktop responsive behavior is validated.
6. Component and E2E coverage passes for walkthrough + CTA paths.
7. Lint/typecheck/tests and targeted E2E pass.

---

## References

- [Sprint 16.2 Plan](../sprints/sprint-16.2.md)
- [Phase 0 Contract Artifact](../ops/landing-walkthrough-phase-0-contract.md)
- [Phase 3 Legal/Product Review](../ops/landing-walkthrough-legal-product-review.md)
- [Phase 3 Publish Artifact Set](../ops/landing-walkthrough-publish-artifacts.md)
- [Sprint 16.1 Plan](../sprints/sprint-16.1.md)
- [Sprint 5.2 Plan](../sprints/sprint-5.2.md)
- [Roadmap](../roadmap.md)
