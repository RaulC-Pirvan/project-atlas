import { describe, expect, it } from 'vitest';

import { formatWeekdaySummary } from '../weekdays';

describe('formatWeekdaySummary', () => {
  it('returns daily for seven days', () => {
    expect(formatWeekdaySummary([1, 2, 3, 4, 5, 6, 7])).toBe('Daily');
  });

  it('returns a comma-separated summary for partial weeks', () => {
    expect(formatWeekdaySummary([3, 1, 5])).toBe('Mon, Wed, Fri');
  });

  it('returns fallback when empty', () => {
    expect(formatWeekdaySummary([])).toBe('No schedule');
  });
});
