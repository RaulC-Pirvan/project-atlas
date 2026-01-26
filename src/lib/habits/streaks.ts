import { addUtcDays, getIsoWeekdayFromUtcDate, normalizeToUtcDate, toUtcDateKey } from './dates';
import { listActiveWeekdays } from './schedule';
import type { HabitScheduleEntry } from './types';

type StreakInputs = {
  schedule: HabitScheduleEntry[];
  completions: Date[];
  asOf: Date;
  timeZone: string;
};

export type StreakSummary = {
  current: number;
  longest: number;
};

function earliestDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return dates.reduce((min, value) => (value < min ? value : min));
}

export function calculateStreaks(input: StreakInputs): StreakSummary {
  const activeWeekdays = listActiveWeekdays(input.schedule);
  if (activeWeekdays.length === 0) {
    return { current: 0, longest: 0 };
  }

  const completionKeys = new Set(input.completions.map(toUtcDateKey));
  const asOfDate = normalizeToUtcDate(input.asOf, input.timeZone);
  const startDate = earliestDate(input.completions) ?? asOfDate;
  const weekdaySet = new Set(activeWeekdays);

  let current = 0;
  let longest = 0;

  for (let date = startDate; date <= asOfDate; date = addUtcDays(date, 1)) {
    const weekday = getIsoWeekdayFromUtcDate(date);
    if (!weekdaySet.has(weekday)) {
      continue;
    }

    if (completionKeys.has(toUtcDateKey(date))) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }

  return { current, longest };
}
