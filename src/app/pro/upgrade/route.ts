import { getServerSession } from 'next-auth/next';

import {
  buildProIntentPath,
  logProConversionEvent,
  parseProCtaSource,
} from '../../../lib/analytics/proConversion';
import { authOptions } from '../../../lib/auth/nextauth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = parseProCtaSource(searchParams.get('source'));
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  logProConversionEvent({
    event: 'pro_cta_click',
    surface: '/pro/upgrade',
    authenticated: Boolean(userId),
    userId,
    source,
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
