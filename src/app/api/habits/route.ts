import { getServerSession } from 'next-auth/next';

import { logFunnelEvent, logFunnelGuardrail } from '../../../lib/analytics/funnel';
import { ApiError, asApiError } from '../../../lib/api/errors';
import { createHabit, listHabits } from '../../../lib/api/habits/habits';
import { createHabitSchema } from '../../../lib/api/habits/validation';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { prisma } from '../../../lib/db/prisma';
import { getRequestId, withApiLogging } from '../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/habits' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const habits = await listHabits({
        prisma,
        userId: session.user.id,
        includeArchived: false,
      });

      return jsonOk({ habits });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  return withApiLogging(
    request,
    { route: '/api/habits' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = createHabitSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const habit = await createHabit({
        prisma,
        userId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        weekdays: parsed.data.weekdays,
        reminderTimes: parsed.data.reminderTimes,
      });

      let isFirstHabit = false;
      try {
        const totalHabits = await prisma.habit.count({
          where: { userId: session.user.id },
        });
        isFirstHabit = totalHabits === 1;
      } catch (error) {
        logFunnelGuardrail({
          reason: 'milestone_probe_failed',
          event: 'habit_first_created',
          surface: '/api/habits',
          authenticated: true,
          userId: session.user.id,
          requestId,
          details: error instanceof Error ? error.message : 'count_failed',
        });
      }

      if (isFirstHabit) {
        logFunnelEvent({
          event: 'habit_first_created',
          surface: '/api/habits',
          authenticated: true,
          userId: session.user.id,
          requestId,
        });
      }

      return jsonOk({ habit }, 201);
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
