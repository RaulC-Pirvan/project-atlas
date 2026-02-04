const WEEKDAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export type WeekStart = 'sun' | 'mon';

export function getWeekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday - 1] ?? 'Day';
}

export function getWeekdayOrder(weekStart: WeekStart): number[] {
  if (weekStart === 'sun') {
    return [7, 1, 2, 3, 4, 5, 6];
  }
  return [1, 2, 3, 4, 5, 6, 7];
}
