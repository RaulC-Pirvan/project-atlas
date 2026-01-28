# Project Atlas - Agent Instructions

## Mission

Build a habit-tracking web app with production-grade quality. Favor clarity, correctness, and maintainability over speed. Be direct and pragmatic.

## Core Product Invariant (do not violate)

A habit is defined independently of dates.

- A habit has: title, optional description, active weekdays.
- A habit appears on every calendar day that matches its active weekdays.
- Daily completion is tracked per habit per date.
- Do not create habits per date.

## Current State (high-level)

- Next.js App Router + TypeScript + Tailwind CSS (v4).
- PostgreSQL (Neon) + Prisma with `@prisma/adapter-pg` and `pg` pool.
- Auth foundation implemented: signup, verify-email, resend-verification, logout, NextAuth Credentials (JWT sessions), middleware protection.
- Account management API + UI: update email/password/display name/week start; delete account.
- Email verification uses Resend client; debug token capture plus `/api/auth/debug/verification-token` for tests.
- Tests in place: Vitest unit/API tests, auth + habit + calendar component tests, Playwright auth + habits + calendar E2E.
- Habit domain models implemented (Habit, HabitSchedule, HabitCompletion) with migrations and seed data.
- Habit domain helpers exist in `src/lib/habits` (dates, schedules, completions, streaks, query helpers, types).
- Habit CRUD API implemented (list/create/update/archive) with a habits UI built around `HabitsPanel` and `HabitForm`.
- Authenticated screens use `AppShell` + `AppSidebar` with Calendar/Habits/Account navigation and Sign out.
- Calendar view implemented with monthly grid, month navigation, and selected-day side panel (`?date=YYYY-MM-DD`).
- User preferences include `weekStart` (sun/mon), used in habit scheduling UI and adjustable in account settings.

## UI Direction (authoritative)

- Visual style: clean, minimalist, black and white only.
- Layout: generous whitespace, clear typographic hierarchy.
- Components: build reusable primitives so styling changes are centralized.
- Avoid heavy decoration, gradients, or bright accent colors.

## Codebase Map

- `src/app` - App Router UI and API routes.
- `src/app/page.tsx` - Marketing/landing page (pre-MVP copy).
- `src/app/api/auth/*/route.ts` - Auth API routes (signup, verify, resend, logout, debug, NextAuth).
- `src/app/api/account/route.ts` - Account update (email/password/display name).
- `src/app/api/account/delete-request/route.ts` - Account deletion request (hard delete).
- `src/app/api/habits/route.ts` - Habit list/create API.
- `src/app/api/habits/[id]/route.ts` - Habit update/archive API.
- `src/app/calendar/page.tsx` - Calendar month view + selected-day side panel.
- `src/app/calendar/[date]/page.tsx` - Legacy daily view route (redirects to calendar with `date` param).
- `src/app/habits/page.tsx` - Habits page (list/create/edit/archive).
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler.
- `src/lib/auth` - Auth utilities (hashing, policy, credentials, rate limit, nextauth).
- `src/lib/api` - Shared API error/response helpers, auth services, validation.
- `src/lib/api/habits` - Habit API services and validation.
- `src/lib/api/habits/__tests__` - Habit API service tests.
- `src/components/habits` - Habit UI components and tests.
- `src/components/calendar` - Calendar UI components and tests.
- `src/components/layout` - App shell layout primitives (AppShell, AppSidebar).
- `src/components/auth/AccountPanel.tsx` - Account settings (including week start).
- `src/components/auth/SignOutButton.tsx` - Sign-out button for authenticated layouts.
- `src/lib/db/prisma.ts` - Prisma singleton using adapter-pg + pg pool.
- `src/lib/habits` - Habit domain helpers (date normalization, schedules, calendar grids, completions, query helpers, streaks, types).
- `src/lib/habits/__tests__` - Habit domain unit tests.
- `src/infra/email` - Resend client, verification email sender, debug token store.
- `src/types/next-auth.d.ts` - NextAuth session/JWT type extensions.
- `prisma/schema.prisma` - DB models; migrations in `prisma/migrations`; seed in `prisma/seed.ts`.
- `src/app/api/auth/__tests__` - API auth tests.
- `src/lib/auth/__tests__` - Auth unit tests (password, tokens, policy, credentials).
- `src/components/auth` - Auth/account UI panels and tests.
- `src/components/ui` - Shared UI primitives.
- `src/app/(auth)` - Auth pages (sign-in, sign-up, verify-email).
- `src/app/account/page.tsx` - Account management page.
- `middleware.ts` - Route protection using NextAuth JWT.
- `e2e` - Playwright auth + habits + calendar E2E tests.

## Engineering Standards

- TypeScript strict; no `any`.
- ESLint + Prettier enforced.
- Domain logic should be pure and testable; avoid tight coupling to Prisma types.
- CI is the enforcement mechanism; do not reintroduce Git hooks.

## Tooling and Commands

- Use `npm` only (no pnpm).
- Common scripts: `npm run dev`, `npm run start`, `npm run start:test`, `npm run lint`, `npm run lint:next`, `npm run typecheck`, `npm test`, `npm run e2e`, `npm run format:check`, `npm run build`.
- Extra scripts: `npm run test:watch`, `npm run test:coverage`, `npm run e2e:ui`, `npm run format`, `npm run lint:fix`, `npm run ci`, `npm run ci:full`.
- Prisma scripts: `npm run prisma:generate`, `npm run prisma:seed`.
- Prisma: `migrate dev` for authoring, `migrate deploy` for CI/prod.

## Auth Policy Notes

- Login requires verified email and not soft-deleted (see `src/lib/auth/policy.ts`).
- Email verification uses hashed tokens (see `src/lib/auth/emailVerification.ts`).
- Resend verification rotates tokens; email updates reset `emailVerified` and trigger a new link.
- Login rate limiting is in-memory and per-process (see `src/lib/auth/loginRateLimit.ts`).
- Debug verification tokens are stored in-memory and exposed via `/api/auth/debug/verification-token` in non-prod or when `ENABLE_TEST_ENDPOINTS=true`.
- `ENABLE_TEST_ENDPOINTS=true` skips sending real emails.
- `/api/auth/logout` clears NextAuth cookies.
- NextAuth uses JWT sessions and requires `NEXTAUTH_SECRET` in production.

## Expectations for AI Assistance

- Think like a senior engineer and catch architectural mistakes early.
- Prefer phased, test-driven implementation.
- Do not suggest shortcuts that undermine quality.
- For form validation, do not display inline error messages; use toast notifications for user-facing errors.
