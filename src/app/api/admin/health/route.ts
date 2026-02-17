import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/admin/health' },
    async () => {
      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      return jsonOk({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
