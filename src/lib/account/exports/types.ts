export const USER_DATA_EXPORT_SCHEMA_VERSION = 1 as const;

export const USER_DATA_EXPORT_FORMAT = 'json' as const;

export type UserDataExportSchemaVersion = typeof USER_DATA_EXPORT_SCHEMA_VERSION;

export type UserDataExportFormat = typeof USER_DATA_EXPORT_FORMAT;

export type UserDataExportIsoDateString = string;

export type UserDataExportWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type UserDataExportHabit = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  archivedAt: UserDataExportIsoDateString | null;
  createdAt: UserDataExportIsoDateString;
  updatedAt: UserDataExportIsoDateString;
  activeWeekdays: UserDataExportWeekday[];
};

export type UserDataExportCompletion = {
  habitId: string;
  date: UserDataExportIsoDateString;
  completedAt: UserDataExportIsoDateString;
};

export type UserDataExportReminderSettings = {
  dailyDigestEnabled: boolean;
  dailyDigestTimeMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStartMinutes: number;
  quietHoursEndMinutes: number;
  snoozeDefaultMinutes: number;
};

export type UserDataExportHabitReminder = {
  habitId: string;
  timeMinutes: number;
  enabled: boolean;
};

export type UserDataExportAchievementUnlock = {
  achievementId: string;
  unlockedAt: UserDataExportIsoDateString;
  createdAt: UserDataExportIsoDateString;
};

export type UserDataExportHabitMilestoneUnlock = {
  habitId: string;
  milestoneId: string;
  unlockedAt: UserDataExportIsoDateString;
  createdAt: UserDataExportIsoDateString;
};

export type UserDataExportRecordCounts = {
  habits: number;
  completions: number;
  reminderSettings: number;
  habitReminders: number;
  achievementUnlocks: number;
  habitMilestoneUnlocks: number;
};

export type UserDataExportPayload = {
  schemaVersion: UserDataExportSchemaVersion;
  generatedAt: UserDataExportIsoDateString;
  userId: string;
  habits: UserDataExportHabit[];
  completions: UserDataExportCompletion[];
  reminders: {
    settings: UserDataExportReminderSettings | null;
    habitReminders: UserDataExportHabitReminder[];
  };
  achievements: {
    achievementUnlocks: UserDataExportAchievementUnlock[];
    habitMilestoneUnlocks: UserDataExportHabitMilestoneUnlock[];
  };
};
