import { describe, expect, it } from 'vitest';

import { MAX_SNOOZE_DAILY_MINUTES, MAX_SNOOZE_MINUTES } from '../constants';
import { getAllowedSnoozeMinutes, isTimeWithinQuietHours } from '../rules';

describe('reminder rules', () => {
  it('detects quiet hours within same-day window', () => {
    const start = 9 * 60;
    const end = 17 * 60;

    expect(isTimeWithinQuietHours(8 * 60 + 30, start, end)).toBe(false);
    expect(isTimeWithinQuietHours(9 * 60, start, end)).toBe(true);
    expect(isTimeWithinQuietHours(12 * 60, start, end)).toBe(true);
    expect(isTimeWithinQuietHours(17 * 60, start, end)).toBe(false);
  });

  it('detects quiet hours that wrap past midnight', () => {
    const start = 22 * 60;
    const end = 7 * 60;

    expect(isTimeWithinQuietHours(21 * 60, start, end)).toBe(false);
    expect(isTimeWithinQuietHours(23 * 60, start, end)).toBe(true);
    expect(isTimeWithinQuietHours(2 * 60, start, end)).toBe(true);
    expect(isTimeWithinQuietHours(8 * 60, start, end)).toBe(false);
  });

  it('clamps snooze minutes by max and daily cap', () => {
    expect(getAllowedSnoozeMinutes(10, 0)).toBe(10);
    expect(getAllowedSnoozeMinutes(MAX_SNOOZE_MINUTES + 30, 0)).toBe(MAX_SNOOZE_MINUTES);

    const remaining = MAX_SNOOZE_DAILY_MINUTES - 15;
    expect(getAllowedSnoozeMinutes(30, MAX_SNOOZE_DAILY_MINUTES - 15)).toBe(15);
    expect(getAllowedSnoozeMinutes(30, MAX_SNOOZE_DAILY_MINUTES)).toBe(0);
    expect(getAllowedSnoozeMinutes(5, remaining)).toBe(5);
  });
});
