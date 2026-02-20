import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { buildUserDataExportFilename } from '../../../../../lib/account/exports/filename';
import { getUserDataExportPayload } from '../../../../../lib/account/exports/payload';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

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

      const payload = await getUserDataExportPayload({
        prisma,
        userId: session.user.id,
      });
      const filename = buildUserDataExportFilename();

      return new NextResponse(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
