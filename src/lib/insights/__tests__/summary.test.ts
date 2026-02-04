import { describe, expect, it } from 'vitest';

import { schedule, utcDate } from '../../habits/__tests__/fixtures';
import { addUtcDays, getIsoWeekdayFromUtcDate } from '../../habits/dates';
import { buildInsightsSummary } from '../summary';

describe('buildInsightsSummary', () => {
  it('returns zeroed metrics when no habits exist', () => {
    const summary = buildInsightsSummary({
      habits: [],
      completions: [],
      timeZone: 'UTC',
      now: utcDate(2026, 2, 7),
    });

    for (const window of summary.consistency) {
      expect(window.scheduled).toBe(0);
      expect(window.completed).toBe(0);
      expect(window.rate).toBe(0);
    }

    expect(summary.weekdayStats.best).toBeNull();
    expect(summary.weekdayStats.worst).toBeNull();
    expect(summary.trend.direction).toBe('flat');

    const flattened = summary.heatmap.values.flat();
    expect(flattened.length).toBe(7 * 12);
    expect(flattened.every((value) => value === 0)).toBe(true);
  });

  it('computes consistency and trend windows', () => {
    const now = utcDate(2026, 2, 15);
    const habit = {
      id: 'habit-1',
      archivedAt: null,
      createdAt: utcDate(2026, 1, 1),
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
    };
    const completions = Array.from({ length: 14 }, (_, index) => ({
      habitId: habit.id,
      date: addUtcDays(now, -index),
    }));

    const summary = buildInsightsSummary({
      habits: [habit],
      completions,
      timeZone: 'UTC',
      now,
    });

    const sevenDay = summary.consistency.find((window) => window.windowDays === 7);
    const thirtyDay = summary.consistency.find((window) => window.windowDays === 30);
    const ninetyDay = summary.consistency.find((window) => window.windowDays === 90);

    expect(sevenDay).toBeTruthy();
    expect(sevenDay?.completed).toBe(7);
    expect(sevenDay?.scheduled).toBe(7);
    expect(sevenDay?.rate).toBe(1);

    expect(thirtyDay?.completed).toBe(14);
    expect(thirtyDay?.scheduled).toBe(30);
    expect(thirtyDay?.rate).toBeCloseTo(14 / 30, 4);

    expect(ninetyDay?.completed).toBe(14);
    expect(ninetyDay?.scheduled).toBe(46);
    expect(ninetyDay?.rate).toBeCloseTo(14 / 46, 4);

    expect(summary.trend.direction).toBe('up');
    expect(summary.trend.currentRate).toBe(1);
    expect(summary.trend.previousRate).toBe(0);
    expect(summary.trend.delta).toBe(1);
  });

  it('selects best and worst weekdays by completion rate', () => {
    const now = utcDate(2026, 2, 15);
    const habit = {
      id: 'habit-2',
      archivedAt: null,
      createdAt: utcDate(2026, 1, 1),
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
    };
    const start = addUtcDays(now, -89);
    const completions: { habitId: string; date: Date }[] = [];

    for (let date = start; date <= now; date = addUtcDays(date, 1)) {
      if (getIsoWeekdayFromUtcDate(date) === 1) {
        completions.push({ habitId: habit.id, date });
      }
    }

    const summary = buildInsightsSummary({
      habits: [habit],
      completions,
      timeZone: 'UTC',
      now,
    });

    expect(summary.weekdayStats.best?.weekday).toBe(1);
    expect(summary.weekdayStats.best?.label).toBe('Monday');
    expect(summary.weekdayStats.best?.rate).toBe(1);

    expect(summary.weekdayStats.worst?.weekday).toBe(2);
    expect(summary.weekdayStats.worst?.label).toBe('Tuesday');
    expect(summary.weekdayStats.worst?.rate).toBe(0);
  });

  it('ignores scheduled opportunities before the habit creation date', () => {
    const now = utcDate(2026, 2, 10);
    const createdAt = utcDate(2026, 2, 7);
    const habit = {
      id: 'habit-3',
      archivedAt: null,
      createdAt,
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
    };

    const summary = buildInsightsSummary({
      habits: [habit],
      completions: [],
      timeZone: 'UTC',
      now,
    });

    const sevenDay = summary.consistency.find((window) => window.windowDays === 7);
    expect(sevenDay?.scheduled).toBe(4);
    expect(sevenDay?.completed).toBe(0);
  });
});
