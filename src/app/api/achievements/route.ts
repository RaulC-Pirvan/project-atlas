import { getServerSession } from 'next-auth/next';

import { getAchievementsSummary } from '../../../lib/api/achievements/summary';
import { ApiError, asApiError } from '../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { prisma } from '../../../lib/db/prisma';
import { withApiLogging } from '../../../lib/observability/apiLogger';
import { getProEntitlementSummary } from '../../../lib/pro/entitlement';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/achievements' },
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

      const summary = await getAchievementsSummary({
        prisma,
        userId: session.user.id,
        timeZone: user.timezone ?? 'UTC',
      });

      return jsonOk({
        generatedAt: summary.generatedAt.toISOString(),
        isPro: entitlement.isPro,
        achievements: summary.achievements.map((achievement) => ({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          tier: achievement.tier,
          unlocked: achievement.unlocked,
          progress: achievement.progress,
        })),
        milestones: summary.milestones.map((timeline) => ({
          habitId: timeline.habitId,
          title: timeline.title,
          completionCount: timeline.completionCount,
          milestones: timeline.milestones.map((milestone) => ({
            id: milestone.id,
            label: milestone.label,
            type: milestone.type,
            tier: milestone.tier,
            current: milestone.current,
            target: milestone.target,
            unlocked: milestone.unlocked,
          })),
        })),
        stats: summary.stats,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
