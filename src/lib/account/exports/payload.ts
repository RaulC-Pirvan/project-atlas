import { resolveReminderSettings } from '../../reminders/settings';
import {
  USER_DATA_EXPORT_SCHEMA_VERSION,
  type UserDataExportPayload,
  type UserDataExportWeekday,
} from './types';

type HabitRecord = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  schedule: Array<{ weekday: number }>;
};

type CompletionRecord = {
  habitId: string;
  date: Date;
  completedAt: Date;
};

type ReminderSettingsRecord = {
  dailyDigestEnabled: boolean;
  dailyDigestTimeMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStartMinutes: number;
  quietHoursEndMinutes: number;
  snoozeDefaultMinutes: number;
};

type HabitReminderRecord = {
  habitId: string;
  timeMinutes: number;
  enabled: boolean;
};

type AchievementUnlockRecord = {
  achievementId: string;
  unlockedAt: Date;
  createdAt: Date;
};

type HabitMilestoneUnlockRecord = {
  habitId: string;
  milestoneId: string;
  unlockedAt: Date;
  createdAt: Date;
};

type UserDataExportPayloadClient = {
  habit: {
    findMany: (args: {
      where: { userId: string };
      orderBy: Array<{
        sortOrder?: 'asc' | 'desc';
        createdAt?: 'asc' | 'desc';
        id?: 'asc' | 'desc';
      }>;
      select: {
        id: true;
        title: true;
        description: true;
        sortOrder: true;
        archivedAt: true;
        createdAt: true;
        updatedAt: true;
        schedule: { select: { weekday: true } };
      };
    }) => Promise<HabitRecord[]>;
  };
  habitCompletion: {
    findMany: (args: {
      where: { habit: { userId: string } };
      orderBy: Array<{ date?: 'asc' | 'desc'; habitId?: 'asc' | 'desc' }>;
      select: { habitId: true; date: true; completedAt: true };
    }) => Promise<CompletionRecord[]>;
  };
  userReminderSettings: {
    findUnique: (args: {
      where: { userId: string };
      select: {
        dailyDigestEnabled: true;
        dailyDigestTimeMinutes: true;
        quietHoursEnabled: true;
        quietHoursStartMinutes: true;
        quietHoursEndMinutes: true;
        snoozeDefaultMinutes: true;
      };
    }) => Promise<ReminderSettingsRecord | null>;
  };
  habitReminder: {
    findMany: (args: {
      where: { habit: { userId: string } };
      orderBy: Array<{ habitId?: 'asc' | 'desc'; timeMinutes?: 'asc' | 'desc' }>;
      select: { habitId: true; timeMinutes: true; enabled: true };
    }) => Promise<HabitReminderRecord[]>;
  };
  achievementUnlock: {
    findMany: (args: {
      where: { userId: string };
      orderBy: Array<{ unlockedAt?: 'asc' | 'desc'; achievementId?: 'asc' | 'desc' }>;
      select: { achievementId: true; unlockedAt: true; createdAt: true };
    }) => Promise<AchievementUnlockRecord[]>;
  };
  habitMilestoneUnlock: {
    findMany: (args: {
      where: { userId: string };
      orderBy: Array<{
        unlockedAt?: 'asc' | 'desc';
        habitId?: 'asc' | 'desc';
        milestoneId?: 'asc' | 'desc';
      }>;
      select: { habitId: true; milestoneId: true; unlockedAt: true; createdAt: true };
    }) => Promise<HabitMilestoneUnlockRecord[]>;
  };
};

type GetUserDataExportPayloadArgs = {
  prisma: UserDataExportPayloadClient;
  userId: string;
  now?: Date;
};

function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toExportWeekday(value: number): UserDataExportWeekday {
  if (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6 ||
    value === 7
  ) {
    return value;
  }
  throw new RangeError(`Invalid weekday value for export: ${value}`);
}

export async function getUserDataExportPayload({
  prisma,
  userId,
  now = new Date(),
}: GetUserDataExportPayloadArgs): Promise<UserDataExportPayload> {
  const [
    habits,
    completions,
    reminderSettings,
    habitReminders,
    achievementUnlocks,
    habitMilestoneUnlocks,
  ] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        sortOrder: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        schedule: { select: { weekday: true } },
      },
    }),
    prisma.habitCompletion.findMany({
      where: { habit: { userId } },
      orderBy: [{ date: 'asc' }, { habitId: 'asc' }],
      select: { habitId: true, date: true, completedAt: true },
    }),
    prisma.userReminderSettings.findUnique({
      where: { userId },
      select: {
        dailyDigestEnabled: true,
        dailyDigestTimeMinutes: true,
        quietHoursEnabled: true,
        quietHoursStartMinutes: true,
        quietHoursEndMinutes: true,
        snoozeDefaultMinutes: true,
      },
    }),
    prisma.habitReminder.findMany({
      where: { habit: { userId } },
      orderBy: [{ habitId: 'asc' }, { timeMinutes: 'asc' }],
      select: { habitId: true, timeMinutes: true, enabled: true },
    }),
    prisma.achievementUnlock.findMany({
      where: { userId },
      orderBy: [{ unlockedAt: 'asc' }, { achievementId: 'asc' }],
      select: { achievementId: true, unlockedAt: true, createdAt: true },
    }),
    prisma.habitMilestoneUnlock.findMany({
      where: { userId },
      orderBy: [{ unlockedAt: 'asc' }, { habitId: 'asc' }, { milestoneId: 'asc' }],
      select: { habitId: true, milestoneId: true, unlockedAt: true, createdAt: true },
    }),
  ]);

  const settings = resolveReminderSettings(reminderSettings);

  return {
    schemaVersion: USER_DATA_EXPORT_SCHEMA_VERSION,
    generatedAt: toIsoDateTime(now),
    userId,
    habits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      description: habit.description,
      sortOrder: habit.sortOrder,
      archivedAt: habit.archivedAt ? toIsoDateTime(habit.archivedAt) : null,
      createdAt: toIsoDateTime(habit.createdAt),
      updatedAt: toIsoDateTime(habit.updatedAt),
      activeWeekdays: habit.schedule
        .map((entry) => toExportWeekday(entry.weekday))
        .sort((a, b) => a - b),
    })),
    completions: completions.map((completion) => ({
      habitId: completion.habitId,
      date: toIsoDateOnly(completion.date),
      completedAt: toIsoDateTime(completion.completedAt),
    })),
    reminders: {
      settings: {
        dailyDigestEnabled: settings.dailyDigestEnabled,
        dailyDigestTimeMinutes: settings.dailyDigestTimeMinutes,
        quietHoursEnabled: settings.quietHoursEnabled,
        quietHoursStartMinutes: settings.quietHoursStartMinutes,
        quietHoursEndMinutes: settings.quietHoursEndMinutes,
        snoozeDefaultMinutes: settings.snoozeDefaultMinutes,
      },
      habitReminders: habitReminders.map((reminder) => ({
        habitId: reminder.habitId,
        timeMinutes: reminder.timeMinutes,
        enabled: reminder.enabled,
      })),
    },
    achievements: {
      achievementUnlocks: achievementUnlocks.map((unlock) => ({
        achievementId: unlock.achievementId,
        unlockedAt: toIsoDateTime(unlock.unlockedAt),
        createdAt: toIsoDateTime(unlock.createdAt),
      })),
      habitMilestoneUnlocks: habitMilestoneUnlocks.map((unlock) => ({
        habitId: unlock.habitId,
        milestoneId: unlock.milestoneId,
        unlockedAt: toIsoDateTime(unlock.unlockedAt),
        createdAt: toIsoDateTime(unlock.createdAt),
      })),
    },
  };
}
