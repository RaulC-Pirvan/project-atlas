import { logFunnelEvent } from '../../../../lib/analytics/funnel';
import { signInSchema } from '../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { AUTH_RATE_LIMIT, shouldBypassAuthRateLimit } from '../../../../lib/auth/authRateLimit';
import { authorizeCredentials } from '../../../../lib/auth/credentials';
import { createDatabaseSession } from '../../../../lib/auth/databaseSession';
import {
  ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
  getSessionTokenCookieName,
  shouldUseSecureAuthCookies,
} from '../../../../lib/auth/sessionConfig';
import { createStepUpChallenge } from '../../../../lib/auth/stepUpChallenges';
import { shouldEnforceAdminTwoFactor } from '../../../../lib/auth/twoFactorPolicy';
import { prisma } from '../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../lib/http/rateLimit';
import { getRequestId, withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

function clearAdminTwoFactorEnrollmentCookie(response: Response, secure: boolean) {
  const nextResponse = response as Response & {
    cookies?: {
      set: (args: {
        name: string;
        value: string;
        path: string;
        maxAge: number;
        expires: Date;
        httpOnly: boolean;
        sameSite: 'lax';
        secure: boolean;
      }) => void;
    };
  };

  nextResponse.cookies?.set({
    name: ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure,
  });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

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

      const secure = shouldUseSecureAuthCookies();
      const adminRequiresEnrollment =
        authorizedUser.isAdmin && shouldEnforceAdminTwoFactor() && !authorizedUser.twoFactorEnabled;

      if (adminRequiresEnrollment) {
        const { sessionToken, expires } = await createDatabaseSession({
          prisma,
          userId: authorizedUser.id,
          request,
        });

        const response = jsonOk({ ok: true, requiresAdminTwoFactorEnrollment: true });
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
          value: 'required',
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure,
          maxAge: 60 * 60 * 24,
        });

        if (decision) {
          applyRateLimitHeaders(response.headers, decision);
        }

        logFunnelEvent({
          event: 'auth_sign_in_completed',
          surface: '/api/auth/sign-in',
          authenticated: true,
          userId: authorizedUser.id,
          provider: 'credentials',
          requestId,
        });

        return response;
      }

      if (authorizedUser.twoFactorEnabled) {
        const challenge = await createStepUpChallenge({
          prisma,
          userId: authorizedUser.id,
          action: 'sign_in',
        });

        const response = jsonOk({
          ok: true,
          requiresTwoFactor: true,
          challengeToken: challenge.challengeToken,
          methods: ['totp', 'recovery_code'] as const,
        });
        clearAdminTwoFactorEnrollmentCookie(response, secure);

        if (decision) {
          applyRateLimitHeaders(response.headers, decision);
        }

        return response;
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
        secure,
        expires,
      });
      clearAdminTwoFactorEnrollmentCookie(response, secure);

      if (decision) {
        applyRateLimitHeaders(response.headers, decision);
      }

      logFunnelEvent({
        event: 'auth_sign_in_completed',
        surface: '/api/auth/sign-in',
        authenticated: true,
        userId: authorizedUser.id,
        provider: 'credentials',
        requestId,
      });

      return response;
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
