import { MAX_SNOOZE_MINUTES } from './constants';
import { isQuietHoursRangeValid } from './rules';
import { isValidTimeMinutes } from './time';
import type { UserReminderSettings } from './types';

export function getReminderSettingsValidationError(settings: UserReminderSettings): string | null {
  if (!isValidTimeMinutes(settings.dailyDigestTimeMinutes)) {
    return 'Daily digest time is invalid.';
  }

  if (!isValidTimeMinutes(settings.quietHoursStartMinutes)) {
    return 'Quiet hours start time is invalid.';
  }

  if (!isValidTimeMinutes(settings.quietHoursEndMinutes)) {
    return 'Quiet hours end time is invalid.';
  }

  if (settings.quietHoursEnabled) {
    if (!isQuietHoursRangeValid(settings.quietHoursStartMinutes, settings.quietHoursEndMinutes)) {
      return 'Quiet hours start and end times must be different.';
    }
  }

  if (
    !Number.isFinite(settings.snoozeDefaultMinutes) ||
    !Number.isInteger(settings.snoozeDefaultMinutes) ||
    settings.snoozeDefaultMinutes < 1 ||
    settings.snoozeDefaultMinutes > MAX_SNOOZE_MINUTES
  ) {
    return `Snooze duration must be between 1 and ${MAX_SNOOZE_MINUTES} minutes.`;
  }

  return null;
}
