# Sprint 11.1: Today View + Speed Improvements (Web-first) - Project Atlas

**Duration**: TBD (5-7 days)
**Status**: Planned
**Theme**: Fast daily entry with clear ordering and zero friction.

---

## Overview

Sprint 11.1 adds a dedicated Today experience for quick daily completion on web.
The focus is speed, clarity, and consistent ordering without bulk actions or undo.

**Core Goal**: make today�s due habits fast to act on, with uncompleted items always prominent.

---

## Scope Decisions (Locked)

- Today view lives at `/today`.
- Post-login redirect switches to `/today`.
- Today view shows only today�s due habits.
- No bulk actions (no complete-all or uncomplete-all).
- No undo behavior.
- No schedule presets in this sprint.
- Ordering prioritizes uncompleted habits above completed habits.
- Manual ordering is supported.
- A user setting controls whether completed items are pinned to the bottom.

---

## Included

- New Today screen optimized for fast daily entry.
- Habit ordering controls, including manual ordering.
- Optional setting: keep completed items at the bottom (default on).
- Update account settings UI to manage the ordering preference.
- Tests covering ordering behavior and Today view flows.

---

## Excluded

- Schedule presets (Weekdays / Every day / Weekend).
- Bulk actions and undo actions.
- Mobile wrapper or native push work.

---

## UX Decisions

- Today view is a dedicated route with a streamlined list layout.
- List order defaults to uncompleted first, then completed.
- When the �keep completed at bottom� setting is on, manual ordering only applies within each section.
- When the setting is off, manual ordering applies across the full list.

---

## Data Model Impact

- Add ordering metadata on habits to support manual ordering.
- Add a user preference for �keep completed at bottom.�

---

## Implementation Plan

### Phase 1: Today View

- [x] Add `/today` route with server-side data loading.
- [x] Show only today�s due habits (respect timezone and creation date).
- [x] Update post-login redirect to `/today`.

### Phase 2: Ordering

- [x] Add habit ordering fields and API support.
- [x] Add UI controls for manual ordering.
- [x] Implement ordering logic based on completion status and user preference.

### Phase 3: Settings

- [x] Add account setting for �keep completed at bottom.�
- [x] Persist and apply preference across Today view and daily panels.

### Phase 4: Performance & Polish

- [ ] Reduce unnecessary rerenders in daily habit list.
- [ ] Keep animations motion-safe and light on small screens.

---

## Testing Policy

- Unit tests for ordering logic and completion-section sorting.
- Component tests for Today view rendering and ordering controls.
- E2E coverage for Today view completion flow and ordering preference.

---

## File Structure (Expected)

- `src/app/today/page.tsx`
- `src/components/calendar/DailyCompletionPanel.tsx`
- `src/components/habits/*`
- `src/app/account/page.tsx`
- `src/lib/habits/*`
- `src/lib/api/habits/*`
- `src/lib/api/account/*`
- `src/lib/habits/__tests__/*`
- `src/components/calendar/__tests__/*`
- `e2e/*`

---

## Definition of Done

1. Today view exists at `/today` and is the post-login landing page.
2. Today view shows only today�s due habits and is timezone-safe.
3. Ordering puts uncompleted habits above completed habits by default.
4. Manual ordering works and persists.
5. �Keep completed at bottom� setting exists and is respected.
6. Tests cover ordering logic and Today view flows.
7. CI passes from a clean checkout.