import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { archiveHabit, updateHabit } from '../../../../lib/api/habits/habits';
import { updateHabitSchema } from '../../../../lib/api/habits/validation';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError('unauthorized', 'Not authenticated.', 401);
    }

    const { id: habitId } = await context.params;
    if (!habitId) {
      throw new ApiError('invalid_request', 'Habit id is required.', 400);
    }

    const body = await request.json();
    const parsed = updateHabitSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_request', 'Invalid request.', 400);
    }

    const habit = await updateHabit({
      prisma,
      userId: session.user.id,
      habitId,
      title: parsed.data.title,
      description: parsed.data.description,
      weekdays: parsed.data.weekdays,
    });

    return jsonOk({ habit });
  } catch (error) {
    return jsonError(asApiError(error));
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError('unauthorized', 'Not authenticated.', 401);
    }

    const { id: habitId } = await context.params;
    if (!habitId) {
      throw new ApiError('invalid_request', 'Habit id is required.', 400);
    }

    const result = await archiveHabit({
      prisma,
      userId: session.user.id,
      habitId,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
