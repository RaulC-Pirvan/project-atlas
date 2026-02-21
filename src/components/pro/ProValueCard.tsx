import Link from 'next/link';

type ProValueCardProps = {
  isPro: boolean;
};

const metricCardClasses = 'rounded-xl border border-black/10 px-4 py-3 dark:border-white/10';

const linkClasses =
  'inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function ProValueCard({ isPro }: ProValueCardProps) {
  return (
    <section className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Why Pro
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Built for users who want deeper pattern visibility and stronger long-term momentum.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {isPro ? 'Unlocked' : 'Available'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className={metricCardClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Understand patterns
          </p>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            Trend cards and consistency snapshots show where habits actually stick.
          </p>
        </div>
        <div className={metricCardClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Keep motivation high
          </p>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            Expanded achievements add longer milestone tracks without turning the app into a game.
          </p>
        </div>
        <div className={metricCardClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Stay consistent
          </p>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            Reminder controls are push-ready and designed for low-friction daily follow-through.
          </p>
        </div>
      </div>

      {isPro ? (
        <p className="mt-4 text-xs text-black/50 dark:text-white/50">
          You already have Pro. Use the hub below to jump into each feature area.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/api/billing/stripe/checkout" className={linkClasses}>
            See checkout
          </Link>
          <p className="text-xs text-black/50 dark:text-white/50">
            One-time purchase for launch. No monthly or yearly plans.
          </p>
        </div>
      )}
    </section>
  );
}
