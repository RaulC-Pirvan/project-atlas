import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listAdminSupportTickets } from '../../../../lib/admin/support';
import { asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { adminSupportTicketStatusSchema } from '../../../../lib/api/support/validation';
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
    { route: '/api/admin/support' },
    async () => {
      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      const { searchParams } = new URL(request.url);
      const cursor = searchParams.get('cursor');
      const limit = parseLimit(searchParams.get('limit'));
      const rawStatus = searchParams.get('status');
      const parsedStatus = rawStatus ? adminSupportTicketStatusSchema.safeParse(rawStatus) : null;
      const status = parsedStatus?.success ? parsedStatus.data : null;

      const result = await listAdminSupportTickets({
        prisma,
        cursor,
        take: limit,
        status,
      });

      return jsonOk(result);
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
