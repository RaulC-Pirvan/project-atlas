# Sprint 13.2 Test Workflow - 2FA (TOTP) + Session Controls

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 13.2 adds:

- DB-backed NextAuth sessions (server-stored, revocable)
- TOTP 2FA enrollment and login challenge
- Recovery codes (generate, consume, rotate, revoke)
- Session controls (list active sessions, revoke one, revoke others, sign out all)
- Step-up authentication for sensitive actions (email/password change, account delete)
- Admin-first 2FA enrollment gating when enforcement is active

This document covers deterministic E2E workflows, targeted test commands, and CI-stability checks.

---

## Prerequisites

1. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   TOTP_ENCRYPTION_KEY=00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff
   ```

2. **Prisma client is generated**:

   ```bash
   npm run prisma:generate
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Test user assumptions**:
   - Verified credentials user exists (or is created by E2E).
   - For admin workflows, user role can be promoted to `admin` in tests.

---

## Workflow 1: DB-backed session sign-in + logout behavior [x]

Run targeted auth E2E:

```bash
npm run e2e -- e2e/auth.spec.ts --project=chromium
```

**Expected**:

- Credentials sign-in lands on `/today`.
- Logout clears session and protected routes redirect to `/sign-in`.
- Account session remains server-authoritative (no JWT-only assumptions).

---

## Workflow 2: 2FA enrollment and TOTP login challenge [x]

Run targeted 2FA E2E:

```bash
npm run e2e -- e2e/two-factor.spec.ts --project=chromium
```

**Expected**:

- User can set up 2FA from `/account`.
- Setup shows QR/manual secret and accepts valid TOTP code.
- Recovery codes modal appears after enable.
- Subsequent sign-in requires 2FA challenge before `/today`.

---

## Workflow 3: Recovery-code fallback + consumption semantics [x]

Run targeted 2FA E2E:

```bash
npm run e2e -- e2e/two-factor.spec.ts --project=chromium
```

**Expected**:

- Login challenge supports switching to recovery-code method.
- One recovery code can complete sign-in.
- Recovery code is consumed once; remaining count decreases.

---

## Workflow 4: 2FA disable flow and post-disable sign-in [x]

Run targeted 2FA E2E:

```bash
npm run e2e -- e2e/two-factor.spec.ts --project=chromium
```

**Expected**:

- Disable flow requires `DISABLE 2FA`, current password (if set), and valid code.
- After disable, next sign-in no longer prompts 2FA.

---

## Workflow 5: Session controls (revoke one/revoke all/sign out all devices) [x]

Run targeted 2FA/session E2E:

```bash
npm run e2e -- e2e/two-factor.spec.ts --project=chromium
```

**Expected**:

- Account page lists active sessions.
- Sign out all devices revokes sessions across browser contexts.
- Current device is redirected to `/sign-in` after sign-out-all.

---

## Workflow 6: Step-up auth for sensitive actions [x]

Run targeted auth E2E:

```bash
npm run e2e -- e2e/auth.spec.ts --project=chromium
```

**Expected**:

- Password change triggers step-up modal and completes only after verification.
- Email change triggers step-up modal; then forces re-verification + re-login.
- Account delete triggers step-up modal before deletion.

---

## Workflow 7: Admin enforcement + enrollment path [x]

Run admin E2E on both engines:

```bash
npm run e2e -- e2e/admin.spec.ts --project=chromium --project=firefox
```

**Expected**:

- Non-admin remains blocked from admin APIs.
- Admin can access `/admin` and admin APIs.
- Test supports both valid production-mode outcomes:
  - direct `/today` (when admin 2FA enforcement is off)
  - `/account?admin2fa=required` with enrollment flow (when enforcement is on)

---

## Workflow 8: Cross-browser stability (Chromium + Firefox) [x]

Run targeted auth/security specs:

```bash
npm run e2e -- e2e/two-factor.spec.ts --project=chromium --project=firefox
npm run e2e -- e2e/auth.spec.ts --project=chromium --project=firefox
npm run e2e -- e2e/admin.spec.ts --project=chromium --project=firefox
```

**Expected**:

- New security flows pass on Chromium and Firefox.
- No browser-specific regressions on challenge, step-up, or session revocation paths.

---

## Manual QA Checklist

Use this checklist when validating Sprint 13.2 manually in the browser without running Playwright.

### Manual QA 1: 2FA enrollment from Account [x]

1. Sign in with a verified credentials user and open `/account`.
2. Click `Set up 2FA`.
3. Confirm the setup card shows QR and manual secret.
4. Enter a valid authenticator code and submit.
5. Confirm recovery codes modal appears.
6. Save codes and close the modal.

**Expected**:

- Success toast appears for enable flow.
- `2FA is enabled` state is visible.
- Recovery code remaining count is shown.

### Manual QA 2: 2FA challenge during login [x]

1. Sign out.
2. Sign in again with email/password for a 2FA-enabled account.
3. Confirm sign-in screen transitions to 2FA challenge.
4. Submit a valid authenticator code.

**Expected**:

- Challenge copy appears: `Two-factor verification is required for this account`.
- Valid code completes login and routes to `/today`.

### Manual QA 3: Recovery code fallback and one-time use [x]

1. Sign out and sign in again with the same 2FA-enabled account.
2. At challenge screen, switch to `Recovery code`.
3. Enter one saved recovery code and submit.
4. Open `/account` and inspect remaining recovery count.

**Expected**:

- Recovery code login succeeds.
- Recovery code count decreases by one.
- Reusing the same recovery code fails.

### Manual QA 4: Recovery code rotation [x]

1. From `/account`, in the recovery section, choose method (`Authenticator code` or `Recovery code`).
2. Enter a valid proof code.
3. Click `Generate new recovery codes`.
4. Save new codes from modal.

**Expected**:

- New recovery code list is shown once.
- Previous recovery codes are no longer valid.
- Remaining code count resets to full set.

### Manual QA 5: Disable 2FA flow [x]

1. In `/account`, open the disable section.
2. Enter exact confirmation text `DISABLE 2FA`.
3. Enter current password if prompted.
4. Enter valid authenticator or recovery code and submit.
5. Sign out and sign in again.

**Expected**:

- Disable action succeeds with success feedback.
- Next login does not show 2FA challenge.

### Manual QA 6: Active sessions and revoke controls [x]

1. Sign in on two different browsers/devices with the same account.
2. On one session, open `/account` and find `Active sessions`.
3. Confirm current session is labeled.
4. Revoke one non-current session.
5. Refresh revoked device on `/today`.

**Expected**:

- Revoked session disappears from list.
- Revoked device is forced to `/sign-in`.

### Manual QA 7: Sign out all devices [x]

1. Stay signed in on at least two devices/sessions.
2. On `/account`, click `Sign out all devices`.
3. Confirm current device redirects to `/sign-in`.
4. On other device, navigate to `/today`.

**Expected**:

- All sessions are revoked server-side.
- All devices are signed out and must authenticate again.

### Manual QA 8: Step-up verification for sensitive actions [x]

1. Open `/account`.
2. Start email change; confirm step-up modal appears.
3. Complete step-up and submit email change.
4. Start password change; confirm step-up prompt and complete it.
5. Start account delete; confirm step-up prompt appears before destructive action.

**Expected**:

- Sensitive actions are blocked without valid step-up.
- Step-up accepts allowed methods for the user (password for non-2FA, TOTP/recovery for 2FA users).
- Invalid/expired proofs are rejected.

### Manual QA 9: Admin 2FA enforcement path [x]

1. Sign in with an admin account.
2. Observe post-login route.
3. If redirected to `/account?admin2fa=required`, complete 2FA enrollment.
4. Access `/admin` after enrollment.

**Expected**:

- With enforcement enabled, unenrolled admin cannot proceed until 2FA is configured.
- With enforcement disabled, admin may route directly to `/today`.
- Admin APIs remain protected from non-admin access in both modes.

---

## Automated Tests

### Targeted Unit / API / Component

```bash
npm test -- src/lib/auth/__tests__/totp.test.ts
npm test -- src/lib/auth/__tests__/recoveryCodes.test.ts
npm test -- src/lib/auth/__tests__/sessionManagement.test.ts
npm test -- src/lib/auth/__tests__/stepUpProof.test.ts

npm test -- src/app/api/auth/__tests__/sign-in.route.test.ts
npm test -- src/app/api/auth/__tests__/sign-in-two-factor-verify.route.test.ts
npm test -- src/app/api/auth/__tests__/two-factor-challenge.route.test.ts
npm test -- src/app/api/auth/__tests__/two-factor-challenge-verify.route.test.ts

npm test -- src/app/api/account/__tests__/sessions.route.test.ts
npm test -- src/app/api/account/__tests__/sessions-id.route.test.ts
npm test -- src/app/api/account/__tests__/step-up-challenge.route.test.ts
npm test -- src/app/api/account/__tests__/step-up-verify.route.test.ts

npm test -- src/components/auth/__tests__/AccountPanel.test.tsx
npm test -- src/components/auth/__tests__/SignInForm.test.tsx
```

### Targeted E2E

```bash
npm run e2e -- e2e/two-factor.spec.ts --project=chromium --project=firefox
npm run e2e -- e2e/auth.spec.ts --project=chromium --project=firefox
npm run e2e -- e2e/admin.spec.ts --project=chromium --project=firefox
```

### CI-mode smoke (production server path)

```bash
npm run build
CI=true npx playwright test e2e/admin.spec.ts --project=chromium --project=firefox
```

### Full E2E

```bash
npm run e2e
```

---

## Success Criteria

Sprint 13.2 is complete when:

1. DB-backed sessions are stable and revocable from API/UI.
2. 2FA enable/challenge/disable flows are deterministic and pass.
3. Recovery code lifecycle (consume/rotate/revoke) is validated.
4. Step-up is enforced for email/password change and account delete.
5. Admin access behavior is covered for enforcement-on and enforcement-off modes.
6. Chromium + Firefox runs are stable for new auth/security flows.
7. Unit/API/component/E2E tests pass in local and CI-style runs.

---

## References

- [Sprint 13.2 Plan](../sprints/sprint-13.2.md)
- [Admin E2E](../../e2e/admin.spec.ts)
- [Auth E2E](../../e2e/auth.spec.ts)
- [2FA + Sessions E2E](../../e2e/two-factor.spec.ts)
- [Account Panel](../../src/components/auth/AccountPanel.tsx)
- [Step-up Proof Service](../../src/lib/auth/stepUpProof.ts)
- [Session Management Service](../../src/lib/auth/sessionManagement.ts)
- [Two-factor Verification Service](../../src/lib/auth/twoFactorVerification.ts)
- [Playwright Config](../../playwright.config.ts)
- [AGENTS](../../AGENTS.md)
