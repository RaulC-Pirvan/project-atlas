import { planCompletionChange } from '../../habits/completions';
import { validateCompletionWindowDate } from '../../habits/completionWindow';
import { toUtcDateKey } from '../../habits/dates';
import { isHabitActiveOnDate } from '../../habits/schedule';
import type { HabitScheduleEntry } from '../../habits/types';
import { ApiError } from '../errors';

type ScheduleRecord = HabitScheduleEntry;

type HabitRecord = {
  id: string;
  archivedAt: Date | null;
  schedule: ScheduleRecord[];
};

type CompletionRecord = {
  id: string;
  habitId: string;
  date: Date;
};

type HabitCompletionClient = {
  habit: {
    findFirst: (args: {
      where: { id: string; userId: string; archivedAt?: Date | null };
      include: { schedule: { select: { weekday: true } } };
    }) => Promise<HabitRecord | null>;
  };
  habitCompletion: {
    findFirst: (args: {
      where: { habitId: string; date: Date };
    }) => Promise<CompletionRecord | null>;
    create: (args: {
      data: { habitId: string; date: Date; completedAt: Date };
    }) => Promise<{ id: string }>;
    delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
  };
};

type CompletionListClient = {
  habitCompletion: {
    findMany: (args: {
      where: { date: Date; habit: { userId: string } };
      select: { habitId: true; date: true };
    }) => Promise<{ habitId: string; date: Date }[]>;
  };
};

type CompletionRangeClient = {
  habitCompletion: {
    findMany: (args: {
      where: { date: { gte: Date; lte: Date }; habit: { userId: string } };
      select: { habitId: true; date: true };
    }) => Promise<{ habitId: string; date: Date }[]>;
  };
};

export type CompletionStatus = 'created' | 'deleted' | 'noop';

export type CompletionToggleResult = {
  status: CompletionStatus;
  habitId: string;
  date: string;
};

type ToggleCompletionArgs = {
  prisma: HabitCompletionClient;
  userId: string;
  habitId: string;
  date: Date;
  completed: boolean;
  timeZone: string;
  now?: Date;
};

type ListCompletionsArgs = {
  prisma: CompletionListClient;
  userId: string;
  date: Date;
};

type ListCompletionRangeArgs = {
  prisma: CompletionRangeClient;
  userId: string;
  start: Date;
  end: Date;
};

function assertCompletionWindowAllowed({
  date,
  timeZone,
  now,
}: {
  date: Date;
  timeZone: string;
  now: Date;
}): void {
  const validation = validateCompletionWindowDate(date, { timeZone, now });
  if (validation.ok) {
    return;
  }

  if (validation.reason === 'future') {
    throw new ApiError('invalid_request', 'Cannot complete future dates.', 400);
  }

  if (validation.reason === 'grace_expired') {
    throw new ApiError('invalid_request', 'Yesterday can only be completed until 2:00 AM.', 400);
  }

  throw new ApiError('invalid_request', 'Past dates cannot be completed.', 400);
}

export async function toggleCompletion(
  args: ToggleCompletionArgs,
): Promise<CompletionToggleResult> {
  const habit = await args.prisma.habit.findFirst({
    where: { id: args.habitId, userId: args.userId, archivedAt: null },
    include: { schedule: { select: { weekday: true } } },
  });

  if (!habit) {
    throw new ApiError('not_found', 'Habit not found.', 404);
  }

  if (!isHabitActiveOnDate(habit.schedule, args.date, args.timeZone)) {
    throw new ApiError('invalid_request', 'Habit is not scheduled for this day.', 400);
  }

  const now = args.now ?? new Date();
  assertCompletionWindowAllowed({ date: args.date, timeZone: args.timeZone, now });

  const existing = await args.prisma.habitCompletion.findFirst({
    where: { habitId: args.habitId, date: args.date },
  });

  const decision = planCompletionChange(existing ? [existing.date] : [], args.date, args.completed);

  if (decision.action === 'noop') {
    return { status: 'noop', habitId: args.habitId, date: toUtcDateKey(args.date) };
  }

  if (decision.action === 'create') {
    await args.prisma.habitCompletion.create({
      data: { habitId: args.habitId, date: args.date, completedAt: now },
    });
    return { status: 'created', habitId: args.habitId, date: toUtcDateKey(args.date) };
  }

  if (!existing) {
    return { status: 'noop', habitId: args.habitId, date: toUtcDateKey(args.date) };
  }

  await args.prisma.habitCompletion.delete({ where: { id: existing.id } });
  return { status: 'deleted', habitId: args.habitId, date: toUtcDateKey(args.date) };
}

export async function listCompletionsForDate(
  args: ListCompletionsArgs,
): Promise<{ habitId: string; date: string }[]> {
  const completions = await args.prisma.habitCompletion.findMany({
    where: { date: args.date, habit: { userId: args.userId } },
    select: { habitId: true, date: true },
  });

  return completions.map((completion) => ({
    habitId: completion.habitId,
    date: toUtcDateKey(completion.date),
  }));
}

export async function listCompletionsInRange(
  args: ListCompletionRangeArgs,
): Promise<{ habitId: string; date: string }[]> {
  const completions = await args.prisma.habitCompletion.findMany({
    where: { date: { gte: args.start, lte: args.end }, habit: { userId: args.userId } },
    select: { habitId: true, date: true },
  });

  return completions.map((completion) => ({
    habitId: completion.habitId,
    date: toUtcDateKey(completion.date),
  }));
}
