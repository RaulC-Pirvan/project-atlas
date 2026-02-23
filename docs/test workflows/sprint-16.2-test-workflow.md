# Sprint 16.2 Test Workflow - Landing Walkthrough Narrative

**Status**: Planned  
**Last Updated**: February 2026

---

## Overview

Sprint 16.2 validates landing walkthrough quality and activation clarity:

- Guided `create -> remind -> complete -> review` narrative
- Real product screenshot usage (desktop + mobile)
- Non-technical, value-first language
- Auth-aware CTA behavior
- Responsive and E2E coverage for walkthrough interactions

This workflow verifies messaging clarity, asset realism, and route correctness.

---

## Prerequisites

1. Required docs and surfaces:
   - `docs/sprints/sprint-16.2.md`
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

### Workflow 1: Walkthrough structure is present and ordered [ ]

1. Open `/landing`.
2. Review walkthrough sequence.

**Expected**:

- Steps appear in order: `create`, `remind`, `complete`, `review`.
- Narrative is coherent and easy to scan.

### Workflow 2: Real screenshot authenticity [ ]

1. Inspect walkthrough images across steps.

**Expected**:

- Assets reflect real Atlas UI surfaces.
- No placeholder/mockup visuals remain.

### Workflow 3: Copy quality and readability [ ]

1. Review walkthrough text and headings.

**Expected**:

- Copy is non-technical and value-first.
- Claims are clear, concrete, and consistent.

### Workflow 4: Signed-out CTA behavior [ ]

1. Use primary CTA from walkthrough as signed-out user.

**Expected**:

- Route goes to auth entrypoint.
- No broken or ambiguous action targets.

### Workflow 5: Signed-in CTA behavior [ ]

1. Repeat CTA action while signed in.

**Expected**:

- Route goes to dashboard/app-intended destination.
- CTA label and action remain context-correct.

### Workflow 6: Responsive behavior [ ]

1. Validate walkthrough on mobile viewport.
2. Validate walkthrough on desktop viewport.

**Expected**:

- Layout is readable and stable on both sizes.
- Screenshot framing and text hierarchy remain clean.

### Workflow 7: Accessibility baseline [ ]

1. Verify image alt text and heading order.
2. Verify keyboard focus movement through CTA elements.

**Expected**:

- Landmarks/headings are semantically valid.
- Walkthrough remains usable via keyboard and assistive tech patterns.

---

## Automated Tests

### Component / Unit

```bash
npm test -- src/components/marketing/__tests__
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
2. Real product screenshots are used consistently.
3. Copy remains value-first and non-technical.
4. Signed-out and signed-in CTA flows behave correctly.
5. Mobile and desktop responsive behavior is validated.
6. Component and E2E coverage passes for walkthrough + CTA paths.
7. Lint/typecheck/tests and targeted E2E pass.

---

## References

- [Sprint 16.2 Plan](../sprints/sprint-16.2.md)
- [Sprint 16.1 Plan](../sprints/sprint-16.1.md)
- [Sprint 5.2 Plan](../sprints/sprint-5.2.md)
- [Roadmap](../roadmap.md)
