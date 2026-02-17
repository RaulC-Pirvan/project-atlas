import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { AUTH_RATE_LIMIT, shouldBypassAuthRateLimit } from '../../../../../lib/auth/authRateLimit';
import { createDatabaseSession } from '../../../../../lib/auth/databaseSession';
import { resolveGoogleOAuthSignIn } from '../../../../../lib/auth/googleOAuth';
import {
  getSessionTokenCookieName,
  shouldUseSecureAuthCookies,
} from '../../../../../lib/auth/sessionConfig';
import { generateToken } from '../../../../../lib/auth/tokens';
import { prisma } from '../../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

function assertTestMode() {
  if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    throw new ApiError('not_found', 'Not found.', 404);
  }

  if (process.env.ENABLE_TEST_GOOGLE_OAUTH_PROVIDER !== 'true') {
    throw new ApiError('not_found', 'Not found.', 404);
  }
}

type DebugGoogleSignInBody = {
  providerAccountId?: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
};

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/auth/debug/google-sign-in' },
    async () => {
      assertTestMode();

      let decision: ReturnType<typeof consumeRateLimit> | null = null;

      if (!shouldBypassAuthRateLimit()) {
        decision = consumeRateLimit(
          getRateLimitKey('auth:debug-google-sign-in', request),
          AUTH_RATE_LIMIT,
        );
        if (decision.limited) {
          const response = jsonError(
            new ApiError('rate_limited', 'Too many requests. Try again later.', 429),
          );
          applyRateLimitHeaders(response.headers, decision);
          return response;
        }
      }

      let body: DebugGoogleSignInBody = {};
      try {
        body = (await request.json()) as DebugGoogleSignInBody;
      } catch {
        body = {};
      }

      const providerAccountId =
        typeof body.providerAccountId === 'string' && body.providerAccountId.trim().length > 0
          ? body.providerAccountId.trim()
          : `google-test-${generateToken(8)}`;
      const normalizedEmail =
        typeof body.email === 'string' && body.email.trim().length > 0
          ? body.email.trim().toLowerCase()
          : `${providerAccountId}@example.com`;
      const name =
        typeof body.name === 'string' && body.name.trim().length > 0
          ? body.name.trim()
          : 'Atlas OAuth Tester';
      const emailVerified = body.emailVerified !== false;

      const result = await resolveGoogleOAuthSignIn({
        prisma,
        input: {
          providerAccountId,
          email: normalizedEmail,
          emailVerified,
          name,
          account: { type: 'oauth' },
        },
      });

      if (!result.ok) {
        throw new ApiError('unauthorized', 'Unable to complete test Google sign-in.', 401);
      }

      const { sessionToken, expires } = await createDatabaseSession({
        prisma,
        userId: result.user.id,
        request,
      });

      const response = jsonOk({
        ok: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          isAdmin: result.user.isAdmin,
        },
      });

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
