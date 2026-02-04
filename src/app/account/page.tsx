import { redirect } from 'next/navigation';

import { AccountPanel } from '../../components/auth/AccountPanel';
import { AppShell } from '../../components/layout/AppShell';
import { ProAccountCard } from '../../components/pro/ProAccountCard';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

export default async function AccountPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weekStart: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  return (
    <AppShell title="Account" subtitle="Manage your profile and security.">
      <div className="space-y-10">
        <ProAccountCard isPro={proEntitlement.isPro} />
        <AccountPanel
          email={session.user.email ?? ''}
          displayName={session.user.name ?? session.user.email ?? 'User'}
          weekStart={user.weekStart}
        />
      </div>
    </AppShell>
  );
}
