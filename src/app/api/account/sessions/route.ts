import { getServerSession } from 'next-auth/next';

import { manageSessionsSchema } from '../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { readSessionTokenFromCookieHeader } from '../../../../lib/auth/sessionConfig';
import { clearAuthCookies } from '../../../../lib/auth/sessionCookies';
import { listActiveUserSessions, revokeAllUserSessions } from '../../../../lib/auth/sessionManagement';
import { prisma } from '../../../../lib/db/prisma';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/sessions' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const currentSessionToken = readSessionTokenFromCookieHeader(request.headers.get('cookie'));
      const sessions = await listActiveUserSessions({
        prisma,
        userId,
      });

      return jsonOk({
        sessions: sessions.map((record) => ({
          id: record.id,
          createdAt: record.createdAt.toISOString(),
          lastActiveAt: record.lastActiveAt.toISOString(),
          expiresAt: record.expires.toISOString(),
          ipAddress: record.ipAddress,
          userAgent: record.userAgent,
          isCurrent: currentSessionToken ? record.sessionToken === currentSessionToken : false,
        })),
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}

export async function DELETE(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/sessions' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = manageSessionsSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const currentSessionToken = readSessionTokenFromCookieHeader(request.headers.get('cookie'));
      if (parsed.data.scope === 'others' && !currentSessionToken) {
        throw new ApiError('unauthorized', 'Current session not found.', 401);
      }

      const result = await revokeAllUserSessions({
        prisma,
        userId,
        exceptSessionToken: parsed.data.scope === 'others' ? currentSessionToken : null,
      });

      const response = jsonOk({
        revokedCount: result.revokedCount,
        scope: parsed.data.scope,
        signedOutCurrent: parsed.data.scope === 'all',
      });

      if (parsed.data.scope === 'all') {
        clearAuthCookies(response);
      }

      return response;
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
