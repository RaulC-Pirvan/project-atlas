import { describe, expect, it } from 'vitest';

import { createHabitSchema, toggleCompletionSchema, updateHabitSchema } from '../validation';

describe('habit validation', () => {
  it('rejects empty weekday list on create', () => {
    const parsed = createHabitSchema.safeParse({
      title: 'Read',
      weekdays: [],
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects invalid weekday values', () => {
    const parsed = createHabitSchema.safeParse({
      title: 'Read',
      weekdays: [0, 8],
    });

    expect(parsed.success).toBe(false);
  });

  it('requires at least one field on update', () => {
    const parsed = updateHabitSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it('rejects invalid completion payloads', () => {
    const parsed = toggleCompletionSchema.safeParse({
      habitId: '',
      date: '2026-1-5',
      completed: 'yes',
    });

    expect(parsed.success).toBe(false);
  });
});
