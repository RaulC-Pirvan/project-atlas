import { getServerSession } from 'next-auth/next';

import { enableTwoFactorSchema } from '../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { rotateRecoveryCodes } from '../../../../../lib/auth/recoveryCodes';
import {
  ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
  shouldUseSecureAuthCookies,
} from '../../../../../lib/auth/sessionConfig';
import { enableUserTwoFactor, verifyUserTotpCode } from '../../../../../lib/auth/twoFactor';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/2fa/enable' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = enableTwoFactorSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          twoFactorEnabled: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      if (user.twoFactorEnabled) {
        throw new ApiError('invalid_request', 'Two-factor authentication is already enabled.', 400);
      }

      const verification = await verifyUserTotpCode({
        prisma,
        userId: user.id,
        code: parsed.data.code,
      });
      if (!verification.valid) {
        throw new ApiError('unauthorized', 'Invalid authentication code.', 401);
      }

      await enableUserTwoFactor({
        prisma,
        userId: user.id,
      });

      const recovery = await rotateRecoveryCodes({
        prisma,
        userId: user.id,
      });

      const response = jsonOk({
        enabled: true,
        recoveryCodes: recovery.codes,
      });

      response.cookies.set({
        name: ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure: shouldUseSecureAuthCookies(),
      });

      return response;
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
