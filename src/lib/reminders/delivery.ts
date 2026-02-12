export type ReminderChannel = 'push';
export type ReminderKind = 'habit' | 'digest';

export type ReminderPayload = {
  title: string;
  body: string;
  deepLink: string;
  data: Record<string, string>;
};

export type ReminderDispatch = {
  kind: ReminderKind;
  channel: ReminderChannel;
  scheduledFor: Date;
  payload: ReminderPayload;
};

export type ReminderDeliveryStrategy = {
  channel: ReminderChannel;
  approach: 'polling';
  dueWindowMinutes: number;
  retryWindowMinutes: number;
  dedupeKey: 'reminderId+date';
};

export const reminderDeliveryStrategy: ReminderDeliveryStrategy = {
  channel: 'push',
  approach: 'polling',
  dueWindowMinutes: 5,
  retryWindowMinutes: 30,
  dedupeKey: 'reminderId+date',
};

export function buildHabitReminderPayload(habitTitle: string): ReminderPayload {
  return {
    title: 'Habit reminder',
    body: habitTitle,
    deepLink: '/calendar',
    data: {
      kind: 'habit',
      habitTitle,
    },
  };
}

export function buildDailyDigestPayload(dueCount: number): ReminderPayload {
  const countLabel = dueCount === 1 ? '1 habit' : `${dueCount} habits`;
  return {
    title: 'Daily digest',
    body: `${countLabel} due today`,
    deepLink: '/calendar',
    data: {
      kind: 'digest',
      dueCount: String(dueCount),
    },
  };
}
