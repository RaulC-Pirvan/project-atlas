import { z } from 'zod';

const weekdaySchema = z.number().int().min(1).max(7);
const titleSchema = z.string().trim().min(1);
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.');

export const createHabitSchema = z.object({
  title: titleSchema,
  description: z.string().trim().optional(),
  weekdays: z.array(weekdaySchema).min(1),
});

export const updateHabitSchema = z
  .object({
    title: titleSchema.optional(),
    description: z.string().trim().optional().nullable(),
    weekdays: z.array(weekdaySchema).min(1).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined || data.description !== undefined || data.weekdays !== undefined,
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
