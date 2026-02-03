# Sprint 5.1 Test Workflows - Marketing Homepage

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 5.1 delivers the public marketing homepage and ensures authenticated
users are redirected to `/calendar`. This document covers manual and automated
checks for the hero content, benefits copy, CTA routing, accessibility, and
auth-aware entry.

**Key Features Implemented**:

- Marketing hero section with value prop and CTAs
- Benefits section explaining schedule-based habits, completion rules, streaks
- Auth-aware redirect from `/` to `/calendar`
- Accessibility polish (focus rings, skip link, semantic lists)
- Visual polish in the black/white system
- Light/dark theme toggle with system default and localStorage persistence
- Theme styling applied across authenticated screens (cards + typography)

---

## Prerequisites

1. **Database is migrated with Sprint 1.2+ schema**:

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

---

## Test Workflows

### Workflow 1: Signed-out marketing homepage renders [x]

1. Sign out (or open a private window).
2. Navigate to `/`.

**Expected**: Hero headline, value prop copy, benefits section, and CTA buttons
are visible. No authenticated app shell appears.

---

### Workflow 2: CTA routing works [x]

1. On `/`, click **Create your account**.
2. Use the browser Back button.
3. Click **Sign in**.

**Expected**: First CTA routes to `/sign-up`, second routes to `/sign-in`.

---

### Workflow 3: Auth-aware redirect [x]

1. Sign in as a verified user.
2. Navigate to `/`.

**Expected**: You are redirected to `/calendar`.

---

### Workflow 4: Responsive layout checks [x]

1. Resize to mobile width (<= 390px).
2. Refresh `/`.
3. Resize to desktop width (>= 1280px).

**Expected**: Layout stacks cleanly on mobile, uses two-column layout on desktop,
with no horizontal scrollbars.

---

### Workflow 5: Keyboard flow + skip link [x]

1. On `/`, press `Tab`.
2. Activate **Skip to main content**.
3. Continue tabbing through primary CTAs.

**Expected**: Skip link becomes visible on focus and jumps to main content.
CTA links show clear focus rings.

---

### Workflow 6: Contrast and visual polish [x]

1. Scan all copy and labels (hero, benefits, sample cards).
2. Check that gold accent is not used on the marketing page.

**Expected**: Text is readable on white/black backgrounds and only black/white
styles are used.

---

### Workflow 7: Theme toggle and persistence [x]

1. On `/`, toggle the theme in the top-right header.
2. Refresh the page.
3. Navigate to `/sign-in` and `/sign-up`.

**Expected**: The selected theme persists across refreshes and auth routes, and
the toggle reflects the current mode.

---

### Workflow 8: System preference default [x]

1. Clear the `atlas-theme` key from localStorage.
2. Set the OS/browser to Dark mode.
3. Refresh `/`.

**Expected**: The site loads in dark mode without a flash of light theme.

---

### Workflow 9: Authenticated pages theme parity [x]

1. Sign in and open `/calendar`, `/habits`, and `/account`.
2. Toggle the theme.

**Expected**: Cards, headings, and controls switch to the selected theme while
gold remains reserved for completed days only.

---

## Automated Tests

### Unit (Suggested)

```bash
npm test -- src/components/marketing/__tests__/MarketingHome.test.tsx
```

### E2E (Suggested)

```bash
npm run e2e -- e2e/marketing-homepage.spec.ts
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Redirect does not happen

**Symptoms**: Visiting `/` while signed in still shows the marketing page.

**Fixes**:

- Confirm the user session is valid and email is verified.
- Verify `NEXTAUTH_URL` matches the server origin.
- Check that `/` is not cached with stale cookies in the browser.

---

### Issue: Skip link never appears

**Symptoms**: Tabbing does not reveal the skip link.

**Fixes**:

- Ensure focus is within the page (click once, then press `Tab`).
- Confirm the skip link is the first focusable element in the DOM.

---

### Issue: Theme does not persist after refresh

**Symptoms**: The theme flips back to the system preference after reload.

**Fixes**:

- Verify `localStorage.atlas-theme` is set to `light` or `dark`.
- Confirm no browser privacy settings are blocking storage.
- Check that the toggle is rendered (top-right header).

---

## Success Criteria

Sprint 5.1 is complete when:

1. Marketing homepage communicates value and core benefits.
2. CTAs route to sign-up and sign-in flows.
3. Authenticated users are redirected to `/calendar`.
4. Accessibility checks pass for focus flow and contrast.
5. Theme toggle works with system default + persistence.
6. CI passes from clean checkout.

---

## Additional Resources

- [Sprint 5.1 Plan](../sprints/sprint-5.1.md)
- [Marketing Homepage](../../src/app/page.tsx)
- [Marketing Layout](../../src/components/marketing/MarketingHome.tsx)
- [Marketing E2E Test](../../e2e/marketing-homepage.spec.ts)
- [AGENTS](../../AGENTS.md)
