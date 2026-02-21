# AI CONTEXT — PROJECT ATLAS (Updated)

## Project Overview

Project Atlas is a **habit-tracking application** built with a **production-grade, corporate-quality stack**.
The goal is not a toy app, but a clean, scalable, well-tested system with strong engineering discipline.

Target users:

- Individuals tracking daily/weekly habits
- Emphasis on consistency, streaks, visual feedback, and long-term habit building

The app currently exists as a **dynamic web application**, with a planned **mobile launch via WebView wrapper** (Google Play + App Store).

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

## Functional Scope (Current + Planned)

### Authentication (Implemented)

- Email/password account creation
- Email verification (Resend)
- Login / logout
- Account update (basic profile info + week start)
- Account deletion request (hard delete)
- No user-uploaded avatars (use default placeholder icon)
- NextAuth Credentials + JWT sessions
- Auth middleware route protection

---

### Habit Tracking (Implemented)

- Unlimited habits per user
- Habits active on selected weekdays
- No per-date habit creation
- Completion tracked per habit per date
- Habit CRUD (create/update/archive)
- Schedule validation enforced server-side

---

### Calendar & UX (Implemented)

- Monthly calendar view
- Clicking a day shows all habits active that day
- Users check off completed habits
- Day tile visually fills (golden state) when all habits completed
- Completion sound on success (subtle)
- Streak tracking:
  - daily / current
  - longest

---

## Mobile Strategy (NEW — LOCKED IN)

Atlas will be launched as a mobile app using a **WebView wrapper approach** (recommended: **Capacitor**).

Goals:

- Publish on **Google Play Store**
- Publish on **Apple App Store**
- Avoid rewriting the app for native iOS/Android
- No hardware access required beyond **push notifications**

---

## Monetisation Strategy (NEW — LOCKED IN)

Atlas will use a **Freemium + One-Time Purchase** model:

- Free tier remains fully useful for habit tracking
- Pro tier is a **one-time payment unlock** for premium features
- No Google Ads or ad-driven monetisation

Launch non-goal:

- Subscription plans are not user-facing for Sprint 15 launch.
- Subscription schema compatibility is allowed, but subscription purchase UX remains disabled.

Monetisation principle:

- Upgrade should be driven by real value (insights + motivation + convenience)
- Avoid aggressive gating that makes Free feel broken

---

## Atlas Pro — Premium Features (Planned)

The Pro tier will focus on features that create a strong incentive to upgrade:

### 1) Advanced Insights (Pro)

- Premium analytics for consistency and progress
- Heatmaps / trends / patterns (privacy-respecting)
- Motivational breakdowns and progress summaries

### 2) Achievements + Milestone System (Pro)

Inspired by apps like QuitNow:

- Achievement unlocks (basic set in Free, expanded set in Pro)
- Milestones and progress timelines (per habit and global)
- Trophy-style cabinet / achievement screen (minimalist, not cringe)

### 3) Smart Reminders + Push Notifications (Pro)

- Smart reminders (per habit)
- Daily digest reminders
- Quiet hours
- Snooze
- Streak rescue nudges

### 4) Habit Notes (Optional / TBD)

- Notes per habit and/or per day
- Reflection support without turning into a journaling app
- Gating (Free vs Pro) will be decided later

---

## Completion Rule Update (NEW)

History backfill should **NOT** be a Pro feature.

Instead, Atlas will support a **Free grace window**:

- Users may complete "yesterday" until **02:00 the next day**
- This reduces frustration and reflects real-life behaviour (people forget at night)
- Must remain timezone-safe and tested

---

## Enhancements & UX Improvements (Planned)

These improvements are targeted for mobile readiness, retention, and polish:

### Mobile & UX

- **Today View / Daily dashboard** for fast daily usage
- Quick actions:
  - fast completion toggles
  - undo last action
- Habit ordering / pinning / sorting
- Schedule UX presets:
  - Weekdays
  - Every day
  - Weekend

### Reliability & Performance

- Offline-first completion toggles:
  - queue changes locally
  - sync when network returns
  - show pending sync indicators

### Engagement

- Streak protection hints (non-annoying)
- Weekly review / monthly recap summaries

### Launch Readiness

- Help / FAQ pages
- Privacy Policy + Terms pages
- Soft “Rate the app” prompts after win moments
- Pro preview mode (teaser experience without aggressive popups)

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
- **Sentry** for error tracking + observability

---

## Quality & Engineering Standards

This project follows **corporate-level discipline**:

- ESLint (strict, no `any`)
- Prettier (enforced)
- TypeScript `strict`
- Unit tests for core domain logic
- E2E tests for core user flows
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

### Database & Auth (Implemented)

- Prisma configured for Neon
- Auth foundation implemented with NextAuth Credentials
- Email verification implemented with Resend
- Account management implemented
- Route protection via middleware
- Tests implemented:
  - unit tests (domain + API services)
  - E2E tests (auth + habits + calendar + daily completion + streaks + marketing)

### Habit Domain (Implemented)

- Habit, HabitSchedule, HabitCompletion models
- Habit CRUD API and UI
- Calendar grid logic + schedule mapping
- Completion toggles with validation
- Streak logic (current + longest), timezone-safe

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

## Non-Goals (Updated)

- Social features (for now)
- Sharing (for now)
- Heavy gamification beyond streaks + tasteful achievements
- Native rewrite (Swift/Kotlin) — not planned
- Ads-based monetisation — not planned

---

## Reminder

This project values **clarity, correctness, and long-term maintainability** over speed.
If a decision feels “hacky”, it’s probably wrong.

End of context.
