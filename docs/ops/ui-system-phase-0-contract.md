# UI System Refresh Phase 0 Contract

**Artifact**: Sprint 16.4 Phase 0 theme and mobile layout contract  
**Date**: February 27, 2026  
**Status**: Approved for implementation

---

## Purpose

Lock the implementation contract for Sprint 16.4 Phase 0 so theme runtime and
mobile compact refactors (Phase 1+) stay consistent, accessible, and testable.

---

## 1) Semantic Token Dictionary Contract

All UI color usage must flow through semantic tokens. Feature modules must not
hardcode accent hex values.

### 1.1 Core token groups

| Group           | Role                       | Required Tokens                                                                                  |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| Surface         | Background hierarchy       | `--color-bg-canvas`, `--color-bg-surface`, `--color-bg-surface-elevated`, `--color-bg-muted`     |
| Text            | Readability hierarchy      | `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-on-accent` |
| Border          | Structure and separation   | `--color-border-subtle`, `--color-border-strong`                                                 |
| Accent          | Brand/interaction emphasis | `--color-accent-solid`, `--color-accent-strong`, `--color-accent-soft`, `--color-accent-ring`    |
| Semantic States | Meaningful status colors   | `--color-state-error`, `--color-state-warning`, `--color-state-success`, `--color-state-info`    |

### 1.2 Consumption rules

- Accent visuals (completion/progress badges, selected chips, accent buttons)
  consume `--color-accent-*`.
- Shared primitives consume semantic tokens, then product surfaces compose
  primitives; no feature-level hex values.
- Existing global vars in `src/app/globals.css` (`--background`,
  `--foreground`, `--surface`, `--border`, etc.) are migrated into this
  contract with compatibility aliases during rollout.

---

## 2) Accent Preset + Persistence Contract

### 2.1 Preset list (locked)

| Preset ID | Label | Accent Solid | Accent Strong | Text on Accent |
| --------- | ----- | ------------ | ------------- | -------------- |
| `gold`    | Gold  | `#FAB95B`    | `#E9A543`     | `#111111`      |
| `green`   | Green | `#34C759`    | `#28B24A`     | `#111111`      |
| `blue`    | Blue  | `#3B82F6`    | `#2563EB`     | `#111111`      |
| `pink`    | Pink  | `#EC4899`    | `#DB2777`     | `#111111`      |
| `red`     | Red   | `#EF4444`    | `#DC2626`     | `#111111`      |

Notes:

- Default preset is `gold`.
- Preset list is intentionally bounded in Sprint 16.4 (no free-form picker).
- `blue` and `red` use dark text-on-accent to keep label contrast above WCAG AA.

### 2.2 Persistence and fallback

- Storage key: `atlas-accent-preset`.
- Allowed stored values: `gold | green | blue | pink | red`.
- Invalid/missing value falls back to `gold` without throwing.
- Preference applies globally across app shell and authenticated/public
  surfaces after bootstrap.

---

## 3) Semantic State Color Invariant Contract

Semantic state colors are independent from accent presets.

| State   | Token                   | Baseline Value (v1) |
| ------- | ----------------------- | ------------------- |
| Error   | `--color-state-error`   | `#DC2626`           |
| Warning | `--color-state-warning` | `#D97706`           |
| Success | `--color-state-success` | `#16A34A`           |
| Info    | `--color-state-info`    | `#2563EB`           |

Rules:

- Form validation, destructive actions, notices, and status badges must continue
  to use semantic state tokens.
- Accent switching must not alter semantic state meaning or hue mapping.

---

## 4) Dark Theme Tonal Scale + Elevation Contract

Dark theme moves from near-flat black to tonal layering.

### 4.1 Tonal neutrals (v1)

| Token                         | Value                    | Usage                     |
| ----------------------------- | ------------------------ | ------------------------- |
| `--color-bg-canvas`           | `#101214`                | App/page canvas           |
| `--color-bg-surface`          | `#161A1D`                | Primary cards/panels      |
| `--color-bg-surface-elevated` | `#1E2328`                | Modals/sheets/popovers    |
| `--color-bg-muted`            | `#21272D`                | Inputs/sub-panels         |
| `--color-border-subtle`       | `rgba(255,255,255,0.12)` | Low-contrast separators   |
| `--color-border-strong`       | `rgba(255,255,255,0.22)` | Active/focused containers |
| `--color-text-primary`        | `#F5F7FA`                | Headings/body primary     |
| `--color-text-secondary`      | `rgba(245,247,250,0.78)` | Secondary copy            |
| `--color-text-muted`          | `rgba(245,247,250,0.62)` | Helper/meta labels        |

### 4.2 Elevation mapping rules

- Canvas -> surface -> elevated depth must be visually distinguishable without
  relying only on shadows.
- `#000000` may be used for shadow composition, not as dominant surface fill.
- Overlay surfaces (modals/sheets/menus) consume elevated tokens.

---

## 5) Compact Mobile Layout Rules + Anti-Patterns

### 5.1 Compact layout rules (locked)

- Prioritize single-layer grouping: list/sections over nested card stacks.
- Keep container nesting depth to one card layer on compact viewport.
- Minimum tappable target remains `44x44`.
- Avoid scroll-inside-card for core workflows.
- Prefer bottom sheet/modal for secondary actions.

### 5.2 Target surfaces (Phase 2 scope)

- `/today`: collapse nested card wrappers into primary list groups.
- `/calendar` daily panel: flatten nested completion/meta wrappers.
- `/habits`: simplify action clusters and stacked card depth on mobile.
- `/account`: reduce nested settings cards; preserve section clarity.

### 5.3 Anti-pattern list (must avoid)

- Triple-nested rounded containers on phone viewport.
- Visual hierarchy communicated only by shadow intensity.
- Horizontally clipped control rows caused by fixed-width chip/button groups.
- Scrollable content region nested inside another scroll container for daily
  primary tasks.

---

## 6) Accessibility + Responsive Regression Thresholds

### 6.1 Contrast thresholds

- Body text and essential labels: minimum `4.5:1`.
- Large text (`>=24px` regular or `>=18.66px` bold): minimum `3:1`.
- Non-text UI boundaries/icons/focus indicators: minimum `3:1`.

### 6.2 Interaction and focus thresholds

- Touch targets: minimum `44x44`.
- Keyboard focus indicator must remain visible in both themes and all presets.
- Focus ring must remain distinguishable from surrounding surfaces.

### 6.3 Responsive regression matrix (minimum)

- Mobile: `390x844`
- Large mobile: `430x932`
- Tablet: `768x1024`
- Desktop: `1280x900`

Pass criteria:

- No horizontal overflow on primary authenticated routes.
- No clipped primary actions in Today/Calendar/Habits/Account.
- Theme preset switching does not break contrast or focus visibility.

---

## 7) Phase 0 Exit Checklist

- [x] Semantic token dictionary is defined and scoped.
- [x] Accent preset and persistence contract is defined with fallback rules.
- [x] Semantic state color invariants are defined.
- [x] Dark-theme tonal scale and elevation mapping are defined.
- [x] Compact mobile layout rules and anti-patterns are defined.
- [x] Accessibility and responsive regression thresholds are defined.

---

## References

- `docs/sprints/sprint-16.4.md`
- `docs/test workflows/sprint-16.4-test-workflow.md`
- `src/app/globals.css`
- `src/components/ui/ThemeToggle.tsx`
