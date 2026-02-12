import { redirect } from 'next/navigation';

import { HabitsPanel } from '../../components/habits/HabitsPanel';
import { AppShell } from '../../components/layout/AppShell';
import { listHabits } from '../../lib/api/habits/habits';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';

export default async function HabitsPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weekStart: true, timezone: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const habits = await listHabits({
    prisma,
    userId: session.user.id,
    includeArchived: false,
  });

  return (
    <AppShell title="Habits" subtitle="Build routines that stay with you.">
      <HabitsPanel
        initialHabits={habits}
        weekStart={user.weekStart}
        timezoneLabel={user.timezone}
      />
    </AppShell>
  );
}
