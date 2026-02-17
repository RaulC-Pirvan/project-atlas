import { getServerSession } from 'next-auth/next';

import { deleteAccountRequestSchema } from '../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { requireFreshStepUpProof } from '../../../../lib/auth/stepUpProof';
import { prisma } from '../../../../lib/db/prisma';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account/delete-request' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = deleteAccountRequestSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      await requireFreshStepUpProof({
        prisma,
        userId: user.id,
        action: 'account_delete',
        stepUpChallengeToken: parsed.data.stepUpChallengeToken,
      });

      await prisma.user.delete({ where: { id: user.id } });

      return jsonOk({ ok: true });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
