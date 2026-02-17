import { getServerSession } from 'next-auth/next';

import { rotateRecoveryCodesSchema } from '../../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../../lib/api/response';
import { authOptions } from '../../../../../../lib/auth/nextauth';
import { rotateRecoveryCodes } from '../../../../../../lib/auth/recoveryCodes';
import { verifyTwoFactorMethod } from '../../../../../../lib/auth/twoFactorVerification';
import { prisma } from '../../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/2fa/recovery/rotate' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = rotateRecoveryCodesSchema.safeParse(body);
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

      if (!user.twoFactorEnabled) {
        throw new ApiError('invalid_request', 'Two-factor authentication is not enabled.', 400);
      }

      const factor = await verifyTwoFactorMethod({
        prisma,
        userId: user.id,
        method: parsed.data.method,
        code: parsed.data.code,
      });
      if (!factor.valid) {
        throw new ApiError('unauthorized', 'Invalid authentication code.', 401);
      }

      const rotated = await rotateRecoveryCodes({
        prisma,
        userId: user.id,
      });

      return jsonOk({
        recoveryCodes: rotated.codes,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
