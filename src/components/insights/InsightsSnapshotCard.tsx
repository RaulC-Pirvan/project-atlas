import Link from 'next/link';

import type { InsightsSummary } from '../../lib/insights/types';

type InsightsSnapshotCardProps = {
  summary: InsightsSummary;
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function trendLabel(direction: InsightsSummary['trend']['direction']): string {
  if (direction === 'up') return 'Upward';
  if (direction === 'down') return 'Downward';
  return 'Flat';
}

const linkClasses =
  'inline-flex min-h-[40px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function InsightsSnapshotCard({ summary }: InsightsSnapshotCardProps) {
  const sevenDay = summary.consistency.find((window) => window.windowDays === 7);
  const thirtyDay = summary.consistency.find((window) => window.windowDays === 30);

  return (
    <div className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Insights snapshot
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Quick read on your recent momentum.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          Pro active
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 px-4 py-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            7-day
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">
            {formatPercent(sevenDay?.rate ?? 0)}
          </p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {sevenDay?.completed ?? 0} of {sevenDay?.scheduled ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 px-4 py-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            30-day
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">
            {formatPercent(thirtyDay?.rate ?? 0)}
          </p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {thirtyDay?.completed ?? 0} of {thirtyDay?.scheduled ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 px-4 py-3 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Trend
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">
            {trendLabel(summary.trend.direction)}
          </p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {formatPercent(summary.trend.currentRate)} current
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/insights" className={linkClasses}>
          Open insights
        </Link>
      </div>
    </div>
  );
}
