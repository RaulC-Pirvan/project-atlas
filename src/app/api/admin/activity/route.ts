import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { getAdminLogSnapshot } from '../../../../lib/observability/adminLogStore';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

function parseLimit(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/admin/activity' },
    async () => {
      const session = await getServerSession(authOptions);
      requireAdminSession(session);

      const { searchParams } = new URL(request.url);
      const limit = parseLimit(searchParams.get('limit')) ?? 50;

      const entries = getAdminLogSnapshot(limit);

      return jsonOk({ entries });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
