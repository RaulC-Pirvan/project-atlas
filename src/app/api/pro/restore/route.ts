import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import type { ProRestoreRequest, ProRestoreResponse } from '../../../../lib/billing/contracts';
import type { BillingPersistenceClient } from '../../../../lib/billing/persistence';
import { appendBillingEventAndProject } from '../../../../lib/billing/persistence';
import { getStripePortalConfig } from '../../../../lib/billing/stripe/config';
import { findLatestStripeCompletedCheckout } from '../../../../lib/billing/stripe/restore';
import { prisma } from '../../../../lib/db/prisma';
import { getRequestId, withApiLogging } from '../../../../lib/observability/apiLogger';
import { logInfo } from '../../../../lib/observability/logger';
import { getProEntitlementSummary } from '../../../../lib/pro/entitlement';

export const runtime = 'nodejs';

function isMissingStripeRestoreConfigError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.startsWith('Missing required env:') ||
      error.message.startsWith('Invalid env: APP_URL/NEXT_PUBLIC_APP_URL/NEXTAUTH_URL'))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

type RestoreCheckoutLookup = Awaited<ReturnType<typeof findLatestStripeCompletedCheckout>>;

async function findLatestStripeCompletedCheckoutForTestMode(
  userId: string,
): Promise<RestoreCheckoutLookup> {
  const latestPurchase = await prisma.billingEventLedger.findFirst({
    where: {
      userId,
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      eventType: 'purchase_succeeded',
    },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      providerEventId: true,
      providerTransactionId: true,
      occurredAt: true,
      payload: true,
    },
  });

  if (!latestPurchase) {
    return null;
  }

  const payload = isRecord(latestPurchase.payload) ? latestPurchase.payload : {};
  const projection = await prisma.billingEntitlementProjection.findUnique({
    where: {
      userId_productKey: {
        userId,
        productKey: 'pro_lifetime_v1',
      },
    },
    select: {
      providerCustomerId: true,
    },
  });

  const rawProviderEventId = asString(latestPurchase.providerEventId);
  const checkoutSessionId =
    rawProviderEventId && rawProviderEventId.startsWith('checkout_session:')
      ? rawProviderEventId.replace('checkout_session:', '')
      : (rawProviderEventId ?? `test_restore_checkout_${latestPurchase.occurredAt.getTime()}`);

  return {
    checkoutSessionId,
    paymentIntentId: asString(latestPurchase.providerTransactionId),
    customerId: asString(payload.providerCustomerId) ?? projection?.providerCustomerId ?? null,
    amountTotal: asNumber(payload.amountCents),
    currency: asString(payload.currency)?.toUpperCase() ?? null,
    createdAt: latestPurchase.occurredAt,
  };
}

function parseRestoreRequest(value: unknown): ProRestoreRequest {
  if (!isRecord(value) || value.trigger !== 'account') {
    throw new ApiError('invalid_request', 'Invalid restore request.', 400, 'update_input');
  }

  return { trigger: 'account' };
}

function toRestoreResponse(args: {
  outcome: ProRestoreResponse['outcome'];
  summary: Awaited<ReturnType<typeof getProEntitlementSummary>>;
}): ProRestoreResponse {
  return {
    outcome: args.outcome,
    entitlement: {
      isPro: args.summary.isPro,
      status: args.summary.status,
      source: args.summary.source ?? null,
      updatedAt: (args.summary.updatedAt ?? new Date()).toISOString(),
    },
  };
}

async function restoreProEntitlement(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiError('unauthorized', 'Not authenticated.', 401);
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  parseRestoreRequest(body);

  const requestId = getRequestId(request);
  const initialSummary = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  if (initialSummary.isPro) {
    logInfo('billing.restore.already_active', {
      requestId,
      route: '/api/pro/restore',
      provider: 'stripe',
      userId: session.user.id,
    });
    return jsonOk(
      toRestoreResponse({
        outcome: 'already_active',
        summary: initialSummary,
      }),
    );
  }

  let config: ReturnType<typeof getStripePortalConfig>;
  try {
    config = getStripePortalConfig();
  } catch (error) {
    if (isMissingStripeRestoreConfigError(error)) {
      throw new ApiError(
        'internal_error',
        'Restore is temporarily unavailable. Please try again later.',
        503,
        'retry_later',
      );
    }
    throw error;
  }

  await appendBillingEventAndProject({
    prisma: prisma as unknown as BillingPersistenceClient,
    event: {
      eventId: `restore:req:${session.user.id}:${requestId}`,
      type: 'restore_requested',
      userId: session.user.id,
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt: new Date(),
      receivedAt: new Date(),
      providerEventId: null,
      providerTransactionId: null,
      idempotencyKey: null,
      payload: {
        requestOrigin: 'web',
        requestedAt: new Date(),
      },
    },
  });

  const latestCheckout =
    process.env.BILLING_STRIPE_TEST_MODE === 'true'
      ? await findLatestStripeCompletedCheckoutForTestMode(session.user.id)
      : await findLatestStripeCompletedCheckout({
          secretKey: config.secretKey,
          userId: session.user.id,
          productKey: 'pro_lifetime_v1',
        });

  if (!latestCheckout) {
    await appendBillingEventAndProject({
      prisma: prisma as unknown as BillingPersistenceClient,
      event: {
        eventId: `restore:failed:${session.user.id}:${requestId}`,
        type: 'restore_failed',
        userId: session.user.id,
        provider: 'stripe',
        productKey: 'pro_lifetime_v1',
        planType: 'one_time',
        occurredAt: new Date(),
        receivedAt: new Date(),
        providerEventId: null,
        providerTransactionId: null,
        idempotencyKey: null,
        payload: {
          requestOrigin: 'web',
          reasonCode: 'not_found',
        },
      },
    });

    const summary = await getProEntitlementSummary({
      prisma,
      userId: session.user.id,
    });
    logInfo('billing.restore.not_found', {
      requestId,
      route: '/api/pro/restore',
      provider: 'stripe',
      userId: session.user.id,
    });
    return jsonOk(
      toRestoreResponse({
        outcome: 'not_found',
        summary,
      }),
    );
  }

  const restoredAt = new Date();
  await appendBillingEventAndProject({
    prisma: prisma as unknown as BillingPersistenceClient,
    event: {
      eventId: `restore:success:${latestCheckout.checkoutSessionId}`,
      type: 'restore_succeeded',
      userId: session.user.id,
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt: latestCheckout.createdAt,
      receivedAt: restoredAt,
      providerEventId: `checkout_session:${latestCheckout.checkoutSessionId}`,
      providerTransactionId: latestCheckout.paymentIntentId ?? latestCheckout.checkoutSessionId,
      idempotencyKey: `restore:${session.user.id}:${latestCheckout.checkoutSessionId}`,
      payload: {
        requestOrigin: 'web',
        restoredTransactionId:
          latestCheckout.paymentIntentId ?? latestCheckout.checkoutSessionId ?? null,
        providerCustomerId: latestCheckout.customerId,
      },
    },
  });

  const summary = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  logInfo('billing.restore.restored', {
    requestId,
    route: '/api/pro/restore',
    provider: 'stripe',
    userId: session.user.id,
    checkoutSessionId: latestCheckout.checkoutSessionId,
    paymentIntentId: latestCheckout.paymentIntentId ?? undefined,
  });

  return jsonOk(
    toRestoreResponse({
      outcome: 'restored',
      summary,
    }),
  );
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/pro/restore' },
    async () => restoreProEntitlement(request),
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
