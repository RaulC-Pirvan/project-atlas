import { redirect } from 'next/navigation';

import { AuthShell } from '../../components/auth/AuthShell';
import { HabitsPanel } from '../../components/habits/HabitsPanel';
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
    select: { weekStart: true },
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
    <AuthShell title="Habits" subtitle="Build routines that stay with you.">
      <HabitsPanel initialHabits={habits} weekStart={user.weekStart} />
    </AuthShell>
  );
}
