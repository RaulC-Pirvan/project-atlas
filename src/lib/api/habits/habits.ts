import { listActiveWeekdays } from '../../habits/schedule';
import type { HabitScheduleEntry } from '../../habits/types';
import { ApiError } from '../errors';

type ScheduleRecord = {
  weekday: number;
};

type EmptyFilter = Record<string, never>;

type HabitRecord = {
  id: string;
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  schedule: ScheduleRecord[];
};

type HabitListClient = {
  habit: {
    findMany: (args: {
      where: { userId: string; archivedAt?: Date | null };
      include: { schedule: { select: { weekday: true } } };
      orderBy?: { createdAt: 'asc' | 'desc' };
    }) => Promise<HabitRecord[]>;
  };
};

type HabitCreateClient = {
  habit: {
    create: (args: {
      data: {
        userId: string;
        title: string;
        description?: string | null;
        schedule: { create: ScheduleRecord[] };
      };
      include: { schedule: { select: { weekday: true } } };
    }) => Promise<HabitRecord>;
  };
};

type HabitUpdateClient = {
  habit: {
    findFirst: (args: {
      where: { id: string; userId: string; archivedAt?: Date | null };
    }) => Promise<{ id: string } | null>;
    update: (args: {
      where: { id: string };
      data: {
        title?: string;
        description?: string | null;
        archivedAt?: Date | null;
        schedule?: { deleteMany: EmptyFilter; create: ScheduleRecord[] };
      };
    }) => Promise<{ id: string }>;
    findUnique: (args: {
      where: { id: string };
      include: { schedule: { select: { weekday: true } } };
    }) => Promise<HabitRecord | null>;
  };
};

type HabitArchiveClient = {
  habit: {
    findFirst: (args: {
      where: { id: string; userId: string; archivedAt?: Date | null };
    }) => Promise<{ id: string } | null>;
    update: (args: { where: { id: string }; data: { archivedAt: Date } }) => Promise<{
      id: string;
    }>;
  };
};

export type HabitSummary = {
  id: string;
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  weekdays: number[];
};

type ListHabitsArgs = {
  prisma: HabitListClient;
  userId: string;
  includeArchived?: boolean;
};

type CreateHabitArgs = {
  prisma: HabitCreateClient;
  userId: string;
  title: string;
  description?: string;
  weekdays: number[];
};

type UpdateHabitArgs = {
  prisma: HabitUpdateClient;
  userId: string;
  habitId: string;
  title?: string;
  description?: string | null;
  weekdays?: number[];
};

type ArchiveHabitArgs = {
  prisma: HabitArchiveClient;
  userId: string;
  habitId: string;
  now?: Date;
};

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new ApiError('invalid_request', 'Title is required.', 400);
  }
  return trimmed;
}

function normalizeDescription(description?: string | null): string | null | undefined {
  if (description === undefined) return undefined;
  if (description === null) return null;
  const trimmed = description.trim();
  return trimmed ? trimmed : null;
}

function normalizeWeekdays(weekdays: number[]): number[] {
  if (weekdays.length === 0) {
    throw new ApiError('invalid_request', 'Weekdays are required.', 400);
  }
  const scheduleEntries: HabitScheduleEntry[] = weekdays.map((weekday) => ({ weekday }));
  const activeWeekdays = listActiveWeekdays(scheduleEntries);
  if (activeWeekdays.length === 0) {
    throw new ApiError('invalid_request', 'Weekdays are required.', 400);
  }
  return activeWeekdays;
}

function toHabitSummary(habit: HabitRecord): HabitSummary {
  return {
    id: habit.id,
    title: habit.title,
    description: habit.description,
    archivedAt: habit.archivedAt,
    createdAt: habit.createdAt,
    weekdays: listActiveWeekdays(habit.schedule),
  };
}

export async function listHabits(args: ListHabitsArgs): Promise<HabitSummary[]> {
  const habits = await args.prisma.habit.findMany({
    where: {
      userId: args.userId,
      ...(args.includeArchived ? {} : { archivedAt: null }),
    },
    include: { schedule: { select: { weekday: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return habits.map(toHabitSummary);
}

export async function createHabit(args: CreateHabitArgs): Promise<HabitSummary> {
  const title = normalizeTitle(args.title);
  const description = normalizeDescription(args.description);
  const weekdays = normalizeWeekdays(args.weekdays);

  const habit = await args.prisma.habit.create({
    data: {
      userId: args.userId,
      title,
      description,
      schedule: { create: weekdays.map((weekday) => ({ weekday })) },
    },
    include: { schedule: { select: { weekday: true } } },
  });

  return toHabitSummary(habit);
}

export async function updateHabit(args: UpdateHabitArgs): Promise<HabitSummary> {
  const existing = await args.prisma.habit.findFirst({
    where: { id: args.habitId, userId: args.userId, archivedAt: null },
  });

  if (!existing) {
    throw new ApiError('not_found', 'Habit not found.', 404);
  }

  const data: {
    title?: string;
    description?: string | null;
    schedule?: { deleteMany: EmptyFilter; create: ScheduleRecord[] };
  } = {};

  if (args.title !== undefined) {
    data.title = normalizeTitle(args.title);
  }

  if (args.description !== undefined) {
    data.description = normalizeDescription(args.description);
  }

  if (args.weekdays !== undefined) {
    const weekdays = normalizeWeekdays(args.weekdays);
    data.schedule = {
      deleteMany: {},
      create: weekdays.map((weekday) => ({ weekday })),
    };
  }

  await args.prisma.habit.update({
    where: { id: args.habitId },
    data,
  });

  const updated = await args.prisma.habit.findUnique({
    where: { id: args.habitId },
    include: { schedule: { select: { weekday: true } } },
  });

  if (!updated) {
    throw new ApiError('not_found', 'Habit not found.', 404);
  }

  return toHabitSummary(updated);
}

export async function archiveHabit(args: ArchiveHabitArgs): Promise<{ habitId: string }> {
  const existing = await args.prisma.habit.findFirst({
    where: { id: args.habitId, userId: args.userId, archivedAt: null },
  });

  if (!existing) {
    throw new ApiError('not_found', 'Habit not found.', 404);
  }

  await args.prisma.habit.update({
    where: { id: args.habitId },
    data: { archivedAt: args.now ?? new Date() },
  });

  return { habitId: args.habitId };
}
