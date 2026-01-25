# Project Atlas - Agent Instructions

## Mission

Build a habit-tracking web app with production-grade quality. Favor clarity, correctness, and maintainability over speed. Be direct and pragmatic.

## Core Product Invariant (do not violate)

A habit is defined independently of dates.

- A habit has: title, optional description, active weekdays.
- A habit appears on every calendar day that matches its active weekdays.
- Daily completion is tracked per habit per date.
- Do not create habits per date.

## Current State (high-level)

- Next.js App Router + TypeScript + Tailwind CSS.
- PostgreSQL (Neon) + Prisma.
- Auth foundation: Prisma models for User/Account/Session/VerificationToken/EmailVerificationToken/PasswordResetToken.
- Domain-level auth helpers exist in `src/lib/auth` and are unit tested.
- Several files are placeholders (0-length) for upcoming domain/infra/API work.

## Codebase Map

- `src/app` - App Router UI and API routes.
- `src/app/api/auth/*/route.ts` - Auth API routes (currently placeholders).
- `src/lib/auth` - Pure auth utilities (hashing, token logic, policy).
- `src/lib/db/prisma.ts` - Prisma singleton (Next.js safe).
- `src/infra/*` - External integrations (email, persistence) - placeholders.
- `prisma/schema.prisma` - DB models; migrations in `prisma/migrations`.
- `tests` - Placeholder API/domain tests.
- `src/lib/auth/__tests__` - Real unit tests for auth helpers.

## Engineering Standards

- TypeScript strict; no `any`.
- ESLint + Prettier enforced.
- Domain logic should be pure and testable; avoid tight coupling to Prisma types.
- CI is the enforcement mechanism; do not reintroduce Git hooks.

## Tooling and Commands

- Use `npm` only (no pnpm).
- Scripts in `package.json`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`, `npm run e2e`.
- Prisma: `migrate dev` for authoring, `migrate deploy` for CI/prod.

## Auth Policy Notes

- Login requires verified email and not soft-deleted (see `src/lib/auth/policy.ts`).
- Email verification uses hashed tokens (see `src/lib/auth/emailVerification.ts`).

## Expectations for AI Assistance

- Think like a senior engineer and catch architectural mistakes early.
- Prefer phased, test-driven implementation.
- Do not suggest shortcuts that undermine quality.
