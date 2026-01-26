import { redirect } from 'next/navigation';

import { AccountPanel } from '../../components/auth/AccountPanel';
import { AppShell } from '../../components/layout/AppShell';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function AccountPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <AppShell title="Account" subtitle="Manage your profile and security.">
      <AccountPanel
        email={session.user.email ?? ''}
        displayName={session.user.name ?? session.user.email ?? 'User'}
      />
    </AppShell>
  );
}
