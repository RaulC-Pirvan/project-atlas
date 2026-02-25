# Landing Walkthrough Phase 0 Contract

**Artifact**: Sprint 16.2 Phase 0 narrative and asset contract  
**Date**: February 25, 2026  
**Status**: Approved for implementation

---

## Purpose

Lock the implementation contract for Sprint 16.2 Phase 0 so landing walkthrough
build work (Phase 1+) stays consistent, testable, and auth-aware.

---

## 1) Information Architecture Contract

Walkthrough sequence is fixed:

1. `create`
2. `remind`
3. `complete`
4. `review`

Each step must explicitly communicate:

- what the user does
- what the user gets
- why it matters daily

### Step Matrix

| Step       | Primary surface                           | User action                                 | Immediate outcome                                    | Daily relevance                           |
| ---------- | ----------------------------------------- | ------------------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `create`   | `/habits`                                 | Add habit title + weekdays                  | Due list is generated automatically on matching days | Removes planning friction after setup     |
| `remind`   | `/account` + habit reminder controls      | Set reminder times and quiet-hours behavior | Timely prompts support follow-through                | Keeps routines visible without clutter    |
| `complete` | `/today`                                  | Check off due habits                        | Progress updates immediately for the day             | Fast completion loop sustains consistency |
| `review`   | `/calendar` (+ insights snapshot context) | Scan month and inspect specific dates       | Progress patterns become visible                     | Reinforces reflection and adjustment      |

### Ordering and Structure

- Section heading: `How Atlas works`.
- Steps render as an ordered sequence (`ol`) in the fixed order above.
- Each step has:
  - step label (`Step 1` .. `Step 4`)
  - short value-first heading
  - concise description
  - desktop screenshot
  - mobile screenshot

---

## 2) Screenshot Capture Standards

### Source of truth

- Use real Atlas UI screens only.
- No mockups, no Figma exports, no placeholder overlays.
- Capture from current app routes with representative seeded data.

### Capture environment

- Theme: light mode for canonical capture set.
- Browser/UI chrome hidden where possible; crop to product surface.
- Use deterministic sample account data that avoids personal info.

### Viewports and formats

- Desktop capture target: 1440x900 viewport.
- Mobile capture target: 390x844 viewport.
- File format: `.webp`.
- Compression target: quality 80-85.
- Keep screenshot text crisp; avoid blur from aggressive compression.

### Naming convention

Assets live under:

- `public/images/walkthrough/`

Filename pattern:

- `walkthrough-{step}-{surface}-{viewport}-v1.webp`

Examples:

- `walkthrough-create-habits-desktop-v1.webp`
- `walkthrough-create-habits-mobile-v1.webp`
- `walkthrough-complete-today-desktop-v1.webp`

### Asset acceptance rules

- No PII in screenshots.
- No fake KPI numbers that cannot exist in product.
- Screenshot content must match current shipped UI hierarchy.
- If UI changes materially, bump version suffix (`v2`) and update references.

---

## 3) Copy Style Guide (Value-First, Non-Technical)

### Voice rules

- Use plain language and concrete outcomes.
- Prefer short sentences and active voice.
- Describe user benefit first, then detail.

### Required pattern per step

Each step copy must include:

- action: what user does
- result: what user gets now
- significance: why this helps daily consistency

### Avoid list (do not use in walkthrough copy)

- internal architecture terms (`idempotency`, `projection`, `webhook`)
- implementation jargon (`schema`, `endpoint`, `rate limit`)
- coercive language (`must upgrade`, `urgent`, `limited time`)

### CTA wording alignment

Use existing conversion language patterns already present in landing/pro flows:

- signed-out: `Create your account`, `Start free`, `Sign in`
- signed-in: `Go to dashboard`, `Open calendar`

---

## 4) CTA Mapping Contract (Signed-Out vs Signed-In)

| Context                   | Signed-out target       | Signed-out copy       | Signed-in target        | Signed-in copy        |
| ------------------------- | ----------------------- | --------------------- | ----------------------- | --------------------- |
| Primary walkthrough CTA   | `/sign-up`              | `Start free`          | `/today`                | `Go to dashboard`     |
| Secondary auth/action CTA | `/sign-in`              | `Sign in`             | `/calendar`             | `Open calendar`       |
| Support fallback CTA      | `/support#contact-form` | `Open support center` | `/support#contact-form` | `Open support center` |

Implementation requirements:

- Auth-aware branching must remain server-truth based (`isAuthenticated` prop path).
- Signed-in users must not be routed through auth pages for walkthrough CTAs.
- Signed-out users must not be routed to protected app surfaces.

---

## 5) Accessibility Baseline Contract

### Semantics and reading order

- One `h1` for landing hero.
- Walkthrough section uses `h2`; step titles use `h3`.
- Use `ol` for the 4-step narrative sequence.
- DOM order must stay meaningful without CSS/layout styling.

### Images and text alternatives

- Every walkthrough screenshot requires non-empty `alt` text.
- Alt text describes user-visible outcome, not styling details.
- If a screenshot is duplicated for decoration only, mark it decorative (`alt=""` and `aria-hidden`).

### Keyboard and focus

- All CTA links must show visible focus ring in light and dark themes.
- Keyboard traversal order must follow visual narrative order.

### Contrast and motion

- Body text minimum contrast target: WCAG AA (4.5:1).
- UI boundary/secondary text must remain readable in both themes.
- Animated entrances must honor reduced-motion preference.

---

## 6) Responsive Layout Contract

### Breakpoint behavior

- Mobile (`<640px`): single-column, reading-first stack.
- Tablet (`640px-1023px`): stacked narrative with improved spacing and larger media blocks.
- Desktop (`>=1024px`): dual-column storytelling where copy and screenshots can sit side-by-side.

### Spacing and sizing

- Minimum interactive target: 44px height for CTA controls.
- Keep body line length readable (`~45-75` characters where practical).
- Preserve generous whitespace without creating excessive scroll jumps between steps.

### Screenshot framing behavior

- Mobile: screenshots should not force horizontal page scroll.
- Desktop: screenshot pairs can appear side-by-side if legible; otherwise stack with consistent rhythm.
- Maintain consistent corner radius and border treatment across all walkthrough assets.

---

## 7) Phase 0 Exit Checklist

- [x] IA and step order are locked.
- [x] Screenshot standards are documented with naming and quality constraints.
- [x] Copy style contract is documented and actionable.
- [x] CTA mapping is explicitly defined by auth state.
- [x] Accessibility baseline requirements are defined.
- [x] Responsive breakpoint and layout contract is defined.

---

## References

- `docs/sprints/sprint-16.2.md`
- `docs/test workflows/sprint-16.2-test-workflow.md`
- `src/app/landing/page.tsx`
- `src/components/marketing/MarketingHome.tsx`
