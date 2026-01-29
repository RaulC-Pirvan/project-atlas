type StreakItem = {
  habitId: string;
  title: string;
  current: number;
  longest: number;
};

type StreakSummaryPanelProps = {
  items: StreakItem[];
  hasHabits: boolean;
  hasCompletions: boolean;
  asOfLabel: string;
};

export function StreakSummaryPanel({
  items,
  hasHabits,
  hasCompletions,
  asOfLabel,
}: StreakSummaryPanelProps) {
  return (
    <div className="rounded-2xl border border-black/10 px-6 py-6" data-testid="streaks-panel">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60">Streaks</p>
          <p className="text-xs text-black/50">As of {asOfLabel}</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-black/70">
        {!hasHabits ? (
          <div className="space-y-3">
            <p>Create a habit to start a streak.</p>
            <a
              href="/habits"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Go to habits
            </a>
          </div>
        ) : !hasCompletions ? (
          <p>Complete a habit to begin your first streak.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-end gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
              <span>Habit</span>
              <span className="text-center text-black/70">Current</span>
              <span className="pl-2 text-center">Longest</span>
            </div>
            <div className="divide-y divide-black/10">
              {items.map((item) => (
                <div
                  key={item.habitId}
                  className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem] items-center gap-2 py-3"
                >
                  <p className="truncate text-sm font-semibold text-black">{item.title}</p>
                  <p className="text-lg font-semibold text-black tabular-nums text-center">
                    {item.current}
                  </p>
                  <p className="pl-2 text-sm font-semibold text-black/60 tabular-nums text-center">
                    {item.longest}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
