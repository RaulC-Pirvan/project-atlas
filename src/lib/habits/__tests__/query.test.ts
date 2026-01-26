import { describe, expect, it } from 'vitest';

import { habitsForDate } from '../query';
import { schedule, utcDate } from './fixtures';

describe('habitsForDate', () => {
  it('filters archived habits and matches weekdays', () => {
    const habits = [
      { id: 'active', schedule: schedule(1) },
      { id: 'archived', archivedAt: new Date(), schedule: schedule(1) },
      { id: 'inactive', schedule: schedule(2) },
    ];

    const result = habitsForDate(habits, utcDate(2026, 1, 5), 'UTC');

    expect(result.map((habit) => habit.id)).toEqual(['active']);
  });
});
