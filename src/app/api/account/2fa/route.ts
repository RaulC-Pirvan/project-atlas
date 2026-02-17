import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import {
  isAdminPrincipal,
  shouldEnforceAdminTwoFactor,
} from '../../../../lib/auth/twoFactorPolicy';
import { prisma } from '../../../../lib/db/prisma';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/2fa' },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          twoFactorEnabled: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      const [twoFactorConfig, recoveryCodesRemaining] = await Promise.all([
        prisma.userTwoFactor.findUnique({
          where: { userId: user.id },
          select: {
            id: true,
            enabledAt: true,
          },
        }),
        prisma.userRecoveryCode.count({
          where: {
            userId: user.id,
            consumedAt: null,
            revokedAt: null,
          },
        }),
      ]);

      const isAdmin = isAdminPrincipal({
        role: user.role,
        email: user.email,
        sessionIsAdmin: session?.user?.isAdmin ?? false,
      });
      const adminEnrollmentRequired =
        isAdmin && shouldEnforceAdminTwoFactor() && !user.twoFactorEnabled;

      return jsonOk({
        enabled: user.twoFactorEnabled,
        hasTotpSecret: Boolean(twoFactorConfig),
        recoveryCodesRemaining,
        isAdmin,
        adminEnrollmentRequired,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
