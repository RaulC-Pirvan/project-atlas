import { MarketingHome } from '../../components/marketing/MarketingHome';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function LandingPage() {
  const session = await getServerAuthSession();

  return <MarketingHome isAuthenticated={Boolean(session?.user?.id)} />;
}
