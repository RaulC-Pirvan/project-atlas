import { redirect } from 'next/navigation';

import { InsightsDashboard } from '../../components/insights/InsightsDashboard';
import { InsightsUpgradeCard } from '../../components/insights/InsightsUpgradeCard';
import { AppShell } from '../../components/layout/AppShell';
import { getInsightsSummary } from '../../lib/api/insights/summary';
import { getServerAuthSession } from '../../lib/auth/session';
import { prisma } from '../../lib/db/prisma';
import type { InsightsSummary } from '../../lib/insights/types';
import { getWeekdayLabel } from '../../lib/insights/weekdays';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';

function buildPreviewSummary(): InsightsSummary {
  const previewHeatmap = Array.from({ length: 7 }, (_, row) => {
    const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
    return Array.from({ length: 12 }, (_, col) => steps[(row + col) % steps.length]);
  });

  const previewWeekdayRates = [0.78, 0.64, 0.82, 0.71, 0.69, 0.58, 0.42];
  const previewWeekdayStats = previewWeekdayRates.map((rate, index) => {
    const scheduled = 20;
    const completed = Math.round(rate * scheduled);
    const weekday = index + 1;
    return {
      weekday,
      label: getWeekdayLabel(weekday),
      scheduled,
      completed,
      rate,
    };
  });

  return {
    generatedAt: new Date(),
    consistency: [
      { windowDays: 7, scheduled: 14, completed: 12, rate: 12 / 14 },
      { windowDays: 30, scheduled: 60, completed: 43, rate: 43 / 60 },
      { windowDays: 90, scheduled: 180, completed: 116, rate: 116 / 180 },
    ],
    weekdayStats: {
      best: previewWeekdayStats[2] ?? null,
      worst: previewWeekdayStats[6] ?? null,
      stats: previewWeekdayStats,
    },
    trend: {
      windowDays: 14,
      currentRate: 0.76,
      previousRate: 0.68,
      delta: 0.08,
      direction: 'up',
    },
    heatmap: { weeks: 12, weekdays: 7, values: previewHeatmap },
  };
}

export default async function InsightsPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true, weekStart: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  const isPro = proEntitlement.isPro;
  const summary = isPro
    ? await getInsightsSummary({
        prisma,
        userId: session.user.id,
        timeZone: user.timezone ?? 'UTC',
      })
    : buildPreviewSummary();

  return (
    <AppShell title="Insights" subtitle="Patterns and momentum across your habits.">
      <div className="space-y-8">
        {isPro ? null : <InsightsUpgradeCard />}
        <InsightsDashboard summary={summary} weekStart={user.weekStart} isPreview={!isPro} />
      </div>
    </AppShell>
  );
}
