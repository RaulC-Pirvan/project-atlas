import { listActiveWeekdays } from '../../lib/habits/schedule';

export type WeekStart = 'sun' | 'mon';

const ISO_LABELS: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

export function getWeekdayOrder(weekStart: WeekStart): number[] {
  return weekStart === 'sun' ? [7, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7];
}

export function normalizeWeekdays(weekdays: number[]): number[] {
  return listActiveWeekdays(weekdays.map((weekday) => ({ weekday })));
}

export function formatWeekdayLabels(weekdays: number[], weekStart: WeekStart): string[] {
  const normalized = new Set(normalizeWeekdays(weekdays));
  return getWeekdayOrder(weekStart)
    .filter((day) => normalized.has(day))
    .map((day) => ISO_LABELS[day]);
}

export function getWeekdayLabel(day: number): string {
  return ISO_LABELS[day] ?? '';
}
