import { SupportCenter } from '../../components/support/SupportCenter';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function SupportPage() {
  const session = await getServerAuthSession();
  const initialName = session?.user?.name ?? '';
  const initialEmail = session?.user?.email ?? '';

  return (
    <SupportCenter
      initialName={initialName}
      initialEmail={initialEmail}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
