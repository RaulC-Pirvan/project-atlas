# Phase 2 — Habit Definitions

## Goal
Allow users to create and manage habit rules.
No calendar or completion tracking in this phase.

---

## Features
- Create habit
- Edit habit
- Delete habit
- Select active weekdays
- Optional description

---

## Tasks

### Data Model
- Habit:
  - title (required)
  - description (optional)
  - active weekdays
  - start date
  - optional end date
  - user ownership

### Backend
- CRUD APIs (server actions or route handlers).
- Validation using Zod.

### Frontend
- Habit list view.
- Create / edit / delete UI.
- Responsive layout (mobile + desktop).
- Empty states.

---

## Testing Requirements
- Unit tests:
  - weekday encoding/decoding
  - validators
- Integration tests:
  - habit CRUD operations
- E2E tests:
  - create habit
  - edit habit
  - delete habit

---

## Definition of Done
- Habit rules persist correctly.
- No per-day habit instances stored.
- CI green.
