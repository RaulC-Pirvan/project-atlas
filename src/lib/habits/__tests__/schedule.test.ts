import { describe, expect, it } from 'vitest';

import { isHabitActiveOnDate, listActiveWeekdays } from '../schedule';
import { schedule, utcDate } from './fixtures';

describe('schedule helpers', () => {
  it('deduplicates and sorts weekdays', () => {
    expect(listActiveWeekdays(schedule(3, 1, 3, 7))).toEqual([1, 3, 7]);
  });

  it('returns false when schedule is empty', () => {
    const date = utcDate(2026, 1, 5);
    expect(isHabitActiveOnDate([], date, 'UTC')).toBe(false);
  });

  it('throws on invalid weekday values', () => {
    expect(() => listActiveWeekdays(schedule(0))).toThrowError(RangeError);
  });
});
