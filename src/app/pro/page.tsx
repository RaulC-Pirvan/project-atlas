import { redirect } from 'next/navigation';

import { parseStripeCheckoutQueryStatus } from '../../lib/billing/stripe/contracts';

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
  const resolvedSearchParams = await searchParams;
  const checkoutStatus = parseStripeCheckoutQueryStatus(
    parseSearchParamValue(resolvedSearchParams?.checkout),
  );
  const checkoutSessionId = parseCheckoutSessionId(resolvedSearchParams?.checkout_session_id);
  const redirectParams = new URLSearchParams();
  if (checkoutStatus) {
    redirectParams.set('checkout', checkoutStatus);
  }
  if (checkoutSessionId) {
    redirectParams.set('checkout_session_id', checkoutSessionId);
  }
  redirect(redirectParams.size > 0 ? `/account?${redirectParams.toString()}` : '/account');
}
