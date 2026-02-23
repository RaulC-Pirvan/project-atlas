import { ProUpgradePage } from '../../components/pro/ProUpgradePage';
import {
  logProConversionEvent,
  logProConversionGuardrail,
  parseProCtaSourceWithReason,
} from '../../lib/analytics/proConversion';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

type SearchParams = {
  source?: string | string[];
};

function parseSourceParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

export const dynamic = 'force-dynamic';

export default async function ProPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;

  const proEntitlement =
    userId === null
      ? { isPro: false }
      : await getProEntitlementSummary({
          prisma,
          userId,
        });

  const resolvedSearchParams = await searchParams;
  const parsedSource = parseProCtaSourceWithReason(parseSourceParam(resolvedSearchParams?.source));
  const source = parsedSource.source;

  if (parsedSource.reason === 'invalid') {
    logProConversionGuardrail({
      reason: 'invalid_source_fallback',
      surface: '/pro',
      authenticated: Boolean(userId),
      userId,
      source,
      rawSource: parsedSource.raw,
    });
  }

  logProConversionEvent({
    event: 'pro_page_view',
    surface: '/pro',
    authenticated: Boolean(userId),
    userId,
    source,
    isPro: proEntitlement.isPro,
  });

  return <ProUpgradePage isAuthenticated={Boolean(userId)} isPro={proEntitlement.isPro} />;
}
