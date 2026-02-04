# Sprint 7.1: Atlas Pro - Product Strategy & Gating - Project Atlas

**Duration**: Week 14 (5-7 days)  
**Status**: In Progress  
**Theme**: Monetisation foundations with respectful, non-intrusive gating.

---

## Overview

Sprint 7.1 establishes the Atlas Pro foundation: a clear Free vs Pro matrix, a
server-side entitlement model, and UI entry points that communicate value
without disrupting core habit tracking.

**Core Goal**: introduce Pro gating safely while preserving the habit invariant
and keeping the Free tier fully useful.

---

## Scope Decisions

### Included

- [x] Define Free vs Pro feature matrix (one-time purchase)
- [x] Add Pro entitlement model (server-side)
- [x] Add Pro upgrade UI entry points (non-intrusive, contextual)
- [x] Add "Restore purchase" UX placeholder (mobile-first)
- [x] Add Pro preview states (locked panels with teaser content)
- [ ] Ensure Pro gating does not break core invariant (habits are weekday-based)

### Excluded (this sprint)

- [ ] Payment processing or store integrations
- [ ] Subscription billing
- [ ] Full mobile WebView packaging
- [ ] New Pro feature implementations beyond preview states

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> entitlement checks and gating helpers
- **API** -> entitlement access enforcement
- **Components** -> locked/preview UI states
- **E2E** -> key gating paths (Free user sees previews, Pro user sees full access)

CI must remain green.

---

## Phase 1: Strategy & Matrix (Days 1-2)

### Tasks (1)

- [x] **Task 1.1**: Define Free vs Pro feature matrix (one-time purchase)

---

## Free vs Pro Feature Matrix (Draft)

| Feature Area                                                           | Free         | Pro            | Notes                                   |
| ---------------------------------------------------------------------- | ------------ | -------------- | --------------------------------------- |
| Core habit tracking (create/edit/archive, weekday schedules)           | Full         | Full           | Must never be gated.                    |
| Calendar + daily completion                                            | Full         | Full           | Future-date guard stays.                |
| Streaks (current + longest)                                            | Full         | Full           | No gating.                              |
| Grace window (yesterday until 02:00)                                   | Full         | Full           | Free by policy.                         |
| Account settings (email, password, display name, week start)           | Full         | Full           | Core account control.                   |
| Theme toggle                                                           | Full         | Full           | QoL is not gated.                       |
| Advanced insights (heatmaps, trends, consistency, best/worst weekdays) | Preview only | Full           | Pro focus.                              |
| Achievements + milestones                                              | Baseline set | Expanded set   | Pro adds depth, not core functionality. |
| Smart reminders + push notifications                                   | Preview only | Full           | Pro focus.                              |
| Restore purchase                                                       | N/A          | Placeholder UI | Mobile-first placeholder only.          |

### Matrix Decisions

- Free tier must remain fully useful for habit tracking and daily completion.
- Pro value is additive (insights, motivation, convenience), not core access.
- One-time purchase only; no subscriptions or ads.

---

## Phase 2: Entitlements (Days 2-4)

### Tasks (1)

- [x] **Task 2.1**: Add Pro entitlement model (server-side)

---

## Phase 3: UX & Gating (Days 4-6)

### Tasks (3)

- [x] **Task 3.1**: Add Pro upgrade UI entry points (non-intrusive, contextual)
- [x] **Task 3.2**: Add "Restore purchase" UX placeholder (mobile-first)
- [x] **Task 3.3**: Add Pro preview states (locked panels with teaser content)

---

## Implementation Guidelines

- One-time purchase only (no subscriptions).
- Gating must never interfere with core habit creation or completion.
- Pro entry points should be contextual and minimal; no aggressive prompts.
- Server-side entitlements are the source of truth; client uses read-only flags.
- Preview states must communicate value and show how to upgrade.

---

## File Structure (Expected)

- `src/lib/pro/*` (entitlement model + helpers)
- `src/app/api/pro/*` (entitlement endpoints if needed)
- `src/components/pro/*` (upgrade entry points + previews)
- `src/components/**/__tests__/*`
- `src/lib/**/__tests__/*`
- `e2e/*`
- `docs/sprints/sprint-7.1.md`

---

## Definition of Done

1. [x] Free vs Pro matrix is documented and approved
2. [x] Server-side entitlement model is implemented and tested
3. [x] Upgrade entry points exist and are non-intrusive
4. [x] Restore purchase placeholder is visible on mobile
5. [x] Pro preview states are implemented without blocking core flows
6. [ ] CI passes from clean checkout

---
