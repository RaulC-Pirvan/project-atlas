import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

function assertTestMode() {
  if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    throw new ApiError('not_found', 'Not found.', 404);
  }
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/pro/debug/grant' },
    async () => {
      assertTestMode();
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const entitlement = await prisma.proEntitlement.upsert({
        where: { userId: session.user.id },
        update: { status: 'active', source: 'manual', restoredAt: null },
        create: { userId: session.user.id, status: 'active', source: 'manual' },
        select: { status: true, source: true, restoredAt: true, updatedAt: true },
      });

      const now = new Date();
      await prisma.billingEntitlementProjection.upsert({
        where: {
          userId_productKey: {
            userId: session.user.id,
            productKey: 'pro_lifetime_v1',
          },
        },
        update: {
          planType: 'one_time',
          status: 'active',
          provider: 'manual',
          activeFrom: entitlement.restoredAt ?? now,
          activeUntil: null,
          periodStart: null,
          periodEnd: null,
          autoRenew: null,
          lastEventId: `debug:grant:${session.user.id}:${now.getTime()}`,
          lastEventType: 'entitlement_granted',
          version: { increment: 1 },
          updatedAt: now,
        },
        create: {
          userId: session.user.id,
          productKey: 'pro_lifetime_v1',
          planType: 'one_time',
          status: 'active',
          provider: 'manual',
          activeFrom: entitlement.restoredAt ?? now,
          activeUntil: null,
          periodStart: null,
          periodEnd: null,
          autoRenew: null,
          lastEventId: `debug:grant:${session.user.id}:${now.getTime()}`,
          lastEventType: 'entitlement_granted',
          version: 1,
          updatedAt: now,
        },
      });

      return jsonOk({
        isPro: entitlement.status === 'active',
        status: entitlement.status,
        source: entitlement.source,
        restoredAt: entitlement.restoredAt ? entitlement.restoredAt.toISOString() : null,
        updatedAt: entitlement.updatedAt.toISOString(),
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
