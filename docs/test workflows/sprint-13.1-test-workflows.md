# Sprint 13.1 Test Workflows - Social Sign-in (Google OAuth)

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 13.1 adds Google OAuth sign-in with secure account-linking while keeping
email/password as a fallback path.

This document covers deterministic E2E validation (test provider) and manual
smoke checks for real Google consent.

---

## Prerequisites

1. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ENABLE_TEST_GOOGLE_OAUTH_PROVIDER=true
   NEXT_PUBLIC_ATLAS_GOOGLE_PROVIDER_ID=google-test
   NEXT_PUBLIC_ATLAS_GOOGLE_TEST_EMAIL=oauth-e2e@example.com
   NEXT_PUBLIC_ATLAS_GOOGLE_TEST_NAME=OAuth E2E User
   NEXT_PUBLIC_ATLAS_GOOGLE_TEST_PROVIDER_ACCOUNT_ID=oauth-e2e-sub
   ```

2. **For real Google manual checks**, also configure:

   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

---

## Workflow 1: Deterministic OAuth happy path (E2E) [x]

Run targeted OAuth E2E:

```bash
npm run e2e -- e2e/oauth.spec.ts --project=chromium
```

**Expected**:

- Test `google oauth happy path signs in and lands on today` passes.
- Clicking `Continue with Google` lands on `/today`.
- Account page shows OAuth user email.

---

## Workflow 2: Credentials fallback with Google visible (E2E) [x]

Run the same spec:

```bash
npm run e2e -- e2e/oauth.spec.ts --project=chromium
```

**Expected**:

- Test `credentials fallback login still works when google sign-in is available` passes.
- Sign-in page shows both:
  - `Continue with Google`
  - email/password fields and `Sign in` button
- Verified credentials user can sign in and land on `/today`.

---

## Workflow 3: Real Google consent manual smoke [x]

1. Set `ENABLE_TEST_GOOGLE_OAUTH_PROVIDER=false`.
2. Keep `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` configured.
3. Restart server.
4. Open `/sign-in`.
5. Click `Continue with Google`.
6. Complete Google consent with a test user.
7. Confirm redirect to `/today`.
8. Open `/account` and confirm Google email appears.
9. Sign out and sign in again with Google to confirm linked-account reuse.
10. Confirm credentials sign-in UI is still visible on `/sign-in`.

**Expected**:

- Google consent succeeds and returns to app.
- Existing Google account is linked to the same Atlas user.
- Credentials fallback path remains available.

---

## Workflow 4: Cross-browser stability (Chromium + Firefox) [x]

Run OAuth spec on both browsers:

```bash
npm run e2e -- e2e/oauth.spec.ts --project=chromium --project=firefox
```

**Expected**:

- OAuth deterministic happy path passes on Chromium and Firefox.
- Credentials fallback path passes on Chromium and Firefox.

---

## Automated Tests

### Targeted Unit / Component / Auth Callback

```bash
npm test -- src/lib/auth/__tests__/googleOAuth.test.ts
npm test -- src/lib/auth/__tests__/nextauth.test.ts
npm test -- src/components/auth/__tests__/SignInForm.test.tsx
npm test -- src/components/auth/__tests__/SignUpForm.test.tsx
```

### Targeted E2E

```bash
npm run e2e -- e2e/oauth.spec.ts --project=chromium --project=firefox
```

---

## Success Criteria

Sprint 13.1 Phase 4 is complete when:

1. Deterministic OAuth happy path E2E passes.
2. Credentials fallback E2E passes with Google UI present.
3. Manual real-Google smoke checklist is documented and runnable.
4. OAuth E2E is stable on Chromium and Firefox.

---

## References

- [Sprint 13.1 Plan](../sprints/sprint-13.1.md)
- [NextAuth Options](../../src/lib/auth/nextauth.ts)
- [Google OAuth Linking Service](../../src/lib/auth/googleOAuth.ts)
- [Auth Sign-in Form](../../src/components/auth/SignInForm.tsx)
- [Auth Sign-up Form](../../src/components/auth/SignUpForm.tsx)
- [OAuth E2E](../../e2e/oauth.spec.ts)
- [AGENTS](../../AGENTS.md)
