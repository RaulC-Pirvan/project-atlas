import { describe, expect, it } from 'vitest';

import { orderHabitsByCompletion } from '../ordering';

describe('orderHabitsByCompletion', () => {
  it('keeps order when setting is off', () => {
    const habits = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const completed = new Set(['b']);

    const result = orderHabitsByCompletion(habits, completed, false);

    expect(result).toEqual(habits);
  });

  it('moves completed habits to the bottom', () => {
    const habits = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const completed = new Set(['b', 'c']);

    const result = orderHabitsByCompletion(habits, completed, true);

    expect(result.map((habit) => habit.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves manual order within each section', () => {
    const habits = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
    const completed = new Set(['a']);

    const result = orderHabitsByCompletion(habits, completed, true);

    expect(result.map((habit) => habit.id)).toEqual(['c', 'b', 'a']);
  });
});