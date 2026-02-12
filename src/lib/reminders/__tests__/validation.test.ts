import { describe, expect, it } from 'vitest';

import { getReminderSettingsValidationError } from '../validation';

describe('reminder settings validation', () => {
  it('rejects quiet hours with identical start and end', () => {
    const error = getReminderSettingsValidationError({
      dailyDigestEnabled: true,
      dailyDigestTimeMinutes: 20 * 60,
      quietHoursEnabled: true,
      quietHoursStartMinutes: 22 * 60,
      quietHoursEndMinutes: 22 * 60,
      snoozeDefaultMinutes: 10,
    });

    expect(error).toBe('Quiet hours start and end times must be different.');
  });

  it('accepts valid defaults', () => {
    const error = getReminderSettingsValidationError({
      dailyDigestEnabled: true,
      dailyDigestTimeMinutes: 20 * 60,
      quietHoursEnabled: false,
      quietHoursStartMinutes: 22 * 60,
      quietHoursEndMinutes: 7 * 60,
      snoozeDefaultMinutes: 10,
    });

    expect(error).toBeNull();
  });
});
