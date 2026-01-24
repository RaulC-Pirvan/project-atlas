# Phase 0 — Repository, Tooling & Deployment Baseline

## Goal
Establish a production-ready foundation: repository, tooling, CI/CD, testing, and deployment.
No product features are implemented in this phase.

---

## Tasks

### Repository & Local Setup [DONE]
- Create GitHub repository (temporary name is fine).
- Clone repository locally.
- Add:
  - `.gitignore` (Node / Next.js)
  - `.nvmrc` (Node 20 LTS)
  - `.editorconfig`
  - Initial `README.md`

### Next.js Project [DONE]
- Initialize Next.js project:
  - App Router
  - TypeScript
- Install and configure Tailwind CSS.
- Confirm local dev server runs.

### Code Quality
- Configure ESLint (strict).
- Configure Prettier.
- Add scripts:
  - `lint`
  - `typecheck`
  - `format`
  - `build`

### Pre-commit Hooks
- Install Husky + lint-staged.
- Pre-commit must run:
  - ESLint
  - TypeScript typecheck
  - Unit tests
  - Build
  - Prettier check

### Testing Setup
- Unit testing: Vitest
- E2E testing: Playwright
- Add:
  - One unit smoke test
  - One e2e smoke test

### Database
- Create Neon project + database.
- Add Prisma.
- Configure DB connection.
- Run initial empty migration.

### CI/CD
- Configure GitHub Actions:
  - install dependencies
  - lint
  - typecheck
  - unit tests
  - build
  - e2e tests
- CI must run from clean checkout.

### Deployment
- Connect repository to Vercel.
- Enable:
  - Preview deployments (PRs)
  - Production deployment (main branch)

---

## Definition of Done
- `npm/pnpm build` works locally.
- Pre-commit blocks failing commits.
- CI pipeline is green.
- Vercel preview deploy works.
- Basic unit and e2e tests pass.
