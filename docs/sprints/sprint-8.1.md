# Sprint 8.1: Advanced Insights v1 - Project Atlas

**Duration**: Week 16-17 (5-7 days)  
**Status**: Not Started  
**Theme**: Pro-only insights with privacy-respecting aggregation and minimalist presentation.

---

## Overview

Sprint 8.1 delivers Advanced Insights v1 for Pro users, focused on
clear metrics, light-weight visualizations, and safe aggregation.
All insights must respect the habit invariant and remain timezone-safe.

**Core Goal**: ship a Pro insights experience that is useful, fast, and
privacy-respecting without impacting core habit tracking.

---

## Insights Spec (v1)

### Data Scope

- Use **active habits only** (`archivedAt = null`).
- Use the **current schedule** for each habit (no historical schedule tracking).
- Include completions for active habits only.
- Time windows are computed from **today in the user's timezone**,
  normalized to UTC dates.

### Metrics & Formulas

- **Consistency score (7/30/90 days)**  
  `completed opportunities / scheduled opportunities` for the window.
- **Best/Worst weekday (last 90 days)**  
  Per-weekday completion rate; ignore weekdays with zero scheduled opportunities.
  Ties break by higher scheduled count (best) or lower scheduled count (worst),
  then by weekday order.
- **Trend indicator (last 14 vs prior 14 days)**  
  Compare completion rates; `up` if delta > 0.02, `down` if delta < -0.02,
  otherwise `flat`.
- **Heatmap (12 weeks)**  
  12x7 grid of completion rates by day; no explicit dates or date keys.

### Gating & Privacy

- Insights page is visible to all users with **Pro previews** for Free.
- Server must enforce Pro access for real insights data.
- API responses are **aggregated only**; no per-date keys or raw completion lists.

---

## Scope Decisions

### Included

- [ ] Define Insights spec (metrics list + formulas)
- [ ] Add Insights API endpoints (privacy-respecting, aggregated)
- [ ] Add Insights UI (minimalist cards, charts/heatmap)
- [ ] Add consistency score (7/30/90 days)
- [ ] Add best/worst weekday stats
- [ ] Add completion trend indicators
- [ ] Add unit tests for insight calculations
- [ ] Add E2E coverage for Insights visibility + gating

### Excluded (this sprint)

- [ ] Predictive or AI-driven insights
- [ ] Export or sharing features
- [ ] Habit-level reminders or scheduling changes
- [ ] Non-Pro insights beyond preview states

---

## Testing Policy

After each feature area, add tests:

- **Unit** -> insight calculations and helpers
- **API** -> aggregated insight responses and gating checks
- **Components** -> insight cards, charts, heatmap rendering
- **E2E** -> Pro gating and visibility across free/pro users

CI must remain green.

---

## Phase 1: Spec & Metrics (Days 1-2)

### Tasks (4)

- [x] **Task 1.1**: Define Insights spec (metrics list + formulas)
- [x] **Task 1.2**: Add consistency score (7/30/90 days)
- [x] **Task 1.3**: Add best/worst weekday stats
- [x] **Task 1.4**: Add completion trend indicators

---

## Phase 2: API & UI (Days 2-4)

### Tasks (2)

- [x] **Task 2.1**: Add Insights API endpoints (privacy-respecting, aggregated)
- [x] **Task 2.2**: Add Insights UI (minimalist cards, charts/heatmap)

---

## Phase 3: Tests & Gating (Days 4-6)

### Tasks (2)

- [x] **Task 3.1**: Add unit tests for insight calculations
- [x] **Task 3.2**: Add E2E coverage for Insights visibility + gating

---

## Implementation Guidelines

- Insights must be aggregated; avoid exposing raw per-date data in API responses.
- All calculations must be timezone-safe and align with the existing completion rules.
- Gating must be server-enforced; client only renders based on entitlement flags.
- Keep UI aligned with the black/white system and gold-only completion accent.
- Charts/heatmaps should be minimalist and fast to render.

---

## File Structure (Expected)

- `src/app/insights/page.tsx`
- `src/components/insights/*`
- `src/app/api/insights/route.ts`
- `src/lib/insights/*`
- `src/lib/insights/__tests__/*`
- `e2e/*`

---

## Definition of Done

1. [ ] Insights spec is documented with clear formulas
2. [ ] API endpoints return aggregated metrics only
3. [ ] Insights UI renders cards + charts/heatmap for Pro users
4. [ ] Consistency score (7/30/90), weekday stats, and trends are accurate
5. [ ] Unit tests cover insight calculations
6. [ ] E2E covers insights visibility and Pro gating
7. [ ] CI passes from clean checkout

---
