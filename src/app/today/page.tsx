import { redirect } from 'next/navigation';

import { DailyCompletionPanel } from '../../components/calendar/DailyCompletionPanel';
import { AppShell } from '../../components/layout/AppShell';
import { listCompletionsForDate } from '../../lib/api/habits/completions';
import { listHabits } from '../../lib/api/habits/habits';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import { normalizeToUtcDate, toUtcDateKey } from '../../lib/habits/dates';
import { isHabitActiveOnDate } from '../../lib/habits/schedule';

export default async function TodayPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true, keepCompletedAtBottom: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const timeZone = user.timezone || 'UTC';
  const now = new Date();
  const today = normalizeToUtcDate(now, timeZone);
  const todayKey = toUtcDateKey(today);

  const habits = await listHabits({ prisma, userId: session.user.id, includeArchived: false });
  const todayHabits = habits.filter((habit) => {
    const createdAtUtc = normalizeToUtcDate(habit.createdAt, timeZone);
    if (today < createdAtUtc) return false;
    return isHabitActiveOnDate(
      habit.weekdays.map((weekday) => ({ weekday })),
      today,
      timeZone,
    );
  });

  const completions = await listCompletionsForDate({
    prisma,
    userId: session.user.id,
    date: today,
  });
  const completedIds = new Set(completions.map((completion) => completion.habitId));

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(today);

  return (
    <AppShell title="Today" subtitle="Stay focused on the habits due right now.">
      <DailyCompletionPanel
        contextLabel="Today"
        selectedDateKey={todayKey}
        selectedLabel={todayLabel}
        habits={todayHabits}
        initialCompletedHabitIds={Array.from(completedIds)}
        completionWindowLockReason={null}
        timeZone={timeZone}
        keepCompletedAtBottom={user.keepCompletedAtBottom}
      />
    </AppShell>
  );
}
