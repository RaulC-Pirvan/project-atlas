import { redirect } from 'next/navigation';

import { AppShell } from '../../components/layout/AppShell';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function CalendarPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return (
    <AppShell title="Calendar" subtitle="Placeholder until the calendar view ships.">
      <div className="space-y-3 text-sm text-black/60">
        <p>The calendar view is next on the roadmap.</p>
        <p>For now, manage your habits and schedules from the Habits page.</p>
      </div>
    </AppShell>
  );
}
