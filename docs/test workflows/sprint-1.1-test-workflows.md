# Sprint 1.1 Test Workflows - Authentication Foundation

**Status**: Complete (Phases 1-4)
**Last Updated**: January 2026

---

## Overview

Sprint 1.1 delivers the authentication foundation for Project Atlas using NextAuth credentials, email verification, account management, middleware protection, and full test coverage. This document provides end-to-end and manual workflows to verify the auth system behaves correctly and stays stable in CI.

**Key Features Implemented**:

- Email/password signup and verification
- Resend verification flow (rate limited)
- NextAuth credentials login and logout
- Account updates (email and password)
- Account deletion request
- Middleware-protected private routes
- Unit, API, and E2E tests

---

## Prerequisites

Before testing, ensure:

1. **Database is available with Sprint 1.1 schema**:

   ```bash
   npx prisma db push
   npm run prisma:generate
   ```

2. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   RESEND_API_KEY=...           # Optional in dev/test
   RESEND_FROM_EMAIL=...        # Optional in dev/test
   ENABLE_TEST_ENDPOINTS=true   # Required for debug token endpoint and E2E
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Optional seed users** (if needed for manual testing):

   ```bash
   npm run prisma:seed
   ```

5. **Browser dev tools open**:
   - Monitor network requests for API routes
   - Check console for errors
   - Verify cookies under Application

---

## Technical Details

**Middleware Flow** (`middleware.ts`):

```typescript
if (isPublicPath(pathname)) {
  return NextResponse.next();
}

const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

if (token) {
  return NextResponse.next();
}

const signInUrl = new URL('/sign-in', request.url);
signInUrl.searchParams.set('from', pathname);
return NextResponse.redirect(signInUrl);
```

**Debug Token Endpoint Guard** (`src/app/api/auth/debug/verification-token/route.ts`):

```typescript
const allow = process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_ENDPOINTS === 'true';
if (!allow) {
  throw new ApiError('not_found', 'Not found.', 404);
}
```

---

## Test Workflows

### Workflow 1: Signup and verify (happy path)

1. Visit `/sign-up` and submit a new email and password.
2. Confirm UI shows the success message.
3. Fetch the verification token via `/api/auth/debug/verification-token?email=...` (dev/test only).
4. Visit `/verify-email?token=...`.
5. Confirm the page shows a verified success message.
6. Sign in via `/sign-in` and confirm redirect to `/account`.

**Expected**: User is created as unverified, then verified, and can access `/account`.

---

### Workflow 2: Login blocked for unverified account

1. Sign up a new account.
2. Attempt to sign in before verifying.
3. Confirm the UI shows the account not verified message.

**Expected**: Unverified users cannot log in.

---

### Workflow 3: Resend verification

1. Sign up a new account.
2. Visit `/verify-email?email=...`.
3. Click **Resend verification email**.
4. Fetch the latest debug token and verify it differs from the previous token.

**Expected**: Resend triggers a new token and shows a success message.

---

### Workflow 4: Logout ends session

1. Sign in to a verified account.
2. Click **Sign out** on the account page.
3. Confirm redirect to `/sign-in`.
4. Visit `/account` directly.

**Expected**: User is redirected to `/sign-in` and does not see account data.

---

### Workflow 5: Account update (password)

1. Sign in to a verified account.
2. Update the password on `/account`.
3. Confirm success message.
4. Sign out and sign in with the new password.

**Expected**: Password is updated and the new credentials work.

---

### Workflow 6: Account update (email)

1. Sign in to a verified account.
2. Update the email on `/account`.
3. Confirm success message.
4. Fetch the verification token for the new email and verify it.

**Expected**: Email changes are stored and require re-verification.

---

### Workflow 7: Delete request flow

1. Sign in to a verified account.
2. Enter `DELETE` in the delete form on `/account` and submit.

**Expected**: UI confirms the request was submitted.

---

### Workflow 8: Middleware protection

1. Open `/account` in a new session (signed out).

**Expected**: Redirects to `/sign-in` with a `from` query param.

---

## Troubleshooting

### Issue: Prisma generate fails with missing DATABASE_URL

**Symptoms**: `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`.

**Fixes**:

1. Ensure `DATABASE_URL` is set in the environment running `npm run prisma:generate`.
2. Confirm `.env` is loaded and the runner has access to it.
3. Re-run `npm run prisma:generate`.

---

### Issue: Verification emails not sent

**Symptoms**: No email arrives or Resend errors in logs.

**Fixes**:

1. Ensure `RESEND_API_KEY` is set in production.
2. In dev/test, rely on the debug token endpoint instead of actual email.
3. Confirm `ENABLE_TEST_ENDPOINTS=true` for E2E.

---

### Issue: Resend verification returns rate limit

**Symptoms**: 429 response from `/api/auth/resend-verification`.

**Fixes**:

1. Wait 5 minutes or use a new email.
2. In tests, set `ENABLE_TEST_ENDPOINTS=true` to bypass the rate limiter.

---

### Issue: Logout does not redirect

**Symptoms**: `/account` remains accessible after sign out.

**Fixes**:

1. Confirm the UI calls `/api/auth/logout` and clears cookies.
2. Check browser cookies for `next-auth.session-token` and related cookies.
3. Refresh the page to re-run middleware.

---

## Cleanup

1. Remove test users from the database if needed.
2. Clear cookies and localStorage in the browser.
3. Stop the dev server.

---

## Success Criteria

Sprint 1.1 is complete when:

1. Signup, verification, login, logout, and account update flows pass end-to-end.
2. Middleware blocks protected routes without a session.
3. API error responses are consistent (`code`, `message`).
4. Unit, API, and E2E tests pass in CI.

---

## Quick Acceptance Checklist

- [ ] Sign-up creates an unverified user
- [ ] Verification link sets the account as verified
- [ ] Unverified user cannot log in
- [ ] Verified user can log in and view `/account`
- [ ] Resend verification generates a new token
- [ ] Logout clears the session and blocks `/account`
- [ ] Password update works and persists
- [ ] Email update triggers re-verification
- [ ] Delete request UI confirms submission
- [ ] `npm run ci` and `npm run e2e` both pass

---

## Additional Resources

- [Sprint 1.1 Plan](../sprints/sprint-1.1.md)
- [E2E Auth Spec](../../e2e/auth.spec.ts)
- [Auth API Routes](../../src/app/api/auth)
- [Middleware](../../middleware.ts)
- [Debug Token Endpoint](../../src/app/api/auth/debug/verification-token/route.ts)
- [AGENTS](../../AGENTS.md)
