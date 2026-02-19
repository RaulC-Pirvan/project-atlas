import { getServerSession } from 'next-auth/next';
import QRCode from 'qrcode';

import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { buildTotpOtpauthUri, generateTotpSecret } from '../../../../../lib/auth/totp';
import { setUserTotpSecret } from '../../../../../lib/auth/twoFactor';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const TOTP_ISSUER = 'Project Atlas';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/2fa/setup' },
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
          twoFactorEnabled: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      if (user.twoFactorEnabled) {
        throw new ApiError('invalid_request', 'Two-factor authentication is already enabled.', 400);
      }

      const secret = generateTotpSecret();
      const otpauthUri = buildTotpOtpauthUri({
        secret,
        issuer: TOTP_ISSUER,
        accountName: user.email,
      });

      await setUserTotpSecret({
        prisma,
        userId: user.id,
        secret,
      });

      const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 240,
      });

      return jsonOk({
        secret,
        otpauthUri,
        qrDataUrl,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
