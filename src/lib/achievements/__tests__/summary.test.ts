import { describe, expect, it } from 'vitest';

import { schedule, utcDate } from '../../habits/__tests__/fixtures';
import { addUtcDays } from '../../habits/dates';
import { buildAchievementsSummary } from '../summary';

describe('buildAchievementsSummary', () => {
  it('unlocks completion and perfect week achievements', () => {
    const habit = {
      id: 'habit-1',
      title: 'Read',
      archivedAt: null,
      createdAt: utcDate(2026, 1, 1),
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
    };
    const weekStart = utcDate(2026, 1, 5);
    const completions = Array.from({ length: 7 }, (_, index) => ({
      habitId: habit.id,
      date: addUtcDays(weekStart, index),
    }));

    const summary = buildAchievementsSummary({
      habits: [habit],
      completions,
      timeZone: 'UTC',
      now: utcDate(2026, 1, 12),
    });

    expect(summary.stats.totalCompletions).toBe(7);
    expect(summary.stats.perfectWeeks).toBe(1);

    const first = summary.achievements.find((achievement) => achievement.id === 'first-completion');
    const seven = summary.achievements.find(
      (achievement) => achievement.id === 'seven-completions',
    );
    const perfect = summary.achievements.find((achievement) => achievement.id === 'perfect-week');

    expect(first?.unlocked).toBe(true);
    expect(seven?.unlocked).toBe(true);
    expect(perfect?.unlocked).toBe(true);

    const milestones = summary.milestones[0]?.milestones ?? [];
    const completionSeven = milestones.find((milestone) => milestone.id === 'completions-7');
    const completionThirty = milestones.find((milestone) => milestone.id === 'completions-30');
    const perfectWeek = milestones.find((milestone) => milestone.id === 'perfect-weeks-1');

    expect(completionSeven?.unlocked).toBe(true);
    expect(completionThirty?.unlocked).toBe(false);
    expect(perfectWeek?.unlocked).toBe(true);
  });

  it('ignores completions for archived habits or unscheduled days', () => {
    const activeHabit = {
      id: 'habit-2',
      title: 'Stretch',
      archivedAt: null,
      createdAt: utcDate(2026, 1, 1),
      schedule: schedule(1),
    };
    const archivedHabit = {
      id: 'habit-3',
      title: 'Archive',
      archivedAt: utcDate(2026, 1, 2),
      createdAt: utcDate(2026, 1, 1),
      schedule: schedule(1),
    };

    const completions = [
      { habitId: activeHabit.id, date: utcDate(2026, 1, 5) },
      { habitId: activeHabit.id, date: utcDate(2026, 1, 6) },
      { habitId: archivedHabit.id, date: utcDate(2026, 1, 5) },
    ];

    const summary = buildAchievementsSummary({
      habits: [activeHabit, archivedHabit],
      completions,
      timeZone: 'UTC',
      now: utcDate(2026, 1, 10),
    });

    expect(summary.stats.totalCompletions).toBe(1);
  });

  it('applies the grace window before 02:00 local time', () => {
    const habit = {
      id: 'habit-4',
      title: 'Journal',
      archivedAt: null,
      createdAt: utcDate(2026, 2, 1),
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
    };

    const now = new Date(Date.UTC(2026, 1, 10, 5, 30));
    const completions = [
      { habitId: habit.id, date: utcDate(2026, 2, 9) },
      { habitId: habit.id, date: utcDate(2026, 2, 10) },
    ];

    const summary = buildAchievementsSummary({
      habits: [habit],
      completions,
      timeZone: 'America/New_York',
      now,
    });

    expect(summary.generatedAt.toISOString().slice(0, 10)).toBe('2026-02-09');
    expect(summary.stats.totalCompletions).toBe(1);
  });
});
