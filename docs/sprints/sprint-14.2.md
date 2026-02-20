# Sprint 14.2: Trust & Policy Surfaces - Project Atlas

**Duration**: TBD (6-8 days)  
**Status**: Planned  
**Theme**: Publish clear legal and trust surfaces that are publicly accessible, operationally consistent with product behavior, and ready for legal sign-off.

---

## Overview

Sprint 14.2 introduces public legal pages (`Privacy`, `Terms`, `Refunds`) plus
support expectation guidance and shared legal link placement across key user
surfaces.

This sprint prioritizes clarity, policy consistency, and release readiness over
advanced legal tooling. Legal copy must match real product behavior (for example,
hard-delete account behavior and support workflows) and must include basic
version metadata and change notes.

**Core Goal**: users can easily find and understand legal/support policies, and
the team can safely publish policy updates with traceable version history.

---

## Scope Decisions (Locked for this sprint)

### Included

- [ ] Publish public pages: `/legal/privacy`, `/legal/terms`, `/legal/refunds`
- [ ] Add support response-time expectations and "how to get help faster" guidance
- [ ] Link legal/support surfaces from landing, Pro, and account pages
- [ ] Add simple policy versioning metadata (version, effective date, last updated)
- [ ] Add `/legal/changes` page with short change-log entries
- [ ] Add test coverage for route access, cross-linking, and basic content expectations

### Excluded (this sprint)

- [ ] Full legal CMS/editor workflow
- [ ] Multi-language policy localization
- [ ] Automated policy diff rendering
- [ ] User re-consent/forced acceptance flows
- [ ] Cookie banner/consent-management platform integration

---

## Legal + Trust Policy (Locked)

### Jurisdiction + Consumer Rights

- Governing law: **Romanian law**.
- Venue: competent courts at the company's registered office in Romania
  (final court city set after incorporation).
- Consumer carve-out must be explicit:
  - "If you are a consumer, mandatory protections of your country of residence remain applicable."
  - "Nothing in these Terms limits your rights under mandatory consumer law."

### Age Policy

- Minimum age: **16+**.
- Service is not directed to children under 16.
- Include a clause allowing account/data removal if underage use is discovered.

### Refund Policy

- **14-day goodwill refund** for direct web purchases.
- App-store carve-out:
  - Apple App Store purchases follow Apple refund processes.
  - Google Play purchases follow Google refund processes.

### Publishing Blockers (Pre-Production)

The following placeholders are allowed in sprint draft content but block
production publish until finalized:

- Legal entity name
- Registered address
- Court venue city
- VAT/company registration number

### Policy Versioning Baseline

- Each policy page must show:
  - `Version`
  - `Effective date`
  - `Last updated`
- `/legal/changes` must include dated entries summarizing what changed.

---

## Phase 0: Policy Framework + Metadata Foundation (Days 1-2)

### Tasks (6)

- [x] **Task 0.1**: Add shared legal content metadata model (`version`, `effectiveDate`, `updatedAt`)
- [x] **Task 0.2**: Add shared legal page layout component for consistent structure
- [x] **Task 0.3**: Add legal routes scaffold: `/legal/privacy`, `/legal/terms`, `/legal/refunds`, `/legal/changes`
- [x] **Task 0.4**: Keep legal pages publicly accessible in middleware/public-path rules
- [x] **Task 0.5**: Add policy constants/types to avoid hard-coded metadata duplication
- [x] **Task 0.6**: Add placeholder guard checklist for pre-publish legal entity fields

---

## Phase 1: Policy Content Publication (Days 2-4)

### Tasks (7)

- [x] **Task 1.1**: Publish Privacy Policy page with required sections and policy metadata
- [x] **Task 1.2**: Publish Terms page with Romania governing-law + consumer-rights carve-out
- [x] **Task 1.3**: Publish Refund Policy page with 14-day web goodwill + app-store carve-out
- [x] **Task 1.4**: Ensure policy text aligns with actual account deletion behavior (hard delete)
- [x] **Task 1.5**: Add 16+ age eligibility and underage-removal clause where applicable
- [x] **Task 1.6**: Add support response-time expectation copy and help-quality guidance
- [x] **Task 1.7**: Validate policy copy avoids claims unsupported by current product behavior

---

## Phase 2: Cross-Surface Linking + Discoverability (Days 4-5)

### Tasks (6)

- [x] **Task 2.1**: Add legal/support links to landing footer (`Privacy`, `Terms`, `Refunds`, `Support`)
- [x] **Task 2.2**: Add legal links near upgrade/purchase context on `/pro`
- [x] **Task 2.3**: Add "Legal & Support" section on `/account`
- [x] **Task 2.4**: Keep app sidebar lean (Support only; no legal-link overload)
- [x] **Task 2.5**: Ensure mobile and desktop parity for legal/support link availability
- [x] **Task 2.6**: Ensure link labels are explicit and accessibility-friendly

---

## Phase 3: Versioning + Change Log Governance (Days 5-6)

### Tasks (5)

- [x] **Task 3.1**: Implement `/legal/changes` with dated, short-form policy update entries
- [x] **Task 3.2**: Add initial change-log entries for first publication baseline
- [x] **Task 3.3**: Add lightweight policy update procedure note (draft -> review -> legal sign-off -> publish)
- [x] **Task 3.4**: Add release-note template fields (`approver`, `date`, `policy version`)
- [x] **Task 3.5**: Document production publish blockers for missing legal entity details

---

## Phase 4: Coverage + Hardening (Days 6-8)

### Tasks (6)

- [x] **Task 4.1**: Route-level tests for legal page accessibility and canonical metadata rendering
- [x] **Task 4.2**: Component tests for shared legal layout and policy metadata block
- [x] **Task 4.3**: Tests for landing/pro/account legal-support links
- [x] **Task 4.4**: E2E smoke coverage for legal page navigation and support/legal discoverability
- [x] **Task 4.5**: Add checks that prevent placeholder publish in production config/release checklist
- [x] **Task 4.6**: CI stability pass for new legal/trust surfaces

---

## Testing Policy

After each feature area, add tests:

- **Route/Integration** -> public access, metadata visibility, link integrity
- **Components** -> shared legal layout, footer/account/pro legal link blocks
- **E2E** -> legal page navigation and cross-surface discoverability smoke tests

CI must remain green.

---

## Environment and Config

No new runtime secrets are required for this sprint.

Pre-publish content placeholders must be finalized before production rollout:

- `LEGAL_ENTITY_NAME`
- `LEGAL_ENTITY_ADDRESS`
- `LEGAL_VENUE_CITY`
- `LEGAL_COMPANY_REGISTRATION` (or VAT/CUI equivalent)
- `ENFORCE_LEGAL_PUBLISH_READY=true` in production config to block builds when placeholders remain

---

## Implementation Guidelines

- Keep legal pages static/public and consistent with current product behavior.
- Do not introduce terms that conflict with implemented account/security/support flows.
- Keep language plain and user-readable; avoid ambiguous promises.
- Preserve minimalist design system and accessibility standards.
- Keep legal content centralized to avoid metadata/version drift across pages.
- Record every policy revision in `/legal/changes`.
- Treat legal review as a release gate before production publish.

---

## File Structure (Expected)

- `src/app/legal/privacy/page.tsx`
- `src/app/legal/terms/page.tsx`
- `src/app/legal/refunds/page.tsx`
- `src/app/legal/changes/page.tsx`
- `src/components/legal/*` (shared legal page primitives/layout)
- `src/lib/legal/*` (policy metadata, versioning, changelog types/content)
- `src/lib/auth/middleware.ts` (public-path allowance for `/legal/*`)
- `src/components/marketing/MarketingHome.tsx` (landing legal/support links)
- `src/app/pro/page.tsx` (legal link placement near upgrade context)
- `src/components/auth/AccountPanel.tsx` (Legal & Support section)
- `src/components/*/__tests__/*` (link/layout coverage updates)
- `e2e/legal.spec.ts` (or extend existing cross-surface specs)
- `docs/sprints/sprint-14.2.md`

---

## Locked Implementation Decisions (Confirmed)

1. **Governing law**: Romanian law.
2. **Consumer carve-out**: mandatory consumer protections remain preserved.
3. **Age gate**: 16+ baseline policy.
4. **Refund model**: 14-day goodwill for direct web purchases.
5. **Store refund carve-out**: Apple/Google store purchases follow store refund channels.
6. **Link placement**: landing footer + Pro purchase context + account Legal & Support section.
7. **Versioning model**: per-policy metadata + `/legal/changes` notes.
8. **Release gate**: legal entity placeholders must be resolved before production publish.

---

## Definition of Done

1. [ ] Public legal pages (`Privacy`, `Terms`, `Refunds`) are implemented and reachable
2. [ ] Terms include Romania law + mandatory consumer-rights carve-out
3. [ ] Age policy is set to 16+ with underage-removal clause
4. [ ] Refund policy includes 14-day web goodwill and app-store carve-outs
5. [ ] Support response-time/help-quality guidance is visible and clear
6. [ ] Landing, Pro, and account surfaces include legal/support links as specified
7. [ ] Policy pages expose version, effective date, and last updated metadata
8. [ ] `/legal/changes` exists with initial change-log entries
9. [ ] Tests (route/component/E2E) cover legal page access and cross-linking
10. [ ] Pre-publish legal blockers are explicitly tracked and unresolved placeholders are not shipped
11. [ ] CI passes from a clean checkout

---
