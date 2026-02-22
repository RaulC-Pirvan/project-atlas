import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { buildBillingCommandDedupeKey } from '../../../../../lib/billing/idempotency';
import { createStripeCheckoutSession } from '../../../../../lib/billing/stripe/checkout';
import { getStripeCheckoutConfig } from '../../../../../lib/billing/stripe/config';
import { prisma } from '../../../../../lib/db/prisma';
import { getRequestId, withApiLogging } from '../../../../../lib/observability/apiLogger';
import { getProEntitlementSummary } from '../../../../../lib/pro/entitlement';

export const runtime = 'nodejs';

function isMissingStripeCheckoutConfigError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.startsWith('Missing required env:') ||
      error.message.startsWith('Invalid env: APP_URL/NEXT_PUBLIC_APP_URL/NEXTAUTH_URL'))
  );
}

async function startCheckout(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiError('unauthorized', 'Not authenticated.', 401);
  }

  const entitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });
  if (entitlement.isPro) {
    throw new ApiError('invalid_request', 'Pro is already active.', 400, 'none');
  }

  let config: ReturnType<typeof getStripeCheckoutConfig>;
  try {
    config = getStripeCheckoutConfig();
  } catch (error) {
    if (isMissingStripeCheckoutConfigError(error)) {
      throw new ApiError(
        'internal_error',
        'Checkout is temporarily unavailable. Please try again later.',
        503,
        'retry_later',
      );
    }
    throw error;
  }

  await prisma.billingProductMapping.upsert({
    where: {
      provider_providerProductId: {
        provider: 'stripe',
        providerProductId: config.proLifetimePriceId,
      },
    },
    update: {
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      active: true,
    },
    create: {
      provider: 'stripe',
      providerProductId: config.proLifetimePriceId,
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      active: true,
    },
  });

  const requestId = getRequestId(request);
  const idempotencyKey = buildBillingCommandDedupeKey(`checkout:${session.user.id}:${requestId}`);
  const checkout = await createStripeCheckoutSession({
    secretKey: config.secretKey,
    priceId: config.proLifetimePriceId,
    appUrl: config.appUrl,
    userId: session.user.id,
    productKey: 'pro_lifetime_v1',
    idempotencyKey,
  });

  return Response.redirect(checkout.url, 303);
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/billing/stripe/checkout' },
    async () => startCheckout(request),
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
