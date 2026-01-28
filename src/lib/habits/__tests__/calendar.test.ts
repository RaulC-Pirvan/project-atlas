import { describe, expect, it } from 'vitest';

import { getMonthGrid } from '../calendar';
import { toUtcDateKey } from '../dates';

describe('getMonthGrid', () => {
  it('aligns weeks to monday start', () => {
    const { weeks } = getMonthGrid({ year: 2026, month: 1, weekStart: 'mon' });

    expect(weeks[0][0].isoWeekday).toBe(1);
  });

  it('aligns weeks to sunday start', () => {
    const { weeks } = getMonthGrid({ year: 2026, month: 1, weekStart: 'sun' });

    expect(weeks[0][0].isoWeekday).toBe(7);
  });

  it('covers all days in the month', () => {
    const { weeks } = getMonthGrid({ year: 2026, month: 1, weekStart: 'mon' });
    const inMonth = weeks.flat().filter((day) => day.inMonth);

    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].day).toBe(1);
    expect(inMonth[inMonth.length - 1].day).toBe(31);
  });

  it('starts the grid on the expected date', () => {
    const { weeks } = getMonthGrid({ year: 2026, month: 1, weekStart: 'mon' });

    expect(toUtcDateKey(weeks[0][0].date)).toBe('2025-12-29');
  });
});
