# AI CONTEXT — PROJECT ATLAS

## Project Overview

Project Atlas is a **habit-tracking web application** built with a **production-grade, corporate-quality stack**.
The goal is not a toy app, but a clean, scalable, well-tested system with strong engineering discipline.

Target users:

- Individuals tracking daily/weekly habits
- Emphasis on consistency, streaks, and visual feedback

The app is currently **pre-MVP**, focusing on infrastructure, quality, and architecture first.

---

## Core Product Concept (CRITICAL)

A **habit is defined independently of dates**.

- A habit has:
  - title
  - optional description
  - active days of week (Mon–Sun)

- A habit automatically appears on **every calendar day** that matches its active weekdays.
- Users do NOT create habits per date.
- Daily completion is tracked separately per habit per date.

Example:

> Habit: "Read 10 pages"  
> Active days: Mon–Sun  
> → Appears on **every day of the calendar**  
> → Each day can be checked independently

This mental model must never be violated.

---

## Functional Scope (Planned)

### Authentication

- Email/password account creation
- Email verification (Resend planned)
- Login / logout
- Account update (basic profile info)
- Account deletion request
- No user-uploaded avatars (use default placeholder icon)

### Habit Tracking

- Unlimited habits per user
- Habits active on selected weekdays
- No per-date habit creation
- Completion tracked per habit per date

### Calendar & UX

- Monthly calendar view
- Clicking a day shows all habits active that day
- Users check off completed habits
- Day tile visually fills (golden state) when all habits completed
- Completion sound on full completion
- Streak tracking (daily / longest / current)

---

## Tech Stack (LOCKED IN)

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL (Neon)**
- **Prisma**
- **npm** (NOT pnpm)
- **Vitest** for unit tests
- **Playwright** for E2E tests
- **GitHub Actions** for CI/CD

---

## Quality & Engineering Standards

This project follows **corporate-level discipline**:

- ESLint (strict, no `any`)
- Prettier (enforced)
- TypeScript `strict`
- Unit tests for core domain logic
- E2E smoke tests
- CI runs from clean checkout
- CI gates merges (lint, typecheck, tests, build, e2e)

Local git hooks were intentionally **removed** due to Windows PATH issues.
Enforcement happens via:

- `npm run ci`
- GitHub Actions
- Branch protection rules

No time should be wasted fighting local hooks again unless absolutely necessary.

---

## Repository State (Current)

### Infrastructure

- Next.js project scaffolded (App Router)
- ESLint + Prettier configured and enforced
- Vitest + Playwright set up with smoke tests
- CI pipeline configured and green:
  - lint
  - typecheck
  - unit tests
  - prettier check
  - build
  - e2e tests

### Database & Auth Foundation (Sprint 1.1 — Phase 1 ✅ COMPLETED)

- Prisma configured for Neon
- Auth-related Prisma models implemented:
  - User
  - Account
  - Session
  - VerificationToken (NextAuth)
  - EmailVerificationToken (custom, hashed)
  - PasswordResetToken
- Prisma client singleton pattern implemented (Next.js-safe)
- Database migration created and applied (`auth_baseline`)
- Seed script implemented:
  - 1 verified user
  - 1 unverified user
- Domain-level auth logic implemented and unit tested:
  - Password hashing & verification (bcrypt)
  - Token hashing & expiry handling
  - Email verification flow (pure service + mocked Prisma)
  - Login policy (verified + not soft-deleted)
- ESLint clean (no `any`, no rule suppression)
- Domain tests pass deterministically (no DB dependency)

---

## Important Decisions & Lessons Learned

- **Habits are intent, not instances** — dates belong only to completions
- **No pnpm** — npm only
- **No Husky / Lefthook / hooks** — CI-only enforcement
- Windows PATH + Git hook tooling is unreliable → avoid
- Editor warnings ≠ CLI truth; CLI is the source of truth
- Domain logic must be:
  - pure
  - testable
  - decoupled from Prisma
- Migrations are code:
  - `migrate dev` = authoring
  - `migrate deploy` = CI / prod
- Auth logic is tested **before** wiring NextAuth callbacks

---

## Expectations From the AI (YOU)

When responding:

- Think like a **senior software architect**
- Prefer clear mental models over premature code
- Be opinionated, but justified
- Catch architectural mistakes early
- Guide implementation in **phases / sprints**
- Assume tests, CI, and maintainability matter
- Do NOT re-explain basic web dev concepts unless asked
- Do NOT suggest shortcuts that undermine quality

Tone:

- Direct
- Pragmatic
- Slightly aggressive if needed
- No hand-holding fluff

---

## Immediate Next Logical Steps

### Sprint 1.1 — Phase 2 (Next)

1. Wire **NextAuth Credentials provider** to domain logic:
   - `verifyPassword`
   - `canLogin` (reject unverified / soft-deleted)
2. Enforce email verification in auth flow
3. Implement email verification API route (Resend integration)
4. Add auth middleware for route protection
5. Add E2E auth flow tests

### After Auth

6. Habit domain schema (Habit, HabitSchedule, HabitCompletion)
7. Calendar domain logic (date ↔ weekday mapping)
8. Habit completion & streak calculation
9. Calendar/day UX state management

---

## Non-Goals (for now)

- Social features
- Sharing
- Mobile app (web only, responsive)
- Gamification beyond streaks
- Offline mode

---

## Reminder

This project values **clarity, correctness, and long-term maintainability** over speed.
If a decision feels “hacky”, it’s probably wrong.

End of context.
