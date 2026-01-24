# Phase 3 — Calendar & Daily Habit Resolution

## Goal

Display a calendar and resolve which habits are due on a given day.
Read-only (no completion tracking yet).

---

## Features

- Month calendar view
- Select a day
- Display habits due for selected date

---

## Tasks

### Calendar UI

- Month grid view.
- Date selection handling.

### Resolver Logic

- Determine weekday from date.
- Fetch habits active on that weekday.
- Apply start/end date constraints.
- Ensure timezone-safe handling.

### Day View

- Show list of habits due on selected date.

---

## Testing Requirements

- Unit tests:
  - date → weekday logic
  - resolver edge cases
- Integration tests:
  - date-based habit resolution queries
- E2E tests:
  - select date
  - verify expected habits shown

---

## Definition of Done

- Correct habits shown for any date.
- No timezone-related bugs.
- CI green.
