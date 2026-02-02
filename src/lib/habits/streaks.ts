import {
  addUtcDays,
  getIsoWeekdayFromUtcDate,
  normalizeToUtcDate,
  parseUtcDateKey,
  toUtcDateKey,
} from './dates';
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

type PreparedStreakInputs = {
  activeWeekdays: Set<number>;
  completionKeys: Set<string>;
  startDate: Date | null;
  asOfDate: Date;
};

function prepareStreakInputs(input: StreakInputs): PreparedStreakInputs {
  const activeWeekdays = new Set(listActiveWeekdays(input.schedule));
  const asOfDate = normalizeToUtcDate(input.asOf, input.timeZone);
  const asOfKey = toUtcDateKey(asOfDate);
  const completionKeys = new Set<string>();
  let earliestKey: string | null = null;

  for (const completion of input.completions) {
    const key = toUtcDateKey(completion);
    if (key > asOfKey) continue;
    completionKeys.add(key);
    if (!earliestKey || key < earliestKey) {
      earliestKey = key;
    }
  }

  const startDate = earliestKey ? parseUtcDateKey(earliestKey) : null;

  return { activeWeekdays, completionKeys, startDate, asOfDate };
}

function walkScheduledDays({
  activeWeekdays,
  completionKeys,
  startDate,
  asOfDate,
}: PreparedStreakInputs): StreakSummary {
  if (activeWeekdays.size === 0 || !startDate) {
    return { current: 0, longest: 0 };
  }

  let current = 0;
  let longest = 0;

  for (let date = startDate; date <= asOfDate; date = addUtcDays(date, 1)) {
    const weekday = getIsoWeekdayFromUtcDate(date);
    if (!activeWeekdays.has(weekday)) {
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

function adjustAsOfForCurrent(
  activeWeekdays: Set<number>,
  completionKeys: Set<string>,
  asOfDate: Date,
): Date {
  const asOfKey = toUtcDateKey(asOfDate);
  const weekday = getIsoWeekdayFromUtcDate(asOfDate);
  if (!activeWeekdays.has(weekday)) return asOfDate;
  if (completionKeys.has(asOfKey)) return asOfDate;
  return addUtcDays(asOfDate, -1);
}

export function calculateStreaks(input: StreakInputs): StreakSummary {
  const prepared = prepareStreakInputs(input);
  if (prepared.activeWeekdays.size === 0 || !prepared.startDate) {
    return { current: 0, longest: 0 };
  }

  const longest = walkScheduledDays(prepared).longest;
  const currentAsOf = adjustAsOfForCurrent(
    prepared.activeWeekdays,
    prepared.completionKeys,
    prepared.asOfDate,
  );

  if (currentAsOf < prepared.startDate) {
    return { current: 0, longest };
  }

  const current = walkScheduledDays({ ...prepared, asOfDate: currentAsOf }).current;
  return { current, longest };
}

export function calculateCurrentStreak(input: StreakInputs): number {
  return calculateStreaks(input).current;
}

export function calculateLongestStreak(input: StreakInputs): number {
  return calculateStreaks(input).longest;
}
