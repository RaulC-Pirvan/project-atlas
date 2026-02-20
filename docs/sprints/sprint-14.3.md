# Sprint 14.3: User Self-Service Data Export - Project Atlas

**Duration**: TBD (6-8 days)  
**Status**: Planned  
**Theme**: Provide secure, user-scoped self-service data export with durable audit records and reliable download UX.

---

## Overview

Sprint 14.3 introduces a self-service export flow so authenticated users can
download their own account data in a portable format.

This sprint prioritizes security, scope correctness, and auditability over
advanced export orchestration. Exports must be strictly bound to the current
authenticated user and must never allow cross-user data access.

**Core Goal**: a signed-in user can download their own data from Account using
a simple, secure JSON export flow with robust authorization and audit logging.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Add authenticated user export endpoint: `GET /api/account/exports/self`
- [ ] Export user-scoped data: habits, completions, reminders, achievements
- [ ] Return downloadable JSON (`Content-Disposition: attachment`)
- [ ] Add account UI section with a "Download my data" action
- [ ] Add strict authorization checks and per-user export rate limiting
- [ ] Add durable export audit logging in database
- [ ] Add tests for authorization boundaries and payload integrity

### Excluded (this sprint)

- [ ] CSV export variants for self-service users
- [ ] Async export jobs/background queue and delayed delivery
- [ ] Email delivery of export files
- [ ] Compression/encryption-at-rest for generated export artifacts
- [ ] Historical export download history UI

---

## Data Export Policy (Locked)

### Access + Authorization

- Endpoint is authenticated-only.
- Export scope is always `session.user.id`.
- No user id input is accepted from query/body/path for export scoping.
- Unauthorized requests return `401`.
- Cross-user access attempts are structurally impossible by design.

### Export Format

- Format: JSON only for v1.
- Response headers:
  - `Content-Type: application/json; charset=utf-8`
  - `Content-Disposition: attachment; filename="<timestamp>-atlas-data-export.json"`
  - `Cache-Control: no-store`
- Payload includes metadata:
  - `schemaVersion`
  - `generatedAt`
  - `userId`

### Export Data Surface

- `habits`: id/title/description/sortOrder/archivedAt/createdAt/updatedAt + active weekdays
- `completions`: habitId/date/completedAt
- `reminders`:
  - user reminder settings (digest/quiet-hours/snooze defaults)
  - per-habit reminder times
- `achievements`:
  - `AchievementUnlock`
  - `HabitMilestoneUnlock`

### Audit + Abuse Controls

- Every export request writes an audit record in DB.
- Audit captures: `userId`, `requestedAt`, `status`, `format`, `recordCounts`, `requestId`.
- Endpoint is rate-limited per user (baseline: `3 requests / 15 minutes`).

---

## Phase 0: Export Contract + Audit Foundation (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Define export payload contract/types with explicit `schemaVersion`
- [x] **Task 0.2**: Add `UserDataExportAudit` Prisma model + migration
- [x] **Task 0.3**: Add export audit service helpers (create success/failure records)
- [x] **Task 0.4**: Add per-user export rate-limit policy helper
- [x] **Task 0.5**: Add JSON filename/date stamp helper
- [x] **Task 0.6**: Add export record-count summarization utility

---

## Phase 1: User-Scoped Export API (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Implement `GET /api/account/exports/self` (authenticated)
- [x] **Task 1.2**: Enforce strict session-bound user scoping for all export queries
- [x] **Task 1.3**: Query and assemble habits + schedules export section
- [x] **Task 1.4**: Query and assemble completions export section
- [x] **Task 1.5**: Query and assemble reminders export section (settings + habit reminder times)
- [x] **Task 1.6**: Query and assemble achievements export section (unlock tables)
- [x] **Task 1.7**: Return downloadable JSON with `no-store` and attachment headers

---

## Phase 2: Account UX Integration (Days 4-5)

### Tasks (5)

- [x] **Task 2.1**: Add `Data export` section in `/account`
- [x] **Task 2.2**: Add `Download my data (JSON)` action
- [x] **Task 2.3**: Add pending/loading/error UX with toast-based feedback
- [x] **Task 2.4**: Keep UX copy explicit on scope ("your data only")
- [x] **Task 2.5**: Place section near account-management actions without clutter

---

## Phase 3: Security + Audit Hardening (Days 5-6)

### Tasks (6)

- [ ] **Task 3.1**: Write success/failure audit entries for each export request
- [ ] **Task 3.2**: Include request correlation id in audit metadata
- [ ] **Task 3.3**: Ensure failure paths do not leak sensitive internals
- [ ] **Task 3.4**: Add explicit rate-limit error handling for export endpoint
- [ ] **Task 3.5**: Verify endpoint uses API logging wrapper and consistent error responses
- [ ] **Task 3.6**: Validate record-count metadata aligns with exported payload sections

---

## Phase 4: Coverage + Stability (Days 6-8)

### Tasks (6)

- [ ] **Task 4.1**: API tests for auth requirements (`401` when signed out)
- [ ] **Task 4.2**: API tests for user-scope correctness (no cross-user leakage)
- [ ] **Task 4.3**: Service/unit tests for payload integrity and record counts
- [ ] **Task 4.4**: Component tests for account export section interactions
- [ ] **Task 4.5**: Optional E2E smoke for account export download flow
- [ ] **Task 4.6**: CI stability pass for new export/audit surfaces

---

## Testing Policy

After each feature area, add tests:

- **Unit/Service** -> export assembly, schema versioning, record counts, audit helper behavior
- **API** -> auth, rate-limit, headers, payload integrity, user scoping
- **Components** -> account export UI action states and error handling
- **E2E (smoke)** -> signed-in download path and basic success behavior

CI must remain green.

---

## Environment and Config

No new secrets are required.

Recommended config additions:

- `EXPORT_SELF_RATE_LIMIT_MAX=3`
- `EXPORT_SELF_RATE_LIMIT_WINDOW_MS=900000`

Notes:

- Keep export response non-cacheable (`Cache-Control: no-store`).
- Keep audit storage durable in DB (not in-memory only).

---

## Implementation Guidelines

- Keep export assembly in dedicated service modules, not directly in route handlers.
- Avoid leaking Prisma internals in response shape; use explicit DTOs.
- Keep route behavior aligned with existing `jsonOk/jsonError` and `withApiLogging`.
- Never accept caller-provided user ids for export scope.
- Prefer additive schema evolution with `schemaVersion` for forward compatibility.
- Keep UI and API error messages actionable but non-sensitive.
- Preserve strict TypeScript (`no any`) and existing lint/type/test standards.

---

## File Structure (Expected)

- `prisma/schema.prisma` (new `UserDataExportAudit` model)
- `prisma/migrations/*` (new export-audit migration)
- `src/app/api/account/exports/self/route.ts`
- `src/app/api/account/exports/__tests__/self.route.test.ts`
- `src/lib/account/exports/*` (export DTOs + assembly service + helpers)
- `src/lib/account/exports/__tests__/*`
- `src/components/auth/AccountPanel.tsx` (Data export section/button)
- `src/components/auth/__tests__/AccountPanel.test.tsx` (export UI coverage)
- `e2e/account-export.spec.ts` (optional smoke)
- `docs/sprints/sprint-14.3.md`

---

## Locked Implementation Decisions (Confirmed)

1. **Endpoint**: `GET /api/account/exports/self`
2. **Format**: JSON-only in v1
3. **Scope**: strictly current authenticated user (`session.user.id`)
4. **Audit durability**: DB-backed audit model
5. **Rate limiting**: per-user export limit (`3/15min` baseline)
6. **UI surface**: account page self-service download action
7. **Data set**: habits, completions, reminders, achievements unlock records

---

## Definition of Done

1. [ ] Authenticated user can download own export from `/account`
2. [ ] Export endpoint denies unauthenticated requests
3. [ ] Export data is strictly user-scoped with no cross-user leakage
4. [ ] Payload includes required domains and metadata (`schemaVersion`, `generatedAt`)
5. [ ] Response headers enforce attachment download and `no-store`
6. [ ] Export requests are rate-limited per user
7. [ ] Durable audit row is created for success/failure export attempts
8. [ ] Route/service/component tests cover authorization + payload integrity
9. [ ] CI passes from a clean checkout

---
