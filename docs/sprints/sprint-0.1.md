# Sprint 0.1: Engineering Foundation & Delivery Pipeline (Project Atlas)

**Duration**: ~3–5 days (depending on setup friction)  
**Status**: Mostly Complete (verify & stabilise)  
**Theme**: Tooling, testing, CI, database wiring, and deployment plumbing — no product features yet.

---

## Overview

Sprint 0.1 establishes a **production-grade baseline** for Project Atlas:

- Next.js + TypeScript strict setup
- Code quality enforcement (ESLint + Prettier)
- Unit + E2E testing with smoke coverage
- Prisma wired to Neon PostgreSQL
- GitHub Actions CI running from clean checkout
- Vercel connected for Preview (PR) + Production (`main`) deployments
- **No local git hooks** (Windows PATH issues). CI is the gate.

**Core Goal**: after this sprint, the repo is “real”. Every future feature must land with tests and must pass CI.

---

## Scope Decisions

### Included

- ✅ Next.js scaffolding + strict TS
- ✅ Tailwind setup
- ✅ ESLint + Prettier
- ✅ Vitest unit testing setup
- ✅ Playwright E2E setup (smoke)
- ✅ Prisma + Neon connection
- ✅ `.env.example` pattern + env validation (Zod recommended)
- ✅ GitHub Actions CI running clean
- ✅ Vercel Preview + Production deployments

### Explicitly Excluded

- ❌ Local pre-commit hooks enforcement (Husky/Lefthook removed due to Windows reliability)
- ❌ Any auth or habit features
- ❌ Any UI beyond scaffolding

---

## Testing Policy (Sprint 0.1)

**Every tool added must have a proof-of-life test:**

- Unit testing: at least 1 passing smoke test
- E2E testing: at least 1 smoke test proving the app loads in CI
- CI must run from clean checkout and pass consistently

---

## Key Deliverables

1. **Tooling baseline** (TS strict, lint, format, build)
2. **Testing baseline** (Vitest + Playwright)
3. **Database baseline** (Neon + Prisma working)
4. **CI baseline** (GitHub Actions gates merges)
5. **Deployment baseline** (Vercel Preview + Production)

---

## Phase 1: Repo + Next.js Setup (Day 1) — 18 tasks

### Tasks

#### Repository Setup (6 tasks)

- [x] **Task 1.1**: Create GitHub repository (temporary name OK)
- [x] **Task 1.2**: Clone locally and verify Node 20 works
- [x] **Task 1.3**: Add `.gitignore` (Next.js / Node)
- [x] **Task 1.4**: Add `.nvmrc` (Node 20)
- [x] **Task 1.5**: Add `.editorconfig`
- [x] **Task 1.6**: Create initial `README.md` with setup + scripts

#### Next.js Project (6 tasks)

- [x] **Task 1.7**: Create Next.js project (App Router, TS strict)
- [x] **Task 1.8**: Confirm `npm run dev` boots
- [x] **Task 1.9**: Confirm `npm run build` succeeds
- [x] **Task 1.10**: Create baseline folder structure:
  - `src/app`
  - `src/lib`
  - `src/components`
- [x] **Task 1.11**: Add basic app shell and verify routing
- [x] **Task 1.12**: Confirm Vercel builds locally parity (no hidden env issues)

#### Branching & Git Hygiene (6 tasks)

- [x] **Task 1.13**: Use `dev` as working branch; `main` for production deploy
- [ ] **Task 1.14**: Set default branch on GitHub to `dev` (optional but recommended)
- [ ] **Task 1.15**: Protect `main` branch (PR required + CI required)
- [ ] **Task 1.16**: Protect `dev` branch (CI required, optional PR requirement)
- [x] **Task 1.17**: Confirm `.env` ignored but `.env.example` tracked
- [x] **Task 1.18**: Confirm clean `git status` after installs/builds

---

## Phase 2: Code Quality Baseline (Day 1–2) — 16 tasks

### Tasks

#### ESLint + Prettier (10 tasks)

- [x] **Task 2.1**: Configure ESLint (strict)
- [x] **Task 2.2**: Add import sorting + unused imports rules
- [x] **Task 2.3**: Add Prettier config
- [x] **Task 2.4**: Add scripts:
  - `lint`
  - `lint:fix`
  - `typecheck`
  - `format`
  - `format:check`
  - `build`
- [x] **Task 2.5**: Ensure `npm run lint` fails on real errors
- [x] **Task 2.6**: Ensure `npm run format:check` fails when formatting is off
- [x] **Task 2.7**: Add VS Code workspace settings (`.vscode/settings.json`)
- [x] **Task 2.8**: Fix VS Code Prettier path issues caused by earlier pnpm state
- [ ] **Task 2.9**: Add `lint` to also check unused exports (optional)
- [ ] **Task 2.10**: Add `tsconfig` strictness review (confirm intended strict flags)

#### CI command (6 tasks)

- [x] **Task 2.11**: Add `npm run ci` script (lint + typecheck + unit tests + prettier check + build)
- [x] **Task 2.12**: Add `npm run ci:full` (ci + e2e)
- [x] **Task 2.13**: Verify `npm run ci` passes locally
- [x] **Task 2.14**: Verify `npm run ci` fails on intentional lint/format break
- [x] **Task 2.15**: Ensure CI uses `npm ci` (not `npm install`)
- [ ] **Task 2.16**: Add dependency audit step (optional, later)

---

## Phase 3: Testing Baseline (Day 2–3) — 14 tasks

### Tasks

#### Unit testing (Vitest) (6 tasks)

- [x] **Task 3.1**: Install and configure Vitest
- [x] **Task 3.2**: Add `vitest.config.ts` + `vitest.setup.ts`
- [x] **Task 3.3**: Add `src/__tests__/smoke.test.ts`
- [x] **Task 3.4**: Add `npm run test`, `test:watch`, `test:coverage`
- [x] **Task 3.5**: Ensure `npm test` runs in CI
- [ ] **Task 3.6**: Add coverage thresholds (optional, later once there’s real code)

#### E2E testing (Playwright) (8 tasks)

- [x] **Task 3.7**: Install and configure Playwright
- [x] **Task 3.8**: Create `e2e/smoke.spec.ts`
- [x] **Task 3.9**: Configure multi-browser projects (chromium + firefox)
- [x] **Task 3.10**: Ensure Playwright uses `webServer` to start app in CI
- [x] **Task 3.11**: Ensure E2E command exits cleanly in CI
- [x] **Task 3.12**: Add `npm run e2e` and `npm run e2e:ui`
- [ ] **Task 3.13**: Add trace/video capture policy for CI failures (optional)
- [ ] **Task 3.14**: Add a tiny “smoke asserts header exists” improvement (optional)

---

## Phase 4: Database Baseline (Day 3–4) — 12 tasks

### Tasks

#### Neon + Prisma (12 tasks)

- [x] **Task 4.1**: Create Neon project + database
- [x] **Task 4.2**: Add Prisma dependencies
- [x] **Task 4.3**: Create `prisma/schema.prisma`
- [x] **Task 4.4**: Configure Prisma according to current Prisma version constraints (move URLs out of schema if required)
- [x] **Task 4.5**: Create `.env` locally + `.env.example` tracked in git
- [x] **Task 4.6**: Configure `DATABASE_URL` (pooled) and `DIRECT_URL` (non-pooled) strategy
- [x] **Task 4.7**: Create `prisma.config.ts` if needed
- [x] **Task 4.8**: Create initial empty migration
- [x] **Task 4.9**: Add `src/lib/db.ts` (Prisma client singleton)
- [ ] **Task 4.10**: Add basic health route `/api/health/db` (optional)
- [ ] **Task 4.11**: Add migration guard in CI (optional for now)
- [ ] **Task 4.12**: Document DB setup in README

---

## Phase 5: CI/CD + Vercel (Day 4–5) — 12 tasks

### Tasks

#### GitHub Actions (7 tasks)

- [x] **Task 5.1**: Create CI workflow `.github/workflows/ci.yml`
- [x] **Task 5.2**: Ensure clean checkout + `npm ci`
- [x] **Task 5.3**: Run `npm run ci` in CI
- [x] **Task 5.4**: Run Playwright E2E in CI (with browsers install)
- [x] **Task 5.5**: Confirm pipeline fails correctly on lint/test/format errors
- [ ] **Task 5.6**: Add caching improvements only if CI is slow (optional)
- [ ] **Task 5.7**: Add PR annotations / summary output (optional)

#### Vercel Deployments (5 tasks)

- [x] **Task 5.8**: Connect repo to Vercel project
- [x] **Task 5.9**: Enable Preview deployments for PRs
- [x] **Task 5.10**: Configure Production deployments from `main`
- [ ] **Task 5.11**: Set Preview env vars separately from Production
- [ ] **Task 5.12**: Add `VERCEL_ENV`-aware behaviour if needed later

---

## Known Issues / Decisions (Important)

### Local Git Hooks

- ❌ Husky and Lefthook proved unreliable on Windows due to Node PATH visibility in hook shells.
- ✅ Decision: **remove hooks**, rely on **CI + branch protection** as the gate.
- ✅ Local developer workflow uses `npm run ci` and `npm run ci:full` manually.

---

## Definition of Done (Sprint 0.1)

1. ✅ Next.js app builds and runs locally (`dev`, `build`)
2. ✅ ESLint and Prettier enforce code quality via scripts
3. ✅ Vitest + Playwright run locally and in CI
4. ✅ GitHub Actions runs from clean checkout and gates merges
5. ✅ Prisma connects to Neon successfully and migrations work
6. ✅ Vercel deploys preview builds (PRs) and prod builds (`main`)
7. ✅ README includes setup + scripts
8. ✅ No “local-only” enforcement required; CI is authoritative

---

## Success Metrics

- CI passes consistently on clean checkout
- A formatting or lint error reliably fails CI
- Preview deployments appear automatically on PRs
- Production deployments occur only from `main`
- Repo is stable enough to start feature work (Sprint 1.1 Auth)

---

## Next Sprint Suggestion (Sprint 1.1)

**Authentication Foundation**

- Signup/login
- Email verification (Resend)
- Route protection
- Auth E2E tests
- Basic account management + delete request

---
