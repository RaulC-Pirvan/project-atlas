# Sprint 1.1: Authentication Foundation (NextAuth) — Project Atlas

**Duration**: Week 1 (5–7 days)  
**Status**: Not Started  
**Theme**: Production-grade auth with email verification (Resend), account management, route protection, and full test coverage.

---

## Overview

Sprint 1.1 delivers the authentication baseline for Project Atlas using **NextAuth**:

- Email/password signup (Credentials)
- Email verification (Resend)
- Login/logout
- Basic account management (update email/password)
- Account deletion request flow
- Default avatar placeholder (no uploads)
- Route protection (middleware)
- Unit + E2E tests for core auth flows

**Core Goal**: a user can create an account, verify email, log in, and use the app — and CI guarantees it stays working.

---

## Scope Decisions

### Included

- ✅ NextAuth (Credentials provider)
- ✅ Email/password signup
- ✅ Email verification (Resend)
- ✅ Login/logout
- ✅ Account management (update email/password)
- ✅ Account deletion request flow
- ✅ Middleware route protection
- ✅ Unit + E2E tests

### Excluded (this sprint)

- ❌ 2FA
- ❌ OAuth providers
- ❌ User-uploaded avatars/photos
- ❌ RBAC beyond “authenticated user”

---

## Testing Policy

After each feature area, add tests:

- **Services** → `src/lib/**/__tests__/*.test.ts`
- **API routes** → `src/app/api/**/__tests__/*.test.ts`
- **Components** → `src/components/**/__tests__/*.test.tsx`
- **E2E** → `e2e/auth.spec.ts`

No merge into `dev` unless CI is green.

---

## NextAuth Plan (High Level)

- Use **Credentials** provider for login (email + password).
- Signup is handled via a custom API route; NextAuth handles session thereafter.
- Email verification is handled via:
  - verification token persisted in DB
  - Resend email with verification link
  - verify endpoint updates user as verified
- Session strategy:
  - Prefer JWT sessions for simplicity OR DB sessions if you want revocation control.
  - Choose one and lock it during Sprint 1.1.

---

## Phase 1: Database & Models (Days 1–2)

### Required Prisma Models (NextAuth + Verification)

Minimum:

- `User`
- `Account` (NextAuth)
- `Session` (NextAuth; only if DB sessions)
- `VerificationToken` (NextAuth; name reserved; don’t confuse with our email-verify tokens)
- `EmailVerificationToken` (our own, for account verification)
- `PasswordResetToken` (optional, but recommended)

### Tasks (12)

#### Prisma & Migration (8)

- [x] **Task 1.1**: Add NextAuth Prisma models (User/Account/Session/VerificationToken)
- [x] **Task 1.2**: Add user fields:
  - `email` (unique)
  - `passwordHash`
  - `emailVerifiedAt` (nullable)
  - `displayName` (optional)
  - timestamps
- [x] **Task 1.3**: Add `EmailVerificationToken` model (hashed token + expiry)
- [x] **Task 1.4**: Add `PasswordResetToken` model (optional)
- [x] **Task 1.5**: Run migration against Neon
- [x] **Task 1.6**: Seed: 1 verified user + 1 unverified user
- [x] **Task 1.7**: Add indexes (email, token lookups)
- [x] **Task 1.8**: Ensure Prisma client singleton pattern is followed

#### Domain Tests (4)

- [x] **Task 1.9**: Unit test: password hashing/verification
- [x] **Task 1.10**: Unit test: verification token expiry handling
- [x] **Task 1.11**: Unit test: verifying email updates correct fields
- [x] **Task 1.12**: Unit test: login rejects unverified accounts (recommended)

---

## Phase 2: Auth API Routes (Days 2–4)

### Endpoints (Recommended)

- `POST /api/auth/signup` (custom)
- `GET  /api/auth/verify-email?token=...` (custom)
- `POST /api/auth/resend-verification` (custom)
- `PUT  /api/account` (custom; update email/password)
- `POST /api/account/delete-request` (custom)
- NextAuth endpoints:
  - `/api/auth/[...nextauth]`

### Tasks (16)

#### Signup + Verification (8)

- [x] **Task 2.1**: Implement signup route (validate → hash → create user unverified)
- [x] **Task 2.2**: Generate + store verification token (store hashed token)
- [x] **Task 2.3**: Send verification email with Resend
- [x] **Task 2.4**: Implement verify endpoint (validate token → set `emailVerifiedAt`)
- [x] **Task 2.5**: Implement resend endpoint (rate limited)
- [x] **Task 2.6**: Zod validation for all auth inputs (signup/resend/update)
- [x] **Task 2.7**: Standardise API error format (`code`, `message`)
- [x] **Task 2.8**: API tests for signup + verify + resend

#### NextAuth Credentials + Session (8)

- [x] **Task 2.9**: Implement NextAuth Credentials provider `authorize()`
- [x] **Task 2.10**: Enforce verified email in `authorize()` (reject if unverified)
- [x] **Task 2.11**: Configure session strategy (JWT vs DB) and lock it
- [x] **Task 2.12**: Add NextAuth callbacks:
  - include `userId` in session
  - include `emailVerifiedAt` in session (optional)
- [x] **Task 2.13**: Add `getServerSession()` wrapper helper
- [x] **Task 2.14**: API tests for Credentials auth (happy path + reject path)
- [x] **Task 2.15**: Add basic rate limiting to login attempts (recommended)
- [x] **Task 2.16**: Confirm secure cookie settings in production

---

## Phase 3: UI Pages & Middleware (Days 3–5)

### Pages Required

- `/sign-up`
- `/verify-email` (post-signup messaging + resend)
- `/sign-in`
- `/account`

### Tasks (14)

#### Auth UI (10)

- [x] **Task 3.1**: Build sign-up form (email, password, confirm)
- [x] **Task 3.2**: Build sign-in form (uses NextAuth signIn)
- [x] **Task 3.3**: Build verify-email page (instructions)
- [x] **Task 3.4**: Add resend verification UI
- [x] **Task 3.5**: Loading + error states (no raw stack traces)
- [x] **Task 3.6**: Align client/server validation errors
- [x] **Task 3.7**: Add default avatar/icon component (placeholder)
- [x] **Task 3.8**: Build account page (update email/password)
- [x] **Task 3.9**: Build delete request UI (type-confirm or modal confirm)
- [x] **Task 3.10**: Component unit tests (forms + error states)

#### Middleware Protection (4)

- [x] **Task 3.11**: Add middleware to protect private routes
- [x] **Task 3.12**: Define public allowlist (sign-in/up/verify and NextAuth endpoints)
- [x] **Task 3.13**: Redirect unauth → `/sign-in`
- [x] **Task 3.14**: Add middleware tests where feasible (or integration tests)

---

## Phase 4: E2E Coverage (Days 5–7)

### E2E Auth Flows

- Signup → verify → login
- Login failure cases
- Logout
- Resend verification
- Account update

### Tasks (8)

- [ ] **Task 4.1**: Create `e2e/auth.spec.ts`
- [ ] **Task 4.2**: E2E: signup creates unverified account
- [ ] **Task 4.3**: E2E: verify link marks account verified
- [ ] **Task 4.4**: E2E: login works after verification
- [ ] **Task 4.5**: E2E: wrong password fails
- [ ] **Task 4.6**: E2E: logout ends session
- [ ] **Task 4.7**: E2E: resend verification works (dev/test friendly mode)
- [ ] **Task 4.8**: CI stability check (no flakes)

---

## Implementation Guidelines

### Security (Non-negotiable)

- Hash passwords (bcrypt/argon2), never plaintext
- Store verification tokens hashed in DB
- Tokens expire (short TTL)
- Basic rate limiting on signup/login/resend
- Secure cookies in production
- Don’t leak whether an email exists (resend messaging)

### Resend (Email Verification)

- Email contains verify link + expiry mention
- For dev/test and CI:
  - log verification link to console OR
  - provide a debug-only endpoint to fetch the latest verification token for a user (only when `NODE_ENV !== 'production'`)

---

## File Structure (No code block, so it won’t break)

**New/updated files expected in Sprint 1.1:**

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/resend-verification/route.ts`
- `src/app/api/account/route.ts`
- `src/app/api/account/delete-request/route.ts`

- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(auth)/sign-up/page.tsx`
- `src/app/(auth)/verify-email/page.tsx`
- `src/app/account/page.tsx`

- `src/components/auth/sign-in-form.tsx`
- `src/components/auth/sign-up-form.tsx`
- `src/components/auth/verify-email-panel.tsx`
- `src/components/auth/avatar-placeholder.tsx`

- `src/lib/auth/password.ts`
- `src/lib/auth/tokens.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/nextauth.ts` (wrapper/helpers)
- `src/lib/db.ts` (Prisma singleton, if not already)

- `e2e/auth.spec.ts`
- `middleware.ts`

- `prisma/schema.prisma`
- `prisma/migrations/*`

---

## Checklist

### Pre-Development

- [ ] Confirm NextAuth strategy (Credentials + Prisma adapter)
- [ ] Create branch: `sprint-1.1/auth-foundation`
- [ ] Add Resend env vars in Vercel (Preview + Production)

### Development

- [ ] Implement schema + migration
- [ ] Implement NextAuth route + Credentials provider
- [ ] Implement signup + verification routes
- [ ] Implement UI pages
- [ ] Implement middleware protection
- [ ] Add unit tests and E2E tests
- [ ] Confirm `npm run ci:full` passes

### Post-Sprint

- [ ] Merge to `dev`
- [ ] PR preview deploy works end-to-end
- [ ] Production deploy only from `main`
- [ ] Update roadmap docs

---

## Definition of Done

1. ✅ User can sign up with email/password
2. ✅ Verification email is sent via Resend
3. ✅ Verification link marks user verified
4. ✅ Verified user can log in and log out (NextAuth)
5. ✅ Account page updates email/password
6. ✅ Account deletion request flow exists
7. ✅ Middleware protects private routes
8. ✅ Unit tests cover auth logic
9. ✅ E2E tests cover signup/login/logout
10. ✅ CI passes from clean checkout

---
