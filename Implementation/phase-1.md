# Phase 1 — Authentication & User Lifecycle

## Goal
Implement secure, production-grade authentication and user account management.

---

## Features
- User registration
- Email verification (Resend)
- Login / logout
- Protected routes
- Account settings
- Account deletion request (soft delete)
- Placeholder avatar
- Groundwork for optional 2FA

---

## Tasks

### Authentication
- Integrate Auth.js / NextAuth.
- Configure database adapter.
- Define auth tables in Prisma.

### Email Verification
- Implement verification token system.
- Integrate Resend.
- Block unverified users from app access.

### Authorization
- Protect authenticated routes.
- Middleware / server-side guards.

### Account Management
- Settings page:
  - update user details
- Placeholder avatar icon.
- Account deletion request flow (soft delete).

### Security
- Rate limit auth-related endpoints.
- Harden error handling.

---

## Testing Requirements
- Unit tests:
  - validators
  - token helpers
- Integration tests:
  - user creation
  - email verification
  - session creation
- E2E tests:
  - signup
  - verify email (mocked)
  - login
  - access protected route

---

## Definition of Done
- Unverified users cannot access app.
- Auth flows work end-to-end.
- Settings page functional.
- CI green and deployable.
