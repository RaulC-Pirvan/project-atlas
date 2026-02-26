import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../lib/admin/auth';
import {
  buildConversionSummary,
  parseConversionSummaryRange,
} from '../../../../lib/admin/conversion';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { getAdminLogSnapshot } from '../../../../lib/observability/adminLogStore';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

function parseCompareFlag(value: string | null): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new ApiError('invalid_request', 'Invalid compare flag.', 400);
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/admin/conversion' },
    async () => {
      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      const { searchParams } = new URL(request.url);
      const compareWithBaseline = parseCompareFlag(searchParams.get('compare'));

      let rangeStart: Date;
      let rangeEnd: Date;
      try {
        const parsed = parseConversionSummaryRange({
          start: searchParams.get('start'),
          end: searchParams.get('end'),
        });
        rangeStart = parsed.rangeStart;
        rangeEnd = parsed.rangeEnd;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid date range.';
        throw new ApiError('invalid_request', message, 400);
      }

      const entries = getAdminLogSnapshot(200);
      const summary = buildConversionSummary({
        entries,
        rangeStart,
        rangeEnd,
        compareWithBaseline,
      });

      return jsonOk({ summary });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
