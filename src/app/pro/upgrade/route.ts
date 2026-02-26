import { getServerSession } from 'next-auth/next';

import {
  buildProIntentPath,
  logProConversionEvent,
  logProConversionGuardrail,
  parseProCtaSourceWithReason,
} from '../../../lib/analytics/proConversion';
import { authOptions } from '../../../lib/auth/nextauth';
import { getRequestId } from '../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = getRequestId(request);
  const parsedSource = parseProCtaSourceWithReason(searchParams.get('source'));
  const source = parsedSource.source;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (parsedSource.reason === 'invalid') {
    logProConversionGuardrail({
      reason: 'invalid_source_fallback',
      surface: '/pro/upgrade',
      authenticated: Boolean(userId),
      userId,
      source,
      rawSource: parsedSource.raw,
      requestId,
    });
  }

  logProConversionEvent({
    event: 'pro_cta_click',
    surface: '/pro/upgrade',
    authenticated: Boolean(userId),
    userId,
    source,
    requestId,
  });

  if (userId) {
    const checkoutUrl = new URL('/api/billing/stripe/checkout', request.url);
    checkoutUrl.searchParams.set('source', source);
    return Response.redirect(checkoutUrl, 303);
  }

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('from', buildProIntentPath(source));
  signInUrl.searchParams.set('intent', 'pro_upgrade');
  signInUrl.searchParams.set('source', source);

  return Response.redirect(signInUrl, 303);
}
