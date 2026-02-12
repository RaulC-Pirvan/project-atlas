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
- Account management API + UI: update email/password/display name/week start + daily ordering preference; delete account.
- Email verification uses Resend client; debug token capture plus `/api/auth/debug/verification-token` for tests (shared token store for API routes).
- Tests in place: Vitest unit/API tests, auth + habit + calendar + marketing + admin component tests, Playwright auth + habits + today + calendar + daily completion + admin + marketing + visual regression E2E.
- Playwright E2E runs use a Windows-safe temp dir setup via `playwright.global-setup.ts` to avoid chromium shutdown hangs.
- Daily completion and streaks E2E include retry-safe habit creation to handle transient network resets in Firefox.
- Habit domain models implemented (Habit, HabitSchedule, HabitCompletion) with migrations and seed data.
- Habit domain helpers exist in `src/lib/habits` (dates, schedules, calendar grid, completions, streaks, query helpers, types).
- Habit CRUD API implemented (list/create/update/archive) plus manual ordering with a habits UI built around `HabitsPanel` and `HabitForm`.
- Habit ordering supports manual order (`sortOrder`), reorder API, and an optional "keep completed at bottom" preference (default on) shared across Today and daily panels.
- Habit scheduling now respects habit creation date: habits only appear on/after their creation date in Today, calendar, and insights.
- Authenticated screens use `AppShell` + `AppSidebar` with Today-first navigation on desktop, plus Calendar/Habits/Account links and Sign out.
- Marketing homepage built with hero, benefits, CTA, and auth-aware redirect to `/today`.
- Light/dark theme toggle (system default + localStorage persistence) available on marketing/auth/app shells.
- Today view implemented at `/today` for fast daily entry of today's due habits.
- Calendar view implemented with monthly grid, month navigation, selected-day side panel (`?date=YYYY-MM-DD`), daily completion toggles via `/api/completions`, per-day progress indicators, and golden completed-day tiles (black text for contrast).
- Calendar defaults to selecting today on `/calendar` (current month); mobile daily sheet only auto-opens when a `date` param is present.
- Daily completion supports check/uncheck with server-side schedule validation, future-date guard, toast feedback, optimistic updates with rollback, per-row pending indicators, and motion-safe reorder animation.
- Calendar polish includes motion-safe transitions, reduced-motion fallbacks, and subtle completion sounds on success.
- Loading skeletons implemented for calendar and habits routes.
- API error responses include standardized recovery hints; client messaging uses consistent recovery guidance.
- Keyboard navigation and focus management implemented for calendar grid, daily panel, and mobile sheet.
- Streak logic implemented (current + longest) with timezone-safe normalization and unit tests; streak summary panel lives in the calendar sidebar.
- User profile tracks `weekStart` (sun/mon), `timezone` (defaults to UTC, no UI yet), and `keepCompletedAtBottom` for daily ordering.
- Post-login redirect lands on `/today` (tests and flows expect Today as the default landing page).
- Observability & safety in place: Sentry error tracking (with tunnel), structured API logging, `/api/health` endpoint, global security headers, and auth route rate limiting.
- Admin dashboard implemented with allowlist access, health status panel, user/habit lists, activity log, and admin-safe CSV exports.
- Pro entitlement model implemented (server-side) with `ProEntitlement` table and `/api/pro/entitlement` endpoint.
- Pro upgrade entry points and preview states implemented (calendar and account surfaces), with a dedicated `/pro` page and mobile-first restore purchase placeholder.
- Advanced Insights v1 implemented (Pro-gated): insights API, aggregated calculations, and Insights UI (cards + heatmap + summary panel).
- Calendar now shows a Pro-only Insights snapshot card; Free users see an upgrade card.
- Achievements System v1 implemented with expanded Free/Pro catalogue, per-habit milestones, and a trophy cabinet UI.
- Achievements are persisted and locked on unlock (cannot regress), backed by `AchievementUnlock` and `HabitMilestoneUnlock`.
- Achievements UI includes search, filters, tabs (Achievements/Milestones), and a "Next Up" panel.
- Achievement progress/unlock toasts are shown on completion, clickable to dismiss; unlocks play a distinct ding.
- Reminder Scheduling v1 implemented: reminder data model, settings API, and reminder UI on Account.
- Per-habit reminders support up to 3 daily times (24-hour `HH:MM` format), stored on habits and shown in the habit list.
- Reminder settings include daily digest, quiet hours, and snooze defaults (24-hour `HH:MM` inputs), with server-side validation + rate limiting.
- Reminder delivery strategy documented (push-ready, polling window, dedupe rules).
- Reminder unit tests and E2E tests added (`e2e/reminders.spec.ts`).
- Test-only debug endpoints exist when `ENABLE_TEST_ENDPOINTS=true`: `/api/pro/debug/grant`, `/api/habits/debug/create`.

## Roadmap (high-level)

- Expand testing and launch readiness (coverage, staging, backups, CI audit).
- Pro entitlement model, upgrade UX, and gating (one-time purchase).
- Advanced insights and analytics (Pro).
- Achievements and milestone system (Pro).
- Smart reminders and push notifications (Pro).
- Quick actions, schedule presets, and mobile performance work.
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
- `src/app/page.tsx` - Marketing homepage with auth-aware redirect to `/today`.
- `src/app/api/auth/*/route.ts` - Auth API routes (signup, verify, resend, logout, debug, NextAuth).
- `src/app/api/health/route.ts` - Health check endpoint.
- `src/app/api/account/route.ts` - Account update (email/password/display name + daily ordering preference).
- `src/app/api/account/delete-request/route.ts` - Account deletion request (hard delete).
- `src/app/api/habits/route.ts` - Habit list/create API.
- `src/app/api/habits/[id]/route.ts` - Habit update/archive API.
- `src/app/api/habits/order/route.ts` - Habit reorder API.
- `src/app/calendar/page.tsx` - Calendar month view + selected-day side panel + legend and progress indicators.
- `src/app/calendar/loading.tsx` - Calendar route loading skeleton.
- `src/app/calendar/[date]/page.tsx` - Legacy daily view route (redirects to calendar with `date` param).
- `src/app/today/page.tsx` - Today view for fast daily entry.
- `src/app/api/completions/route.ts` - Daily completion list/toggle API.
- `src/app/habits/page.tsx` - Habits page (list/create/edit/archive).
- `src/app/habits/loading.tsx` - Habits route loading skeleton.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler.
- `src/app/admin/page.tsx` - Admin dashboard UI (server-authenticated).
- `src/app/api/admin/*/route.ts` - Admin APIs (health, users, habits, activity, exports).
- `src/app/api/pro/entitlement/route.ts` - Pro entitlement API (read-only summary).
- `src/app/api/pro/debug/grant/route.ts` - Test-only Pro entitlement grant.
- `src/app/api/habits/debug/create/route.ts` - Test-only habit creation with explicit `createdAt`.
- `src/app/api/insights/route.ts` - Insights API (Pro-gated, aggregated).
- `src/app/insights/page.tsx` - Insights page (cards + heatmap + summary).
- `src/app/api/achievements/route.ts` - Achievements API (summary + unlock persistence).
- `src/app/achievements/page.tsx` - Achievements page (trophy cabinet + milestones).
- `src/app/api/reminders/settings/route.ts` - Reminder settings API (read/update).
- `src/lib/auth` - Auth utilities (hashing, policy, credentials, rate limit, nextauth).
- `src/lib/api` - Shared API error/response helpers, auth services, validation.
- `src/lib/api/habits` - Habit API services and validation.
- `src/lib/api/habits/__tests__` - Habit API service tests.
- `src/lib/api/reminders/validation.ts` - Reminder settings validation schema.
- `src/lib/api/insights/summary.ts` - Insights data service (aggregated).
- `src/lib/api/achievements/summary.ts` - Achievements data service (unlock persistence).
- `src/components/habits` - Habit UI components and tests (including manual ordering controls).
- `src/components/calendar/CalendarMonth.tsx` - Calendar grid + progress indicators + completed-day styling.
- `src/components/calendar/DailyCompletionPanel.tsx` - Selected-day habit list + completion toggles + completion ordering + completion sounds.
- `src/components/calendar/__tests__` - Calendar UI tests.
- `src/components/streaks/StreakSummaryPanel.tsx` - Streak summary panel (current/longest + empty states).
- `src/components/layout` - App shell layout primitives (AppShell, AppSidebar).
- `src/components/auth/AccountPanel.tsx` - Account settings (including week start + daily ordering preference).
- `src/components/auth/SignOutButton.tsx` - Sign-out button for authenticated layouts.
- `src/components/marketing` - Marketing homepage layout and sections.
- `src/components/admin` - Admin UI components and tests.
- `src/components/pro` - Pro upgrade entry points and preview cards.
- `src/components/insights` - Insights UI components (dashboard, snapshot, upgrade card).
- `src/components/achievements` - Achievements UI components (dashboard, upgrade card, toast).
- `src/components/reminders/ReminderSettingsPanel.tsx` - Reminder settings UI panel.
- `src/components/ui/ThemeToggle.tsx` - Light/dark theme toggle (system default + persistence).
- `src/components/ui/Toast.tsx` - Toast notifications (no inline form errors).
- `src/components/ui/Notice.tsx` - Inline notice/alert primitive.
- `src/app/global-error.tsx` - Global error boundary (Sentry capture + fallback UI).
- `src/instrumentation.ts` - Sentry instrumentation hook for Next.js.
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` - Sentry SDK config.
- `src/lib/db/prisma.ts` - Prisma singleton using adapter-pg + pg pool.
- `src/lib/habits` - Habit domain helpers (date normalization, schedules, calendar grids, completions, query helpers, streaks, types).
- `src/lib/habits/ordering.ts` - Habit ordering helpers (manual order + completed-at-bottom logic).
- `src/lib/habits/calendar.ts` - Month grid generation and weekday mapping.
- `src/lib/habits/weekdays.ts` - Weekday ordering/labels for week start.
- `src/lib/api/habits/completions.ts` - Completion toggle/list services (date/range).
- `src/lib/habits/__tests__` - Habit domain unit tests.
- `src/lib/reminders` - Reminder domain helpers (time parsing, settings defaults, rules, validation, delivery strategy).
- `src/lib/reminders/__tests__` - Reminder unit tests.
- `src/lib/admin` - Admin access/auth and data services (users, habits, exports).
- `src/lib/pro` - Pro entitlement helpers.
- `src/lib/insights` - Insights domain helpers (summary, types, weekdays).
- `src/lib/insights/__tests__` - Insights unit tests.
- `src/lib/achievements` - Achievements domain helpers (catalogue, summary, types).
- `src/lib/achievements/__tests__` - Achievements unit tests.
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
- `e2e/insights.spec.ts` - Insights gating E2E coverage.
- `e2e/achievements.spec.ts` - Achievements unlock E2E coverage.
- `e2e/streaks.spec.ts` - Streak UI E2E coverage.
- `e2e/reminders.spec.ts` - Reminder settings + habit reminder times E2E coverage.
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
- `docs/sprints/sprint-8.1.md` - Advanced Insights v1 sprint plan.
- `docs/test workflows/sprint-8.1-test-workflows.md` - Advanced Insights v1 test workflows.
- `docs/sprints/sprint-9.1.md` - Achievements System v1 sprint plan.
- `docs/test workflows/sprint-9.1-test-workflows.md` - Achievements System v1 test workflows.
- `docs/test workflows/sprint-10.1-test-workflows.md` - Reminder Scheduling v1 test workflows.
- `docs/sprints/sprint-11.1.md` - Today view + ordering sprint plan.
- `docs/test workflows/sprint-11.1-test-workflows.md` - Today view + ordering test workflows.
- `docs/ops/staging.md` - Staging environment guide.
- `docs/ops/backups.md` - Backup strategy and validation checklist.
- `docs/ops/reminders-delivery.md` - Reminder delivery strategy (push-ready).

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
