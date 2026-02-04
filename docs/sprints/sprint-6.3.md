# Sprint 6.3: Testing & Launch Readiness - Project Atlas

**Duration**: Week 13 (5-7 days)  
**Status**: In Progress  
**Theme**: Raise test confidence and complete launch readiness checklist.

---

## Overview

Sprint 6.3 focuses on the last-mile quality bar before launch. The goal is to
expand automated coverage for core habit flows, set up a staging environment,
and complete operational readiness for production.

**Core Goal**: be confident that the app can ship safely with repeatable
verification and rollback protection.

---

## Scope Decisions

### Included

- [ ] Expand E2E coverage (full habit lifecycle)
- [ ] Achieve ~80% meaningful test coverage
- [ ] Staging environment
- [ ] Database backup strategy
- [ ] Final CI audit
- [ ] Production readiness checklist

### Excluded (this sprint)

- [ ] New product features
- [ ] Performance tuning beyond launch readiness
- [ ] Large UI redesigns

---

## Testing Policy

After each coverage increase, ensure new tests are stable and meaningful:

- **E2E** -> core habit lifecycle and regression paths
- **Unit/API** -> domain logic and API services
- **CI** -> full green run from clean checkout

---

## Phase 1: Coverage Expansion (Days 1-3)

### Tasks (2)

- [x] **Task 1.1**: Expand E2E coverage (full habit lifecycle)
- [x] **Task 1.2**: Achieve ~80% meaningful test coverage

---

## Phase 2: Environments & Backups (Days 3-4)

### Tasks (2)

- [ ] **Task 2.1**: Staging environment
- [ ] **Task 2.2**: Database backup strategy

---

## Phase 3: Release Readiness (Days 4-5)

### Tasks (2)

- [ ] **Task 3.1**: Final CI audit
- [ ] **Task 3.2**: Production readiness checklist

---

## Implementation Guidelines

- Prioritize tests that reflect real user behavior and highest-risk paths.
- Prefer fewer, stronger tests over noisy, brittle checks.
- Staging must be as close to production as practical (env vars, DB, auth).
- Backups should be verified with a restore drill or documented procedure.
- CI audit should include lint, typecheck, unit, E2E, build, and formatting.

---

## File Structure (Expected)

- `e2e/*`
- `src/components/**/__tests__/*`
- `src/app/api/**/__tests__/*`
- `docs/test workflows/*`
- `docs/ops/*`
- `docs/sprints/sprint-6.3.md`

---

## Definition of Done

1. [x] Full habit lifecycle is covered by E2E tests
2. [x] Meaningful test coverage is at or above ~80%
3. [ ] Staging environment is live and documented
4. [ ] Database backup strategy is documented and validated
5. [ ] CI audit passes from a clean checkout
6. [ ] Production readiness checklist is completed

---
