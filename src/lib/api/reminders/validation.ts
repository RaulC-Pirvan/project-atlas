import { z } from 'zod';

import {
  MAX_SNOOZE_MINUTES,
  MAX_TIME_MINUTES,
  MIN_TIME_MINUTES,
} from '../../reminders/constants';

const timeMinutesSchema = z.number().int().min(MIN_TIME_MINUTES).max(MAX_TIME_MINUTES);

export const updateReminderSettingsSchema = z
  .object({
    dailyDigestEnabled: z.boolean().optional(),
    dailyDigestTimeMinutes: timeMinutesSchema.optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStartMinutes: timeMinutesSchema.optional(),
    quietHoursEndMinutes: timeMinutesSchema.optional(),
    snoozeDefaultMinutes: z.number().int().min(1).max(MAX_SNOOZE_MINUTES).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided.',
  });

export type UpdateReminderSettingsInput = z.infer<typeof updateReminderSettingsSchema>;
