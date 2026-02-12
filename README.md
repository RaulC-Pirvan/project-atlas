# Atlas

Atlas is a production-oriented habit-tracking SaaS application designed with strong domain modeling, architectural clarity, and engineering discipline in mind.

The project prioritizes correctness, testability, and long-term maintainability over rapid feature iteration.

---

## Core Domain Concept

A habit is defined independently of dates.

Habits represent user intent, not daily instances.  
They appear automatically on calendar days that match their active weekdays, while completion is tracked separately per habit per date.

This invariant ensures:

- Clean separation between domain logic and persistence
- Predictable state transitions
- Testable, deterministic behavior

---

## Architecture Principles

Atlas follows a structured, production-grade approach:

- Clear separation between domain logic and infrastructure
- Strict TypeScript configuration (`strict` mode, no implicit shortcuts)
- Server-side validation and controlled API boundaries
- CI-enforced quality gates
- Test-driven validation of core logic

The goal is not to build a toy app, but a system that scales in complexity without becoming fragile.

---

## Tech Stack

Frontend & Application Layer:
- Next.js (App Router)
- TypeScript (strict mode)
- Tailwind CSS

Data Layer:
- PostgreSQL (Neon)
- Prisma ORM

Testing & Quality:
- Vitest (unit testing)
- Playwright (end-to-end testing)
- ESLint + Prettier
- GitHub Actions CI

---

## Engineering Standards

- No `any` usage
- Domain logic decoupled from Prisma
- CI runs from clean checkout
- Lint, typecheck, unit tests, build, and E2E must pass before merge
- Local git hooks intentionally avoided — CI is the single source of truth

---

## Requirements

- Node.js 20+
- npm (pnpm intentionally not used)

---

## Setup

1. Copy environment variables:
   cp .env.example .env

2. Install dependencies:
   npm ci

3. Start development server:
   npm run dev

---

## Available Scripts

- npm run dev        → Start development server
- npm run lint       → Run ESLint
- npm run typecheck  → TypeScript validation
- npm test           → Run unit tests
- npm run e2e        → Run end-to-end tests
- npm run ci         → Run CI-equivalent checks
- npm run ci:full    → Run extended CI checks

---

## Roadmap

Atlas is planned for a cross-platform mobile release (iOS and Android) using a WebView-based deployment strategy (Capacitor), enabling efficient reuse of the web codebase without requiring a native rewrite.

Future iterations focus on advanced insights, achievements, and intelligent reminder systems.

---

## Status

Active development.  
Built with production standards and long-term scalability as primary goals.
