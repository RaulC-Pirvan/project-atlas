import { getServerSession } from 'next-auth/next';

import { createAccountStepUpChallengeSchema } from '../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { createStepUpChallenge } from '../../../../../lib/auth/stepUpChallenges';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/step-up/challenge' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = createAccountStepUpChallengeSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorEnabled: true,
          passwordSetAt: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      const methods = user.twoFactorEnabled
        ? (['totp', 'recovery_code'] as const)
        : user.passwordSetAt
          ? (['password'] as const)
          : null;

      if (!methods) {
        throw new ApiError(
          'forbidden',
          'Step-up verification is unavailable. Enable 2FA first.',
          403,
        );
      }

      const challenge = await createStepUpChallenge({
        prisma,
        userId,
        action: parsed.data.action,
      });

      return jsonOk({
        challengeToken: challenge.challengeToken,
        expiresAt: challenge.expiresAt.toISOString(),
        methods,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
