import { verifySignInTwoFactorSchema } from '../../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../../lib/api/response';
import { createDatabaseSession } from '../../../../../../lib/auth/databaseSession';
import {
  ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
  getSessionTokenCookieName,
  shouldUseSecureAuthCookies,
} from '../../../../../../lib/auth/sessionConfig';
import {
  consumeStepUpChallenge,
  getStepUpChallengeByToken,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../../../../../../lib/auth/stepUpChallenges';
import {
  shouldBypassTwoFactorRateLimit,
  TWO_FACTOR_CHALLENGE_RATE_LIMIT,
} from '../../../../../../lib/auth/twoFactorRateLimit';
import { verifyTwoFactorMethod } from '../../../../../../lib/auth/twoFactorVerification';
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
    { route: '/api/auth/sign-in/2fa/verify' },
    async () => {
      let decision: ReturnType<typeof consumeRateLimit> | null = null;
      if (!shouldBypassTwoFactorRateLimit()) {
        decision = consumeRateLimit(
          getRateLimitKey('auth:sign-in:2fa:verify', request),
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
      const parsed = verifySignInTwoFactorSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const now = new Date();
      const challenge = await getStepUpChallengeByToken({
        prisma,
        challengeToken: parsed.data.challengeToken,
      });
      if (!challenge || challenge.action !== 'sign_in') {
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

      const verification = await verifyTwoFactorMethod({
        prisma,
        userId: challenge.userId,
        method: parsed.data.method,
        code: parsed.data.code,
        now,
      });
      if (!verification.valid) {
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

      const { sessionToken, expires } = await createDatabaseSession({
        prisma,
        userId: challenge.userId,
        request,
        now,
      });

      const response = jsonOk({ ok: true });
      const secure = shouldUseSecureAuthCookies();
      response.cookies.set({
        name: getSessionTokenCookieName(),
        value: sessionToken,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        expires,
      });
      response.cookies.set({
        name: ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure,
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
