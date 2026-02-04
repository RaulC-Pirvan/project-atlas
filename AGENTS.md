# Project Atlas - Agent Instructions

## Mission

Build a habit-tracking web app with production-grade quality. Favor clarity, correctness, and maintainability over speed. Be direct and pragmatic.

## Core Product Invariant (do not violate)

A habit is defined independently of dates.

- A habit has: title, optional description, active weekdays.
- A habit appears on every calendar day that matches its active weekdays.
- Daily completion is tracked per habit per date.
- Do not create habits per date.

## Completion Rules (locked)

- History backfill is not a Pro feature.
- Free grace window: users may complete "yesterday" until 02:00 the next day.
- Future dates remain blocked.
- All completion logic must remain timezone-safe and tested.

## Product Decisions (locked)

- Mobile launch uses a WebView wrapper (Capacitor preferred).
- Target stores: Google Play and Apple App Store.
- No native Swift/Kotlin rewrite planned.
- Hardware access is limited to push notifications.

## Monetization (locked)

- Freemium with a one-time Pro purchase (no subscriptions).
- Free tier remains fully useful for habit tracking.
- No ads or ad-driven monetization.

## Pro Focus (planned)

- Advanced insights (trends, consistency, patterns).
- Achievements and milestones (expanded Pro catalogue).
- Smart reminders and push notifications.

## Non-Goals (updated)

- Social features or sharing (for now).
- Heavy gamification beyond streaks and tasteful achievements.
- Native rewrite.
- Ads-based monetization.

## Current State (high-level)

- Next.js App Router + TypeScript + Tailwind CSS (v4).
- PostgreSQL (Neon) + Prisma with `@prisma/adapter-pg` and `pg` pool.
- Auth foundation implemented: signup, verify-email, resend-verification, logout, NextAuth Credentials (JWT sessions), middleware protection.
- Account management API + UI: update email/password/display name/week start; delete account.
- Email verification uses Resend client; debug token capture plus `/api/auth/debug/verification-token` for tests (shared token store for API routes).
- Tests in place: Vitest unit/API tests, auth + habit + calendar + marketing + admin component tests, Playwright auth + habits + calendar + daily completion + admin + marketing + visual regression E2E.
- Playwright E2E runs use a Windows-safe temp dir setup via `playwright.global-setup.ts` to avoid chromium shutdown hangs.
- Daily completion and streaks E2E include retry-safe habit creation to handle transient network resets in Firefox.
- Habit domain models implemented (Habit, HabitSchedule, HabitCompletion) with migrations and seed data.
- Habit domain helpers exist in `src/lib/habits` (dates, schedules, calendar grid, completions, streaks, query helpers, types).
- Habit CRUD API implemented (list/create/update/archive) with a habits UI built around `HabitsPanel` and `HabitForm`.
- Authenticated screens use `AppShell` + `AppSidebar` with Calendar-first navigation on desktop, Habits/Account links, and Sign out.
- Marketing homepage built with hero, benefits, CTA, and auth-aware redirect to `/calendar`.
- Light/dark theme toggle (system default + localStorage persistence) available on marketing/auth/app shells.
- Calendar view implemented with monthly grid, month navigation, selected-day side panel (`?date=YYYY-MM-DD`), daily completion toggles via `/api/completions`, per-day progress indicators, and golden completed-day tiles (black text for contrast).
- Calendar defaults to selecting today on `/calendar` (current month); mobile daily sheet only auto-opens when a `date` param is present.
- Daily completion supports check/uncheck with server-side schedule validation, future-date guard, toast feedback, optimistic updates with rollback, and per-row pending indicators.
- Calendar polish includes motion-safe transitions, reduced-motion fallbacks, and subtle completion sounds on success.
- Loading skeletons implemented for calendar and habits routes.
- API error responses include standardized recovery hints; client messaging uses consistent recovery guidance.
- Keyboard navigation and focus management implemented for calendar grid, daily panel, and mobile sheet.
- Streak logic implemented (current + longest) with timezone-safe normalization and unit tests; streak summary panel lives in the calendar sidebar.
- User profile tracks `weekStart` (sun/mon) and `timezone` (defaults to UTC, no UI yet); week start controls calendar layout, timezone drives date normalization and completion rules.
- Post-login redirect lands on `/calendar` (tests and flows expect Calendar as the default landing page).
- Observability & safety in place: Sentry error tracking (with tunnel), structured API logging, `/api/health` endpoint, global security headers, and auth route rate limiting.
- Admin dashboard implemented with allowlist access, health status panel, user/habit lists, activity log, and admin-safe CSV exports.
- Pro entitlement model implemented (server-side) with `ProEntitlement` table and `/api/pro/entitlement` endpoint.
- Pro upgrade entry points and preview states implemented (calendar and account surfaces), with a dedicated `/pro` page and mobile-first restore purchase placeholder.

## Roadmap (high-level)

- Expand testing and launch readiness (coverage, staging, backups, CI audit).
- Pro entitlement model, upgrade UX, and gating (one-time purchase).
- Advanced insights and analytics (Pro).
- Achievements and milestone system (Pro).
- Smart reminders and push notifications (Pro).
- Today view, quick actions, sorting, and mobile performance work.
- Offline-first completion queue with sync indicators.
- Completion grace window enforcement until 02:00.
- Store launch readiness (privacy, metadata, compliance assets).

## UI Direction (authoritative)

- Visual style: clean, minimalist, black and white foundation with a single golden accent (`#FAB95B`) for fully completed days.
- Layout: generous whitespace, clear typographic hierarchy.
- Components: build reusable primitives so styling changes are centralized.
- Avoid heavy decoration, gradients, or bright accent colors beyond the gold accent.
- Support light/dark themes while preserving the black/white system and gold-only completion accent.

## Codebase Map

- `src/app` - App Router UI and API routes.
- `src/app/page.tsx` - Marketing homepage with auth-aware redirect.
- `src/app/api/auth/*/route.ts` - Auth API routes (signup, verify, resend, logout, debug, NextAuth).
- `src/app/api/health/route.ts` - Health check endpoint.
- `src/app/api/account/route.ts` - Account update (email/password/display name).
- `src/app/api/account/delete-request/route.ts` - Account deletion request (hard delete).
- `src/app/api/habits/route.ts` - Habit list/create API.
- `src/app/api/habits/[id]/route.ts` - Habit update/archive API.
- `src/app/calendar/page.tsx` - Calendar month view + selected-day side panel + legend and progress indicators.
- `src/app/calendar/loading.tsx` - Calendar route loading skeleton.
- `src/app/calendar/[date]/page.tsx` - Legacy daily view route (redirects to calendar with `date` param).
- `src/app/api/completions/route.ts` - Daily completion list/toggle API.
- `src/app/habits/page.tsx` - Habits page (list/create/edit/archive).
- `src/app/habits/loading.tsx` - Habits route loading skeleton.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler.
- `src/app/admin/page.tsx` - Admin dashboard UI (server-authenticated).
- `src/app/api/admin/*/route.ts` - Admin APIs (health, users, habits, activity, exports).
- `src/app/api/pro/entitlement/route.ts` - Pro entitlement API (read-only summary).
- `src/lib/auth` - Auth utilities (hashing, policy, credentials, rate limit, nextauth).
- `src/lib/api` - Shared API error/response helpers, auth services, validation.
- `src/lib/api/habits` - Habit API services and validation.
- `src/lib/api/habits/__tests__` - Habit API service tests.
- `src/components/habits` - Habit UI components and tests.
- `src/components/calendar/CalendarMonth.tsx` - Calendar grid + progress indicators + completed-day styling.
- `src/components/calendar/DailyCompletionPanel.tsx` - Selected-day habit list + completion toggles + completion sounds.
- `src/components/calendar/__tests__` - Calendar UI tests.
- `src/components/streaks/StreakSummaryPanel.tsx` - Streak summary panel (current/longest + empty states).
- `src/components/layout` - App shell layout primitives (AppShell, AppSidebar).
- `src/components/auth/AccountPanel.tsx` - Account settings (including week start).
- `src/components/auth/SignOutButton.tsx` - Sign-out button for authenticated layouts.
- `src/components/marketing` - Marketing homepage layout and sections.
- `src/components/admin` - Admin UI components and tests.
- `src/components/pro` - Pro upgrade entry points and preview cards.
- `src/components/ui/ThemeToggle.tsx` - Light/dark theme toggle (system default + persistence).
- `src/components/ui/Toast.tsx` - Toast notifications (no inline form errors).
- `src/components/ui/Notice.tsx` - Inline notice/alert primitive.
- `src/app/global-error.tsx` - Global error boundary (Sentry capture + fallback UI).
- `src/instrumentation.ts` - Sentry instrumentation hook for Next.js.
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` - Sentry SDK config.
- `src/lib/db/prisma.ts` - Prisma singleton using adapter-pg + pg pool.
- `src/lib/habits` - Habit domain helpers (date normalization, schedules, calendar grids, completions, query helpers, streaks, types).
- `src/lib/habits/calendar.ts` - Month grid generation and weekday mapping.
- `src/lib/habits/weekdays.ts` - Weekday ordering/labels for week start.
- `src/lib/api/habits/completions.ts` - Completion toggle/list services (date/range).
- `src/lib/habits/__tests__` - Habit domain unit tests.
- `src/lib/admin` - Admin access/auth and data services (users, habits, exports).
- `src/lib/pro` - Pro entitlement helpers.
- `src/infra/email` - Resend client, verification email sender, debug token store.
- `src/lib/observability` - Structured logging + API logging wrapper.
- `src/lib/http/securityHeaders.ts` - Shared security headers.
- `src/lib/http/rateLimit.ts` - In-memory rate limiting helper.
- `src/types/next-auth.d.ts` - NextAuth session/JWT type extensions.
- `prisma/schema.prisma` - DB models; migrations in `prisma/migrations`; seed in `prisma/seed.ts`.
- `src/app/api/auth/__tests__` - API auth tests.
- `src/lib/auth/__tests__` - Auth unit tests (password, tokens, policy, credentials).
- `src/components/auth` - Auth/account UI panels and tests.
- `src/components/ui` - Shared UI primitives.
- `src/app/(auth)` - Auth pages (sign-in, sign-up, verify-email).
- `src/app/account/page.tsx` - Account management page.
- `src/app/pro/page.tsx` - Pro upgrade page and preview content.
- `middleware.ts` - Route protection using NextAuth JWT.
- `e2e/daily-completion.spec.ts` - Daily completion E2E flow coverage.
- `e2e/admin.spec.ts` - Admin dashboard E2E coverage.
- `e2e/calendar-visual.spec.ts` - Playwright visual regression coverage for calendar tiles.
- `e2e/marketing-homepage.spec.ts` - Marketing homepage E2E coverage.
- `e2e/streaks.spec.ts` - Streak UI E2E coverage.
- `e2e` - Playwright auth + habits + calendar + daily completion + visual regression E2E tests.
- `playwright.config.ts` - Playwright config (chromium + firefox + visual).
- `playwright.global-setup.ts` - Windows temp dir setup for Playwright runs.
- `docs/context.md` - Canonical product context and constraints.
- `docs/roadmap.md` - Product and engineering roadmap.
- `docs/sprints/sprint-5.1.md` - Sprint plan for marketing homepage.
- `docs/test workflows/sprint-5.1-test-workflows.md` - Marketing homepage + theme test workflows.
- `docs/test workflows/sprint-4.2-test-workflows.md` - UX refinement test workflows.
- `docs/sprints/sprint-6.1.md` - Observability & safety sprint plan.
- `docs/test workflows/sprint-6.1-test-workflows.md` - Observability & safety test workflows.
- `docs/sprints/sprint-6.2.md` - Admin dashboard sprint plan.
- `docs/sprints/sprint-6.3.md` - Testing & launch readiness sprint plan.
- `docs/test workflows/sprint-6.3-test-workflows.md` - Staging and backup test workflows.
- `docs/sprints/sprint-7.1.md` - Atlas Pro gating sprint plan.
- `docs/test workflows/sprint-7.1-test-workflows.md` - Atlas Pro gating test workflows.
- `docs/ops/staging.md` - Staging environment guide.
- `docs/ops/backups.md` - Backup strategy and validation checklist.

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
- Auth route rate limiting is in-memory and per-process (see `src/lib/http/rateLimit.ts` + `src/lib/auth/authRateLimit.ts`).
- Debug verification tokens are stored in-memory and exposed via `/api/auth/debug/verification-token` in non-prod or when `ENABLE_TEST_ENDPOINTS=true`.
- `ENABLE_TEST_ENDPOINTS=true` skips sending real emails.
- `/api/auth/logout` clears NextAuth cookies.
- NextAuth uses JWT sessions and requires `NEXTAUTH_SECRET` in production.

## Expectations for AI Assistance

- Think like a senior engineer and catch architectural mistakes early.
- Prefer phased, test-driven implementation.
- Do not suggest shortcuts that undermine quality.
- For form validation, do not display inline error messages; use toast notifications for user-facing errors.
- Tone: direct and pragmatic, no fluff.
