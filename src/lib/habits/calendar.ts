import { addUtcDays, getIsoWeekdayFromUtcDate, toUtcDateFromParts, toUtcDateKey } from './dates';

type WeekStart = 'sun' | 'mon';

type MonthGridArgs = {
  year: number;
  month: number;
  weekStart: WeekStart;
};

export type CalendarDay = {
  date: Date;
  key: string;
  day: number;
  isoWeekday: number;
  inMonth: boolean;
};

export type CalendarWeek = CalendarDay[];

export type MonthGrid = {
  year: number;
  month: number;
  weeks: CalendarWeek[];
};

function assertValidMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError('Year must be a positive integer.');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Month must be between 1 and 12.');
  }
}

function daysInMonthUtc(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getWeekStartIso(weekStart: WeekStart): number {
  return weekStart === 'sun' ? 7 : 1;
}

export function getMonthGrid({ year, month, weekStart }: MonthGridArgs): MonthGrid {
  assertValidMonth(year, month);

  const firstOfMonth = toUtcDateFromParts({ year, month, day: 1 });
  const firstWeekday = getIsoWeekdayFromUtcDate(firstOfMonth);
  const weekStartIso = getWeekStartIso(weekStart);
  const offset = (firstWeekday - weekStartIso + 7) % 7;
  const daysInMonth = daysInMonthUtc(year, month);
  const totalDays = offset + daysInMonth;
  const weeksCount = Math.ceil(totalDays / 7);
  const gridStart = addUtcDays(firstOfMonth, -offset);

  const weeks: CalendarWeek[] = [];

  for (let weekIndex = 0; weekIndex < weeksCount; weekIndex += 1) {
    const week: CalendarDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addUtcDays(gridStart, weekIndex * 7 + dayIndex);
      const inMonth = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1;
      const day = date.getUTCDate();
      const isoWeekday = getIsoWeekdayFromUtcDate(date);

      week.push({
        date,
        day,
        isoWeekday,
        inMonth,
        key: toUtcDateKey(date),
      });
    }

    weeks.push(week);
  }

  return { year, month, weeks };
}
