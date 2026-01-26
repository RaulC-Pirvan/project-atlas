import { getIsoWeekday } from './dates';
import type { HabitScheduleEntry } from './types';

const MIN_WEEKDAY = 1;
const MAX_WEEKDAY = 7;

function assertValidWeekday(value: number): void {
  if (!Number.isInteger(value) || value < MIN_WEEKDAY || value > MAX_WEEKDAY) {
    throw new RangeError(`Weekday must be ${MIN_WEEKDAY}-${MAX_WEEKDAY}.`);
  }
}

export function listActiveWeekdays(schedule: HabitScheduleEntry[]): number[] {
  const unique = new Set<number>();
  for (const entry of schedule) {
    assertValidWeekday(entry.weekday);
    unique.add(entry.weekday);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function isHabitActiveOnDate(
  schedule: HabitScheduleEntry[],
  date: Date,
  timeZone: string,
): boolean {
  if (schedule.length === 0) return false;
  const weekday = getIsoWeekday(date, timeZone);
  return schedule.some((entry) => {
    assertValidWeekday(entry.weekday);
    return entry.weekday === weekday;
  });
}
