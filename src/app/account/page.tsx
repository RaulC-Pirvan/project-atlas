import Link from 'next/link';

import { AccountPanel } from '../../components/auth/AccountPanel';
import { AuthShell } from '../../components/auth/AuthShell';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function AccountPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return (
      <AuthShell
        title="Account"
        subtitle="You need an active session to view this page."
        footer={
          <p className="text-center text-sm text-black/60">
            <Link className="text-black underline underline-offset-4" href="/sign-in">
              Sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-black/70">Please sign in to continue.</p>
      </AuthShell>
    );
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
