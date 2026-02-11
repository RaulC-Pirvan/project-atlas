import {
  DEFAULT_DAILY_DIGEST_MINUTES,
  DEFAULT_QUIET_HOURS_END_MINUTES,
  DEFAULT_QUIET_HOURS_START_MINUTES,
  DEFAULT_SNOOZE_MINUTES,
} from './constants';
import type { UserReminderSettings } from './types';

type SettingsRecord = {
  dailyDigestEnabled: boolean;
  dailyDigestTimeMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStartMinutes: number;
  quietHoursEndMinutes: number;
  snoozeDefaultMinutes: number;
};

export function getDefaultReminderSettings(): UserReminderSettings {
  return {
    dailyDigestEnabled: true,
    dailyDigestTimeMinutes: DEFAULT_DAILY_DIGEST_MINUTES,
    quietHoursEnabled: false,
    quietHoursStartMinutes: DEFAULT_QUIET_HOURS_START_MINUTES,
    quietHoursEndMinutes: DEFAULT_QUIET_HOURS_END_MINUTES,
    snoozeDefaultMinutes: DEFAULT_SNOOZE_MINUTES,
  };
}

export function resolveReminderSettings(
  record?: SettingsRecord | null,
): UserReminderSettings {
  const defaults = getDefaultReminderSettings();
  if (!record) return defaults;
  return {
    dailyDigestEnabled: record.dailyDigestEnabled ?? defaults.dailyDigestEnabled,
    dailyDigestTimeMinutes:
      record.dailyDigestTimeMinutes ?? defaults.dailyDigestTimeMinutes,
    quietHoursEnabled: record.quietHoursEnabled ?? defaults.quietHoursEnabled,
    quietHoursStartMinutes:
      record.quietHoursStartMinutes ?? defaults.quietHoursStartMinutes,
    quietHoursEndMinutes:
      record.quietHoursEndMinutes ?? defaults.quietHoursEndMinutes,
    snoozeDefaultMinutes:
      record.snoozeDefaultMinutes ?? defaults.snoozeDefaultMinutes,
  };
}
