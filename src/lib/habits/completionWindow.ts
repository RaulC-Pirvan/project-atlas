import { addUtcDays, normalizeToUtcDate, parseUtcDateKey } from './dates';

const DEFAULT_GRACE_HOUR = 2;
const DEFAULT_ALLOW_HISTORY = false;

export type CompletionWindowValidation =
  | { ok: true }
  | {
      ok: false;
      reason: 'invalid_date' | 'future' | 'grace_expired' | 'history_blocked';
    };

export type CompletionWindowPolicy = {
  timeZone: string;
  now?: Date;
  graceHour?: number;
  allowHistory?: boolean;
};

function getLocalHour(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((part) => part.type === 'hour')?.value;
  if (!hourPart) {
    throw new Error('Unable to resolve local hour.');
  }
  const parsed = Number(hourPart);
  if (!Number.isFinite(parsed)) {
    throw new Error('Invalid local hour value.');
  }
  return parsed === 24 ? 0 : parsed;
}

export function validateCompletionWindowDate(
  targetDate: Date,
  policy: CompletionWindowPolicy,
): CompletionWindowValidation {
  const now = policy.now ?? new Date();
  const graceHour = policy.graceHour ?? DEFAULT_GRACE_HOUR;
  const allowHistory = policy.allowHistory ?? DEFAULT_ALLOW_HISTORY;
  const today = normalizeToUtcDate(now, policy.timeZone);

  if (targetDate.getTime() > today.getTime()) {
    return { ok: false, reason: 'future' };
  }

  if (allowHistory) {
    return { ok: true };
  }

  if (targetDate.getTime() === today.getTime()) {
    return { ok: true };
  }

  const yesterday = addUtcDays(today, -1);
  if (targetDate.getTime() !== yesterday.getTime()) {
    return { ok: false, reason: 'history_blocked' };
  }

  const hour = getLocalHour(now, policy.timeZone);
  if (hour < graceHour) {
    return { ok: true };
  }

  return { ok: false, reason: 'grace_expired' };
}

export function validateCompletionWindowDateKey(
  dateKey: string,
  policy: CompletionWindowPolicy,
): CompletionWindowValidation {
  const targetDate = parseUtcDateKey(dateKey);
  if (!targetDate) {
    return { ok: false, reason: 'invalid_date' };
  }

  return validateCompletionWindowDate(targetDate, policy);
}
