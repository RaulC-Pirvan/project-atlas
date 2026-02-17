import { signInSchema } from '../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { AUTH_RATE_LIMIT, shouldBypassAuthRateLimit } from '../../../../lib/auth/authRateLimit';
import { authorizeCredentials } from '../../../../lib/auth/credentials';
import { createDatabaseSession } from '../../../../lib/auth/databaseSession';
import {
  getSessionTokenCookieName,
  shouldUseSecureAuthCookies,
} from '../../../../lib/auth/sessionConfig';
import { prisma } from '../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/auth/sign-in' },
    async () => {
      let decision: ReturnType<typeof consumeRateLimit> | null = null;

      if (!shouldBypassAuthRateLimit()) {
        decision = consumeRateLimit(getRateLimitKey('auth:sign-in', request), AUTH_RATE_LIMIT);
        if (decision.limited) {
          const response = jsonError(
            new ApiError('rate_limited', 'Too many requests. Try again later.', 429),
          );
          applyRateLimitHeaders(response.headers, decision);
          return response;
        }
      }

      const body = await request.json();
      const parsed = signInSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      let authorizedUser;
      try {
        authorizedUser = await authorizeCredentials({
          prisma,
          credentials: parsed.data,
          rateLimitKey: parsed.data.email.toLowerCase(),
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
          throw new ApiError(
            'email_not_verified',
            'Account not verified. Check your email for the verification link.',
            401,
          );
        }
        throw error;
      }

      if (!authorizedUser) {
        throw new ApiError('invalid_credentials', 'Invalid email or password.', 401);
      }

      const { sessionToken, expires } = await createDatabaseSession({
        prisma,
        userId: authorizedUser.id,
        request,
      });

      const response = jsonOk({ ok: true });
      response.cookies.set({
        name: getSessionTokenCookieName(),
        value: sessionToken,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: shouldUseSecureAuthCookies(),
        expires,
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
