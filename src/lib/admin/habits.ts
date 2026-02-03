import { listActiveWeekdays } from '../habits/schedule';
import type { HabitScheduleEntry } from '../habits/types';
import { formatWeekdaySummary } from './weekdays';

type HabitRecord = {
  id: string;
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  user: {
    email: string;
    displayName: string;
  };
  schedule: HabitScheduleEntry[];
};

type AdminHabitClient = {
  habit: {
    findMany: (args: {
      where?: Record<string, unknown>;
      orderBy: Array<{ createdAt?: 'desc' | 'asc'; id?: 'desc' | 'asc' }>;
      take: number;
      skip?: number;
      cursor?: { id: string };
      select: {
        id: true;
        title: true;
        description: true;
        archivedAt: true;
        createdAt: true;
        schedule: { select: { weekday: true } };
        user: { select: { email: true; displayName: true } };
      };
    }) => Promise<HabitRecord[]>;
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  };
};

export type AdminHabitSummary = {
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  scheduleSummary: string;
  weekdays: number[];
  user: {
    email: string;
    displayName: string;
  };
};

export type AdminHabitCounts = {
  total: number;
  active: number;
  archived: number;
};

export type AdminHabitListResult = {
  habits: AdminHabitSummary[];
  counts: AdminHabitCounts;
  nextCursor: string | null;
};

type HabitStatusFilter = 'active' | 'archived' | 'all';

type ListAdminHabitsArgs = {
  prisma: AdminHabitClient;
  search?: string | null;
  cursor?: string | null;
  take?: number | null;
  status?: string | null;
};

function normalizeLimit(value?: number | null): number {
  if (!value || Number.isNaN(value)) return 20;
  const coerced = Math.floor(value);
  if (coerced < 1) return 1;
  if (coerced > 100) return 100;
  return coerced;
}

function normalizeStatus(value?: string | null): HabitStatusFilter {
  if (value === 'archived' || value === 'all') return value;
  return 'active';
}

function buildSearchFilter(search?: string | null): Record<string, unknown> {
  const trimmed = search?.trim();
  if (!trimmed) return {};

  return {
    OR: [
      { title: { contains: trimmed, mode: 'insensitive' } },
      { description: { contains: trimmed, mode: 'insensitive' } },
      { user: { email: { contains: trimmed, mode: 'insensitive' } } },
      { user: { displayName: { contains: trimmed, mode: 'insensitive' } } },
    ],
  };
}

function toSummary(habit: HabitRecord): AdminHabitSummary {
  const weekdays = listActiveWeekdays(habit.schedule);

  return {
    title: habit.title,
    description: habit.description,
    archivedAt: habit.archivedAt,
    createdAt: habit.createdAt,
    weekdays,
    scheduleSummary: formatWeekdaySummary(weekdays),
    user: habit.user,
  };
}

export async function listAdminHabits({
  prisma,
  search,
  cursor,
  take,
  status,
}: ListAdminHabitsArgs): Promise<AdminHabitListResult> {
  const limit = normalizeLimit(take);
  const normalizedStatus = normalizeStatus(status);
  const baseWhere: Record<string, unknown> = {
    ...buildSearchFilter(search),
  };

  const activeWhere = { ...baseWhere, archivedAt: null };
  const archivedWhere = { ...baseWhere, archivedAt: { not: null } };

  const [activeCount, archivedCount] = await Promise.all([
    prisma.habit.count({ where: activeWhere }),
    prisma.habit.count({ where: archivedWhere }),
  ]);

  const listWhere =
    normalizedStatus === 'all'
      ? baseWhere
      : normalizedStatus === 'archived'
        ? archivedWhere
        : activeWhere;

  const habits = await prisma.habit.findMany({
    where: listWhere,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      archivedAt: true,
      createdAt: true,
      schedule: { select: { weekday: true } },
      user: { select: { email: true, displayName: true } },
    },
  });

  const hasNext = habits.length > limit;
  const sliced = hasNext ? habits.slice(0, limit) : habits;
  const nextCursor = hasNext ? (sliced[sliced.length - 1]?.id ?? null) : null;

  return {
    habits: sliced.map(toSummary),
    counts: {
      total: activeCount + archivedCount,
      active: activeCount,
      archived: archivedCount,
    },
    nextCursor,
  };
}
