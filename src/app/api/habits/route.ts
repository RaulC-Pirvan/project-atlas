import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../lib/api/errors';
import { createHabit, listHabits } from '../../../lib/api/habits/habits';
import { createHabitSchema } from '../../../lib/api/habits/validation';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { prisma } from '../../../lib/db/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
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
  } catch (error) {
    return jsonError(asApiError(error));
  }
}

export async function POST(request: Request) {
  try {
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
    });

    return jsonOk({ habit }, 201);
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
