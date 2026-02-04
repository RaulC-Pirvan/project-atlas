import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';
import { withApiLogging } from '../../../../lib/observability/apiLogger';
import { getProEntitlementSummary } from '../../../../lib/pro/entitlement';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/pro/entitlement' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const summary = await getProEntitlementSummary({
        prisma,
        userId: session.user.id,
      });

      return jsonOk({
        isPro: summary.isPro,
        status: summary.status,
        source: summary.source ?? null,
        restoredAt: summary.restoredAt ? summary.restoredAt.toISOString() : null,
        updatedAt: summary.updatedAt ? summary.updatedAt.toISOString() : null,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
