import { redirect } from 'next/navigation';

import { AppShell } from '../../components/layout/AppShell';
import { ProAccountCard } from '../../components/pro/ProAccountCard';
import { ProPreviewCard } from '../../components/pro/ProPreviewCard';
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
    <AppShell title="Atlas Pro" subtitle="More insight, more motivation, no extra friction.">
      <div className="space-y-8">
        <ProAccountCard isPro={proEntitlement.isPro} />
        <ProPreviewCard isPro={proEntitlement.isPro} />
      </div>
    </AppShell>
  );
}
