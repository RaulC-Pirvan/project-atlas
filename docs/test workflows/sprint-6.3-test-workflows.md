# Sprint 6.3 Test Workflows - Testing & Launch Readiness

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 6.3 focuses on launch readiness: full lifecycle E2E coverage, staging
validation, and verified backup procedures. This document covers the manual
workflows for the staging environment and backup drills.

---

## Prerequisites

1. **Database is migrated**:

   ```bash
   npm run prisma:generate
   ```

2. **Staging environment variables set** (see `docs/ops/staging.md`).

3. **Staging deployment is live**.

---

## Workflow 1: Staging Smoke Check [ ]

1. Visit `/api/health` in staging.
2. Sign up a new user and verify email.
3. Create a habit with a weekday schedule.
4. Mark completion for today.
5. Confirm the calendar tile shows completion state.

**Expected**: All actions succeed without console or API errors.

---

## Workflow 2: Admin Access Guard [ ]

1. Sign in as an allowlisted admin.
2. Visit `/admin`.
3. Verify Health, Users, Habits, Activity, Export panels load.
4. Sign out and verify `/admin` access is denied for non-admin.

**Expected**: Admin-only access enforced with a clear unauthorized response.

---

## Workflow 3: Staging Email Verification [ ]

1. Create a new user in staging.
2. Confirm verification email is sent to the staging inbox.
3. Verify the link uses the staging domain and opens successfully.

**Expected**: Email verification completes and login is permitted.

---

## Workflow 4: Backup & Restore Drill [ ]

1. Take a manual `pg_dump` backup from production.
2. Restore into a fresh staging database.
3. Run a basic smoke test (login, list habits, open calendar).

**Expected**: Restore succeeds and core flows operate normally.

---

## Automated Tests (Suggested)

```bash
npm run test:coverage
npm run e2e -- --project=chromium
```

---

## Success Criteria

Sprint 6.3 Phase 2 is complete when:

1. Staging environment is live and validated.
2. Backup strategy is documented and a restore drill is successful.
3. CI passes from clean checkout.

---

## References

- [Sprint 6.3 Plan](../sprints/sprint-6.3.md)
- [Staging Guide](../ops/staging.md)
- [Backup Strategy](../ops/backups.md)
- [AGENTS](../../AGENTS.md)
