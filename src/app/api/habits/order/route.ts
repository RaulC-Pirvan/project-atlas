import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { reorderHabits } from '../../../../lib/api/habits/habits';
import { reorderHabitsSchema } from '../../../../lib/api/habits/validation';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function PUT(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/habits/order' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = reorderHabitsSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const result = await reorderHabits({
        prisma,
        userId: session.user.id,
        habitIds: parsed.data.habitIds,
      });

      return jsonOk(result);
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
