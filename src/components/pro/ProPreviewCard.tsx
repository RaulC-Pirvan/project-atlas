import Link from 'next/link';

type ProPreviewCardProps = {
  isPro: boolean;
};

const linkClasses =
  'inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function ProPreviewCard({ isPro }: ProPreviewCardProps) {
  const cardState = isPro ? 'Pro active' : 'Preview';
  const previewTone = isPro ? '' : 'opacity-60';

  return (
    <div className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Atlas Pro
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            See deeper patterns and smarter nudges.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {cardState}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-black/70 dark:text-white/70">
        <div
          className={`rounded-xl border border-black/10 px-4 py-3 dark:border-white/10 ${previewTone}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Consistency score
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">84%</p>
          <p className="text-xs text-black/50 dark:text-white/50">Preview metric</p>
        </div>
        <div
          className={`rounded-xl border border-black/10 px-4 py-3 dark:border-white/10 ${previewTone}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Best weekday
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">Wednesday</p>
          <p className="text-xs text-black/50 dark:text-white/50">Preview insight</p>
        </div>
        <div
          className={`rounded-xl border border-black/10 px-4 py-3 dark:border-white/10 ${previewTone}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Trend
          </p>
          <p className="text-lg font-semibold text-black dark:text-white">Upward</p>
          <p className="text-xs text-black/50 dark:text-white/50">Preview trend</p>
        </div>
      </div>

      {!isPro ? (
        <div className="mt-4">
          <Link href="/api/billing/stripe/checkout" className={`${linkClasses} w-full sm:w-auto`}>
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-xs text-black/50 dark:text-white/50">
          Pro insights will appear here as they ship.
        </p>
      )}
    </div>
  );
}
