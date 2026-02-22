import { redirect } from 'next/navigation';

import { AppShell } from '../../components/layout/AppShell';
import { ProFeatureHubCard } from '../../components/pro/ProFeatureHubCard';
import { ProManageCard } from '../../components/pro/ProManageCard';
import { ProPlanCard } from '../../components/pro/ProPlanCard';
import { ProRoadmapCard } from '../../components/pro/ProRoadmapCard';
import { ProValueCard } from '../../components/pro/ProValueCard';
import { getServerAuthSession } from '../../lib/auth/session';
import { parseStripeCheckoutQueryStatus } from '../../lib/billing/stripe/contracts';
import { prisma } from '../../lib/db/prisma';
import { logInfo } from '../../lib/observability/logger';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

type SearchParams = {
  checkout?: string | string[];
  checkout_session_id?: string | string[];
};

function parseSearchParamValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCheckoutSessionId(value: string | string[] | undefined): string | null {
  const raw = parseSearchParamValue(value);
  if (!raw) return null;
  if (raw.length > 255) return null;
  return raw;
}

export default async function ProPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const resolvedSearchParams = await searchParams;
  const checkoutStatus = parseStripeCheckoutQueryStatus(
    parseSearchParamValue(resolvedSearchParams?.checkout),
  );
  const checkoutSessionId = parseCheckoutSessionId(resolvedSearchParams?.checkout_session_id);

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  if (checkoutStatus) {
    logInfo('billing.checkout.return', {
      route: '/pro',
      userId: session.user.id,
      checkoutStatus,
      checkoutSessionId: checkoutSessionId ?? undefined,
      isPro: proEntitlement.isPro,
    });
  }

  return (
    <AppShell
      title="Atlas Pro"
      subtitle="Manage your plan, unlock features, and keep billing simple."
    >
      <div className="space-y-8">
        <ProValueCard isPro={proEntitlement.isPro} />
        <ProPlanCard
          isPro={proEntitlement.isPro}
          source={proEntitlement.source}
          checkoutStatus={checkoutStatus}
        />
        <ProFeatureHubCard isPro={proEntitlement.isPro} />
        <div className="grid gap-8 lg:grid-cols-2">
          <ProManageCard isPro={proEntitlement.isPro} />
          <ProRoadmapCard isPro={proEntitlement.isPro} />
        </div>
      </div>
    </AppShell>
  );
}
