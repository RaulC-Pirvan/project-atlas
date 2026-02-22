type ProRoadmapCardProps = {
  isPro: boolean;
};

const itemClasses = 'rounded-xl border border-black/10 px-4 py-3 dark:border-white/10';

export function ProRoadmapCard({ isPro }: ProRoadmapCardProps) {
  return (
    <section className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
          Pro roadmap
        </p>
        <p className="text-sm text-black/60 dark:text-white/60">
          {isPro
            ? 'Your current Pro purchase includes future depth improvements in this stream.'
            : 'Buying Pro now grants lifetime access to this roadmap stream.'}
        </p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-black/70 dark:text-white/70">
        <div className={itemClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            In progress
          </p>
          <p className="mt-1">
            Richer consistency breakdowns and stronger trend context in Insights.
          </p>
        </div>
        <div className={itemClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Planned
          </p>
          <p className="mt-1">Expanded achievement catalogue with additional milestone sets.</p>
        </div>
        <div className={itemClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Planned
          </p>
          <p className="mt-1">
            Smarter reminder orchestration with push-focused delivery controls.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-black/50 dark:text-white/50">
        Non-goal for launch: no monthly/yearly subscriptions. Atlas Pro remains a one-time purchase.
      </p>
    </section>
  );
}
