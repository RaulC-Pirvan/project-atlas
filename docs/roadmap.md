# Project Atlas — Product & Engineering Roadmap

---

## Phase 0: Engineering Foundation (Completed / In Progress)

### Sprint 0.1: Project & Tooling Setup

- [x] Initialize Next.js project (App Router, TypeScript strict)
- [x] Configure Tailwind CSS
- [x] Configure ESLint (strict) + Prettier
- [x] Setup npm-based workflow (no pnpm)
- [x] Configure Vitest (unit testing)
- [x] Configure Playwright (E2E testing)
- [x] Add unit smoke test
- [x] Add E2E smoke test
- [x] Setup GitHub Actions CI:
  - lint
  - typecheck
  - unit tests
  - prettier check
  - build
  - e2e tests
- [x] Setup Neon PostgreSQL project
- [x] Install & configure Prisma (no models yet)
- [x] Connect repository to Vercel
- [x] Enable Preview deployments (PRs)
- [x] Enable Production deployment (main branch)
- [x] Decide CI-only enforcement (no git hooks)

---

## Phase 1: Core Domain & Auth MVP (Weeks 1–3)

### Sprint 1.1: Authentication Foundation

- [x] Decide auth strategy (custom vs library)
- [x] Implement email/password signup
- [x] Implement email verification flow (Resend)
- [x] Implement login & logout
- [x] Implement basic account management (update email/password)
- [x] Add account deletion request flow
- [x] Add default user avatar (placeholder icon)
- [x] Protect authenticated routes (middleware)
- [x] Unit tests for auth logic
- [x] E2E tests for signup/login/logout

---

### Sprint 1.2: Core Data Model (Prisma)

- [ ] Design Prisma schema:
  - User
  - Habit
  - HabitSchedule (weekday-based)
  - HabitCompletion (habit + date)
  - Streak (derived or stored)
- [ ] Define indices & constraints
- [ ] Run initial migration
- [ ] Seed database with sample users & habits
- [ ] Unit tests for domain logic (no UI)
- [ ] Validate weekday → date mapping logic

---

### Sprint 1.3: Habit CRUD

- [ ] Create habit creation UI
- [ ] Select active weekdays (Mon–Sun)
- [ ] Edit / delete habits
- [ ] Persist habits in DB
- [ ] Validate habit rules (no empty weekday selection)
- [ ] Unit tests for habit CRUD
- [ ] E2E tests for habit creation/edit/delete

---

## Phase 2: Calendar & Daily Tracking (Weeks 4–6)

### Sprint 2.1: Calendar Core

- [ ] Monthly calendar view
- [ ] Correct date ↔ weekday mapping
- [ ] Display which days have active habits
- [ ] Click day → open daily view
- [ ] Responsive layout (desktop-first, mobile-safe)
- [ ] Unit tests for calendar date logic
- [ ] E2E tests for calendar navigation

---

### Sprint 2.2: Daily Habit Completion

- [ ] Show habits active on selected day
- [ ] Allow checking/unchecking habits
- [ ] Persist habit completion per date
- [ ] Prevent double completion
- [ ] Handle past/future dates correctly
- [ ] Unit tests for completion logic
- [ ] E2E tests for daily completion flow

---

### Sprint 2.3: Visual Feedback & Delight

- [ ] Day tile progress indicator
- [ ] Fully completed day → golden state
- [ ] Completion sound (configurable / subtle)
- [ ] Smooth UI transitions
- [ ] Accessibility considerations
- [ ] Visual regression tests (Playwright)

---

## Phase 3: Streaks & Engagement (Weeks 7–8)

### Sprint 3.1: Streak Logic

- [ ] Define streak rules clearly (what breaks a streak)
- [ ] Compute:
  - current streak
  - longest streak
- [ ] Handle partial days correctly
- [ ] Timezone-safe logic
- [ ] Unit tests for streak calculations

---

### Sprint 3.2: Streak UI

- [ ] Display streak stats in dashboard
- [ ] Visual emphasis on streak continuity
- [ ] Friendly empty states
- [ ] E2E tests for streak updates

---

## Phase 4: UX Polish & Mobile (Weeks 9–10)

### Sprint 4.1: Mobile & Responsiveness

- [ ] Mobile-optimized calendar view
- [ ] Touch-friendly interactions
- [ ] Bottom-sheet style daily view (mobile)
- [ ] Cross-device testing

---

### Sprint 4.2: UX Refinement

- [ ] Loading states
- [ ] Optimistic updates
- [ ] Error handling & recovery
- [ ] Keyboard navigation
- [ ] Accessibility pass (ARIA, contrast)

---

## Phase 5: Production Hardening (Weeks 11–12)

### Sprint 5.1: Observability & Safety

- [ ] Error tracking (Sentry or equivalent)
- [ ] Structured logging
- [ ] Health check endpoint
- [ ] Rate limiting on auth routes
- [ ] Security headers

---

### Sprint 5.2: Testing & Launch Readiness

- [ ] Expand E2E coverage (full habit lifecycle)
- [ ] Achieve ~80% meaningful test coverage
- [ ] Staging environment
- [ ] Database backup strategy
- [ ] Final CI audit
- [ ] Production readiness checklist

---

## Phase 6: Post-Launch (Optional / Future)

- Habit templates
- Reminders / notifications
- Analytics (privacy-respecting)
- Premium features
- Offline support (PWA)
- Data export

---

## Core Principles (Do Not Break)

- Habits are **weekday-based**, not date-based
- Completion is **habit + date**
- CI is the ultimate gatekeeper
- No shortcuts that undermine correctness
- Infrastructure before features
