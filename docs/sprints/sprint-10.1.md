# Sprint 10.1: Reminder Scheduling v1 (Web + Mobile Ready) - Project Atlas

**Duration**: TBD (5-7 days)  
**Status**: Not Started  
**Theme**: Make reminders reliable, timezone-safe, and ready for mobile push.

---

## Overview

Sprint 10.1 introduces reminder scheduling foundations that work on web today
and are ready to plug into mobile push delivery later. The focus is on a clear
reminder model, stable scheduling rules, and server-side safeguards.

**Core Goal**: deliver a reminder system that is deterministic, timezone-safe,
and ready for push without violating existing completion rules.

---

## Reminder Model (v1)

- Per habit reminder time(s)
- Daily digest
- Quiet hours
- Snooze

---

## Scope Decisions

### Included

- [ ] Define reminder model
- [ ] Add reminder settings UI
- [ ] Implement notification delivery strategy (push-ready)
- [ ] Add server-side validation + rate limiting for reminder APIs
- [ ] Add tests for reminder scheduling rules

### Excluded (this sprint)

- [ ] Store purchase flow integration
- [ ] Native rewrite or platform-specific notification SDKs
- [ ] Social or sharing features

---

## Testing Policy

After each reminder feature, add tests:

- **Unit** -> reminder schedule calculation, quiet hours, snooze rules
- **API** -> reminder validation and rate limiting
- **E2E** -> reminder settings UI smoke flow (if UI is introduced)

CI must remain green.

---

## Phase 1: Model & Rules (Days 1-2)

### Tasks (1)

- [x] **Task 1.1**: Define reminder model (per habit times, digest, quiet hours, snooze)

---

## Phase 2: UI & Delivery Strategy (Days 2-4)

### Tasks (2)

- [ ] **Task 2.1**: Add reminder settings UI
- [ ] **Task 2.2**: Implement notification delivery strategy (push-ready)

---

## Phase 3: API Safeguards & Tests (Days 4-6)

### Tasks (2)

- [ ] **Task 3.1**: Add server-side validation + rate limiting for reminder APIs
- [ ] **Task 3.2**: Add tests for reminder scheduling rules

---

## Implementation Guidelines

- Reminders must be timezone-safe and deterministic.
- Respect completion rules: no future-date completions and the 02:00 grace window.
- Avoid changing the habit invariant (habits remain weekday-based).
- Use existing UI primitives; no inline form errors, toast-based user feedback only.
- Keep the web experience fully functional for Free users.

---

## File Structure (Expected)

- `src/lib/reminders/*`
- `src/lib/reminders/__tests__/*`
- `src/app/api/reminders/*`
- `src/components/reminders/*`
- `src/app/account/page.tsx`
- `e2e/*`
- `docs/sprints/sprint-10.1.md`

---

## Definition of Done

1. [ ] Reminder model is defined and documented
2. [ ] Reminder settings UI is accessible and functional
3. [ ] Delivery strategy is push-ready and documented
4. [ ] Reminder APIs validate input and are rate-limited
5. [ ] Reminder scheduling rules are covered by unit tests
6. [ ] CI passes from a clean checkout

---
