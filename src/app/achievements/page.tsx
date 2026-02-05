import { redirect } from 'next/navigation';

import { AchievementsDashboard } from '../../components/achievements/AchievementsDashboard';
import { AchievementsUpgradeCard } from '../../components/achievements/AchievementsUpgradeCard';
import { AppShell } from '../../components/layout/AppShell';
import { getAchievementsSummary } from '../../lib/api/achievements/summary';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

export default async function AchievementsPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  const summary = await getAchievementsSummary({
    prisma,
    userId: session.user.id,
    timeZone: user.timezone ?? 'UTC',
  });

  return (
    <AppShell
      title="Achievements"
      subtitle="A minimalist trophy cabinet for your habit milestones."
    >
      <div className="space-y-8">
        {proEntitlement.isPro ? null : <AchievementsUpgradeCard />}
        <AchievementsDashboard summary={summary} isPro={proEntitlement.isPro} />
      </div>
    </AppShell>
  );
}
