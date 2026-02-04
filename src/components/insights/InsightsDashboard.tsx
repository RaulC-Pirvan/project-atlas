import { getWeekdayLabel, getWeekdayOrder, type WeekStart } from '../../lib/insights/weekdays';
import type { InsightsSummary } from '../../lib/insights/types';
import { Notice } from '../ui/Notice';

type InsightsDashboardProps = {
  summary: InsightsSummary;
  weekStart: WeekStart;
  isPreview?: boolean;
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDelta(value: number): string {
  const percent = Math.round(value * 100);
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent}%`;
}

function heatmapCellClass(rate: number): string {
  if (rate >= 1) {
    return 'bg-[#FAB95B] border-[#FAB95B]';
  }
  if (rate >= 0.67) {
    return 'bg-black/40 dark:bg-white/40';
  }
  if (rate >= 0.34) {
    return 'bg-black/20 dark:bg-white/20';
  }
  if (rate > 0) {
    return 'bg-black/10 dark:bg-white/10';
  }
  return 'bg-transparent';
}

export function InsightsDashboard({
  summary,
  weekStart,
  isPreview = false,
}: InsightsDashboardProps) {
  const totalScheduled =
    summary.consistency.find((window) => window.windowDays === 90)?.scheduled ?? 0;
  const hasData = totalScheduled > 0;
  const tone = isPreview ? 'opacity-60' : '';
  const trendLabel =
    summary.trend.direction === 'up'
      ? 'Upward'
      : summary.trend.direction === 'down'
        ? 'Downward'
        : 'Flat';
  const weekdayOrder = getWeekdayOrder(weekStart);

  return (
    <div className="space-y-6" data-testid={isPreview ? 'insights-preview' : 'insights-dashboard'}>
      {!hasData && !isPreview ? (
        <Notice>Add a habit and complete a few days to unlock your first insights summary.</Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div
          className={`rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10 ${tone}`.trim()}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
              Consistency
            </p>
            {isPreview ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                Preview
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {summary.consistency.map((window) => (
              <div key={window.windowDays} className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                  {window.windowDays}d
                </p>
                <p className="text-lg font-semibold text-black dark:text-white">
                  {formatPercent(window.rate)}
                </p>
                <p className="text-[11px] text-black/50 dark:text-white/50">
                  {window.completed} of {window.scheduled}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10 ${tone}`.trim()}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
              Weekdays
            </p>
            {isPreview ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                Preview
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                Best
              </p>
              <p className="text-base font-semibold text-black dark:text-white">
                {summary.weekdayStats.best?.label ?? '—'}
              </p>
              <p className="text-xs text-black/50 dark:text-white/50">
                {summary.weekdayStats.best
                  ? formatPercent(summary.weekdayStats.best.rate)
                  : 'No data'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                Worst
              </p>
              <p className="text-base font-semibold text-black dark:text-white">
                {summary.weekdayStats.worst?.label ?? '—'}
              </p>
              <p className="text-xs text-black/50 dark:text-white/50">
                {summary.weekdayStats.worst
                  ? formatPercent(summary.weekdayStats.worst.rate)
                  : 'No data'}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10 ${tone}`.trim()}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
              Trend
            </p>
            {isPreview ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                Preview
              </span>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-lg font-semibold text-black dark:text-white">{trendLabel}</p>
            <p className="text-xs text-black/50 dark:text-white/50">
              {formatDelta(summary.trend.delta)} vs previous {summary.trend.windowDays} days
            </p>
            <div className="flex items-center gap-3 text-xs text-black/60 dark:text-white/60">
              <span>Current {formatPercent(summary.trend.currentRate)}</span>
              <span
                className="h-1 w-1 rounded-full bg-black/40 dark:bg-white/40"
                aria-hidden="true"
              />
              <span>Previous {formatPercent(summary.trend.previousRate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10 ${tone}`.trim()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
            Completion Heatmap
          </p>
          {isPreview ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
              Preview
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-2">
          {weekdayOrder.map((weekday) => {
            const rowIndex = weekday - 1;
            const values = summary.heatmap.values[rowIndex] ?? [];
            const label = getWeekdayLabel(weekday).slice(0, 3);
            return (
              <div key={weekday} className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                  {label}
                </span>
                <div className="flex flex-1 flex-wrap gap-1">
                  {values.map((value, index) => (
                    <span
                      key={`${weekday}-${index}`}
                      className={`h-4 w-4 rounded-md border border-black/10 dark:border-white/10 ${heatmapCellClass(
                        value,
                      )}`.trim()}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
