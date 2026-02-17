import { getServerSession } from 'next-auth/next';

import { createTwoFactorChallengeSchema } from '../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { createStepUpChallenge } from '../../../../../lib/auth/stepUpChallenges';
import { getUserTwoFactorState } from '../../../../../lib/auth/twoFactor';
import { isAdminPrincipal } from '../../../../../lib/auth/twoFactorPolicy';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/auth/2fa/challenge' },
    async () => {
      const session = await getServerSession(authOptions);
      const sessionUser = session?.user ?? null;
      const userId = sessionUser?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = createTwoFactorChallengeSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const state = await getUserTwoFactorState(prisma, userId);
      if (!state) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      if (!state.twoFactorEnabled || !state.hasTotpSecret) {
        throw new ApiError(
          'forbidden',
          'Two-factor authentication is not enabled for this user.',
          403,
        );
      }

      if (parsed.data.action === 'admin_access') {
        const isAdmin = isAdminPrincipal({
          role: state.role,
          email: state.email,
          sessionIsAdmin: sessionUser?.isAdmin ?? false,
        });

        if (!isAdmin) {
          throw new ApiError('forbidden', 'Admin access is restricted.', 403);
        }
      }

      const challenge = await createStepUpChallenge({
        prisma,
        userId,
        action: parsed.data.action,
      });

      return jsonOk({
        challengeToken: challenge.challengeToken,
        expiresAt: challenge.expiresAt.toISOString(),
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
