# Sprint 13.2: 2FA (TOTP) + Session Controls - Project Atlas

**Duration**: TBD (7-10 days)  
**Status**: Planned  
**Theme**: Strengthen account security with TOTP 2FA, recovery controls, and revocable DB sessions without breaking existing auth UX.

---

## Overview

Sprint 13.2 adds optional TOTP-based 2FA for all users, mandatory 2FA for admin
accounts, backup/recovery codes, active session controls, and step-up
authentication for sensitive account actions.

This sprint also includes a session architecture migration from NextAuth JWT
session strategy to server-stored sessions (Prisma-backed) to support reliable
revocation and active-session management.

This sprint is security-sensitive: factor verification, recovery paths, and
session revocation must be deterministic, testable, and resilient to brute-force
or replay attempts.

**Core Goal**: users (and especially admins) can securely verify identity beyond
password/OAuth, recover access safely, and manage active sessions across devices.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Implement optional TOTP 2FA for all users
- [ ] Require 2FA for admin accounts
- [ ] Add backup/recovery codes (generate, rotate, revoke)
- [ ] Add session management UI (active sessions + sign out all devices)
- [ ] Add step-up auth prompts for sensitive actions (email/password change, delete account)
- [ ] Migrate auth session strategy from JWT to server-stored sessions
- [ ] Add unit + E2E coverage for 2FA enable/disable, verification, and recovery

### Excluded (this sprint)

- [ ] Passkeys/WebAuthn
- [ ] SMS-based 2FA
- [ ] Trusted device bypass ("remember this device")
- [ ] Enterprise SSO

---

## Session Strategy Migration (Locked)

- NextAuth remains the auth framework.
- Session persistence migrates from `session.strategy='jwt'` to
  `session.strategy='database'` (Prisma-backed server-stored sessions).
- Session revocation and "sign out all devices" must be server-authoritative.
- Existing JWT sessions are invalidated at cutover; users re-authenticate once.
- Middleware/admin protection must not rely on JWT-only claim decoding after cutover.

---

## 2FA + Session Security Spec (Locked)

- 2FA method:
  - TOTP (`RFC 6238`) with 6-digit codes, 30-second window
  - acceptance window: current time-step with small clock-skew tolerance
- User policy:
  - 2FA is optional for non-admin users
  - 2FA is mandatory for `role=admin` users
- Admin enforcement:
  - admin access paths must be blocked unless 2FA is enabled and recently verified
- Recovery codes:
  - generate one-time recovery codes during enable flow
  - store only hashed recovery codes server-side
  - support rotate/regenerate and full revoke semantics
- Session controls:
  - users can view active sessions with basic metadata (current device marker, last seen, created at, IP/UA where available)
  - users can sign out all other devices (and optionally all devices including current)
- Step-up auth:
  - required before sensitive actions:
    - email change
    - password change
    - account delete
  - prompt accepts TOTP (or recovery code fallback) for 2FA-enabled users
  - non-2FA users must re-confirm current password as step-up

---

## Phase 0: Session Migration Foundation (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Add Prisma adapter dependency for NextAuth and wire adapter in `authOptions`
- [x] **Task 0.2**: Switch session strategy to DB-backed sessions with explicit max age/update age settings
- [x] **Task 0.3**: Replace JWT-only middleware/admin assumptions with DB-session-compatible auth checks
- [x] **Task 0.4**: Add deterministic cutover behavior (invalidate JWT sessions, require re-login once)
- [x] **Task 0.5**: Add/extend session metadata persistence needed for session-management UI
- [x] **Task 0.6**: Add migration-focused tests for sign-in, persistence, revoke-all, and logout behavior

---

## Phase 1: 2FA Data Model + Auth Core (Days 2-4)

### Tasks (6)

- [x] **Task 1.1**: Add Prisma models/fields for TOTP settings, recovery codes, and step-up challenge state
- [x] **Task 1.2**: Implement TOTP service (secret generation, otpauth URI, verify, skew tolerance) as pure/testable domain logic
- [x] **Task 1.3**: Implement recovery code service (secure generation, hashing, one-time consume, rotation)
- [x] **Task 1.4**: Add auth guards for admin 2FA requirement in NextAuth + DB-session checks
- [x] **Task 1.5**: Add attempt rate limiting and lockout cooldowns for 2FA challenge endpoints
- [x] **Task 1.6**: Ensure secrets are encrypted/hashed at rest and never logged

---

## Phase 2: Enrollment + Challenge UX (Days 4-6)

### Tasks (5)

- [x] **Task 2.1**: Add account UI for 2FA setup (QR/manual key + verification code confirm)
- [x] **Task 2.2**: Add 2FA disable flow with strong confirmation + re-auth guard
- [x] **Task 2.3**: Add login challenge UI for TOTP when user has 2FA enabled
- [x] **Task 2.4**: Add recovery-code challenge fallback during login/step-up
- [x] **Task 2.5**: Enforce admin-first setup path (admins cannot proceed without enrolling 2FA)

---

## Phase 3: Session Controls + Step-up Auth (Days 6-8)

### Tasks (5)

- [x] **Task 3.1**: Add account sessions API for listing active DB sessions
- [x] **Task 3.2**: Add account sessions API for revoke-one / revoke-all / sign-out-all-devices
- [x] **Task 3.3**: Build session management UI in account settings with current-session labeling
- [x] **Task 3.4**: Implement reusable step-up challenge flow for email/password change + delete account
- [x] **Task 3.5**: Wire sensitive APIs to require fresh step-up proof before state-changing actions

---

## Phase 4: Coverage + Hardening (Days 8-10)

### Tasks (6)

- [ ] **Task 4.1**: Unit tests for TOTP generation/verification boundaries and drift handling
- [ ] **Task 4.2**: Unit tests for recovery code one-time use, rotation, and revoke behavior
- [ ] **Task 4.3**: Auth/API tests for admin enforcement, session revocation, and challenge denial cases
- [ ] **Task 4.4**: Component tests for enable/disable flows and step-up prompt UI states
- [ ] **Task 4.5**: E2E coverage for 2FA enable, login verify, disable, recovery fallback, and sign-out-all
- [ ] **Task 4.6**: CI stability pass across Chromium + Firefox for new auth flows

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> TOTP rules, recovery code lifecycle, step-up token freshness checks
- **API/Auth** -> session migration behavior, challenge/verify/revoke paths, admin enforcement, rate-limit behavior
- **Components** -> account 2FA controls, session list/actions, step-up prompt states
- **E2E** -> end-to-end login + step-up + recovery + revoke-all flows on DB-backed sessions

CI must remain green.

---

## Environment and Config

Required/expected:

- `NEXTAUTH_SECRET` (already required)
- `ENABLE_TEST_ENDPOINTS` (for deterministic E2E helpers only)
- `TOTP_ENCRYPTION_KEY` (new; server-only key for encrypted TOTP secret material)

Recommended doc updates in this sprint:

- [ ] Update `.env.example` with 2FA/session-control variables
- [ ] Add auth operations notes for admin bootstrap and 2FA recovery handling

---

## Implementation Guidelines

- Keep 2FA/recovery/session logic in dedicated auth domain services (pure and testable where possible).
- Never store plaintext TOTP secrets or plaintext recovery codes in the database.
- Keep session revocation server-authoritative; no client-side bypass logic.
- Apply strict rate limits on verify endpoints and return generic auth errors.
- Keep step-up state short-lived and scoped to specific sensitive actions.
- Preserve existing credentials and OAuth behavior; security additions must be additive, not regressive.
- Keep user-facing validation feedback toast-based (no inline form errors).
- Maintain strict TypeScript types; no `any`.

---

## File Structure (Expected)

- `prisma/schema.prisma`
- `prisma/migrations/*` (new 2FA/session-control migration)
- `middleware.ts`
- `package.json` (auth adapter dependency update)
- `src/lib/auth/nextauth.ts`
- `src/lib/auth/*` (new TOTP, recovery, step-up, and session-control services)
- `src/lib/auth/__tests__/*`
- `src/app/api/auth/*` (new 2FA challenge/verify endpoints where appropriate)
- `src/app/api/account/route.ts` (step-up enforcement for email/password changes)
- `src/app/api/account/delete-request/route.ts` (step-up enforcement)
- `src/app/api/account/sessions/*` (new list/revoke session routes)
- `src/components/auth/AccountPanel.tsx`
- `src/components/auth/*` (new 2FA + step-up + sessions UI components)
- `src/components/auth/__tests__/*`
- `e2e/auth.spec.ts` and/or `e2e/2fa.spec.ts`
- `.env.example`
- `docs/sprints/sprint-13.2.md`

---

## Locked Implementation Decisions (Confirmed)

1. **Session architecture**: migrate from JWT sessions to DB-backed sessions (NextAuth + Prisma adapter).
2. **Admin rollout**: enforce in non-prod immediately; production rollout is staged with explicit deadline.
3. **Step-up freshness window**: 10 minutes, action-scoped.
4. **Recovery codes**: 10 single-use high-entropy codes, shown once, hashed at rest.
5. **Break-glass policy**: documented, audited manual admin recovery with post-recovery forced session revocation and 2FA re-enrollment.

---

## Definition of Done

1. [ ] Session strategy is migrated from JWT to server-stored DB sessions with stable auth behavior
2. [ ] Optional TOTP 2FA works for all users end-to-end
3. [ ] Admin accounts are blocked from admin access unless 2FA requirements are satisfied
4. [ ] Recovery codes are generated, rotatable, revocable, and one-time consumable
5. [ ] Session management UI lists active sessions and supports sign-out-all-devices
6. [ ] Sensitive account changes require successful step-up authentication
7. [ ] Unit/API/component/E2E tests cover enable/disable, verify, and recovery flows
8. [ ] Auth docs/config are updated for secure operations and onboarding
9. [ ] CI passes from a clean checkout

---
