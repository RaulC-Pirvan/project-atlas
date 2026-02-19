import { getServerSession } from 'next-auth/next';

import { disableTwoFactorSchema } from '../../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { verifyPassword } from '../../../../../lib/auth/password';
import { revokeRecoveryCodes } from '../../../../../lib/auth/recoveryCodes';
import { disableUserTwoFactor } from '../../../../../lib/auth/twoFactor';
import {
  isAdminPrincipal,
  shouldEnforceAdminTwoFactor,
} from '../../../../../lib/auth/twoFactorPolicy';
import { verifyTwoFactorMethod } from '../../../../../lib/auth/twoFactorVerification';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/2fa/disable' },
    async () => {
      const session = await getServerSession(authOptions);
      const sessionUser = session?.user ?? null;
      const userId = sessionUser?.id ?? null;
      if (!userId) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = disableTwoFactorSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      if (parsed.data.confirmation.trim().toUpperCase() !== 'DISABLE 2FA') {
        throw new ApiError('invalid_request', 'Type DISABLE 2FA to confirm.', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          twoFactorEnabled: true,
          passwordHash: true,
          passwordSetAt: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new ApiError('invalid_request', 'Two-factor authentication is not enabled.', 400);
      }

      const isAdmin = isAdminPrincipal({
        role: user.role,
        email: user.email,
        sessionIsAdmin: sessionUser?.isAdmin ?? false,
      });
      if (isAdmin && shouldEnforceAdminTwoFactor()) {
        throw new ApiError(
          'forbidden',
          'Admin two-factor authentication cannot be disabled in self-service.',
          403,
        );
      }

      if (user.passwordSetAt) {
        if (!parsed.data.currentPassword) {
          throw new ApiError(
            'invalid_request',
            'Current password is required to disable two-factor authentication.',
            400,
          );
        }

        const passwordOk = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
        if (!passwordOk) {
          throw new ApiError('unauthorized', 'Current password is incorrect.', 401);
        }
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

      await disableUserTwoFactor({
        prisma,
        userId: user.id,
      });

      await revokeRecoveryCodes({
        prisma,
        userId: user.id,
      });

      return jsonOk({
        enabled: false,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
