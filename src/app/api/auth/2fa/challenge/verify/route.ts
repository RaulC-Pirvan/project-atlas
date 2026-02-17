import { getServerSession } from 'next-auth/next';

import { verifyTwoFactorChallengeSchema } from '../../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../../lib/api/response';
import { authOptions } from '../../../../../../lib/auth/nextauth';
import { consumeRecoveryCode } from '../../../../../../lib/auth/recoveryCodes';
import {
  consumeStepUpChallenge,
  getStepUpChallengeByToken,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../../../../../../lib/auth/stepUpChallenges';
import { verifyUserTotpCode } from '../../../../../../lib/auth/twoFactor';
import {
  shouldBypassTwoFactorRateLimit,
  TWO_FACTOR_CHALLENGE_RATE_LIMIT,
} from '../../../../../../lib/auth/twoFactorRateLimit';
import { prisma } from '../../../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/auth/2fa/challenge/verify' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      let decision: ReturnType<typeof consumeRateLimit> | null = null;
      if (!shouldBypassTwoFactorRateLimit()) {
        decision = consumeRateLimit(
          `${getRateLimitKey('auth:2fa:challenge:verify', request)}:${userId}`,
          TWO_FACTOR_CHALLENGE_RATE_LIMIT,
        );
        if (decision.limited) {
          const response = jsonError(
            new ApiError('rate_limited', 'Too many verification attempts. Try again later.', 429),
          );
          applyRateLimitHeaders(response.headers, decision);
          return response;
        }
      }

      const body = await request.json();
      const parsed = verifyTwoFactorChallengeSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const now = new Date();
      const challenge = await getStepUpChallengeByToken({
        prisma,
        challengeToken: parsed.data.challengeToken,
      });
      if (!challenge || challenge.userId !== userId) {
        throw new ApiError('unauthorized', 'Invalid challenge.', 401);
      }

      const consumable = isStepUpChallengeConsumable(challenge, now);
      if (!consumable.ok) {
        if (consumable.reason === 'expired') {
          throw new ApiError('token_expired', 'Challenge expired.', 401);
        }

        if (consumable.reason === 'locked') {
          const response = jsonError(
            new ApiError('rate_limited', 'Too many verification attempts. Try again later.', 429),
          );
          if (challenge.lockedUntil) {
            const retryAfter = Math.max(
              1,
              Math.ceil((challenge.lockedUntil.getTime() - now.getTime()) / 1000),
            );
            response.headers.set('Retry-After', String(retryAfter));
          }

          return response;
        }

        throw new ApiError('unauthorized', 'Invalid challenge.', 401);
      }

      const valid =
        parsed.data.method === 'totp'
          ? (
              await verifyUserTotpCode({
                prisma,
                userId,
                code: parsed.data.code,
                now,
              })
            ).valid
          : await consumeRecoveryCode({
              prisma,
              userId,
              recoveryCode: parsed.data.code,
              now,
            });

      if (!valid) {
        await recordFailedStepUpAttempt({
          prisma,
          challenge: { id: challenge.id, failedAttempts: challenge.failedAttempts },
          now,
        });

        throw new ApiError('unauthorized', 'Invalid authentication code.', 401);
      }

      await consumeStepUpChallenge({
        prisma,
        challengeId: challenge.id,
        method: parsed.data.method,
        now,
      });

      const response = jsonOk({
        verified: true,
        method: parsed.data.method,
        action: challenge.action,
        verifiedAt: now.toISOString(),
      });

      if (decision) {
        applyRateLimitHeaders(response.headers, decision);
      }

      return response;
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
