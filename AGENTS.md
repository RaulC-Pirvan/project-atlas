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
- PostgreSQL (Neon) + Prisma with `@prisma/adapter-pg` and `pg` pool.
- Auth foundation: Prisma models for User/Account/Session/VerificationToken/EmailVerificationToken/PasswordResetToken.
- Auth API routes implemented: signup, verify-email, resend-verification.
- NextAuth Credentials provider with JWT sessions and callbacks.
- Domain-level auth helpers exist in `src/lib/auth` and are unit tested.
- Email verification uses Resend client stub (skips in non-prod without API key).
- Auth UI pages and shared UI components are not built yet.

## UI Direction (authoritative)

- Visual style: clean, minimalist, black and white only.
- Layout: generous whitespace, clear typographic hierarchy.
- Components: build reusable primitives so styling changes are centralized.
- Avoid heavy decoration, gradients, or bright accent colors.

## Codebase Map

- `src/app` - App Router UI and API routes.
- `src/app/api/auth/*/route.ts` - Auth API routes.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler.
- `src/lib/auth` - Auth utilities (hashing, policy, credentials, rate limit, nextauth).
- `src/lib/api` - Shared API error/response helpers and auth logic.
- `src/lib/db/prisma.ts` - Prisma singleton using adapter-pg + pg pool.
- `src/infra/email` - Resend client and verification email sender.
- `src/types/next-auth.d.ts` - NextAuth session/JWT type extensions.
- `prisma/schema.prisma` - DB models; migrations in `prisma/migrations`.
- `src/app/api/auth/__tests__` - API auth tests.
- `src/lib/auth/__tests__` - Auth unit tests (password, tokens, policy, credentials).
- `src/components` - Shared UI components (to be introduced for auth UI).
- `src/app/(auth)` - Auth pages (to be introduced).

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
- Login rate limiting is in-memory and per-process (see `src/lib/auth/loginRateLimit.ts`).
- NextAuth uses JWT sessions and requires `NEXTAUTH_SECRET` in production.

## Expectations for AI Assistance

- Think like a senior engineer and catch architectural mistakes early.
- Prefer phased, test-driven implementation.
- Do not suggest shortcuts that undermine quality.
