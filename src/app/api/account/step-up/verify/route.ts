import { getServerSession } from 'next-auth/next';

import { verifyAccountStepUpChallengeSchema } from '../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { verifyPassword } from '../../../../../lib/auth/password';
import {
  consumeStepUpChallenge,
  getStepUpChallengeByToken,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../../../../../lib/auth/stepUpChallenges';
import {
  shouldBypassTwoFactorRateLimit,
  TWO_FACTOR_CHALLENGE_RATE_LIMIT,
} from '../../../../../lib/auth/twoFactorRateLimit';
import { verifyTwoFactorMethod } from '../../../../../lib/auth/twoFactorVerification';
import { prisma } from '../../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const ACCOUNT_STEP_UP_ACTIONS = new Set([
  'account_email_change',
  'account_password_change',
  'account_delete',
]);

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/step-up/verify' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      let decision: ReturnType<typeof consumeRateLimit> | null = null;
      if (!shouldBypassTwoFactorRateLimit()) {
        decision = consumeRateLimit(
          `${getRateLimitKey('account:step-up:verify', request)}:${userId}`,
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
      const parsed = verifyAccountStepUpChallengeSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const now = new Date();
      const challenge = await getStepUpChallengeByToken({
        prisma,
        challengeToken: parsed.data.challengeToken,
      });
      if (
        !challenge ||
        challenge.userId !== userId ||
        !ACCOUNT_STEP_UP_ACTIONS.has(challenge.action)
      ) {
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorEnabled: true,
          passwordHash: true,
          passwordSetAt: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      let valid = false;
      if (user.twoFactorEnabled) {
        if (parsed.data.method === 'password') {
          throw new ApiError(
            'invalid_request',
            'Password verification is not allowed for this user.',
            400,
          );
        }
        valid = (
          await verifyTwoFactorMethod({
            prisma,
            userId,
            method: parsed.data.method,
            code: parsed.data.code,
            now,
          })
        ).valid;
      } else {
        if (parsed.data.method !== 'password') {
          throw new ApiError('invalid_request', 'Password verification is required.', 400);
        }
        if (!user.passwordSetAt) {
          throw new ApiError(
            'forbidden',
            'Step-up verification is unavailable. Enable 2FA first.',
            403,
          );
        }
        valid = await verifyPassword(parsed.data.code, user.passwordHash);
      }

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
        action: challenge.action,
        method: parsed.data.method,
        verifiedAt: now.toISOString(),
        stepUpChallengeToken: parsed.data.challengeToken,
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
