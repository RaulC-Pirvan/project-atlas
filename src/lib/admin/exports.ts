import { listActiveWeekdays } from '../habits/schedule';
import type { HabitScheduleEntry } from '../habits/types';
import { formatWeekdaySummary } from './weekdays';

type ExportUserRecord = {
  email: string;
  displayName: string;
  emailVerified: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
};

type ExportUserClient = {
  user: {
    findMany: (args: {
      orderBy: Array<{ createdAt?: 'desc' | 'asc'; id?: 'desc' | 'asc' }>;
      select: {
        email: true;
        displayName: true;
        emailVerified: true;
        createdAt: true;
        deletedAt: true;
      };
    }) => Promise<ExportUserRecord[]>;
  };
};

type ExportHabitRecord = {
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  schedule: HabitScheduleEntry[];
  user: {
    email: string;
    displayName: string;
  };
};

type ExportHabitClient = {
  habit: {
    findMany: (args: {
      orderBy: Array<{ createdAt?: 'desc' | 'asc'; id?: 'desc' | 'asc' }>;
      select: {
        title: true;
        description: true;
        archivedAt: true;
        createdAt: true;
        schedule: { select: { weekday: true } };
        user: { select: { email: true; displayName: true } };
      };
    }) => Promise<ExportHabitRecord[]>;
  };
};

export type AdminExportUserRow = {
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
};

export type AdminExportHabitRow = {
  title: string;
  description: string | null;
  scheduleSummary: string;
  archivedAt: Date | null;
  createdAt: Date;
  ownerEmail: string;
  ownerName: string;
};

export async function listExportUsers(prisma: ExportUserClient): Promise<AdminExportUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      email: true,
      displayName: true,
      emailVerified: true,
      createdAt: true,
      deletedAt: true,
    },
  });

  return users.map((user) => ({
    email: user.email,
    displayName: user.displayName,
    emailVerifiedAt: user.emailVerified,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
  }));
}

export async function listExportHabits(prisma: ExportHabitClient): Promise<AdminExportHabitRow[]> {
  const habits = await prisma.habit.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      title: true,
      description: true,
      archivedAt: true,
      createdAt: true,
      schedule: { select: { weekday: true } },
      user: { select: { email: true, displayName: true } },
    },
  });

  return habits.map((habit) => {
    const weekdays = listActiveWeekdays(habit.schedule);

    return {
      title: habit.title,
      description: habit.description,
      scheduleSummary: formatWeekdaySummary(weekdays),
      archivedAt: habit.archivedAt,
      createdAt: habit.createdAt,
      ownerEmail: habit.user.email,
      ownerName: habit.user.displayName,
    };
  });
}

function toCsvValue(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  const raw = String(value);
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n') || raw.includes('\r')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | Date | null>>,
): string {
  const lines = [headers.map((header) => toCsvValue(header)).join(',')];
  for (const row of rows) {
    lines.push(row.map((value) => toCsvValue(value)).join(','));
  }
  return lines.join('\n');
}
