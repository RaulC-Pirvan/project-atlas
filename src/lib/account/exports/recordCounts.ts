import type { UserDataExportPayload, UserDataExportRecordCounts } from './types';

export function summarizeUserDataExportRecordCounts(
  payload: UserDataExportPayload,
): UserDataExportRecordCounts {
  return {
    habits: payload.habits.length,
    completions: payload.completions.length,
    reminderSettings: 1,
    habitReminders: payload.reminders.habitReminders.length,
    achievementUnlocks: payload.achievements.achievementUnlocks.length,
    habitMilestoneUnlocks: payload.achievements.habitMilestoneUnlocks.length,
  };
}
