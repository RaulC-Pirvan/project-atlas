import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CalendarMonth } from '../../components/calendar/CalendarMonth';
import { AppShell } from '../../components/layout/AppShell';
import { listHabits } from '../../lib/api/habits/habits';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import { getMonthGrid } from '../../lib/habits/calendar';
import {
  getLocalDateParts,
  normalizeToUtcDate,
  toUtcDateFromParts,
  toUtcDateKey,
} from '../../lib/habits/dates';

type SearchParams = {
  month?: string | string[];
};

function parseMonthParam(value: string | string[] | undefined): { year: number; month: number } | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const match = /^\d{4}-\d{2}$/.exec(raw);
  if (!match) return null;
  const [yearPart, monthPart] = raw.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (year < 1 || month < 1 || month > 12) return null;
  return { year, month };
}

function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true, weekStart: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const timeZone = user.timezone || 'UTC';
  const now = new Date();
  const today = normalizeToUtcDate(now, timeZone);
  const todayKey = toUtcDateKey(today);

  const localParts = getLocalDateParts(now, timeZone);
  const resolvedSearchParams = await searchParams;
  const requested = parseMonthParam(resolvedSearchParams?.month);
  const year = requested?.year ?? localParts.year;
  const month = requested?.month ?? localParts.month;

  const monthGrid = getMonthGrid({ year, month, weekStart: user.weekStart });
  const habits = await listHabits({ prisma, userId: session.user.id, includeArchived: false });
  const activeWeekdays = new Set<number>();

  for (const habit of habits) {
    for (const weekday of habit.weekdays) {
      activeWeekdays.add(weekday);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const weeks = monthGrid.weeks.map((week) =>
    week.map((day) => ({
      key: day.key,
      day: day.day,
      inMonth: day.inMonth,
      isToday: day.key === todayKey,
      hasHabits: day.inMonth && activeWeekdays.has(day.isoWeekday),
      label: dateFormatter.format(day.date),
    })),
  );

  const monthDate = toUtcDateFromParts({ year, month, day: 1 });
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const prevHref = `/calendar?month=${formatMonthParam(prev.year, prev.month)}`;
  const nextHref = `/calendar?month=${formatMonthParam(next.year, next.month)}`;

  return (
    <AppShell title="Calendar" subtitle="Track your habits day by day.">
      <div className="space-y-6">
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-black/10 px-6 py-4 text-sm text-black/60">
            No habits yet. Create one to populate your calendar.{' '}
            <Link href="/habits" className="font-semibold text-black">
              Go to Habits
            </Link>
            .
          </div>
        ) : null}

        <CalendarMonth
          monthLabel={monthLabel}
          weekStart={user.weekStart}
          weeks={weeks}
          prevHref={prevHref}
          nextHref={nextHref}
        />

        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.25em] text-black/50">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-black" aria-hidden="true" />
            Active habit day
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-black" aria-hidden="true" />
            Today
          </span>
        </div>
      </div>
    </AppShell>
  );
}
