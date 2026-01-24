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
→ Appears on **every day of the calendar**  
→ Each day can be checked independently

This mental model must never be violated.

---

## Functional Scope (Planned)
### Authentication
- Email/password account creation
- Email verification (Resend planned)
- Account update (basic profile info)
- Optional future 2FA
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

- ESLint (strict)
- Prettier (enforced)
- TypeScript `strict`
- Unit tests for core logic
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

## Repository State (as of last session)
- Next.js project scaffolded
- ESLint + Prettier configured
- Vitest + Playwright set up with smoke tests
- Prisma installed and configured for Neon (no models yet)
- CI pipeline exists and runs:
  - lint
  - typecheck
  - unit tests
  - prettier check
  - build
  - e2e tests (with Playwright webServer)

---

## Important Decisions & Lessons Learned
- **No pnpm** — npm only
- **No Husky / Lefthook / hooks** — CI-only enforcement
- Windows PATH + Git hook tooling is unreliable → avoid
- Editor warnings ≠ CLI truth; CLI is the source of truth
- Build infrastructure first, features second

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
When resuming work, likely next areas:
1. Prisma schema design (User, Habit, HabitSchedule, HabitCompletion, Streaks)
2. Auth architecture decision (custom vs library)
3. Calendar domain logic (date ↔ weekday mapping)
4. Habit completion & streak calculation logic
5. UX state management for calendar/day view

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
