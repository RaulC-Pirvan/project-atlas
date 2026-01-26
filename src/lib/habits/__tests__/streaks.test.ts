import { describe, expect, it } from 'vitest';

import { calculateStreaks } from '../streaks';
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
});
