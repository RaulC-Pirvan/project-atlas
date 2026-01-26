# Project Atlas

Project Atlas is a habit-tracking web application focused on correctness,
testability, and production-grade engineering discipline.

Key invariant: a habit is defined independently of dates. Habits appear on every
calendar day that matches their active weekdays, and completion is tracked per
habit per date.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL (Neon) + Prisma
- Vitest (unit tests) + Playwright (E2E)

## Requirements

- Node 20+
- npm (no pnpm)

## Setup

1. Copy `.env.example` to `.env` and set DB connection strings.
2. Install deps: `npm ci`
3. Run dev server: `npm run dev`

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run e2e`
- `npm run ci`
- `npm run ci:full`

## Notes

- CI is the enforcement gate; local git hooks are intentionally not used.
