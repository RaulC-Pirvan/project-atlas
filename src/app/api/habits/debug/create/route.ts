import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { prisma } from '../../../../../lib/db/prisma';
import { parseUtcDateKey } from '../../../../../lib/habits/dates';
import { listActiveWeekdays } from '../../../../../lib/habits/schedule';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

type CreatePayload = {
  title?: string;
  description?: string | null;
  weekdays?: number[];
  createdAt?: string;
};

function assertTestMode() {
  if (process.env.NODE_ENV === 'production') {
    throw new ApiError('not_found', 'Not found.', 404);
  }
  if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    throw new ApiError('not_found', 'Not found.', 404);
  }
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/habits/debug/create' },
    async () => {
      assertTestMode();
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = (await request.json()) as CreatePayload;
      const title = body.title?.trim();
      if (!title) {
        throw new ApiError('invalid_request', 'Title is required.', 400);
      }

      const weekdays = Array.isArray(body.weekdays) ? body.weekdays : [];
      const activeWeekdays = listActiveWeekdays(weekdays.map((weekday) => ({ weekday })));
      if (activeWeekdays.length === 0) {
        throw new ApiError('invalid_request', 'Weekdays are required.', 400);
      }

      const createdAt = body.createdAt ? parseUtcDateKey(body.createdAt) : null;
      if (body.createdAt && !createdAt) {
        throw new ApiError('invalid_request', 'Invalid createdAt date.', 400);
      }

      const habit = await prisma.habit.create({
        data: {
          userId: session.user.id,
          title,
          description: body.description?.trim() || null,
          createdAt: createdAt ?? undefined,
          schedule: { create: activeWeekdays.map((weekday) => ({ weekday })) },
        },
        include: { schedule: { select: { weekday: true } } },
      });

      return jsonOk({
        habit: {
          id: habit.id,
          title: habit.title,
          description: habit.description,
          archivedAt: habit.archivedAt,
          createdAt: habit.createdAt.toISOString(),
          weekdays: listActiveWeekdays(habit.schedule),
        },
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
