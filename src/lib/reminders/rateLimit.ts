import type { RateLimitOptions } from '../http/rateLimit';

export const REMINDER_SETTINGS_RATE_LIMIT: RateLimitOptions = {
  windowMs: 1000 * 60 * 5,
  max: 20,
  blockMs: 1000 * 60 * 10,
};

export function getReminderRateLimitKey(userId: string, action: string): string {
  return `reminders:${action}:${userId}`;
}
