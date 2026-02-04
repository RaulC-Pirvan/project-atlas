import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../lib/api/errors';
import { getInsightsSummary } from '../../../lib/api/insights/summary';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { prisma } from '../../../lib/db/prisma';
import type { WeekdayStat } from '../../../lib/insights/types';
import { withApiLogging } from '../../../lib/observability/apiLogger';
import { getProEntitlementSummary } from '../../../lib/pro/entitlement';

export const runtime = 'nodejs';

function serializeWeekdayStat(stat: WeekdayStat | null) {
  if (!stat) return null;
  return {
    weekday: stat.weekday,
    label: stat.label,
    scheduled: stat.scheduled,
    completed: stat.completed,
    rate: stat.rate,
  };
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/insights' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
      });

      if (!user) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const entitlement = await getProEntitlementSummary({
        prisma,
        userId: session.user.id,
      });

      if (!entitlement.isPro) {
        throw new ApiError('forbidden', 'Pro access required.', 403);
      }

      const summary = await getInsightsSummary({
        prisma,
        userId: session.user.id,
        timeZone: user.timezone ?? 'UTC',
      });

      return jsonOk({
        generatedAt: summary.generatedAt.toISOString(),
        consistency: summary.consistency.map((window) => ({
          windowDays: window.windowDays,
          scheduled: window.scheduled,
          completed: window.completed,
          rate: window.rate,
        })),
        weekdayStats: {
          best: serializeWeekdayStat(summary.weekdayStats.best),
          worst: serializeWeekdayStat(summary.weekdayStats.worst),
          stats: summary.weekdayStats.stats.map((stat) => serializeWeekdayStat(stat)),
        },
        trend: {
          windowDays: summary.trend.windowDays,
          currentRate: summary.trend.currentRate,
          previousRate: summary.trend.previousRate,
          delta: summary.trend.delta,
          direction: summary.trend.direction,
        },
        heatmap: summary.heatmap,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
