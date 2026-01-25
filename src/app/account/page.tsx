import { redirect } from 'next/navigation';

import { AccountPanel } from '../../components/auth/AccountPanel';
import { AuthShell } from '../../components/auth/AuthShell';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function AccountPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <AuthShell title="Account" subtitle="Manage your profile and security.">
      <AccountPanel
        email={session.user.email ?? ''}
        emailVerifiedAt={session.user.emailVerifiedAt ?? null}
      />
    </AuthShell>
  );
}
