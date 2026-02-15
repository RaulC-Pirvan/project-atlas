import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../lib/api/errors';
import { listCompletionsForDate, toggleCompletion } from '../../../lib/api/habits/completions';
import { toggleCompletionSchema } from '../../../lib/api/habits/validation';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { prisma } from '../../../lib/db/prisma';
import { parseUtcDateKey } from '../../../lib/habits/dates';
import { withApiLogging } from '../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const TEST_NOW_HEADER = 'x-atlas-test-now';

function resolveTestNowOverride(request: Request): Date | undefined {
  if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    return undefined;
  }

  const raw = request.headers.get(TEST_NOW_HEADER);
  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError('invalid_request', 'Invalid test now override.', 400);
  }

  return parsed;
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/completions' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const { searchParams } = new URL(request.url);
      const dateParam = searchParams.get('date');
      if (!dateParam) {
        throw new ApiError('invalid_request', 'Date is required.', 400);
      }

      const date = parseUtcDateKey(dateParam);
      if (!date) {
        throw new ApiError('invalid_request', 'Invalid date.', 400);
      }

      const completions = await listCompletionsForDate({
        prisma,
        userId: session.user.id,
        date,
      });

      return jsonOk({ completions });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/completions' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const body = await request.json();
      const parsed = toggleCompletionSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const date = parseUtcDateKey(parsed.data.date);
      if (!date) {
        throw new ApiError('invalid_request', 'Invalid date.', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
      });

      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      const result = await toggleCompletion({
        prisma,
        userId: session.user.id,
        habitId: parsed.data.habitId,
        date,
        completed: parsed.data.completed,
        timeZone: user.timezone ?? 'UTC',
        now: resolveTestNowOverride(request),
      });

      return jsonOk({ result });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
