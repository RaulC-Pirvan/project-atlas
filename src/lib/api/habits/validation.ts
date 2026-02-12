import { z } from 'zod';

import {
  MAX_REMINDERS_PER_HABIT,
  MAX_TIME_MINUTES,
  MIN_TIME_MINUTES,
} from '../../reminders/constants';

const weekdaySchema = z.number().int().min(1).max(7);
const titleSchema = z.string().trim().min(1);
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.');
const reminderTimeSchema = z.number().int().min(MIN_TIME_MINUTES).max(MAX_TIME_MINUTES);

export const createHabitSchema = z.object({
  title: titleSchema,
  description: z.string().trim().optional(),
  weekdays: z.array(weekdaySchema).min(1),
  reminderTimes: z.array(reminderTimeSchema).max(MAX_REMINDERS_PER_HABIT).optional(),
});

export const updateHabitSchema = z
  .object({
    title: titleSchema.optional(),
    description: z.string().trim().optional().nullable(),
    weekdays: z.array(weekdaySchema).min(1).optional(),
    reminderTimes: z.array(reminderTimeSchema).max(MAX_REMINDERS_PER_HABIT).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.weekdays !== undefined ||
      data.reminderTimes !== undefined,
    { message: 'At least one field must be provided.' },
  );

export const toggleCompletionSchema = z.object({
  habitId: z.string().min(1),
  date: dateKeySchema,
  completed: z.boolean(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
