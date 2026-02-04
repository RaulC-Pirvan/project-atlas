# Sprint 6.1 Test Workflows - Observability & Safety

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 6.1 hardens the service with observability and safety features: error
tracking, structured logging, health checks, security headers, and auth route
rate limiting. This document covers manual and automated verification.

**Key Features Implemented**:

- Sentry error tracking with dev toggle and tunnel routing
- Structured API logging (`api.request` / `api.error`)
- `/api/health` endpoint
- Global security headers via middleware
- Auth route rate limiting (signup/resend/verify/logout/debug)

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

   SENTRY_DSN=...
   NEXT_PUBLIC_SENTRY_DSN=...

   # Enable Sentry in dev (optional for local verification)
   SENTRY_ENABLED=true
   NEXT_PUBLIC_SENTRY_ENABLED=true

   # Disable this if you want to verify rate limiting locally
   ENABLE_TEST_ENDPOINTS=true
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

---

## Test Workflows

### Workflow 1: Health endpoint responds quickly [x]

1. Visit `/api/health` or run:

   ```bash
   curl http://localhost:3000/api/health
   ```

**Expected**: HTTP 200 and JSON payload containing `status`, `timestamp`, and
`uptimeSeconds`.

---

### Workflow 2: Security headers are present [x]

1. Open `/` in the browser.
2. In DevTools ? Network, click the document request.
3. Verify response headers include:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
   - `X-DNS-Prefetch-Control: off`

**Expected**: All headers above exist. `Strict-Transport-Security` only appears
in production.

---

### Workflow 3: Structured logging on API calls [x]

1. Call `/api/health`.
2. Observe the server console output.

**Expected**: A JSON log line with `message: "api.request"` containing
`method`, `path`, `status`, and `durationMs`.

---

### Workflow 4: Sentry event capture (dev) [x]

1. Ensure `SENTRY_ENABLED=true` and `NEXT_PUBLIC_SENTRY_ENABLED=true`.
2. Temporarily throw an error in a client component or call `Sentry.captureException(...)`.
3. Watch DevTools ? Network for a POST to `/_obs?...`.
4. Check Sentry ? Issues (Environment = All/development).

**Expected**: The event appears in Sentry and a tunnel request is visible to `/_obs`.

---

### Workflow 5: Auth rate limiting [x]

1. Set `ENABLE_TEST_ENDPOINTS=false` and restart the dev server.
2. Run the following in PowerShell to exceed the limit:

   ```powershell
   1..12 | ForEach-Object {
     Invoke-WebRequest -Method Post -Uri http://localhost:3000/api/auth/signup \
       -ContentType 'application/json' \
       -Body '{"email":"test@example.com","password":"weakpass","displayName":"Test"}' \
       -SkipHttpErrorCheck | Select-Object -ExpandProperty StatusCode
   }
   ```

**Expected**: After several attempts, responses return **429** and include:
`Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Automated Tests

### Unit (Suggested)

```bash
npm test -- apiLogger
npm test -- health
npm test -- securityHeaders
npm test -- rateLimit
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Sentry events do not appear

**Symptoms**: No new issues in Sentry after triggering a test error.

**Fixes**:

- Ensure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are set.
- Disable ad blockers (or verify tunnel requests to `/_obs`).
- Set Sentry UI Environment filter to **All** or **development**.

---

### Issue: Rate limiting never triggers in dev

**Symptoms**: Requests never return 429.

**Fixes**:

- Set `ENABLE_TEST_ENDPOINTS=false` and restart.

---

### Issue: Missing security headers

**Symptoms**: One or more headers not present.

**Fixes**:

- Confirm requests are going through `middleware.ts` (not `/_next/*`).

---

## Success Criteria

Sprint 6.1 is complete when:

1. `/api/health` returns a stable, fast response.
2. Security headers are present on app and marketing responses.
3. API logs are structured and consistent.
4. Sentry captures errors via the tunnel route.
5. Auth rate limiting enforces 429 responses on abuse.
6. CI passes from clean checkout.

---

## Additional Resources

- [Sprint 6.1 Plan](../sprints/sprint-6.1.md)
- [Health Endpoint](../../src/app/api/health/route.ts)
- [Security Headers](../../src/lib/http/securityHeaders.ts)
- [Rate Limiter](../../src/lib/http/rateLimit.ts)
- [Middleware](../../middleware.ts)
- [AGENTS](../../AGENTS.md)
