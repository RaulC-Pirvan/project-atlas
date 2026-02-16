# Sprint 13.1: Social Sign-in (Google OAuth) - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: Planned  
**Theme**: Add Google sign-in without weakening existing credentials auth or account security.

---

## Overview

Sprint 13.1 introduces Google OAuth sign-in/sign-up through NextAuth while
preserving the current email/password flow as a reliable fallback path.

This sprint is security-sensitive: account-linking rules must prevent account
takeover, enforce verified Google email requirements, and keep behavior
deterministic across API, UI, and tests.

**Core Goal**: users can authenticate with Google safely, and existing
credentials users keep working without regressions.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Add Google provider to NextAuth
- [ ] Implement safe account-linking rules for Google callback flow
- [ ] Add `Continue with Google` on sign-in and sign-up
- [ ] Keep credentials sign-in fully functional as fallback
- [ ] Add unit/API coverage for callback and linking edge cases
- [ ] Add E2E coverage for OAuth happy path + credentials fallback path

### Excluded (this sprint)

- [ ] Additional OAuth providers (Apple, GitHub, etc.)
- [ ] "Connect/disconnect provider" settings page
- [ ] Native mobile provider SDKs
- [ ] 2FA/passkeys (covered in Phase 13.2/13.3)

---

## OAuth Password Policy (Locked)

- Google OAuth users are allowed to complete first login without a forced password setup step.
- On first Google-created account, store a secure random internal password hash server-side.
- Credentials fallback is optional until user explicitly sets a password from account settings.
- Do not block OAuth login with a mandatory "set password now" interruption in this sprint.

---

## Account-Linking Policy (Security Spec)

Google sign-in callback must follow these rules:

1. Provider must be `google`.
2. Google profile must include an email.
3. Google profile email must be marked verified (`email_verified=true`).
4. Email matching is case-insensitive (always normalize to lowercase).
5. If a Google account link already exists (`provider + providerAccountId`), sign in that user.
6. If no account link exists but user exists by email:
   - deny sign-in if user is soft-deleted
   - link Google account to that existing user
   - set `emailVerified` if not already set
7. If no user exists by email:
   - create user with normalized email
   - set `emailVerified` to now
   - create Google account link
8. Never link to a different existing user when provider identity conflicts.
9. Credentials auth remains available and unchanged for existing users.

---

## Google OAuth Setup (Step-by-Step for first-time setup)

Follow this once before implementation testing:

1. Open Google Cloud Console and create/select a project.
2. Configure OAuth consent screen:
   - User Type: External
   - App name/support email/developer email
   - Add scopes: `openid`, `email`, `profile`
   - Add test users (your Google account) while app is in testing mode.
3. Create OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-production-domain>/api/auth/callback/google`
     - `https://<your-staging-domain>/api/auth/callback/google` (if used)
4. Copy credentials from Google:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. Add env vars locally (`.env`):
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXTAUTH_SECRET=<strong-random-secret>`
6. Add same env vars in hosting (Vercel/Staging/Production) with correct `NEXTAUTH_URL`.
7. Restart app after env changes: `npm run dev`.
8. Validate manually:
   - open `/sign-in` and click `Continue with Google`
   - complete consent
   - confirm redirect to `/today`

Important note: Google does not support wildcard callback URLs. Preview domains
usually cannot use Google OAuth unless explicitly registered.

---

## Phase 1: Provider + Callback Domain Logic (Days 1-2)

### Tasks (5)

- [x] **Task 1.1**: Add Google provider configuration in `src/lib/auth/nextauth.ts`
- [x] **Task 1.2**: Implement callback service for Google account-linking policy (single source of truth)
- [x] **Task 1.3**: Integrate callback service into NextAuth `signIn`/`jwt` callbacks
- [x] **Task 1.4**: Ensure soft-deleted users are blocked in OAuth path
- [x] **Task 1.5**: Preserve credentials provider flow with no regressions

---

## Phase 2: Auth UI Updates (Days 2-3)

### Tasks (3)

- [x] **Task 2.1**: Add reusable OAuth action button component for auth screens
- [x] **Task 2.2**: Add `Continue with Google` to sign-in page
- [x] **Task 2.3**: Add `Continue with Google` to sign-up page

---

## Phase 3: Tests - Unit/API (Days 3-5)

### Tasks (6)

- [ ] **Task 3.1**: Unit tests for linking rules (new user, existing user, conflict, deleted user)
- [ ] **Task 3.2**: Unit test: reject unverified Google email profile
- [ ] **Task 3.3**: Unit test: normalized email matching and linking
- [ ] **Task 3.4**: NextAuth callback tests for JWT/session fields in OAuth path
- [ ] **Task 3.5**: API-level test coverage for callback handling edge cases
- [ ] **Task 3.6**: Component tests for Google button visibility + credentials fallback presence

---

## Phase 4: E2E + Manual Validation (Days 5-7)

### Tasks (4)

- [ ] **Task 4.1**: Add E2E OAuth happy path coverage (test-mode deterministic flow)
- [ ] **Task 4.2**: Add E2E credentials fallback login path coverage
- [ ] **Task 4.3**: Add manual smoke checklist for real Google consent flow
- [ ] **Task 4.4**: CI stability check across Chromium + Firefox

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> account-linking policy logic and edge-case guards
- **API/Auth callback** -> provider callback behavior and deny rules
- **Components** -> sign-in/sign-up OAuth entry points and fallback auth UI
- **E2E** -> OAuth happy path + credentials fallback path

CI must remain green.

---

## Environment Variables

Required:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Recommended doc updates in this sprint:

- [ ] Update `.env.example` with Google OAuth variables
- [ ] Update auth/testing docs with Google callback URI requirements

---

## Implementation Guidelines

- Keep account-linking logic in a dedicated auth service (pure/testable where possible).
- Do not bypass deleted-account protections in OAuth flow.
- Do not weaken credentials login behavior.
- Keep user-facing auth errors generic and toast-friendly (no inline form errors).
- Maintain strict TypeScript types; no `any`.
- Avoid provider-specific assumptions beyond required Google profile fields.

---

## File Structure (Expected)

- `src/lib/auth/nextauth.ts`
- `src/lib/auth/*` (new OAuth linking service + tests)
- `src/lib/auth/__tests__/*`
- `src/app/api/auth/[...nextauth]/route.ts` (if callback wiring updates required)
- `src/components/auth/SignInForm.tsx`
- `src/components/auth/SignUpForm.tsx`
- `src/components/auth/*` (new reusable OAuth button component)
- `src/components/auth/__tests__/*`
- `e2e/auth.spec.ts` and/or `e2e/oauth.spec.ts`
- `.env.example`
- `docs/sprints/sprint-13.1.md`

---

## Definition of Done

1. [ ] Google provider is configured and functional in local + deployed envs
2. [ ] Safe account-linking rules are implemented and tested
3. [ ] Sign-in and sign-up both show `Continue with Google`
4. [ ] Credentials login remains fully functional as fallback
5. [ ] Unit/API tests cover callback + linking edge cases
6. [ ] E2E covers OAuth happy path and credentials fallback path
7. [ ] OAuth setup/documentation is clear for future contributors
8. [ ] CI passes from clean checkout

---
