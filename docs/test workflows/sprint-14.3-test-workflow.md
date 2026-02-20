# Sprint 14.3 Test Workflow - User Self-Service Data Export

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 14.3 adds and hardens:

- Authenticated self-service export endpoint: `GET /api/account/exports/self`
- User-scoped JSON export payload for habits, completions, reminders, and achievements
- Download action in `/account` (`Download my data (JSON)`)
- Durable DB audit records for export success/failure
- Per-user export rate limiting (`3 requests / 15 minutes`)
- Request-correlation id capture in audit metadata

This workflow verifies manual behavior and automated coverage for security, scope correctness, and stability.

---

## Prerequisites

1. Set required env vars in `.env`:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ENABLE_TEST_ENDPOINTS=true
   ```

2. Apply migrations and start app:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   npm run dev
   ```

3. Prepare test accounts:
   - One verified regular user (`user-a`)
   - One verified regular user (`user-b`)

4. Ensure both users have at least one habit (with different titles) so scope checks are obvious.

---

## Manual QA Checklist

### Workflow 1: Account page shows Data export section [x]

1. Sign in as `user-a`.
2. Open `/account`.

**Expected**:

- `Data export` section is visible.
- Copy explicitly says export is for `your data only`.
- `Download my data (JSON)` button is visible.

### Workflow 2: Download action pending and success UX [x]

1. On `/account`, click `Download my data (JSON)`.

**Expected**:

- Button switches to `Preparing download...` while request is in flight.
- A JSON file download is triggered when request succeeds.
- Success toast appears: `Data export downloaded.`

### Workflow 3: Export response headers and metadata [x]

1. Open browser devtools Network tab.
2. Trigger export from `/account`.
3. Inspect `GET /api/account/exports/self`.

**Expected**:

- Status `200`
- `Content-Type: application/json; charset=utf-8`
- `Content-Disposition: attachment; filename="...-atlas-data-export.json"`
- `Cache-Control: no-store`
- JSON body includes:
  - `schemaVersion`
  - `generatedAt`
  - `userId`

### Workflow 4: Auth guard (`401` signed out) [x]

Run while signed out:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/account/exports/self" `
  -Method Get `
  -SkipHttpErrorCheck
```

**Expected**:

- Status `401`
- Error payload with `ok: false` and `error.code: "unauthorized"`

### Workflow 5: User-scope correctness / no cross-user leakage [x]

1. Sign in as `user-a` and trigger export.
2. Confirm export includes only `user-a` habits/completions/reminders/unlocks.
3. Sign in as `user-b` and trigger export.
4. Confirm export includes only `user-b` data.

**Expected**:

- No records from `user-b` appear in `user-a` export and vice versa.
- Export scope is always tied to current session user.

### Workflow 6: Rate-limit handling (`3 / 15m`) [x]

1. While signed in as the same user, trigger export 4 times in quick succession.
2. Inspect the 4th response.

**Expected**:

- First 3 requests succeed (`200`).
- 4th request returns `429`.
- Error code is `rate_limited`.
- Rate-limit headers are present (including `Retry-After`).

### Workflow 7: Audit durability and metadata [x]

After running success + failure paths (for example one rate-limited call), query DB:

```sql
SELECT "userId", "requestedAt", "status", "format", "recordCounts", "requestId", "errorCode"
FROM "UserDataExportAudit"
ORDER BY "requestedAt" DESC
LIMIT 20;
```

**Expected**:

- A row is written per export attempt.
- Success attempts have `status = success` and populated `recordCounts`.
- Failure attempts have `status = failure` and relevant `errorCode` (for example `rate_limited`).
- `requestId` is populated for both success and failure attempts.

---

## Automated Tests

### API + Service + Component

```bash
npm test -- src/app/api/account/exports/__tests__/self.route.test.ts
npm test -- src/lib/account/exports/__tests__
npm test -- src/components/auth/__tests__/AccountPanel.test.tsx
npm test -- src/lib/observability/__tests__/apiLogger.test.ts
```

### Optional E2E Smoke

```bash
npm run e2e -- e2e/account-export.spec.ts --project=chromium
```

---

## CI Stability Pass

```bash
npm run lint
npm run typecheck
npm test -- src/lib/account/exports/__tests__ src/app/api/account/exports/__tests__/self.route.test.ts src/components/auth/__tests__/AccountPanel.test.tsx src/lib/observability/__tests__/apiLogger.test.ts
npm run e2e -- e2e/account-export.spec.ts --project=chromium
```

For full repo gate:

```bash
npm run ci
```

---

## Success Criteria

Sprint 14.3 export rollout is considered verified when:

1. Signed-in users can download their own JSON export from `/account`.
2. Signed-out export requests return `401`.
3. Export payload is strictly session-user scoped (no cross-user leakage).
4. Export response headers enforce attachment + `no-store`.
5. Rate-limit behavior is enforced and returns explicit `429` handling.
6. Durable audit rows are created for success and failure with `requestId` metadata.
7. Service/API/component tests and optional E2E smoke pass.
8. Typecheck/lint and CI validation pass.

---

## References

- [Sprint 14.3 Plan](../sprints/sprint-14.3.md)
- [Export Route](../../src/app/api/account/exports/self/route.ts)
- [Export Route Tests](../../src/app/api/account/exports/__tests__/self.route.test.ts)
- [Export Payload Service](../../src/lib/account/exports/payload.ts)
- [Export Types](../../src/lib/account/exports/types.ts)
- [Export Record Counts](../../src/lib/account/exports/recordCounts.ts)
- [Export Audit Helpers](../../src/lib/account/exports/audit.ts)
- [Export Rate Limit Helpers](../../src/lib/account/exports/rateLimit.ts)
- [Account Panel](../../src/components/auth/AccountPanel.tsx)
- [Account Panel Tests](../../src/components/auth/__tests__/AccountPanel.test.tsx)
- [Account Export E2E](../../e2e/account-export.spec.ts)
