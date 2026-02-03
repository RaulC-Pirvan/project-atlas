const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

export function formatWeekdaySummary(weekdays: number[]): string {
  const normalized = Array.from(new Set(weekdays))
    .filter((weekday) => WEEKDAY_LABELS[weekday])
    .sort((a, b) => a - b);

  if (normalized.length === 0) return 'No schedule';
  if (normalized.length === 7) return 'Daily';

  return normalized.map((weekday) => WEEKDAY_LABELS[weekday]).join(', ');
}
