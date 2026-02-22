import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { getStripePortalConfig } from '../../../../../lib/billing/stripe/config';
import { createStripeBillingPortalSession } from '../../../../../lib/billing/stripe/portal';
import { findLatestStripeCompletedCheckout } from '../../../../../lib/billing/stripe/restore';
import { prisma } from '../../../../../lib/db/prisma';
import { getRequestId, withApiLogging } from '../../../../../lib/observability/apiLogger';
import { logInfo } from '../../../../../lib/observability/logger';

export const runtime = 'nodejs';

function isMissingStripePortalConfigError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.startsWith('Missing required env:') ||
      error.message.startsWith('Invalid env: APP_URL/NEXT_PUBLIC_APP_URL/NEXTAUTH_URL'))
  );
}

async function resolveStripeCustomerId(args: {
  userId: string;
  secretKey: string;
}): Promise<string | null> {
  const projection = await prisma.billingEntitlementProjection.findUnique({
    where: {
      userId_productKey: {
        userId: args.userId,
        productKey: 'pro_lifetime_v1',
      },
    },
    select: {
      provider: true,
      providerCustomerId: true,
    },
  });

  if (projection?.provider === 'stripe' && projection.providerCustomerId) {
    return projection.providerCustomerId;
  }

  const latestCheckout = await findLatestStripeCompletedCheckout({
    secretKey: args.secretKey,
    userId: args.userId,
    productKey: 'pro_lifetime_v1',
  });

  if (!latestCheckout?.customerId) {
    return null;
  }

  if (projection) {
    await prisma.billingEntitlementProjection.update({
      where: {
        userId_productKey: {
          userId: args.userId,
          productKey: 'pro_lifetime_v1',
        },
      },
      data: {
        providerCustomerId: latestCheckout.customerId,
      },
    });
  }

  return latestCheckout.customerId;
}

async function startStripePortal(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiError('unauthorized', 'Not authenticated.', 401);
  }

  let config: ReturnType<typeof getStripePortalConfig>;
  try {
    config = getStripePortalConfig();
  } catch (error) {
    if (isMissingStripePortalConfigError(error)) {
      throw new ApiError(
        'internal_error',
        'Billing portal is temporarily unavailable. Please try again later.',
        503,
        'retry_later',
      );
    }
    throw error;
  }

  const customerId = await resolveStripeCustomerId({
    userId: session.user.id,
    secretKey: config.secretKey,
  });
  if (!customerId) {
    throw new ApiError(
      'not_found',
      'No Stripe billing history was found for this account yet.',
      404,
      'none',
    );
  }

  const portalSession = await createStripeBillingPortalSession({
    secretKey: config.secretKey,
    customerId,
    returnUrl: `${config.appUrl}/account`,
    configurationId: config.portalConfigurationId,
  });

  logInfo('billing.portal.redirect', {
    requestId: getRequestId(request),
    route: '/api/billing/stripe/portal',
    provider: 'stripe',
    userId: session.user.id,
    customerId,
    portalSessionId: portalSession.id,
  });

  return Response.redirect(portalSession.url, 303);
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/billing/stripe/portal' },
    async () => startStripePortal(request),
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
