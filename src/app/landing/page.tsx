import { MarketingHome } from '../../components/marketing/MarketingHome';
import { logLandingWalkthroughEvent } from '../../lib/analytics/landingWalkthrough';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function LandingPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = Boolean(userId);

  logLandingWalkthroughEvent({
    event: 'landing_walkthrough_view',
    surface: '/landing',
    authenticated: isAuthenticated,
    userId,
    source: 'walkthrough_primary',
  });

  return <MarketingHome isAuthenticated={isAuthenticated} />;
}
