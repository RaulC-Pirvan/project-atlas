import { describe, expect, it } from 'vitest';

import { summarizeUserDataExportRecordCounts } from '../recordCounts';
import { USER_DATA_EXPORT_SCHEMA_VERSION, type UserDataExportPayload } from '../types';

describe('summarizeUserDataExportRecordCounts', () => {
  it('returns counts for each export surface', () => {
    const payload: UserDataExportPayload = {
      schemaVersion: USER_DATA_EXPORT_SCHEMA_VERSION,
      generatedAt: '2026-02-20T16:45:12.345Z',
      userId: 'user-123',
      habits: [
        {
          id: 'habit-1',
          title: 'Read',
          description: null,
          sortOrder: 0,
          archivedAt: null,
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-02T00:00:00.000Z',
          activeWeekdays: [1, 3, 5],
        },
      ],
      completions: [
        {
          habitId: 'habit-1',
          date: '2026-02-19',
          completedAt: '2026-02-19T18:00:00.000Z',
        },
        {
          habitId: 'habit-1',
          date: '2026-02-20',
          completedAt: '2026-02-20T18:00:00.000Z',
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
        habitReminders: [
          { habitId: 'habit-1', timeMinutes: 540, enabled: true },
          { habitId: 'habit-1', timeMinutes: 1140, enabled: true },
        ],
      },
      achievements: {
        achievementUnlocks: [
          {
            achievementId: 'streak-7',
            unlockedAt: '2026-02-20T12:00:00.000Z',
            createdAt: '2026-02-20T12:00:00.000Z',
          },
        ],
        habitMilestoneUnlocks: [
          {
            habitId: 'habit-1',
            milestoneId: 'habit-1-completions-10',
            unlockedAt: '2026-02-20T12:00:00.000Z',
            createdAt: '2026-02-20T12:00:00.000Z',
          },
        ],
      },
    };

    expect(summarizeUserDataExportRecordCounts(payload)).toEqual({
      habits: 1,
      completions: 2,
      reminderSettings: 1,
      habitReminders: 2,
      achievementUnlocks: 1,
      habitMilestoneUnlocks: 1,
    });
  });

  it('counts missing reminder settings as zero', () => {
    const payload: UserDataExportPayload = {
      schemaVersion: USER_DATA_EXPORT_SCHEMA_VERSION,
      generatedAt: '2026-02-20T16:45:12.345Z',
      userId: 'user-123',
      habits: [],
      completions: [],
      reminders: {
        settings: null,
        habitReminders: [],
      },
      achievements: {
        achievementUnlocks: [],
        habitMilestoneUnlocks: [],
      },
    };

    expect(summarizeUserDataExportRecordCounts(payload).reminderSettings).toBe(0);
  });
});
