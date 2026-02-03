# Sprint 6.2: Admin Dashboard - Project Atlas

**Duration**: Week 12-13 (5-7 days)  
**Status**: Not Started  
**Theme**: Internal admin visibility with strict access control and safe reporting.

---

## Overview

Sprint 6.2 introduces a lightweight admin dashboard for internal operations.
It provides a private view into app health, users, habits, and recent activity
without exposing sensitive user data. Access is restricted to a single owner
(or explicit allowlist).

**Core Goal**: ship a safe, read-only admin surface that helps monitor the app
and diagnose issues quickly.

---

## Scope Decisions

### Included

- [ ] Admin access control (role-based with allowlist fallback)
- [ ] Admin dashboard shell + navigation
- [ ] Health status panel (API uptime, basic checks)
- [ ] User list (search, counts, verified vs unverified)
- [ ] Habit list (active/archived, schedule summary)
- [ ] Recent activity/logs view (non-PII)
- [ ] Admin-safe export (CSV)

### Excluded (this sprint)

- [ ] Admin mutation actions (delete/disable users)
- [ ] Full analytics dashboards
- [ ] Billing or subscription tooling
- [ ] Customer support tooling

---

## Testing Policy

After each feature area, add tests:

- **API** -> `src/app/api/**/__tests__/*.test.ts`
- **Components** -> `src/components/**/__tests__/*.test.tsx`
- **E2E** -> admin access guard + key workflows

CI must remain green.

---

## Phase 1: Access Control & Shell (Days 1-2)

### Tasks (2)

- [x] **Task 1.1**: Admin access gate (DB role + allowlist fallback via middleware guard)
- [x] **Task 1.2**: Admin dashboard layout + navigation scaffold

---

## Phase 2: Core Views (Days 2-4)

### Tasks (3)

- [x] **Task 2.1**: Health status panel (api/health + uptime)
- [x] **Task 2.2**: User list (search, verified/unverified status)
- [x] **Task 2.3**: Habit list (active/archived, weekday schedule summary)

---

## Phase 3: Operations & Export (Days 4-6)

### Tasks (2)

- [x] **Task 3.1**: Recent activity/logs view (structured log feed)
- [x] **Task 3.2**: CSV export for users + habits (admin-only)

---

## Implementation Guidelines

- Admin access must be deny-by-default with explicit DB role; allowlist is a bootstrap fallback.
- Keep dashboards read-only; no destructive actions in this sprint.
- Avoid exposing PII beyond email + display name + timestamps.
- Paginate large datasets and keep queries efficient.
- Keep UI aligned with the black/white system and minimal layout.

---

## File Structure (Expected)

- `src/app/admin/page.tsx`
- `src/components/admin/*`
- `src/app/api/admin/*/route.ts`
- `src/lib/admin/*` (access control helpers)
- `middleware.ts` (admin access guard)

---

## Definition of Done

1. [ ] Only allowlisted admin accounts can access `/admin`
2. [ ] Health panel shows API health and uptime
3. [ ] Admin can view user + habit lists with basic search
4. [ ] Recent activity/logs are visible without PII leakage
5. [ ] CSV exports are available to admin only
6. [ ] CI passes from clean checkout

---
