import { redirect } from 'next/navigation';

import { CalendarMonth } from '../../components/calendar/CalendarMonth';
import { DailyCompletionPanel } from '../../components/calendar/DailyCompletionPanel';
import { MobileDailySheet } from '../../components/calendar/MobileDailySheet';
import { InsightsSnapshotCard } from '../../components/insights/InsightsSnapshotCard';
import { InsightsUpgradeCard } from '../../components/insights/InsightsUpgradeCard';
import { AppShell } from '../../components/layout/AppShell';
import { StreakSummaryPanel } from '../../components/streaks/StreakSummaryPanel';
import { getInsightsSummary } from '../../lib/api/insights/summary';
import { listCompletionsForDate, listCompletionsInRange } from '../../lib/api/habits/completions';
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
import { isHabitActiveOnDate } from '../../lib/habits/schedule';
import { calculateStreaks } from '../../lib/habits/streaks';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

type SearchParams = {
  month?: string | string[];
  date?: string | string[];
};

function parseMonthParam(
  value: string | string[] | undefined,
): { year: number; month: number } | null {
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

function parseDateParam(
  value: string | string[] | undefined,
): { year: number; month: number; day: number } | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(raw);
  if (!match) return null;
  const [yearPart, monthPart, dayPart] = raw.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
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

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  const timeZone = user.timezone || 'UTC';
  const now = new Date();
  const today = normalizeToUtcDate(now, timeZone);
  const todayKey = toUtcDateKey(today);

  const localParts = getLocalDateParts(now, timeZone);
  const resolvedSearchParams = await searchParams;
  const requested = parseMonthParam(resolvedSearchParams?.month);
  const requestedDate = parseDateParam(resolvedSearchParams?.date);
  const hasDateParam = resolvedSearchParams?.date !== undefined;
  const isCurrentMonth = !requested
    ? true
    : requested.year === localParts.year && requested.month === localParts.month;
  const year = requested?.year ?? requestedDate?.year ?? localParts.year;
  const month = requested?.month ?? requestedDate?.month ?? localParts.month;

  const monthGrid = getMonthGrid({ year, month, weekStart: user.weekStart });
  const habits = await listHabits({ prisma, userId: session.user.id, includeArchived: false });
  const habitSchedules = habits.map((habit) => ({
    habit,
    schedule: habit.weekdays.map((weekday) => ({ weekday })),
    createdAtUtc: normalizeToUtcDate(habit.createdAt, timeZone),
  }));

  const habitIds = habits.map((habit) => habit.id);
  const streakCompletions =
    habitIds.length > 0
      ? await prisma.habitCompletion.findMany({
          where: { habitId: { in: habitIds }, habit: { userId: session.user.id } },
          select: { habitId: true, date: true },
        })
      : [];
  const completionByHabit = new Map<string, Date[]>();
  for (const completion of streakCompletions) {
    const dates = completionByHabit.get(completion.habitId) ?? [];
    dates.push(completion.date);
    completionByHabit.set(completion.habitId, dates);
  }

  const streakItems = habits.map((habit) => {
    const summary = calculateStreaks({
      schedule: habit.weekdays.map((weekday) => ({ weekday })),
      completions: completionByHabit.get(habit.id) ?? [],
      asOf: now,
      timeZone,
    });

    return {
      habitId: habit.id,
      title: habit.title,
      current: summary.current,
      longest: summary.longest,
    };
  });
  const hasCompletions = streakCompletions.length > 0;

  const insightsSummary = proEntitlement.isPro
    ? await getInsightsSummary({
        prisma,
        userId: session.user.id,
        timeZone,
        now,
      })
    : null;

  const firstWeek = monthGrid.weeks[0];
  const lastWeek = monthGrid.weeks[monthGrid.weeks.length - 1];
  const gridStart = firstWeek?.[0]?.date ?? null;
  const gridEnd = lastWeek?.[6]?.date ?? null;
  const rangeCompletions =
    gridStart && gridEnd
      ? await listCompletionsInRange({
          prisma,
          userId: session.user.id,
          start: gridStart,
          end: gridEnd,
        })
      : [];
  const completionMap = new Map<string, Set<string>>();

  for (const completion of rangeCompletions) {
    const entry = completionMap.get(completion.date) ?? new Set<string>();
    entry.add(completion.habitId);
    completionMap.set(completion.date, entry);
  }

  const selectedDate = requestedDate
    ? toUtcDateFromParts(requestedDate)
    : !hasDateParam && isCurrentMonth
      ? today
      : null;
  const selectedKey = selectedDate ? toUtcDateKey(selectedDate) : null;
  const selectedLabel = selectedDate
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(selectedDate)
    : null;
  const selectedHabits = selectedDate
    ? habits.filter((habit) => {
        const createdAtUtc = normalizeToUtcDate(habit.createdAt, timeZone);
        if (selectedDate < createdAtUtc) return false;
        return isHabitActiveOnDate(
          habit.weekdays.map((weekday) => ({ weekday })),
          selectedDate,
          timeZone,
        );
      })
    : [];
  const selectedCompletions = selectedDate
    ? await listCompletionsForDate({ prisma, userId: session.user.id, date: selectedDate })
    : [];
  const selectedCompletedIds = new Set(selectedCompletions.map((completion) => completion.habitId));
  const isFuture = selectedDate ? selectedDate.getTime() > today.getTime() : false;

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const monthParam = formatMonthParam(year, month);
  const weeks = monthGrid.weeks.map((week) =>
    week.map((day) => {
      if (!day.inMonth) {
        return {
          key: day.key,
          day: day.day,
          inMonth: day.inMonth,
          isToday: day.key === todayKey,
          isSelected: !!selectedKey && day.key === selectedKey,
          hasHabits: false,
          completedCount: 0,
          totalCount: 0,
          label: dateFormatter.format(day.date),
          href: `/calendar?month=${monthParam}&date=${day.key}`,
        };
      }

      const activeHabits = habitSchedules.filter(({ schedule, createdAtUtc }) => {
        if (day.date < createdAtUtc) return false;
        return isHabitActiveOnDate(schedule, day.date, timeZone);
      });
      const activeHabitIds = new Set(activeHabits.map(({ habit }) => habit.id));
      const completed = completionMap.get(day.key);
      let completedCount = 0;
      if (completed) {
        for (const habitId of completed) {
          if (activeHabitIds.has(habitId)) {
            completedCount += 1;
          }
        }
      }

      return {
        key: day.key,
        day: day.day,
        inMonth: day.inMonth,
        isToday: day.key === todayKey,
        isSelected: !!selectedKey && day.key === selectedKey,
        hasHabits: activeHabitIds.size > 0,
        completedCount,
        totalCount: activeHabitIds.size,
        label: dateFormatter.format(day.date),
        href: `/calendar?month=${monthParam}&date=${day.key}`,
      };
    }),
  );

  const monthDate = toUtcDateFromParts({ year, month, day: 1 });
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(monthDate);
  const streakAsOfLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(today);

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const prevHref = `/calendar?month=${formatMonthParam(prev.year, prev.month)}`;
  const nextHref = `/calendar?month=${formatMonthParam(next.year, next.month)}`;

  return (
    <AppShell title="Calendar" subtitle="Track your habits day by day.">
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-6 lg:flex-1">
            <CalendarMonth
              monthLabel={monthLabel}
              weekStart={user.weekStart}
              weeks={weeks}
              prevHref={prevHref}
              nextHref={nextHref}
            />

            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white"
                  aria-hidden="true"
                />
                Active habit day
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3 w-3 border border-black dark:border-white"
                  aria-hidden="true"
                />
                Today
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3 w-3 border-2 border-black dark:border-white"
                  aria-hidden="true"
                />
                Selected day
              </span>
            </div>

            {proEntitlement.isPro && insightsSummary ? (
              <InsightsSnapshotCard summary={insightsSummary} />
            ) : (
              <InsightsUpgradeCard />
            )}
          </div>

          <aside className="lg:w-80">
            <div className="space-y-6">
              <StreakSummaryPanel
                items={streakItems}
                hasHabits={habits.length > 0}
                hasCompletions={hasCompletions}
                asOfLabel={streakAsOfLabel}
              />
              <div className="hidden lg:block">
                <DailyCompletionPanel
                  selectedDateKey={selectedKey}
                  selectedLabel={selectedLabel}
                  habits={selectedHabits}
                  initialCompletedHabitIds={Array.from(selectedCompletedIds)}
                  isFuture={isFuture}
                />
              </div>
            </div>
          </aside>
        </div>
        <MobileDailySheet
          selectedDateKey={selectedKey}
          selectedLabel={selectedLabel}
          habits={selectedHabits}
          initialCompletedHabitIds={Array.from(selectedCompletedIds)}
          autoOpen={hasDateParam}
          isFuture={isFuture}
        />
      </div>
    </AppShell>
  );
}
