import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { readSessionTokenFromCookieHeader } from '../../../../../lib/auth/sessionConfig';
import { clearAuthCookies } from '../../../../../lib/auth/sessionCookies';
import {
  findUserSessionById,
  revokeUserSessionById,
} from '../../../../../lib/auth/sessionManagement';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  return withApiLogging(
    request,
    { route: '/api/account/sessions/[sessionId]' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const { sessionId } = await context.params;
      if (!sessionId) {
        throw new ApiError('invalid_request', 'Session id is required.', 400);
      }

      const target = await findUserSessionById({
        prisma,
        userId,
        sessionId,
      });
      if (!target) {
        throw new ApiError('not_found', 'Session not found.', 404);
      }

      const currentSessionToken = readSessionTokenFromCookieHeader(request.headers.get('cookie'));
      const isCurrentSession = currentSessionToken
        ? target.sessionToken === currentSessionToken
        : false;

      const result = await revokeUserSessionById({
        prisma,
        userId,
        sessionId,
      });
      if (!result.revokedCount) {
        throw new ApiError('not_found', 'Session not found.', 404);
      }

      const response = jsonOk({
        revoked: true,
        signedOutCurrent: isCurrentSession,
      });

      if (isCurrentSession) {
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
