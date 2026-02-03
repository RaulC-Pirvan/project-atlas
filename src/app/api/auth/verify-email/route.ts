import { verifyEmailSchema } from '../../../../lib/api/auth/validation';
import { verifyEmail } from '../../../../lib/api/auth/verifyEmail';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { AUTH_RATE_LIMIT, shouldBypassAuthRateLimit } from '../../../../lib/auth/authRateLimit';
import { prisma } from '../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/auth/verify-email' },
    async () => {
      if (!shouldBypassAuthRateLimit()) {
        const decision = consumeRateLimit(
          getRateLimitKey('auth:verify-email', request),
          AUTH_RATE_LIMIT,
        );
        if (decision.limited) {
          const response = jsonError(
            new ApiError('rate_limited', 'Too many requests. Try again later.', 429, 'retry_later'),
          );
          applyRateLimitHeaders(response.headers, decision);
          return response;
        }
      }

      const { searchParams } = new URL(request.url);
      const token = searchParams.get('token') ?? '';
      const parsed = verifyEmailSchema.safeParse({ token });
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const result = await verifyEmail(prisma, parsed.data.token);
      return jsonOk(result);
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
