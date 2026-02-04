# Sprint 6.1: Observability & Safety - Project Atlas

**Duration**: Week 12 (5-7 days)  
**Status**: Not Started  
**Theme**: Production hardening with visibility, safeguards, and baseline security.

---

## Overview

Sprint 6.1 establishes core observability and safety measures required for a
production-ready launch: error tracking, structured logs, a health check
endpoint, auth rate limiting, and security headers.

**Core Goal**: make failures visible, reduce abuse risk, and enforce secure
defaults without disrupting existing auth and habit flows.

---

## Scope Decisions

### Included

- [ ] Error tracking (Sentry or equivalent)
- [ ] Structured logging
- [ ] Health check endpoint
- [ ] Rate limiting on auth routes
- [ ] Security headers

### Excluded (this sprint)

- [ ] Full analytics/BI pipeline
- [ ] Performance tracing/APM beyond error tracking basics
- [ ] Bot protection or CAPTCHA
- [ ] Advanced WAF or CDN edge rules

---

## Testing Policy

After each feature area, add tests:

- **API** -> `src/app/api/**/__tests__/*.test.ts`
- **Middleware** -> `middleware.ts` (add/extend tests if applicable)
- **E2E** -> only if behavior must be verified end-to-end

CI must remain green.

---

## Phase 1: Observability Foundations (Days 1-2)

### Tasks (2)

- [x] **Task 1.1**: Add error tracking (Sentry or equivalent)
- [x] **Task 1.2**: Implement structured logging for API routes

---

## Phase 2: Service Safety (Days 2-3)

### Tasks (2)

- [x] **Task 2.1**: Add health check endpoint
- [x] **Task 2.2**: Apply security headers globally

---

## Phase 3: Auth Protection (Days 3-5)

### Tasks (1)

- [x] **Task 3.1**: Add rate limiting on auth routes

---

## Implementation Guidelines

- Keep logging structured and consistent; avoid PII in logs.
- Error tracking must be environment-aware (dev vs prod behavior).
- Health check should be fast and safe (no expensive DB queries).
- Rate limiting must not break email verification or resend flows.
- Security headers should be applied across app, auth, and marketing routes.

---

## File Structure (Expected)

- `src/app/api/health/route.ts`
- `src/lib/observability/*` (logging/error tracking utilities)
- `middleware.ts` (security headers / rate limiting hooks)
- `src/app/api/**/__tests__/*`

---

## Definition of Done

1. [ ] Errors are captured by the chosen tracking tool in production
2. [ ] API logs are structured and consistent across routes
3. [ ] `/api/health` responds quickly with a stable payload
4. [ ] Auth routes enforce rate limiting without false positives
5. [ ] Security headers are present on app and marketing responses
6. [ ] CI passes from clean checkout

---
