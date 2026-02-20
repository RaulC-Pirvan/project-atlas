import { describe, expect, it, vi } from 'vitest';

import { getUserDataExportPayload } from '../payload';
import { USER_DATA_EXPORT_SCHEMA_VERSION } from '../types';

describe('getUserDataExportPayload', () => {
  it('assembles all export sections with strict user scoping', async () => {
    const habitFindMany = vi.fn().mockResolvedValue([
      {
        id: 'habit-1',
        title: 'Read',
        description: 'Read every day',
        sortOrder: 2,
        archivedAt: null,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        updatedAt: new Date('2026-02-10T00:00:00.000Z'),
        schedule: [{ weekday: 3 }, { weekday: 1 }],
      },
    ]);
    const completionFindMany = vi.fn().mockResolvedValue([
      {
        habitId: 'habit-1',
        date: new Date('2026-02-19T00:00:00.000Z'),
        completedAt: new Date('2026-02-19T08:00:00.000Z'),
      },
    ]);
    const reminderSettingsFindUnique = vi.fn().mockResolvedValue({
      dailyDigestEnabled: true,
      dailyDigestTimeMinutes: 1200,
      quietHoursEnabled: false,
      quietHoursStartMinutes: 1320,
      quietHoursEndMinutes: 420,
      snoozeDefaultMinutes: 10,
    });
    const habitReminderFindMany = vi
      .fn()
      .mockResolvedValue([{ habitId: 'habit-1', timeMinutes: 540, enabled: true }]);
    const achievementUnlockFindMany = vi.fn().mockResolvedValue([
      {
        achievementId: 'streak-7',
        unlockedAt: new Date('2026-02-19T08:00:00.000Z'),
        createdAt: new Date('2026-02-19T08:00:00.000Z'),
      },
    ]);
    const habitMilestoneUnlockFindMany = vi.fn().mockResolvedValue([
      {
        habitId: 'habit-1',
        milestoneId: 'habit-1-completions-10',
        unlockedAt: new Date('2026-02-20T08:00:00.000Z'),
        createdAt: new Date('2026-02-20T08:00:00.000Z'),
      },
    ]);

    const prisma = {
      habit: { findMany: habitFindMany },
      habitCompletion: { findMany: completionFindMany },
      userReminderSettings: { findUnique: reminderSettingsFindUnique },
      habitReminder: { findMany: habitReminderFindMany },
      achievementUnlock: { findMany: achievementUnlockFindMany },
      habitMilestoneUnlock: { findMany: habitMilestoneUnlockFindMany },
    };

    const payload = await getUserDataExportPayload({
      prisma,
      userId: 'user-1',
      now: new Date('2026-02-20T10:00:00.000Z'),
    });

    expect(habitFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(completionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { habit: { userId: 'user-1' } } }),
    );
    expect(reminderSettingsFindUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: {
        dailyDigestEnabled: true,
        dailyDigestTimeMinutes: true,
        quietHoursEnabled: true,
        quietHoursStartMinutes: true,
        quietHoursEndMinutes: true,
        snoozeDefaultMinutes: true,
      },
    });
    expect(habitReminderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { habit: { userId: 'user-1' } } }),
    );
    expect(achievementUnlockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(habitMilestoneUnlockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );

    expect(payload).toEqual({
      schemaVersion: USER_DATA_EXPORT_SCHEMA_VERSION,
      generatedAt: '2026-02-20T10:00:00.000Z',
      userId: 'user-1',
      habits: [
        {
          id: 'habit-1',
          title: 'Read',
          description: 'Read every day',
          sortOrder: 2,
          archivedAt: null,
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-10T00:00:00.000Z',
          activeWeekdays: [1, 3],
        },
      ],
      completions: [
        {
          habitId: 'habit-1',
          date: '2026-02-19',
          completedAt: '2026-02-19T08:00:00.000Z',
        },
      ],
      reminders: {
        settings: {
          dailyDigestEnabled: true,
          dailyDigestTimeMinutes: 1200,
          quietHoursEnabled: false,
          quietHoursStartMinutes: 1320,
          quietHoursEndMinutes: 420,
          snoozeDefaultMinutes: 10,
        },
        habitReminders: [{ habitId: 'habit-1', timeMinutes: 540, enabled: true }],
      },
      achievements: {
        achievementUnlocks: [
          {
            achievementId: 'streak-7',
            unlockedAt: '2026-02-19T08:00:00.000Z',
            createdAt: '2026-02-19T08:00:00.000Z',
          },
        ],
        habitMilestoneUnlocks: [
          {
            habitId: 'habit-1',
            milestoneId: 'habit-1-completions-10',
            unlockedAt: '2026-02-20T08:00:00.000Z',
            createdAt: '2026-02-20T08:00:00.000Z',
          },
        ],
      },
    });
  });

  it('falls back to default reminder settings when no settings row exists', async () => {
    const payload = await getUserDataExportPayload({
      prisma: {
        habit: { findMany: vi.fn().mockResolvedValue([]) },
        habitCompletion: { findMany: vi.fn().mockResolvedValue([]) },
        userReminderSettings: { findUnique: vi.fn().mockResolvedValue(null) },
        habitReminder: { findMany: vi.fn().mockResolvedValue([]) },
        achievementUnlock: { findMany: vi.fn().mockResolvedValue([]) },
        habitMilestoneUnlock: { findMany: vi.fn().mockResolvedValue([]) },
      },
      userId: 'user-1',
      now: new Date('2026-02-20T10:00:00.000Z'),
    });

    expect(payload.reminders.settings).toEqual({
      dailyDigestEnabled: true,
      dailyDigestTimeMinutes: 1200,
      quietHoursEnabled: false,
      quietHoursStartMinutes: 1320,
      quietHoursEndMinutes: 420,
      snoozeDefaultMinutes: 10,
    });
  });
});
