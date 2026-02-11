export type ReminderTimeMinutes = number;

export type UserReminderSettings = {
  dailyDigestEnabled: boolean;
  dailyDigestTimeMinutes: ReminderTimeMinutes;
  quietHoursEnabled: boolean;
  quietHoursStartMinutes: ReminderTimeMinutes;
  quietHoursEndMinutes: ReminderTimeMinutes;
  snoozeDefaultMinutes: number;
};

export type HabitReminder = {
  id: string;
  habitId: string;
  timeMinutes: ReminderTimeMinutes;
  enabled: boolean;
};

export type HabitReminderSnooze = {
  id: string;
  habitReminderId: string;
  userId: string;
  localDate: Date;
  snoozedUntil: Date;
  totalMinutes: number;
};
