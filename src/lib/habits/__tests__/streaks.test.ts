import { describe, expect, it } from 'vitest';

import { calculateCurrentStreak, calculateLongestStreak, calculateStreaks } from '../streaks';
import { completionDates, schedule, utcDate } from './fixtures';

describe('streak helpers', () => {
  it('counts consecutive scheduled completions as current streak', () => {
    const result = calculateStreaks({
      schedule: schedule(1, 3, 5),
      completions: completionDates(utcDate(2026, 1, 5), utcDate(2026, 1, 7), utcDate(2026, 1, 9)),
      asOf: utcDate(2026, 1, 10),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('breaks streak when a scheduled day is missed', () => {
    const result = calculateStreaks({
      schedule: schedule(1, 3, 5),
      completions: completionDates(utcDate(2026, 1, 5), utcDate(2026, 1, 7)),
      asOf: utcDate(2026, 1, 10),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 0, longest: 2 });
  });

  it('keeps streak across unscheduled days', () => {
    const result = calculateStreaks({
      schedule: schedule(1, 2, 3, 4, 5),
      completions: completionDates(utcDate(2026, 1, 7), utcDate(2026, 1, 8), utcDate(2026, 1, 9)),
      asOf: utcDate(2026, 1, 10),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('keeps current streak through an incomplete scheduled day until it ends', () => {
    const result = calculateStreaks({
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
      completions: completionDates(utcDate(2026, 1, 4), utcDate(2026, 1, 5)),
      asOf: utcDate(2026, 1, 6),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it('returns zero streaks when schedule is empty', () => {
    const result = calculateStreaks({
      schedule: [],
      completions: completionDates(utcDate(2026, 1, 7)),
      asOf: utcDate(2026, 1, 10),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it('returns zero streaks when there are no completions', () => {
    const result = calculateStreaks({
      schedule: schedule(1, 2, 3, 4, 5),
      completions: [],
      asOf: utcDate(2026, 1, 10),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it('tracks longest streak even when current is broken', () => {
    const result = calculateStreaks({
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
      completions: completionDates(
        utcDate(2026, 1, 1),
        utcDate(2026, 1, 2),
        utcDate(2026, 1, 3),
        utcDate(2026, 1, 5),
      ),
      asOf: utcDate(2026, 1, 5),
      timeZone: 'UTC',
    });

    expect(result).toEqual({ current: 1, longest: 3 });
  });

  it('ignores completions after the as-of date (timezone-aware)', () => {
    const asOf = new Date(Date.UTC(2026, 0, 2, 2, 0, 0));
    const result = calculateStreaks({
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
      completions: completionDates(utcDate(2026, 1, 1), utcDate(2026, 1, 2)),
      asOf,
      timeZone: 'America/Los_Angeles',
    });

    expect(result).toEqual({ current: 1, longest: 1 });
  });

  it('counts the local as-of day based on timezone', () => {
    const asOf = new Date(Date.UTC(2026, 0, 1, 16, 0, 0));
    const result = calculateStreaks({
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
      completions: completionDates(utcDate(2026, 1, 1), utcDate(2026, 1, 2)),
      asOf,
      timeZone: 'Asia/Tokyo',
    });

    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it('exposes current and longest streak helpers', () => {
    const input = {
      schedule: schedule(1, 2, 3, 4, 5, 6, 7),
      completions: completionDates(utcDate(2026, 1, 1), utcDate(2026, 1, 2)),
      asOf: utcDate(2026, 1, 2),
      timeZone: 'UTC',
    };

    expect(calculateCurrentStreak(input)).toBe(2);
    expect(calculateLongestStreak(input)).toBe(2);
  });
});
