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
- Auth foundation implemented: signup, verify-email, resend-verification, logout, NextAuth Credentials + Google OAuth, Prisma-backed DB sessions, and middleware protection.
- Security hardening implemented: optional TOTP 2FA for all users, admin 2FA enforcement path, recovery codes (rotate/revoke/consume), active session controls (list/revoke/revoke-all), and step-up verification for sensitive account actions.
- Account management API + UI: update email/password/display name/week start + daily ordering preference; delete account; reminders settings are integrated into the account flow.
- Account self-service data export is implemented: authenticated JSON export at `GET /api/account/exports/self` with strict session-user scoping, download headers, and account page download action.
- Account export hardening is implemented: per-user rate limiting (`3/15m` baseline), durable `UserDataExportAudit` DB records for success/failure, request-id audit correlation, and record-count metadata.
- Email verification uses Resend client; debug token capture plus `/api/auth/debug/verification-token` for tests (shared token store for API routes).
- Tests in place: Vitest unit/API tests, auth + habit + calendar + marketing + support + legal + admin + billing component/API tests, Playwright auth + oauth + two-factor + habits + today + calendar + daily completion + support + legal + admin + marketing + visual regression + Pro billing E2E.
- Playwright E2E runs use a Windows-safe temp dir setup via `playwright.global-setup.ts` to avoid chromium shutdown hangs.
- Auth and admin E2E flows include resilience improvements for current navigation and transient request resets (sidebar/mobile sign-out selectors and retry-safe admin API checks).
- Daily completion and streaks E2E include retry-safe habit creation to handle transient network resets in Firefox.
- Daily completion E2E includes deterministic grace-window checks (`01:59` allow, `02:00` block) via a test-only time override.
- Offline-first completion queue implemented with IndexedDB persistence, dedupe, and timezone-safe validation.
- Offline sync engine implemented with online/startup triggers, backoff retry, and drop-on-rejection with toasts.
- Pending sync indicators now appear in Today and Calendar daily lists plus calendar tiles.
- Habit domain models implemented (Habit, HabitSchedule, HabitCompletion) with migrations and seed data.
- Habit domain helpers exist in `src/lib/habits` (dates, schedules, calendar grid, completions, streaks, query helpers, types).
- Habit CRUD API implemented (list/create/update/archive) plus manual ordering with a habits UI built around `HabitsPanel` and `HabitForm`.
- Habit ordering supports manual order (`sortOrder`), reorder API, and an optional "keep completed at bottom" preference (default on) shared across Today and daily panels.
- Habit scheduling now respects habit creation date: habits only appear on/after their creation date in Today, calendar, and insights.
- Habits page mobile actions are tuned for symmetry (2x2 action grid) and danger-forward delete affordances.
- Authenticated screens use `AppShell` + `AppSidebar` with desktop core routes (`Home/Today/Calendar/Habits/Insights/Achievements/Account`) plus bottom utility actions (`Support` -> `/support#contact-form`, `Legal` -> `/legal/changes`, `Sign out`), and mobile primary nav (`Today/Calendar/Habits`) with animated `More` actions (`Home/Insights/Achievements/Account`) plus utility actions (`Support/Legal/Sign out`).
- Marketing homepage expansion is live with full product narrative, refined non-technical messaging, Free vs Pro comparison, Pro value callouts, and support discoverability entry points.
- Root routing is auth-aware: signed-out users visiting `/` are routed to canonical landing `/landing`, while signed-in users are routed to `/today`.
- Signed-in users can access `/landing` and use two-way navigation (`Home` in app shell, `Go to dashboard` on landing).
- Light/dark theme toggle (system default + localStorage persistence) available on marketing/auth/app shells.
- Shared modal dialogs are rendered via portal to `document.body` so mobile confirmation dialogs stay viewport-centered even inside animated/transformed page containers.
- Public Support Center is implemented at `/support` with FAQ + support form for signed-out and signed-in users, signed-in prefill, motion-safe entrance animations, and route loading skeleton.
- Support form is directly addressable via `#contact-form` and is the sidebar `Support` destination for authenticated users.
- Support intake is implemented via `POST /api/support/tickets` with strict payload validation, honeypot handling, per-IP/per-email rate limits, conditional CAPTCHA policy, DB-authoritative ticket storage, and support inbox email notification routing.
- Support form validation remains toast-first (no inline error text), with field-specific error toasts and invalid-field highlighting.
- Trust & policy surfaces are implemented at `/legal/privacy`, `/legal/terms`, `/legal/refunds`, and `/legal/changes` with shared metadata (`Version`, `Effective date`, `Last updated`) and legal change-log governance content.
- Legal publish-readiness guard is implemented with placeholder detection and optional production enforcement via `ENFORCE_LEGAL_PUBLISH_READY=true`.
- Legal/support discoverability is implemented on landing and account surfaces; `/pro` is retained as a compatibility redirect to `/account`.
- Today view implemented at `/today` for fast daily entry of today's due habits.
- Calendar view implemented with monthly grid, month navigation, selected-day side panel (`?date=YYYY-MM-DD`), daily completion toggles via `/api/completions`, per-day progress indicators, and golden completed-day tiles (black text for contrast).
- Calendar defaults to selecting today on `/calendar` (current month); mobile daily sheet only auto-opens when a `date` param is present.
- Daily completion supports check/uncheck with server-side schedule validation, grace-window enforcement (today + yesterday until 02:00 local), blocked older history/future dates, toast feedback, optimistic updates with rollback, per-row pending indicators, and motion-safe reorder animation.
- Completion-window rules are centralized in `src/lib/habits/completionWindow.ts` and reused by API and offline queue validation.
- Daily completion surfaces now disable toggles immediately for locked dates (`future`, `grace_expired`, `history_blocked`) and show grace-window guidance copy.
- Offline queue + sync integrates with completion toggles; pending state persists across reloads when the API is blocked.
- Calendar polish includes motion-safe transitions, reduced-motion fallbacks, and subtle completion sounds on success.
- Loading skeletons implemented for calendar and habits routes.
- API error responses include standardized recovery hints; client messaging uses consistent recovery guidance.
- Keyboard navigation and focus management implemented for calendar grid, daily panel, and mobile sheet.
- Streak logic implemented (current + longest) with timezone-safe normalization and unit tests; streak summary panel lives in the calendar sidebar.
- User profile tracks `weekStart` (sun/mon), `timezone` (defaults to UTC, no UI yet), and `keepCompletedAtBottom` for daily ordering.
- Post-login redirect lands on `/today` (tests and flows expect Today as the default landing page).
- Observability & safety in place: Sentry error tracking (with tunnel), structured API logging, `/api/health` endpoint, global security headers, and auth route rate limiting.
- Admin dashboard implemented with allowlist access, health status panel, user/habit lists, activity log, support triage panel, and admin-safe CSV exports.
- Admin support triage supports status filtering/pagination, status transitions (`open`/`in_progress`/`resolved`), and ticket context display (requester name/email, subject, message) while avoiding infrastructure-sensitive leakage.
- Admin one-page navigation supports smooth scrolling for section anchors (`Health`, `Users`, `Habits`, `Activity`, `Support`, `Export`) with reduced-motion fallback.
- Sprint 15.1 billing architecture is implemented with provider-aware entitlement contracts, canonical billing event taxonomy, idempotency contracts, and replay-safe projection logic.
- Billing persistence foundation is implemented with append-only `BillingEventLedger`, provider-aware `BillingEntitlementProjection`, and `BillingProductMapping` canonical SKU resolution (`pro_lifetime_v1`).
- Web-first Stripe runtime integration is implemented via hosted checkout (`/api/billing/stripe/checkout`) and signed webhook ingestion (`/api/billing/stripe/webhook`) with canonical event normalization and sanitized failure responses.
- `/api/pro/entitlement` remains the canonical compatibility read API and now resolves from billing projection first with fallback to legacy `ProEntitlement` during migration states.
- Pro upgrade entry points are wired to hosted Stripe checkout, with checkout success/cancel returning to `/account` for toast-first feedback; `/pro` now redirects to `/account` for compatibility.
- Sprint 15.3 mobile billing compliance strategy is documented and currently in review, with completed artifacts for policy matrix, reconciliation contract, fallback/support operations playbook, store-launch checklist, and expanded Phase 3 scenario workflows.
- Advanced Insights v1 implemented (Pro-gated): insights API, aggregated calculations, and Insights UI (cards + heatmap + summary panel).
- Insights heatmap mobile UX improved with horizontal row scrolling, clear Older/Newer direction, intensity legend, and overflow-safe card sizing.
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
- Offline completions E2E added (`e2e/offline-completions.spec.ts`) plus component tests for pending indicators.
- Account export coverage added: export route/API tests, export service/unit tests, account export component tests, and an optional account export E2E smoke (`e2e/account-export.spec.ts`).
- `/api/completions` supports a test-only `x-atlas-test-now` header when `ENABLE_TEST_ENDPOINTS=true` for deterministic date-boundary E2E coverage.
- Test-only debug endpoints exist when `ENABLE_TEST_ENDPOINTS=true`: `/api/pro/debug/grant`, `/api/habits/debug/create`.

## Roadmap (high-level)

- Sprint 15.2 Stripe web billing execution is complete (webhook reliability, billing history links, restore/re-sync).
- Sprint 15.3 mobile billing compliance strategy artifacts are complete and in review; next step is cross-functional approvals and launch-gate execution before store launch.
- Continue post-launch UX polish and reliability hardening (navigation ergonomics, responsive QA, E2E stability).
- Smart reminders and push notifications (Pro).
- Store launch readiness (privacy, metadata, compliance assets).

## UI Direction (authoritative)

- Visual style: clean, minimalist, black and white foundation with a single golden accent (`#FAB95B`) for fully completed days.
- Layout: generous whitespace, clear typographic hierarchy.
- Components: build reusable primitives so styling changes are centralized.
- Avoid heavy decoration, gradients, or bright accent colors beyond the gold accent.
- Support light/dark themes while preserving the black/white system and gold-only completion accent.

## Codebase Map

- `src/app` - App Router UI and API routes.
- `src/app/page.tsx` - Auth-aware root router (`/` -> `/landing` when signed out, `/today` when signed in).
- `src/app/landing/page.tsx` - Canonical marketing landing page route (accessible signed-in and signed-out).
- `src/app/support/page.tsx` - Public support center route (FAQ + support form).
- `src/app/support/loading.tsx` - Support route loading skeleton.
- `src/app/legal/privacy/page.tsx` - Public Privacy policy route.
- `src/app/legal/terms/page.tsx` - Public Terms of service route.
- `src/app/legal/refunds/page.tsx` - Public Refund policy route.
- `src/app/legal/changes/page.tsx` - Public policy changes and governance route.
- `src/app/api/auth/*/route.ts` - Auth API routes (signup, verify, resend, logout, debug, NextAuth).
- `src/app/api/health/route.ts` - Health check endpoint.
- `src/app/api/account/route.ts` - Account update (email/password/display name + daily ordering preference) with step-up proof requirements for sensitive changes.
- `src/app/api/account/delete-request/route.ts` - Account deletion request (hard delete) with step-up proof requirement.
- `src/app/api/account/2fa/*` - Account 2FA APIs (setup/enable/disable/recovery rotate/state).
- `src/app/api/account/sessions/*` - Active session list + revoke one/revoke others/revoke all APIs.
- `src/app/api/account/step-up/*` - Step-up challenge + verification APIs for sensitive account actions.
- `src/app/api/account/exports/self/route.ts` - Authenticated self-service user data export API (JSON attachment, rate limit, audit).
- `src/app/api/account/exports/__tests__/self.route.test.ts` - Account export route tests (auth/scope/rate-limit/audit/error behavior).
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
- `src/app/api/auth/sign-in/route.ts` - Credentials sign-in orchestration with 2FA/admin-enrollment gating.
- `src/app/api/auth/sign-in/2fa/verify/route.ts` - Credentials sign-in 2FA verification endpoint.
- `src/app/api/auth/2fa/challenge/*` - Generic 2FA challenge verification endpoints.
- `src/app/admin/page.tsx` - Admin dashboard UI (server-authenticated).
- `src/app/api/admin/*/route.ts` - Admin APIs (health, users, habits, activity, support, exports).
- `src/app/api/admin/support/route.ts` - Admin support ticket list API (filter + cursor pagination).
- `src/app/api/admin/support/[id]/route.ts` - Admin support ticket status update API.
- `src/app/api/support/tickets/route.ts` - Public support ticket submit API.
- `src/app/api/billing/stripe/checkout/route.ts` - Authenticated hosted Stripe Checkout entrypoint for one-time Pro.
- `src/app/api/billing/stripe/webhook/route.ts` - Stripe webhook ingestion with signature verification and canonical event projection.
- `src/app/api/billing/stripe/__tests__/checkout.route.test.ts` - Checkout endpoint tests (auth, entitlement guard, env failure handling).
- `src/app/api/billing/stripe/__tests__/webhook.route.test.ts` - Webhook tests (signature rejection, canonical mapping, replay dedupe behavior).
- `src/app/api/pro/entitlement/route.ts` - Pro entitlement API (read-only summary).
- `src/app/api/pro/debug/grant/route.ts` - Test-only Pro entitlement grant.
- `src/app/api/habits/debug/create/route.ts` - Test-only habit creation with explicit `createdAt`.
- `src/app/api/insights/route.ts` - Insights API (Pro-gated, aggregated).
- `src/app/insights/page.tsx` - Insights page (cards + heatmap + summary).
- `src/app/api/achievements/route.ts` - Achievements API (summary + unlock persistence).
- `src/app/achievements/page.tsx` - Achievements page (trophy cabinet + milestones).
- `src/app/api/reminders/settings/route.ts` - Reminder settings API (read/update).
- `src/lib/auth` - Auth utilities (hashing, policy, credentials, Google OAuth linking, NextAuth, DB session services, 2FA/recovery, step-up, and rate limits).
- `src/lib/api` - Shared API error/response helpers, auth services, validation.
- `src/lib/api/habits` - Habit API services and validation.
- `src/lib/api/habits/__tests__` - Habit API service tests.
- `src/lib/api/support/validation.ts` - Support API validation schemas.
- `src/lib/api/reminders/validation.ts` - Reminder settings validation schema.
- `src/lib/api/insights/summary.ts` - Insights data service (aggregated).
- `src/lib/api/achievements/summary.ts` - Achievements data service (unlock persistence).
- `src/lib/account/exports` - Self-service export domain helpers (types, payload assembly, rate limit, audit, filename, record counts).
- `src/lib/account/exports/__tests__` - Account export unit/service tests.
- `src/components/habits` - Habit UI components and tests (including manual ordering controls).
- `src/components/calendar/CalendarMonth.tsx` - Calendar grid + progress indicators + completed-day styling.
- `src/components/calendar/DailyCompletionPanel.tsx` - Selected-day habit list + completion toggles + completion ordering + completion sounds.
- `src/components/calendar/__tests__` - Calendar UI tests.
- `src/components/streaks/StreakSummaryPanel.tsx` - Streak summary panel (current/longest + empty states).
- `src/components/layout` - App shell layout primitives (AppShell, AppSidebar with core route nav, bottom utility actions, and mobile More menu).
- `src/components/auth/AccountPanel.tsx` - Account settings (profile, email/password, preferences, reminders, 2FA enrollment/disable/recovery, session management, legal/support links, and step-up prompts).
- `src/components/auth/SignOutButton.tsx` - Sign-out button for authenticated layouts.
- `src/components/legal` - Shared legal layout and legal/support link primitives.
- `src/components/marketing` - Marketing homepage layout and expanded sections (workflow, insights, achievements, reminders, offline reliability, grace window, Free vs Pro, Pro callouts).
- `src/components/admin` - Admin UI components and tests.
- `src/components/admin/AdminSupportPanel.tsx` - Admin support triage UI panel.
- `src/components/support` - Support center UI components and tests.
- `src/components/pro` - Pro upgrade entry points and preview cards.
- `src/components/insights` - Insights UI components (dashboard, snapshot, upgrade card).
- `src/components/achievements` - Achievements UI components (dashboard, upgrade card, toast).
- `src/components/reminders/ReminderSettingsPanel.tsx` - Reminder settings UI panel.
- `src/components/ui/ThemeToggle.tsx` - Light/dark theme toggle (system default + persistence).
- `src/components/ui/Toast.tsx` - Toast notifications (no inline form errors).
- `src/components/ui/Notice.tsx` - Inline notice/alert primitive.
- `src/components/ui/Modal.tsx` - Shared modal primitive (portaled to `document.body` for viewport-anchored overlays).
- `src/app/global-error.tsx` - Global error boundary (Sentry capture + fallback UI).
- `src/instrumentation.ts` - Sentry instrumentation hook for Next.js.
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` - Sentry SDK config.
- `src/lib/db/prisma.ts` - Prisma singleton using adapter-pg + pg pool.
- `src/lib/habits` - Habit domain helpers (date normalization, schedules, calendar grids, completions, query helpers, streaks, types).
- `src/lib/habits/completionWindow.ts` - Shared completion-window policy (today/yesterday cutoff/future/history validation).
- `src/lib/habits/ordering.ts` - Habit ordering helpers (manual order + completed-at-bottom logic).
- `src/lib/habits/offlineQueue.ts` - Offline completion queue with IndexedDB persistence + validation.
- `src/lib/habits/offlineQueueClient.ts` - Client hook for offline queue snapshot.
- `src/lib/habits/offlineSync.ts` - Sync engine for offline completions (retry + drop handling).
- `src/lib/habits/calendar.ts` - Month grid generation and weekday mapping.
- `src/lib/habits/weekdays.ts` - Weekday ordering/labels for week start.
- `src/lib/api/habits/completions.ts` - Completion toggle/list services (date/range).
- `src/app/api/completions/__tests__/route.test.ts` - Completion route tests (including test-only time override behavior).
- `src/lib/habits/__tests__` - Habit domain unit tests.
- `src/lib/reminders` - Reminder domain helpers (time parsing, settings defaults, rules, validation, delivery strategy).
- `src/lib/reminders/__tests__` - Reminder unit tests.
- `src/lib/admin` - Admin access/auth and data services (users, habits, support, exports).
- `src/lib/admin/support.ts` - Admin support ticket query/update services.
- `src/lib/support` - Support domain helpers (policy, retention, hashing, lifecycle, types).
- `src/lib/legal` - Legal policy metadata, change-log, governance steps, and publish guard/enforcement helpers.
- `src/lib/pro` - Pro entitlement helpers.
- `src/lib/billing` - Billing domain contracts, idempotency helpers, canonical events, projection logic, and persistence helpers.
- `src/lib/billing/stripe` - Stripe adapter utilities (config, checkout client, webhook normalization, signature verification).
- `src/lib/billing/__tests__` - Billing domain/persistence/projector unit tests.
- `src/lib/insights` - Insights domain helpers (summary, types, weekdays).
- `src/lib/insights/__tests__` - Insights unit tests.
- `src/lib/achievements` - Achievements domain helpers (catalogue, summary, types).
- `src/lib/achievements/__tests__` - Achievements unit tests.
- `src/infra/email` - Resend client, verification email sender, debug token store.
- `src/infra/email/sendSupportTicketEmail.ts` - Support inbox notification email sender.
- `src/lib/observability` - Structured logging + API logging wrapper.
- `src/lib/http/securityHeaders.ts` - Shared security headers.
- `src/lib/http/rateLimit.ts` - In-memory rate limiting helper.
- `src/types/next-auth.d.ts` - NextAuth session/JWT type extensions.
- `prisma/schema.prisma` - DB models; migrations in `prisma/migrations`; seed in `prisma/seed.ts`.
- `prisma/migrations/20260220103000_add_user_data_export_audit/migration.sql` - Adds `UserDataExportAudit` table and enums.
- `prisma/migrations/20260221130000_add_billing_event_ledger_and_projection/migration.sql` - Adds billing ledger/projection/product-mapping models and constraints.
- `src/app/api/auth/__tests__` - API auth tests.
- `src/app/api/support/__tests__` - Support submit API tests.
- `src/app/api/admin/__tests__/support.route.test.ts` - Admin support list route tests.
- `src/app/api/admin/__tests__/support-id.route.test.ts` - Admin support status route tests.
- `src/lib/auth/__tests__` - Auth unit tests (password, tokens, policy, credentials).
- `src/components/auth` - Auth/account UI panels and tests.
- `src/components/ui` - Shared UI primitives.
- `src/app/(auth)` - Auth pages (sign-in, sign-up, verify-email).
- `src/app/account/page.tsx` - Account management page and primary Pro/billing surface (checkout return logging + status handoff to toasts).
- `src/app/pro/page.tsx` - Legacy compatibility route that redirects to `/account` and forwards checkout query params.
- `middleware.ts` - Route protection using DB session cookies, legacy JWT-session cutover invalidation, and admin 2FA enrollment gating.
- `e2e/auth.spec.ts` - Auth flows E2E coverage (including shared sign-out helper for desktop/mobile nav variants).
- `e2e/oauth.spec.ts` - Google OAuth and credentials fallback E2E coverage.
- `e2e/two-factor.spec.ts` - 2FA enrollment/challenge/recovery/session-revocation E2E coverage.
- `e2e/daily-completion.spec.ts` - Daily completion E2E flow coverage.
- `e2e/admin.spec.ts` - Admin dashboard E2E coverage (including retry-safe API request assertions).
- `e2e/support.spec.ts` - Support center submit/prefill/abuse-path E2E coverage.
- `e2e/legal.spec.ts` - Legal route access + legal/support discoverability E2E coverage.
- `e2e/calendar-visual.spec.ts` - Playwright visual regression coverage for calendar tiles.
- `e2e/marketing-homepage.spec.ts` - Marketing homepage E2E coverage.
- `e2e/insights.spec.ts` - Insights gating E2E coverage.
- `e2e/achievements.spec.ts` - Achievements unlock E2E coverage.
- `e2e/streaks.spec.ts` - Streak UI E2E coverage.
- `e2e/reminders.spec.ts` - Reminder settings + habit reminder times E2E coverage.
- `e2e/account-export.spec.ts` - Account self-service export smoke E2E coverage.
- `e2e/pro-billing.spec.ts` - Optional Pro billing checkout/entitlement smoke coverage.
- `e2e` - Playwright auth + habits + calendar + daily completion + visual regression E2E tests.
- `playwright.config.ts` - Playwright config (chromium + firefox + visual).
- `playwright.global-setup.ts` - Windows temp dir setup for Playwright runs.
- `docs/context.md` - Canonical product context and constraints.
- `docs/roadmap.md` - Product and engineering roadmap.
- `docs/sprints/sprint-5.1.md` - Sprint plan for marketing homepage.
- `docs/sprints/sprint-5.2.md` - Sprint plan for marketing homepage expansion.
- `docs/test workflows/sprint-5.2-test-workflows.md` - Marketing homepage expansion test workflows.
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
- `docs/test workflows/sprint-11.2-test-workflows.md` - Offline-first completions test workflows.
- `docs/sprints/sprint-12.1.md` - Completion grace window sprint plan.
- `docs/test workflows/sprint-12.1-test-workflows.md` - Completion grace window test workflows.
- `docs/sprints/sprint-13.1.md` - Social sign-in (Google OAuth) sprint plan.
- `docs/test workflows/sprint-13.1-test-workflows.md` - Social sign-in (Google OAuth) test workflows.
- `docs/sprints/sprint-13.2.md` - 2FA (TOTP) + session controls sprint plan.
- `docs/test workflows/sprint-13.2-test-workflow.md` - 2FA (TOTP) + session controls test workflow.
- `docs/sprints/sprint-14.1.md` - Support Center + Contact Form sprint plan.
- `docs/test workflows/sprint-14.1-test-workflow.md` - Support Center + Contact Form test workflow.
- `docs/sprints/sprint-14.2.md` - Trust & policy surfaces sprint plan.
- `docs/test workflows/sprint-14.2-test-workflow.md` - Trust & policy surfaces test workflow.
- `docs/sprints/sprint-14.3.md` - User self-service data export sprint plan.
- `docs/test workflows/sprint-14.3-test-workflow.md` - User self-service data export test workflow.
- `docs/sprints/sprint-15.1.md` - Billing architecture and entitlement abstraction sprint plan (completed).
- `docs/sprints/sprint-15.2.md` - Stripe web billing integration sprint plan (execution sprint).
- `docs/sprints/sprint-15.3.md` - Mobile billing compliance strategy sprint plan.
- `docs/test workflows/sprint-15.1-test-workflow.md` - Billing architecture and projection test workflows.
- `docs/test workflows/sprint-15.2-test-workflow.md` - Stripe integration and restore/recovery test workflows.
- `docs/test workflows/sprint-15.3-test-workflow.md` - Mobile billing compliance test workflows (including Phase 3 fallback and reconciliation simulation scenarios).
- `docs/ops/staging.md` - Staging environment guide.
- `docs/ops/backups.md` - Backup strategy and validation checklist.
- `docs/ops/legal-publish-checklist.md` - Legal publish readiness checklist and blockers.
- `docs/ops/reminders-delivery.md` - Reminder delivery strategy (push-ready).
- `docs/ops/billing-source-of-truth.md` - Billing source-of-truth boundaries and ownership model.
- `docs/ops/billing-launch-defaults.md` - One-time Pro launch defaults, provider/event policy, and required config.
- `docs/ops/billing-pricing-gate.md` - Pricing gate checklist and decision artifact template.
- `docs/ops/billing-launch-freeze-policy.md` - Pre-launch billing freeze policy and emergency exception rules.
- `docs/ops/billing-subscription-migration.md` - Future subscription migration path (schema/event compatibility, UX out of scope).
- `docs/ops/billing-legal-consistency-review.md` - Billing/legal/support consistency review artifact.
- `docs/ops/billing-compliance-matrix.md` - Platform-region billing policy matrix and governance contract.
- `docs/ops/billing-reconciliation.md` - Multi-provider reconciliation strategy and conflict-safe resolution contract.
- `docs/ops/billing-support-playbook.md` - Billing fallback behavior, support triage, escalation, and audit requirements.
- `docs/ops/store-launch-billing-checklist.md` - Store-launch billing readiness, scenario packs, sign-off, and publish gate checklist.

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
- NextAuth uses Prisma adapter with DB-backed sessions (`session.strategy='database'`) and requires `NEXTAUTH_SECRET` in production.
- Middleware invalidates legacy JWT-shaped session cookies from pre-migration sessions and forces one-time re-login.
- TOTP secrets are encrypted at rest and require `TOTP_ENCRYPTION_KEY` (32-byte key material in hex/base64).
- Admin 2FA enforcement is controlled by `ENABLE_ADMIN_2FA_ENFORCEMENT`, `ADMIN_2FA_ENFORCE_FROM`, and `DISABLE_ADMIN_2FA_ENFORCEMENT`.

## Expectations for AI Assistance

- Think like a senior engineer and catch architectural mistakes early.
- Prefer phased, test-driven implementation.
- Do not suggest shortcuts that undermine quality.
- For form validation, do not display inline error messages; use toast notifications for user-facing errors.
- Tone: direct and pragmatic, no fluff.
