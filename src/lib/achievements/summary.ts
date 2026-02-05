import {
  addUtcDays,
  getIsoWeekdayFromUtcDate,
  normalizeToUtcDate,
  toUtcDateKey,
} from '../habits/dates';
import { listActiveWeekdays } from '../habits/schedule';
import { ACHIEVEMENT_CATALOGUE, COMPLETION_MILESTONES, PERFECT_WEEK_MILESTONES } from './catalogue';
import type {
  AchievementCompletion,
  AchievementHabit,
  AchievementsSummary,
  AchievementStatus,
  HabitMilestone,
  HabitMilestoneTimeline,
  MilestoneDefinition,
} from './types';

const GRACE_HOUR = 2;

type BuildAchievementsArgs = {
  habits: AchievementHabit[];
  completions: AchievementCompletion[];
  timeZone: string;
  now?: Date;
};

type PreparedAchievements = {
  activeHabits: AchievementHabit[];
  effectiveToday: Date;
  completionCounts: Map<string, number>;
  completionKeys: Map<string, Set<string>>;
  completionDateKeys: Set<string>;
  scheduleByHabit: Map<string, Set<number>>;
  createdAtByHabit: Map<string, Date>;
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

function getEffectiveToday(now: Date, timeZone: string): Date {
  const today = normalizeToUtcDate(now, timeZone);
  const hour = getLocalHour(now, timeZone);
  if (hour < GRACE_HOUR) {
    return addUtcDays(today, -1);
  }
  return today;
}

function prepareAchievements({
  habits,
  completions,
  timeZone,
  now,
}: BuildAchievementsArgs): PreparedAchievements {
  const effectiveToday = getEffectiveToday(now ?? new Date(), timeZone);
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const scheduleByHabit = new Map<string, Set<number>>();
  const createdAtByHabit = new Map<string, Date>();

  for (const habit of activeHabits) {
    const weekdays = listActiveWeekdays(habit.schedule);
    scheduleByHabit.set(habit.id, new Set(weekdays));
    createdAtByHabit.set(habit.id, normalizeToUtcDate(habit.createdAt, timeZone));
  }

  const completionCounts = new Map<string, number>();
  const completionKeys = new Map<string, Set<string>>();
  const completionDateKeys = new Set<string>();

  for (const completion of completions) {
    const schedule = scheduleByHabit.get(completion.habitId);
    if (!schedule || schedule.size === 0) continue;

    const createdAt = createdAtByHabit.get(completion.habitId);
    if (createdAt && completion.date < createdAt) continue;
    if (completion.date > effectiveToday) continue;

    const weekday = getIsoWeekdayFromUtcDate(completion.date);
    if (!schedule.has(weekday)) continue;

    const key = toUtcDateKey(completion.date);
    const existing = completionKeys.get(completion.habitId) ?? new Set<string>();
    if (!existing.has(key)) {
      existing.add(key);
      completionKeys.set(completion.habitId, existing);
      completionCounts.set(completion.habitId, (completionCounts.get(completion.habitId) ?? 0) + 1);
      completionDateKeys.add(key);
    }
  }

  return {
    activeHabits,
    effectiveToday,
    completionCounts,
    completionKeys,
    completionDateKeys,
    scheduleByHabit,
    createdAtByHabit,
  };
}

function startOfIsoWeek(date: Date): Date {
  const weekday = getIsoWeekdayFromUtcDate(date);
  return addUtcDays(date, -(weekday - 1));
}

function countPerfectWeeks({
  createdAt,
  schedule,
  completionKeys,
  effectiveToday,
}: {
  createdAt: Date;
  schedule: Set<number>;
  completionKeys: Set<string>;
  effectiveToday: Date;
}): number {
  if (schedule.size === 0) return 0;
  if (createdAt > effectiveToday) return 0;

  let count = 0;
  let weekStart = startOfIsoWeek(createdAt);
  const lastWeekStart = startOfIsoWeek(effectiveToday);

  while (weekStart <= lastWeekStart) {
    const weekEnd = addUtcDays(weekStart, 6);
    if (weekEnd > effectiveToday) break;

    const requiredDates: Date[] = [];
    for (const weekday of schedule) {
      const date = addUtcDays(weekStart, weekday - 1);
      if (date < createdAt || date > effectiveToday) continue;
      requiredDates.push(date);
    }

    if (requiredDates.length > 0) {
      const completed = requiredDates.every((date) => completionKeys.has(toUtcDateKey(date)));
      if (completed) count += 1;
    }

    weekStart = addUtcDays(weekStart, 7);
  }

  return count;
}

function countLongestStreak({
  createdAt,
  schedule,
  completionKeys,
  effectiveToday,
}: {
  createdAt: Date;
  schedule: Set<number>;
  completionKeys: Set<string>;
  effectiveToday: Date;
}): number {
  if (schedule.size === 0) return 0;
  if (createdAt > effectiveToday) return 0;

  let current = 0;
  let longest = 0;

  for (let date = createdAt; date <= effectiveToday; date = addUtcDays(date, 1)) {
    const weekday = getIsoWeekdayFromUtcDate(date);
    if (!schedule.has(weekday)) {
      continue;
    }

    if (completionKeys.has(toUtcDateKey(date))) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }

  return longest;
}

function buildAchievementStatuses(
  totalCompletions: number,
  scheduledDays: number,
  distinctHabits: number,
  perfectWeeks: number,
  longestStreak: number,
  maxHabitCompletions: number,
): AchievementStatus[] {
  return ACHIEVEMENT_CATALOGUE.map((achievement) => {
    let current = 0;
    if (achievement.metric === 'totalCompletions') current = totalCompletions;
    if (achievement.metric === 'scheduledDays') current = scheduledDays;
    if (achievement.metric === 'perfectWeeks') current = perfectWeeks;
    if (achievement.metric === 'distinctHabits') current = distinctHabits;
    if (achievement.metric === 'longestStreak') current = longestStreak;
    if (achievement.metric === 'maxHabitCompletions') current = maxHabitCompletions;

    const target = achievement.target;
    const ratio = target > 0 ? Math.min(1, current / target) : 0;

    return {
      ...achievement,
      unlocked: current >= target,
      progress: { current, target, ratio },
    };
  });
}

function buildMilestones(
  habit: AchievementHabit,
  completionCount: number,
  perfectWeeks: number,
): HabitMilestoneTimeline {
  const buildMilestone = (definition: MilestoneDefinition): HabitMilestone => {
    const current = definition.type === 'completions' ? completionCount : perfectWeeks;
    return {
      ...definition,
      current,
      unlocked: current >= definition.target,
    };
  };

  const milestones = [
    ...COMPLETION_MILESTONES.map(buildMilestone),
    ...PERFECT_WEEK_MILESTONES.map(buildMilestone),
  ];

  return {
    habitId: habit.id,
    title: habit.title,
    completionCount,
    milestones,
  };
}

export function buildAchievementsSummary(args: BuildAchievementsArgs): AchievementsSummary {
  const prepared = prepareAchievements(args);
  const completionCounts = prepared.completionCounts;
  const completionKeys = prepared.completionKeys;

  let totalCompletions = 0;
  const scheduledDays = prepared.completionDateKeys.size;
  let distinctHabits = 0;
  let perfectWeeksTotal = 0;
  let longestStreak = 0;
  let maxHabitCompletions = 0;

  const perfectWeeksByHabit = new Map<string, number>();

  for (const habit of prepared.activeHabits) {
    const completionCount = completionCounts.get(habit.id) ?? 0;
    totalCompletions += completionCount;
    if (completionCount > 0) distinctHabits += 1;
    if (completionCount > maxHabitCompletions) {
      maxHabitCompletions = completionCount;
    }

    const schedule = prepared.scheduleByHabit.get(habit.id) ?? new Set();
    const createdAt = prepared.createdAtByHabit.get(habit.id) ?? habit.createdAt;
    const weekCount = countPerfectWeeks({
      createdAt,
      schedule,
      completionKeys: completionKeys.get(habit.id) ?? new Set(),
      effectiveToday: prepared.effectiveToday,
    });
    perfectWeeksByHabit.set(habit.id, weekCount);
    perfectWeeksTotal += weekCount;

    const habitLongest = countLongestStreak({
      createdAt,
      schedule,
      completionKeys: completionKeys.get(habit.id) ?? new Set(),
      effectiveToday: prepared.effectiveToday,
    });
    if (habitLongest > longestStreak) longestStreak = habitLongest;
  }

  const achievements = buildAchievementStatuses(
    totalCompletions,
    scheduledDays,
    distinctHabits,
    perfectWeeksTotal,
    longestStreak,
    maxHabitCompletions,
  );
  const milestones = prepared.activeHabits.map((habit) =>
    buildMilestones(
      habit,
      completionCounts.get(habit.id) ?? 0,
      perfectWeeksByHabit.get(habit.id) ?? 0,
    ),
  );

  return {
    generatedAt: prepared.effectiveToday,
    achievements,
    milestones,
    stats: {
      totalCompletions,
      scheduledDays,
      distinctHabits,
      perfectWeeks: perfectWeeksTotal,
      longestStreak,
      maxHabitCompletions,
    },
  };
}
