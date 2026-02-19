import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listAdminHabits } from '../../../../lib/admin/habits';
import { asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';
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
    { route: '/api/admin/habits' },
    async () => {
      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const cursor = searchParams.get('cursor');
      const limit = parseLimit(searchParams.get('limit'));
      const status = searchParams.get('status');

      const result = await listAdminHabits({
        prisma,
        search,
        cursor,
        take: limit,
        status: status === null ? undefined : status,
      });

      return jsonOk(result);
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
