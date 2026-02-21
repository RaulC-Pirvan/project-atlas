import { redirect } from 'next/navigation';

import { AppShell } from '../../components/layout/AppShell';
import { ProFeatureHubCard } from '../../components/pro/ProFeatureHubCard';
import { ProManageCard } from '../../components/pro/ProManageCard';
import { ProPlanCard } from '../../components/pro/ProPlanCard';
import { ProRoadmapCard } from '../../components/pro/ProRoadmapCard';
import { ProValueCard } from '../../components/pro/ProValueCard';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

export default async function ProPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  return (
    <AppShell
      title="Atlas Pro"
      subtitle="Manage your plan, unlock features, and keep billing simple."
    >
      <div className="space-y-8">
        <ProValueCard isPro={proEntitlement.isPro} />
        <ProPlanCard isPro={proEntitlement.isPro} source={proEntitlement.source} />
        <ProFeatureHubCard isPro={proEntitlement.isPro} />
        <div className="grid gap-8 lg:grid-cols-2">
          <ProManageCard isPro={proEntitlement.isPro} />
          <ProRoadmapCard isPro={proEntitlement.isPro} />
        </div>
      </div>
    </AppShell>
  );
}
