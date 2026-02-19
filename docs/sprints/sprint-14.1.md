# Sprint 14.1: Support Center + Contact Form - Project Atlas

**Duration**: TBD (7-10 days)  
**Status**: In Progress  
**Theme**: Ship a public support intake flow with durable ticket storage, anti-spam controls, and minimal admin triage visibility.

---

## Overview

Sprint 14.1 introduces a public `/support` page with FAQ content and a contact form,
plus server-side ticket intake with anti-spam controls and durable triage routing.

This sprint prioritizes operational reliability and abuse resistance over advanced
customer-support workflows. The support queue must be persisted in the database,
while inbound support notifications are delivered to a configured support inbox.

**Core Goal**: users can reliably submit support requests from a public surface,
and operators can review queued tickets safely from a minimal admin view.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Add public `/support` page with FAQ + support form
- [ ] Add support categories: `billing`, `account`, `bug`, `feature_request`
- [ ] Prefill known user context when authenticated
- [ ] Add anti-spam controls: honeypot + rate limiting + conditional CAPTCHA
- [ ] Persist tickets in DB and send support-inbox notification email
- [ ] Add minimal read-only admin triage list for submitted tickets
- [ ] Add E2E coverage for success/failure submission paths

### Excluded (this sprint)

- [ ] Two-way support messaging or threaded conversations
- [ ] Auto-acknowledgement email to requester
- [ ] SLA automation and escalation workflows
- [ ] Full support analytics dashboard
- [ ] Attachments or file uploads

---

## Support Intake Policy (Locked)

- `/support` is fully public (signed-out and signed-in users).
- Authenticated users get prefilled identity fields from session where available.
- Ticket persistence is DB-authoritative; email notification is a delivery channel.
- No requester auto-ack email in v1.

### Anti-Spam Baseline (Locked)

- Honeypot field must remain empty.
- Primary rate limits:
  - `5 submissions / 15 minutes / IP`
  - `3 submissions / 24 hours / email`
- CAPTCHA is conditionally required (not default-on).

### CAPTCHA Trigger Policy (Locked)

Require CAPTCHA for a principal when either threshold is crossed:

- `>= 8 attempts / 1 hour / IP`
- `>= 2 honeypot hits / 24 hours`

CAPTCHA requirement decays after `24 hours` of clean behavior.

### Data Retention + Privacy (Locked)

- Ticket retention: `18 months`, then hard delete via scheduled cleanup.
- Store IP as HMAC-SHA256 hash in ticket/security records (no raw IP in durable ticket row).
- Persist only minimum metadata required for triage and abuse correlation.
- Allow legal-hold extension path (manual flag) for exceptional cases.

---

## Phase 0: Data Model + Policy Foundation (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Add Prisma models for support tickets, ticket status, and abuse signal records
- [x] **Task 0.2**: Add support categories enum (`billing`, `account`, `bug`, `feature_request`)
- [x] **Task 0.3**: Add IP hashing utility (HMAC-SHA256 with server secret)
- [x] **Task 0.4**: Add retention helper for ticket expiry cutoff and legal-hold skip behavior
- [x] **Task 0.5**: Add migration and schema tests for ticket lifecycle constraints
- [x] **Task 0.6**: Define typed support DTOs independent of Prisma model leakage

---

## Phase 1: Public Support Intake API + Anti-Spam (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Implement `POST /api/support/tickets` (public endpoint)
- [x] **Task 1.2**: Add request validation schema (name/email/category/subject/message + honeypot)
- [x] **Task 1.3**: Add honeypot rejection path with generic success-style response semantics
- [x] **Task 1.4**: Add per-IP and per-email rate limiting for submission endpoint
- [x] **Task 1.5**: Add CAPTCHA-required decision logic based on abuse thresholds
- [x] **Task 1.6**: Add optional CAPTCHA verification adapter (enabled only when configured)
- [x] **Task 1.7**: Persist ticket + abuse metadata atomically and return standardized API response

---

## Phase 2: Support Page UX + Auth Prefill (Days 4-6)

### Tasks (6)

- [x] **Task 2.1**: Add `/support` page route with FAQ section + support form
- [x] **Task 2.2**: Keep `/support` publicly accessible in middleware/public-path rules
- [x] **Task 2.3**: Prefill authenticated user name/email while allowing edits
- [x] **Task 2.4**: Add category selection UI with locked category set
- [x] **Task 2.5**: Keep all form validation feedback toast-based (no inline error copy)
- [x] **Task 2.6**: Add submission success state and retry-safe UX for transient failures

---

## Phase 3: Routing to Inbox + Admin Triage (Days 6-8)

### Tasks (6)

- [x] **Task 3.1**: Add support notification email sender using existing email infrastructure
- [x] **Task 3.2**: Add support inbox env configuration and safe non-prod/test-mode behavior
- [x] **Task 3.3**: Add admin API to list support tickets (cursor + status filter)
- [x] **Task 3.4**: Add admin read-only triage panel section in `/admin` (new `Support` block)
- [x] **Task 3.5**: Add basic ticket status workflow (`open`, `in_progress`, `resolved`) for operator tracking
- [x] **Task 3.6**: Ensure admin ticket views avoid unnecessary sensitive payload leakage

---

## Phase 4: Coverage + Hardening (Days 8-10)

### Tasks (7)

- [x] **Task 4.1**: Unit tests for IP hashing, abuse threshold evaluation, and retention helpers
- [x] **Task 4.2**: API tests for public submit success, validation failures, rate-limit, honeypot, CAPTCHA-required
- [x] **Task 4.3**: Component tests for support form UX, category behavior, and toast error paths
- [x] **Task 4.4**: Admin API/component tests for ticket list and status filtering
- [x] **Task 4.5**: E2E tests for signed-out submit and signed-in prefill submit paths
- [x] **Task 4.6**: E2E tests for abuse/failure paths (rate limited + invalid payload)
- [x] **Task 4.7**: CI stability pass for new support and admin triage flows

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> hashing, abuse-threshold decisions, retention cutoff helpers
- **API** -> support submit route, anti-spam branches, admin support list route
- **Components** -> support form, FAQ rendering, admin support panel states
- **E2E** -> public submit success/failure and signed-in prefill path

CI must remain green.

---

## Environment and Config

Required/expected additions:

- `SUPPORT_INBOX_EMAIL` (internal support destination)
- `SUPPORT_IP_HASH_SECRET` (HMAC key material, server-only)

Optional (conditional CAPTCHA path):

- `SUPPORT_CAPTCHA_PROVIDER` (e.g. `turnstile`)
- `SUPPORT_CAPTCHA_SECRET`
- `NEXT_PUBLIC_SUPPORT_CAPTCHA_SITE_KEY`

Recommended updates in this sprint:

- [x] Update `.env.example` with support + anti-spam variables
- [ ] Add ops notes for support queue triage and retention cleanup execution

---

## Implementation Guidelines

- Keep support domain logic in dedicated service modules (pure and testable where possible).
- Keep API responses aligned with existing `jsonOk/jsonError` patterns.
- Use `withApiLogging` but avoid logging raw ticket message body.
- Treat DB queue as source of truth; inbox email is best-effort notification.
- Do not block public support access behind authentication.
- Keep rate-limit and CAPTCHA checks deterministic and testable.
- Preserve existing auth and admin protections; support features must be additive.
- Keep user-facing form errors toast-based (no inline form error messages).
- Maintain strict TypeScript types; no `any`.

---

## File Structure (Expected)

- `prisma/schema.prisma`
- `prisma/migrations/*` (new support model migration)
- `src/app/support/page.tsx`
- `src/app/api/support/tickets/route.ts`
- `src/lib/api/support/*` (validation + services)
- `src/lib/support/*` (domain types, anti-spam policy, retention, hashing)
- `src/lib/support/__tests__/*`
- `src/infra/email/sendSupportTicketEmail.ts` (new support notification sender)
- `src/app/admin/page.tsx` (add Support section)
- `src/components/admin/*` (support triage panel)
- `src/app/api/admin/support/route.ts`
- `src/app/api/support/__tests__/*`
- `src/app/api/admin/__tests__/*` (support route coverage)
- `src/components/support/*` + `src/components/support/__tests__/*`
- `e2e/support.spec.ts`
- `src/lib/auth/middleware.ts` (public route allowance for `/support`)
- `.env.example`
- `docs/sprints/sprint-14.1.md`

---

## Locked Implementation Decisions (Confirmed)

1. **Access model**: `/support` is fully public.
2. **Routing model**: persist to DB queue and send support-inbox notification email.
3. **Admin operations**: include minimal admin triage list in this sprint.
4. **Requester email**: no auto-ack email in v1.
5. **CAPTCHA strategy**: triggered only after abuse thresholds, not always-on.
6. **Data policy**: 18-month retention; durable IP storage must be HMAC-hashed.

---

## Definition of Done

1. [ ] Public `/support` page is accessible and includes FAQ + contact form
2. [ ] Ticket categories match locked set and submit payload validation is enforced
3. [ ] Authenticated users see prefilled support identity context
4. [ ] Anti-spam controls enforce honeypot + rate limits + conditional CAPTCHA
5. [ ] Support tickets are persisted durably and routed to internal support inbox
6. [ ] Admin dashboard includes a minimal read-only support triage view
7. [ ] Retention and IP-hashing policy are implemented as specified
8. [ ] Unit/API/component/E2E coverage exists for success and failure branches
9. [ ] CI passes from a clean checkout

---
