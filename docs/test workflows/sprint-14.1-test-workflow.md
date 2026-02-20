# Sprint 14.1 Test Workflow - Support Center + Contact Form

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 14.1 adds:

- Public `/support` page with FAQ and contact form
- Support categories: `billing`, `account`, `bug`, `feature_request`
- Signed-in prefill for support name/email
- Anti-spam controls: honeypot, per-IP/per-email rate limits, conditional CAPTCHA policy
- Durable DB queue for support tickets + abuse signals
- Support inbox notification email routing
- Admin support triage panel with status updates and filters

This workflow is focused on manual verification of all shipped behavior.

---

## Prerequisites

1. Set required environment values in `.env`:

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   SUPPORT_IP_HASH_SECRET=replace-with-random-secret
   SUPPORT_INBOX_EMAIL=support@example.com
   ENABLE_TEST_ENDPOINTS=true
   ```

2. Apply migrations and start app:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   npm run dev
   ```

3. Prepare accounts:
   - One verified regular user
   - One verified admin user

4. Use unique support emails for repeated tests to avoid cross-test interference.

5. Optional DB reset between runs (dev only):

   ```sql
   DELETE FROM "SupportAbuseSignal";
   DELETE FROM "SupportTicket";
   ```

---

## Manual QA Checklist

### Manual QA 1: Public access to `/support` [x]

1. Open a private/incognito browser window (signed out).
2. Navigate to `/support`.
3. Verify the page loads without redirecting to `/sign-in`.

**Expected**:

- `/support` is publicly accessible.
- Header shows `Project Atlas`, `Home`, and theme toggle.

### Manual QA 1A: Landing support discoverability [x]

1. Open `/landing` while signed out.
2. In the top-right nav, click `Support`.
3. Return to `/landing`.
4. Scroll to the `Pro adds depth when you want it.` section.
5. Click `Open support center`.

**Expected**:

- Header `Support` link routes to `/support`.
- Bottom `Open support center` CTA also routes to `/support`.
- Support discoverability exists without requiring sign-in.

### Manual QA 2: Support form + FAQ rendering + categories [x]

1. On `/support`, verify FAQ section is visible with multiple entries.
2. Verify form fields are present: `Name`, `Email`, `Category`, `Subject`, `Message`.
3. Open category dropdown and confirm options:
   - Billing
   - Account
   - Bug
   - Feature request

**Expected**:

- FAQ and form render correctly.
- Category list exactly matches sprint scope.

### Manual QA 2A: Support page motion + loading skeleton [x]

1. Navigate away from `/support` (for example to `/landing`).
2. Navigate back to `/support`.
3. Observe initial appearance of header, intro, FAQ card, and form card.
4. In devtools, throttle network (for example `Slow 3G`) and navigate to `/support`.

**Expected**:

- Support sections enter with subtle staged motion when reduced-motion is not requested.
- With reduced-motion preferences enabled, content appears without animated motion.
- A support-specific skeleton layout appears while route data is loading.

### Manual QA 3: Client-side validation is toast-based (no inline errors) [x]

1. On `/support`, leave fields invalid (for example empty name/subject/message).
2. Submit the form.

**Expected**:

- Error toast is field-specific (examples):
  - `Name: Please enter at least 2 characters.`
  - `Email: Please enter a valid email address.`
  - `Message: Please enter at least 10 characters.`
- Invalid fields show red error borders.
- No inline field-level error text is rendered.

### Manual QA 4: Signed-out success submit path [x]

1. Signed out, open `/support`.
2. Fill valid values:
   - Name: `Atlas Visitor`
   - Email: unique email
   - Category: `Account`
   - Subject: valid text (3+ chars)
   - Message: valid text (10+ chars)
3. Click `Send support request`.

**Expected**:

- Success toast appears: `Support request sent. We will get back to you soon.`
- Subject and message clear after success.

### Manual QA 5: Signed-in prefill path [x]

1. Sign in as a verified user.
2. Navigate to `/support`.
3. Inspect `Name` and `Email` fields.

**Expected**:

- Name is prefilled from session display name.
- Email is prefilled from session email.
- User can still edit both fields before submit.

### Manual QA 5A: Signed-in support discoverability from app shell [x]

1. Sign in and land on `/today`.
2. Verify `Support` appears in desktop sidebar navigation.
3. On mobile viewport, open `More` and verify `Support` appears.
4. Click `Support` from nav.
5. Scroll to page footer and click `Support` link.

**Expected**:

- Signed-in users can reach `/support` directly from app navigation.
- Footer `Support` link routes to `/support` from authenticated pages.

### Manual QA 6: Retry-safe transient failure UX [x]

1. Open `/support` and fill valid form values.
2. In browser devtools, simulate offline mode (or block `/api/support/tickets`).
3. Submit the form.

**Expected**:

- Error toast appears: `Support request could not be sent right now. Please try again.`
- Submit button returns to enabled state after failure.
- User-entered form data remains for retry.

### Manual QA 7: Invalid payload API rejection [ ]

Run:

```powershell
$body = @{
  name = "A"
  email = "not-an-email"
  category = "invalid"
  subject = "x"
  message = "short"
  honeypot = ""
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/support/tickets" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body $body `
  -SkipHttpErrorCheck
```

**Expected**:

- HTTP `400`
- JSON response has `ok: false` and `error.code: "invalid_request"`

### Manual QA 8: Honeypot behavior (generic success + no ticket row) [ ]

Run with same IP header:

```powershell
$body = @{
  name = "Bot"
  email = "bot@example.com"
  category = "bug"
  subject = "Bot submit"
  message = "This should look valid but has honeypot content."
  honeypot = "filled-by-bot"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/support/tickets" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json"; "x-forwarded-for" = "manual-honeypot-test" } `
  -Body $body `
  -SkipHttpErrorCheck
```

**Expected**:

- HTTP `200` with accepted response shape
- No support ticket created for this submission
- Abuse signals are recorded (`submission_attempt`, `honeypot_hit`)

### Manual QA 9: Per-IP rate limiting (5/15m) [ ]

Use one IP value and unique emails:

```powershell
for ($i = 1; $i -le 6; $i++) {
  $email = "ip-limit-$i-$(Get-Random)@example.com"
  $body = @{
    name = "IP Limit Tester"
    email = $email
    category = "account"
    subject = "IP limit test $i"
    message = "Testing support endpoint rate limit behavior for same client address."
    honeypot = ""
  } | ConvertTo-Json
  Invoke-WebRequest -Uri "http://localhost:3000/api/support/tickets" -Method Post -Headers @{ "Content-Type"="application/json"; "x-forwarded-for"="manual-ip-limit" } -Body $body -SkipHttpErrorCheck | Select-Object StatusCode
}
```

**Expected**:

- Requests 1-5: HTTP `200`
- Request 6: HTTP `429` (`rate_limited`)

### Manual QA 10: Per-email rate limiting (3/24h) [ ]

Use same email with different IPs:

```powershell
$email = "email-limit-$(Get-Random)@example.com"
for ($i = 1; $i -le 4; $i++) {
  $body = @{
    name = "Email Limit Tester"
    email = $email
    category = "billing"
    subject = "Email limit test $i"
    message = "Testing per-email support endpoint limits while rotating client address."
    honeypot = ""
  } | ConvertTo-Json
  Invoke-WebRequest -Uri "http://localhost:3000/api/support/tickets" -Method Post -Headers @{ "Content-Type"="application/json"; "x-forwarded-for"="manual-email-limit-$i" } -Body $body -SkipHttpErrorCheck | Select-Object StatusCode
}
```

**Expected**:

- Requests 1-3: HTTP `200`
- Request 4: HTTP `429` (`rate_limited`)

### Manual QA 11: Conditional CAPTCHA trigger policy (honeypot threshold) [ ]

1. Send two honeypot requests from the same `x-forwarded-for` value (as in QA 8).
2. Send a third valid (non-honeypot) request from the same IP.

**Expected**:

- The third request is blocked once CAPTCHA is required.
- With default local config (no CAPTCHA provider), response is HTTP `429` (`rate_limited`).
- `SupportAbuseSignal` includes `captcha_required` for the blocked attempt.

### Manual QA 12: DB durability, hashing, and retention fields [ ]

Inspect DB (Prisma Studio or SQL) after at least one successful submit:

```sql
SELECT id, category, status, email, emailHash, ipHash, retentionExpiresAt, legalHoldUntil, createdAt
FROM "SupportTicket"
ORDER BY "createdAt" DESC
LIMIT 5;
```

```sql
SELECT ticketId, signalType, ipHash, emailHash, createdAt
FROM "SupportAbuseSignal"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Expected**:

- Ticket is persisted with `status = open`.
- `ipHash` and `emailHash` are stored as hashes (not raw values).
- `retentionExpiresAt` is about 18 months after `createdAt`
- Abuse signal rows exist for submission attempts.

### Manual QA 13: Support inbox email routing [x]

1. Set `SUPPORT_INBOX_EMAIL` to a mailbox you can inspect.
2. Set `ENABLE_TEST_ENDPOINTS=false`.
3. Restart server and submit a valid support request.

**Expected**:

- Ticket is still persisted in DB.
- Support inbox receives one notification email with category/subject metadata.
- No requester auto-ack email is sent.

### Manual QA 14: Admin access control for support triage [x]

1. Sign in as a non-admin user and open `/admin`.
2. Sign in as admin and open `/admin`.
3. Click sidebar nav items (`Health`, `Users`, `Habits`, `Activity`, `Support`, `Export`).

**Expected**:

- Non-admin cannot access admin dashboard.
- Admin can access `/admin` and sees a `Support` section in sidebar and page content.
- Admin sidebar section links smooth-scroll to the corresponding section anchors.

### Manual QA 15: Admin support list, filters, and cursor pagination [x]

1. As admin, open `/admin#support`.
2. Verify counters (`total/open/in progress/resolved`) render.
3. Toggle status filters: `All`, `Open`, `In progress`, `Resolved`.
4. If `Load more` appears, click it.

**Expected**:

- List updates by filter.
- Counts stay coherent.
- Pagination appends more results when cursor is available.
- Each ticket card shows requester name, subject, and message content.
- Status action buttons are consistently rendered below the ticket content.

### Manual QA 16: Admin status workflow and transition behavior [x]

1. On `/admin#support`, pick an `open` ticket.
2. Click `In progress`, then `Resolved`.
3. For a resolved ticket, click `In progress` to reopen workflow.
4. Try `Open` directly from `Resolved`.

**Expected**:

- `Open -> In progress -> Resolved` succeeds.
- `Resolved -> In progress` succeeds (reopen path).
- `Resolved -> Open` is rejected and ticket remains unchanged.
- `Updated` timestamp changes on successful status updates.

### Manual QA 17: Admin response payload avoids sensitive leakage [x]

1. While on `/admin` as admin, inspect network response for `GET /api/admin/support`.
2. Inspect one ticket object in response JSON.

**Expected**:

- Ticket summary includes triage-needed fields (`id`, `category`, `status`, `name`, `subject`, `message`, `email`, timestamps).
- Response does not include raw IP, hashed IP, user agent, or abuse-signal detail.

---

## Suggested Execution Order

1. Run QA 1, 1A, 2, 2A, 3-6, and 5A (public UX, discoverability, motion/loading, prefill, retry behavior).
2. Run QA 7-11 (API anti-spam and validation branches).
3. Run QA 12-13 (persistence + email routing).
4. Run QA 14-17 (admin triage and security boundaries).

---

## References

- [Sprint 14.1 Plan](../sprints/sprint-14.1.md)
- [Support E2E](../../e2e/support.spec.ts)
- [Support API Route](../../src/app/api/support/tickets/route.ts)
- [Support Form UI](../../src/components/support/SupportCenter.tsx)
- [Admin Support API](../../src/app/api/admin/support/route.ts)
- [Admin Support Status API](../../src/app/api/admin/support/[id]/route.ts)
- [Admin Support Panel](../../src/components/admin/AdminSupportPanel.tsx)
- [Support Policy](../../src/lib/support/policy.ts)
- [Support Hashing](../../src/lib/support/ipHash.ts)
- [Support Retention](../../src/lib/support/retention.ts)
