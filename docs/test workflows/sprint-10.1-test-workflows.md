# Sprint 10.1 Test Workflows - Reminder Scheduling v1

**Status**: In Progress  
**Last Updated**: February 2026

---

## Overview

Sprint 10.1 introduces reminder scheduling foundations: per-habit reminder times,
daily digest settings, quiet hours, and snooze rules. This document covers
manual and automated checks to validate the new reminder UX, API safeguards,
and reminder rule helpers.

---

## Prerequisites

1. **Database is migrated**:

   ```bash
   npm run prisma:generate
   ```

2. **Environment variables are set** (local or staging):

   ```bash
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Development server is running**:

   ```bash
   npm run dev
   ```

4. **Test accounts exist**:
   - One verified Free user (no `ProEntitlement` row).

---

## Workflow 1: Reminder settings UI renders [x]

1. Sign in as a Free user.
2. Visit `/account`.

**Expected**:

- Reminder settings panel is visible.
- Daily digest toggle and time inputs render.
- Quiet hours toggle and time inputs render.
- Snooze default input renders with a 1-120 minute range.

---

## Workflow 2: Reminder settings save successfully [x]

1. On `/account`, set daily digest to `On`.
2. Set digest time to `20:00`.
3. Enable quiet hours and set `22:00` -> `07:00`.
4. Set snooze default to `10`.
5. Save settings.

**Expected**:

- Success toast appears.
- Reloading `/account` preserves the values.

---

## Workflow 3: Reminder settings validation [x]

1. Enable quiet hours.
2. Set both quiet hours start and end to the same time (e.g., `22:00`).
3. Save settings.

**Expected**:

- Error toast appears.
- Settings are not saved.

---

## Workflow 4: Habit reminders in create/edit [x]

1. Visit `/habits`.
2. Create a habit and add up to 3 reminder times (24-hour `HH:MM` format).
3. Save the habit.
4. Edit the habit and remove a reminder time.

**Expected**:

- Up to 3 times can be added; the Add time button is disabled after the third.
- Reminder times render in the habit list.
- Reminder times persist after refresh.

---

## Workflow 5: Reminder settings API rate limiting [x]

1. Call `/api/reminders/settings` repeatedly within a short window.

**Expected**:

- Requests eventually return `429` with `rate_limited`.
- Response includes `Retry-After` and rate limit headers.

---

## Automated Tests

### Unit

```bash
npm test -- reminders
```

### E2E

```bash
npm run e2e -- reminders.spec.ts
```

---

## Success Criteria

Sprint 10.1 is complete when:

1. Reminder settings UI is visible and saves values.
2. Quiet hours validation rejects invalid ranges.
3. Habit reminders support up to 3 times per habit.
4. Reminder settings API returns rate limiting responses under load.
5. Reminder rule helper tests pass.
6. CI passes from a clean checkout.

---

## References

- [Sprint 10.1 Plan](../sprints/sprint-10.1.md)
- [Reminder Settings API](../../src/app/api/reminders/settings/route.ts)
- [Reminder Settings Panel](../../src/components/reminders/ReminderSettingsPanel.tsx)
- [Reminder Rules](../../src/lib/reminders/rules.ts)
- [Reminder Validation](../../src/lib/reminders/validation.ts)
- [AGENTS](../../AGENTS.md)
