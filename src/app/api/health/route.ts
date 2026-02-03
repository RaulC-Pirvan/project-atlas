import { jsonOk } from '../../../lib/api/response';
import { withApiLogging } from '../../../lib/observability/apiLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withApiLogging(request, { route: '/api/health' }, async () => {
    return jsonOk({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });
}
