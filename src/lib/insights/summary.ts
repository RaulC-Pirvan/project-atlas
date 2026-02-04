import {
  addUtcDays,
  getIsoWeekdayFromUtcDate,
  normalizeToUtcDate,
  toUtcDateKey,
} from '../habits/dates';
import { listActiveWeekdays } from '../habits/schedule';
import { getWeekdayLabel } from './weekdays';
import type {
  ConsistencyScore,
  HeatmapGrid,
  InsightCompletion,
  InsightHabit,
  InsightsSummary,
  TrendDirection,
  TrendSummary,
  WeekdayStat,
} from './types';

const CONSISTENCY_WINDOWS = [7, 30, 90] as const;
const TREND_WINDOW_DAYS = 14;
const TREND_EPSILON = 0.02;
const HEATMAP_WEEKS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

type DayMetric = {
  date: Date;
  weekday: number;
  scheduled: number;
  completed: number;
};

type BuildInsightsArgs = {
  habits: InsightHabit[];
  completions: InsightCompletion[];
  timeZone: string;
  now?: Date;
};

function buildDayMetrics({
  habits,
  completions,
  start,
  end,
}: {
  habits: InsightHabit[];
  completions: InsightCompletion[];
  start: Date;
  end: Date;
}): DayMetric[] {
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const scheduleByHabit = new Map<string, Set<number>>();
  const scheduledByWeekday = new Map<number, number>();

  for (const habit of activeHabits) {
    const weekdays = listActiveWeekdays(habit.schedule);
    scheduleByHabit.set(habit.id, new Set(weekdays));
    for (const weekday of weekdays) {
      scheduledByWeekday.set(weekday, (scheduledByWeekday.get(weekday) ?? 0) + 1);
    }
  }

  const completionCounts = new Map<string, number>();
  for (const completion of completions) {
    const schedule = scheduleByHabit.get(completion.habitId);
    if (!schedule) continue;
    const weekday = getIsoWeekdayFromUtcDate(completion.date);
    if (!schedule.has(weekday)) continue;
    const key = toUtcDateKey(completion.date);
    completionCounts.set(key, (completionCounts.get(key) ?? 0) + 1);
  }

  const metrics: DayMetric[] = [];
  for (let date = start; date <= end; date = addUtcDays(date, 1)) {
    const weekday = getIsoWeekdayFromUtcDate(date);
    metrics.push({
      date,
      weekday,
      scheduled: scheduledByWeekday.get(weekday) ?? 0,
      completed: completionCounts.get(toUtcDateKey(date)) ?? 0,
    });
  }

  return metrics;
}

function summarizeWindow(metrics: DayMetric[], windowDays: number): ConsistencyScore {
  const slice = metrics.slice(-windowDays);
  let scheduled = 0;
  let completed = 0;

  for (const day of slice) {
    scheduled += day.scheduled;
    completed += day.completed;
  }

  const rate = scheduled > 0 ? completed / scheduled : 0;
  return { windowDays, scheduled, completed, rate };
}

function computeWeekdayStats(metrics: DayMetric[]): {
  best: WeekdayStat | null;
  worst: WeekdayStat | null;
  stats: WeekdayStat[];
} {
  const totals = new Map<number, { scheduled: number; completed: number }>();

  for (const day of metrics) {
    const entry = totals.get(day.weekday) ?? { scheduled: 0, completed: 0 };
    entry.scheduled += day.scheduled;
    entry.completed += day.completed;
    totals.set(day.weekday, entry);
  }

  const stats: WeekdayStat[] = [];
  for (const [weekday, totalsForDay] of totals.entries()) {
    if (totalsForDay.scheduled <= 0) continue;
    const rate = totalsForDay.completed / totalsForDay.scheduled;
    stats.push({
      weekday,
      label: getWeekdayLabel(weekday),
      scheduled: totalsForDay.scheduled,
      completed: totalsForDay.completed,
      rate,
    });
  }

  if (stats.length === 0) {
    return { best: null, worst: null, stats: [] };
  }

  const best = [...stats].sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    if (b.scheduled !== a.scheduled) return b.scheduled - a.scheduled;
    return a.weekday - b.weekday;
  })[0];

  const worst = [...stats].sort((a, b) => {
    if (a.rate !== b.rate) return a.rate - b.rate;
    if (a.scheduled !== b.scheduled) return a.scheduled - b.scheduled;
    return a.weekday - b.weekday;
  })[0];

  const ordered = stats.sort((a, b) => a.weekday - b.weekday);
  return { best, worst, stats: ordered };
}

function computeTrend(metrics: DayMetric[]): TrendSummary {
  const currentWindow = metrics.slice(-TREND_WINDOW_DAYS);
  const previousWindow = metrics.slice(-(TREND_WINDOW_DAYS * 2), -TREND_WINDOW_DAYS);

  const summarizeRate = (window: DayMetric[]) => {
    let scheduled = 0;
    let completed = 0;
    for (const day of window) {
      scheduled += day.scheduled;
      completed += day.completed;
    }
    return scheduled > 0 ? completed / scheduled : 0;
  };

  const currentRate = summarizeRate(currentWindow);
  const previousRate = summarizeRate(previousWindow);
  const delta = currentRate - previousRate;

  let direction: TrendDirection = 'flat';
  if (delta > TREND_EPSILON) direction = 'up';
  if (delta < -TREND_EPSILON) direction = 'down';

  return {
    windowDays: TREND_WINDOW_DAYS,
    currentRate,
    previousRate,
    delta,
    direction,
  };
}

function buildHeatmap(metrics: DayMetric[]): HeatmapGrid {
  const totalDays = HEATMAP_WEEKS * 7;
  const slice = metrics.slice(-totalDays);
  const values = Array.from({ length: 7 }, () => Array.from({ length: HEATMAP_WEEKS }, () => 0));

  if (slice.length === 0) {
    return { weeks: HEATMAP_WEEKS, weekdays: 7, values };
  }

  const start = slice[0].date;
  for (const day of slice) {
    const diffDays = Math.round((day.date.getTime() - start.getTime()) / DAY_MS);
    const weekIndex = Math.floor(diffDays / 7);
    if (weekIndex < 0 || weekIndex >= HEATMAP_WEEKS) continue;
    const weekdayIndex = day.weekday - 1;
    const rate = day.scheduled > 0 ? day.completed / day.scheduled : 0;
    values[weekdayIndex][weekIndex] = rate;
  }

  return { weeks: HEATMAP_WEEKS, weekdays: 7, values };
}

export function buildInsightsSummary(args: BuildInsightsArgs): InsightsSummary {
  const now = args.now ?? new Date();
  const today = normalizeToUtcDate(now, args.timeZone);
  const start = addUtcDays(today, -(CONSISTENCY_WINDOWS[CONSISTENCY_WINDOWS.length - 1] - 1));
  const metrics = buildDayMetrics({
    habits: args.habits,
    completions: args.completions,
    start,
    end: today,
  });

  return {
    generatedAt: today,
    consistency: CONSISTENCY_WINDOWS.map((window) => summarizeWindow(metrics, window)),
    weekdayStats: computeWeekdayStats(metrics),
    trend: computeTrend(metrics),
    heatmap: buildHeatmap(metrics),
  };
}
