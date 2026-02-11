# Reminder Delivery Strategy (v1)

## Overview

Reminder delivery is designed to be push-ready while running on web today.
The system prioritizes correctness, timezone safety, and determinism.

## Strategy

- **Channel**: push-compatible payloads (future: APNs/FCM)
- **Approach**: server-side polling/cron
- **Window**: query reminders due in a rolling window (e.g. 5 minutes)
- **Dedupe**: `(reminderId + localDate)` to prevent double sends
- **Skip rules**: do not send if the habit is already completed for that local date

## Scheduling Flow (v1)

1. Resolve user timezone and reminder settings.
2. Find reminders due within the window for active weekdays.
3. Respect quiet hours; defer until the next allowed time.
4. Apply snoozes for the same-day reminder instance.
5. Skip reminders that are already completed.
6. Emit a push-ready payload for delivery.

## Quiet Hours & Snooze

- Quiet hours are **user-level** and may wrap past midnight.
- Snooze is **same-day only** and capped by total daily snooze minutes.
- Snoozed reminders still respect quiet hours before delivery.

## Push-Ready Payload

Each delivery uses a provider-agnostic payload:

- `title`
- `body`
- `deepLink` (e.g. `/calendar`)
- `data` (`kind`, `habitTitle`, `dueCount`, etc.)

This keeps the interface compatible with future APNs/FCM wrappers.

## Future Enhancements

- Smart reminders (Pro) using completion patterns.
- Delivery retries with exponential backoff.
- Device registration + token management.
