# Project Atlas - Product & Engineering Roadmap (Updated)

---

## Roadmap Constraints (Active)

- No-cash constraint: defer paid mobile/store prerequisites (Apple/Google accounts, APNs/FCM setup).
- Web-first launch: all work before launch must be web-only or mobile-friendly but not require paid accounts.
- Mobile wrapper, native push, and store release happen after web launch and funding.

---

## Phase 0: Engineering Foundation (Completed)

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

## Phase 1: Core Domain & Auth MVP (Weeks 1-3) (Completed)

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

- [x] Design Prisma schema:
  - User
  - Habit
  - HabitSchedule (weekday-based)
  - HabitCompletion (habit + date)
  - Streak (derived or stored)
- [x] Define indices & constraints
- [x] Run initial migration
- [x] Seed database with sample users & habits
- [x] Unit tests for domain logic (no UI)
- [x] Validate weekday -> date mapping logic

---

### Sprint 1.3: Habit CRUD

- [x] Create habit creation UI
- [x] Select active weekdays (Mon-Sun)
- [x] Edit / delete habits
- [x] Persist habits in DB
- [x] Validate habit rules (no empty weekday selection)
- [x] Unit tests for habit CRUD
- [x] E2E tests for habit creation/edit/delete

---

## Phase 2: Calendar & Daily Tracking (Weeks 4-6) (Completed)

### Sprint 2.1: Calendar Core

- [x] Monthly calendar view
- [x] Correct date <-> weekday mapping
- [x] Display which days have active habits
- [x] Click day -> open daily view
- [x] Responsive layout (desktop-first, mobile-safe)
- [x] Unit tests for calendar date logic
- [x] E2E tests for calendar navigation

---

### Sprint 2.2: Daily Habit Completion

- [x] Show habits active on selected day
- [x] Allow checking/unchecking habits
- [x] Persist habit completion per date
- [x] Prevent double completion
- [x] Handle past/future dates correctly
- [x] Unit tests for completion logic
- [x] E2E tests for daily completion flow

---

### Sprint 2.3: Visual Feedback & Delight

- [x] Day tile progress indicator
- [x] Fully completed day -> golden state
- [x] Completion sound (configurable / subtle)
- [x] Smooth UI transitions
- [x] Accessibility considerations
- [x] Visual regression tests (Playwright)

---

## Phase 3: Streaks & Engagement (Weeks 7-8) (Completed)

### Sprint 3.1: Streak Logic

- [x] Define streak rules clearly (what breaks a streak)
- [x] Compute:
  - current streak
  - longest streak
- [x] Handle partial days correctly
- [x] Timezone-safe logic
- [x] Unit tests for streak calculations

---

### Sprint 3.2: Streak UI

- [x] Display streak stats in dashboard
- [x] Visual emphasis on streak continuity
- [x] Friendly empty states
- [x] E2E tests for streak updates

---

## Phase 4: UX Polish & Responsiveness (Weeks 9-10) (Completed)

### Sprint 4.1: Responsive UX

- [x] Mobile-optimized calendar view
- [x] Touch-friendly interactions
- [x] Bottom-sheet style daily view (mobile)
- [x] Cross-device testing

---

### Sprint 4.2: UX Refinement

- [x] Loading states
- [x] Optimistic updates
- [x] Error handling & recovery
- [x] Keyboard navigation
- [x] Accessibility pass (ARIA, contrast)

---

## Phase 5: Landing & Positioning (Week 11) (Completed)

### Sprint 5.1: Marketing Homepage

- [x] Define clear value prop and hero section
- [x] Explain core benefits (schedule-based habits, daily completion, streaks)
- [x] Add primary CTA (sign up / sign in)
- [x] Auth-aware redirect: logged-in users go to `/today`
- [x] Keep styling aligned with minimalist black/white system

---

## Phase 6: Production Hardening (Weeks 12-13) (Completed / In Progress)

### Sprint 6.1: Observability & Safety

- [x] Error tracking (Sentry or equivalent)
- [x] Structured logging
- [x] Health check endpoint
- [x] Rate limiting on auth routes
- [x] Security headers

---

### Sprint 6.2: Admin Dashboard

- [x] Admin access control (single-owner allowlist)
- [x] Admin navigation entry and layout
- [x] App health status panel
- [x] User list (search + basic stats)
- [x] Habit list (search + active/archived)
- [x] Recent logs / audit trail view
- [x] Admin-safe data export (CSV)

---

### Sprint 6.3: Testing & Launch Readiness

- [ ] Expand E2E coverage (full habit lifecycle)
- [ ] Achieve ~80% meaningful test coverage
- [ ] Staging environment
- [ ] Database backup strategy
- [ ] Final CI audit
- [ ] Production readiness checklist

---

## Phase 7: Monetization & Pro Foundation (New)

### Sprint 7.1: Atlas Pro - Product Strategy & Gating

- [x] Define Free vs Pro feature matrix (one-time purchase)
- [x] Add Pro entitlement model (server-side)
- [x] Add Pro upgrade UI entry points (non-intrusive, contextual)
- [x] Add "Restore purchase" UX placeholder (mobile-first)
- [x] Add Pro preview states (locked panels with teaser content)
- [x] Ensure Pro gating does not break core invariant (habits are weekday-based)

---

## Phase 8: Advanced Insights (Pro) (New)

### Sprint 8.1: Advanced Insights v1

- [x] Define Insights spec (metrics list + formulas)
- [x] Add Insights API endpoints (privacy-respecting, aggregated)
- [x] Add Insights UI (minimalist cards, charts/heatmap)
- [x] Add consistency score (7/30/90 days)
- [x] Add best/worst weekday stats
- [x] Add completion trend indicators
- [x] Add unit tests for insight calculations
- [x] Add E2E coverage for Insights visibility + gating

---

## Phase 9: Achievements & Milestones (Pro) (New)

### Sprint 9.1: Achievements System v1

- [x] Define achievement catalogue (Free baseline + Pro extended)
- [x] Implement achievement evaluation engine (pure domain logic)
- [x] Add achievements UI ("Trophy cabinet")
- [x] Add milestone timeline per habit (7/30/100 completions, perfect weeks, etc.)
- [x] Ensure achievements are timezone-safe
- [x] Unit tests for achievements unlock logic
- [x] E2E tests for achievement unlock display

---

## Phase 10: Smart Reminders (Pro) (Web-first) (New)

### Sprint 10.1: Reminder Scheduling v1 (Web + Mobile Ready)

- [x] Define reminder model:
  - per habit reminder time(s)
  - daily digest
  - quiet hours
  - snooze
- [x] Add reminder settings UI
- [x] Implement notification delivery strategy (push-ready)
- [x] Add server-side validation + rate limiting for reminder APIs
- [x] Add tests for reminder scheduling rules

---

## Phase 11: Daily UX + Performance (Web-first) (New)

### Sprint 11.1: Today View + Speed Improvements

- [x] Add "Today" screen (fast daily entry)
- [x] Add quick actions (complete/uncomplete + undo)
- [x] Add habit ordering/pinning/sorting
- [x] Add schedule presets (Weekdays / Every day / Weekend)
- [x] Improve daily panel performance on small screens

---

### Sprint 11.2: Offline-first Completions

- [x] Implement offline queue for completion toggles
- [x] Sync queue when network returns
- [x] Add "pending sync" UI indicators
- [x] Add unit tests for offline queue logic
- [x] Add E2E coverage for flaky network scenarios

---

## Phase 12: Grace Window Rule (Free) (New)

### Sprint 12.1: Completion Grace Window Until 02:00

- [ ] Implement Free grace window: allow completing "yesterday" until 02:00
- [ ] Keep future-date guard intact
- [ ] Ensure timezone-safe boundary handling
- [ ] Update UI copy to explain grace window
- [ ] Add unit tests + E2E tests for grace window edge cases

---

## Phase 13: Mobile + Store Launch (Deferred - Requires Funding) (New)

### Prereqs (Paid / External)

- Apple Developer Program membership
- Google Play Console registration
- Firebase project
- iOS bundle ID + Android package name
- APNs auth key (.p8)

### Sprint 13.1: Mobile Push Implementation (WebView)

- [ ] Wrap app using WebView (Capacitor recommended)
- [ ] Setup Android push (FCM)
- [ ] Setup iOS push (APNs)
- [ ] Implement device token registration + secure storage
- [ ] Implement push send pipeline
- [ ] E2E/manual test plan for push delivery on devices

---

### Sprint 13.2: Store Readiness & Compliance

- [ ] App icons, splash screens, store screenshots
- [ ] Privacy policy + Terms pages (in-app + hosted)
- [ ] App Store / Play Store metadata (description, keywords)
- [ ] Data safety declarations (Google Play)
- [ ] Apple privacy labels + review notes
- [ ] Beta testing tracks (internal/closed)
- [ ] Production release checklist

---

## Core Principles (Do Not Break)

- Habits are **weekday-based**, not date-based
- Completion is **habit + date**
- CI is the ultimate gatekeeper
- No shortcuts that undermine correctness
- Infrastructure before features
