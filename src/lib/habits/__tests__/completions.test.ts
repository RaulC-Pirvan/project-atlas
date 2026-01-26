import { describe, expect, it } from 'vitest';

import { hasCompletion, planCompletionChange } from '../completions';
import { utcDate } from './fixtures';

describe('completion helpers', () => {
  it('detects completion on the same utc date', () => {
    const date = utcDate(2026, 1, 5);
    const sameDayDifferentTime = new Date('2026-01-05T13:00:00.000Z');

    expect(hasCompletion([date], sameDayDifferentTime)).toBe(true);
  });

  it('plans create when missing and desired complete', () => {
    const date = utcDate(2026, 1, 5);
    expect(planCompletionChange([], date, true)).toEqual({ action: 'create', date });
  });

  it('plans noop when already complete', () => {
    const date = utcDate(2026, 1, 5);
    expect(planCompletionChange([date], date, true)).toEqual({ action: 'noop', date });
  });

  it('plans delete when uncompleting an existing entry', () => {
    const date = utcDate(2026, 1, 5);
    expect(planCompletionChange([date], date, false)).toEqual({ action: 'delete', date });
  });
});
