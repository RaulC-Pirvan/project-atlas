import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import {
  createUserDataExportAuditFailure,
  createUserDataExportAuditSuccess,
} from '../../../../../lib/account/exports/audit';
import { buildUserDataExportFilename } from '../../../../../lib/account/exports/filename';
import { getUserDataExportPayload } from '../../../../../lib/account/exports/payload';
import {
  ACCOUNT_EXPORT_RATE_LIMIT,
  getAccountExportRateLimitKey,
  shouldBypassAccountExportRateLimit,
} from '../../../../../lib/account/exports/rateLimit';
import { summarizeUserDataExportRecordCounts } from '../../../../../lib/account/exports/recordCounts';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { prisma } from '../../../../../lib/db/prisma';
import { applyRateLimitHeaders, consumeRateLimit } from '../../../../../lib/http/rateLimit';
import { getRequestId, withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/exports/self' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const userId = session.user.id;
      const requestId = getRequestId(request);
      const requestedAt = new Date();

      try {
        if (!shouldBypassAccountExportRateLimit()) {
          const rateLimitDecision = consumeRateLimit(
            getAccountExportRateLimitKey(userId),
            ACCOUNT_EXPORT_RATE_LIMIT,
          );

          if (rateLimitDecision.limited) {
            await createUserDataExportAuditFailure({
              prisma,
              userId,
              requestedAt,
              requestId,
              errorCode: 'rate_limited',
            });

            const response = jsonError(
              new ApiError(
                'rate_limited',
                'Too many requests. Try again later.',
                429,
                'retry_later',
              ),
            );
            applyRateLimitHeaders(response.headers, rateLimitDecision);
            return response;
          }
        }

        const payload = await getUserDataExportPayload({
          prisma,
          userId,
        });
        const filename = buildUserDataExportFilename();
        const recordCounts = summarizeUserDataExportRecordCounts(payload);

        await createUserDataExportAuditSuccess({
          prisma,
          userId,
          requestedAt,
          requestId,
          recordCounts,
        });

        return new NextResponse(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        });
      } catch (error) {
        const apiError = asApiError(error);

        try {
          await createUserDataExportAuditFailure({
            prisma,
            userId,
            requestedAt,
            requestId,
            errorCode: apiError.code,
          });
        } catch {
          // Best effort only; preserve original API failure semantics.
        }

        throw apiError;
      }
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
