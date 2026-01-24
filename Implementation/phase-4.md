# Phase 4 — Habit Completion & Daily Progress

## Goal
Allow users to mark habits as completed per day and show daily progress.

---

## Features
- Mark habit complete / incomplete
- Persist daily completion
- Daily progress indicator
- Golden day state
- Completion sound

---

## Tasks

### Data Model
- HabitCompletion:
  - habit_id
  - date (YYYY-MM-DD)
  - completed_at
  - unique constraint (habit_id, date)

### Backend
- Toggle completion endpoint.
- Idempotent operations.

### Frontend
- Completion checkbox UI.
- Daily completion percentage.
- Golden day animation.
- Sound playback (respect mute / reduced motion).

---

## Testing Requirements
- Unit tests:
  - completion toggle logic
  - daily completion calculation
- Integration tests:
  - unique constraint enforcement
- E2E tests:
  - complete all habits
  - day turns gold

---

## Definition of Done
- No duplicate completion records.
- Daily completion logic correct.
- CI green.
