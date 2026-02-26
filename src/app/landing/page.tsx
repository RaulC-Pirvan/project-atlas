import { MarketingHome } from '../../components/marketing/MarketingHome';
import { logFunnelEvent } from '../../lib/analytics/funnel';
import { logLandingWalkthroughEvent } from '../../lib/analytics/landingWalkthrough';
import { getServerAuthSession } from '../../lib/auth/session';

export default async function LandingPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = Boolean(userId);

  logFunnelEvent({
    event: 'landing_page_view',
    surface: '/landing',
    authenticated: isAuthenticated,
    userId,
  });

  logLandingWalkthroughEvent({
    event: 'landing_walkthrough_view',
    surface: '/landing',
    authenticated: isAuthenticated,
    userId,
    source: 'walkthrough_primary',
  });

  return <MarketingHome isAuthenticated={isAuthenticated} />;
}
