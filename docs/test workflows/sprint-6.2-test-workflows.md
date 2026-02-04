# Sprint 6.2 Test Workflows - Admin Dashboard

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 6.2 adds a read-only admin dashboard with strict access control, health
visibility, user/habit listings, recent activity feed, and CSV exports. This
document covers manual and automated verification.

**Key Features Implemented**:

- Admin allowlist access gate (middleware + API)
- Admin health status panel
- User list with search and verified status
- Habit list with active/archived filter and schedule summary
- Recent activity feed from structured logs
- Admin-only CSV exports (users + habits)

---

## Prerequisites

1. **Database is migrated**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set**:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000

   # Admin access (deny-by-default)
   # Option A: DB role (preferred)
   # Set role = 'admin' for the intended account
   # Option B: Env allowlist (bootstrap)
   ADMIN_OWNER_EMAIL=admin@example.com
   ADMIN_EMAIL_ALLOWLIST=admin@example.com,other@example.com
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Test accounts**:
   - At least one verified user account for admin.
   - Promote the admin account in the database:

     ```sql
     UPDATE "User"
     SET "role" = 'admin'
     WHERE "email" = 'admin@example.com';
     ```

   - Sign out and sign back in after changing the role (JWT refresh).

   - At least one non-admin user with habits (active + archived).

---

## Test Workflows

### Workflow 1: Admin access gate (UI + API) [x]

1. Sign in as a non-admin user (role = `user`).
2. Visit `/admin`.
3. Call `/api/admin/health` in the browser or via curl.

**Expected**:

- `/admin` redirects to `/calendar`.
- `/api/admin/health` returns **403** with recovery guidance.

---

### Workflow 2: Admin access allowed [x]

1. Sign in as an admin user (role = `admin` or allowlisted).
2. Visit `/admin`.

**Expected**: Admin dashboard loads successfully without redirect.

---

### Workflow 3: Health status panel [x]

1. In `/admin`, locate **Health status**.
2. Click **Refresh health**.

**Expected**: Panel shows `status: ok`, a recent timestamp, and a non-zero
`uptimeSeconds` value.

---

### Workflow 4: User list search + counts [x]

1. In `/admin`, locate **Users**.
2. Verify counts show total/verified/unverified.
3. Search for a known email or display name.
4. Click **Load more** if visible.

**Expected**:

- Counts are consistent with existing data.
- Search filters results by email or name.
- Pagination loads additional results.

---

### Workflow 5: Habit list filters + schedule summary [x]

1. In `/admin`, locate **Habits**.
2. Toggle filters **Active**, **Archived**, **All**.
3. Search by habit title or owner email.

**Expected**:

- Active shows only unarchived habits.
- Archived shows only archived habits.
- Schedule summary uses weekday labels (e.g., `Mon, Wed`) or `Daily`.

---

### Workflow 6: Activity feed [x]

1. Trigger a few API calls (e.g., `/api/health`, `/api/admin/health`).
2. Refresh the **Recent activity** panel.

**Expected**: The activity feed displays recent log entries with method, route,
status, duration, and request ID. No PII beyond safe fields is present.

---

### Workflow 7: CSV exports [x]

1. In `/admin`, locate **Export**.
2. Click **Download users CSV** and **Download habits CSV**.

**Expected**:

- CSV files download with headers and rows.
- Users export includes: email, display name, email verified at, created at, deleted at.
- Habits export includes: title, description, schedule, archived at, created at, owner email, owner name.

---

## Automated Tests

### Unit / API / Component (Suggested)

```bash
npm test -- src/app/api/admin/__tests__
npm test -- src/lib/admin/__tests__
npm test -- src/lib/observability/__tests__
npm test -- src/components/admin/__tests__
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Admin user still blocked

**Symptoms**: Redirected to `/calendar` or API returns 403.

**Fixes**:

- Ensure `ADMIN_OWNER_EMAIL` or `ADMIN_EMAIL_ALLOWLIST` is set.
- Confirm the admin account email matches exactly (case-insensitive).
- Restart the dev server after env changes.

---

### Issue: Activity feed is empty

**Symptoms**: No log entries appear after refresh.

**Fixes**:

- Trigger a few API requests (e.g., `/api/health`).
- Remember the log store is in-memory and resets on server restart.

---

### Issue: CSV downloads are empty

**Symptoms**: CSV headers only, no data.

**Fixes**:

- Ensure users/habits exist in the database.
- Verify the admin account is allowlisted.

---

## Success Criteria

Sprint 6.2 is complete when:

1. Only allowlisted accounts can access `/admin` and `/api/admin/*`.
2. Health, users, habits, and activity panels load data reliably.
3. CSV exports download with correct headers and row data.
4. CI passes from a clean checkout.

---

## Additional Resources

- [Sprint 6.2 Plan](../sprints/sprint-6.2.md)
- [Admin Dashboard](../../src/app/admin/page.tsx)
- [Admin APIs](../../src/app/api/admin)
- [Admin Helpers](../../src/lib/admin)
- [Observability Logger](../../src/lib/observability/logger.ts)
- [AGENTS](../../AGENTS.md)
