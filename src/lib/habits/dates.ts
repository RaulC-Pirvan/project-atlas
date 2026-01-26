export type DateParts = {
  year: number;
  month: number;
  day: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function requireNumber(value: string | undefined, label: string): number {
  if (!value) {
    throw new Error(`Missing ${label} in date parts.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label} in date parts.`);
  }
  return parsed;
}

export function getLocalDateParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: requireNumber(values.get('year'), 'year'),
    month: requireNumber(values.get('month'), 'month'),
    day: requireNumber(values.get('day'), 'day'),
  };
}

export function toUtcDateFromParts(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function normalizeToUtcDate(date: Date, timeZone: string): Date {
  return toUtcDateFromParts(getLocalDateParts(date, timeZone));
}

export function getIsoWeekday(date: Date, timeZone: string): number {
  const parts = getLocalDateParts(date, timeZone);
  return getIsoWeekdayFromUtcDate(toUtcDateFromParts(parts));
}

export function getIsoWeekdayFromUtcDate(date: Date): number {
  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function isSameUtcDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function toUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
