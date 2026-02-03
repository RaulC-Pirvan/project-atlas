import { getLatestVerificationToken } from '../../../../../infra/email/debugTokenStore';
import { resendVerificationSchema } from '../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/auth/debug/verification-token' },
    async () => {
      const allow =
        process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_ENDPOINTS === 'true';
      if (!allow) {
        throw new ApiError('not_found', 'Not found.', 404);
      }

      const { searchParams } = new URL(request.url);
      const email = searchParams.get('email') ?? '';
      const parsed = resendVerificationSchema.safeParse({ email });
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const token = getLatestVerificationToken(parsed.data.email);
      if (!token) {
        throw new ApiError('not_found', 'Token not found.', 404);
      }

      return jsonOk({ token });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
