import Link from 'next/link';

type ProFeatureHubCardProps = {
  isPro: boolean;
};

const featureCardClasses = 'rounded-xl border border-black/10 px-4 py-4 dark:border-white/10';

const linkClasses =
  'inline-flex min-h-[40px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function ProFeatureHubCard({ isPro }: ProFeatureHubCardProps) {
  return (
    <section className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Pro hub
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            {isPro
              ? 'Jump directly into your Pro feature areas.'
              : 'Preview what unlocks with one-time Pro access.'}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {isPro ? 'Included' : 'Locked'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className={featureCardClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Advanced insights
          </p>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            Trend snapshots, consistency signals, and weekday performance patterns.
          </p>
          <Link
            href="/insights"
            className="mt-3 inline-flex text-xs font-medium underline underline-offset-4"
          >
            {isPro ? 'Open insights' : 'View insights preview'}
          </Link>
        </div>

        <div className={featureCardClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Expanded achievements
          </p>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            Extra goals and milestone tracks for long-term consistency.
          </p>
          <Link
            href="/achievements"
            className="mt-3 inline-flex text-xs font-medium underline underline-offset-4"
          >
            {isPro ? 'Open achievements' : 'View achievements preview'}
          </Link>
        </div>

        <div className={featureCardClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Smart reminders
          </p>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            Reminder controls and push-ready settings in your account panel.
          </p>
          <Link
            href="/account"
            className="mt-3 inline-flex text-xs font-medium underline underline-offset-4"
          >
            {isPro ? 'Open reminder settings' : 'View reminder settings'}
          </Link>
        </div>
      </div>

      {isPro ? (
        <p className="mt-4 text-xs text-black/50 dark:text-white/50">
          Pro feature depth will keep expanding without changing your plan type.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/api/billing/stripe/checkout" className={linkClasses}>
            Continue to checkout
          </Link>
          <p className="self-center text-xs text-black/50 dark:text-white/50">
            One-time purchase only for launch. No subscription checkout is offered.
          </p>
        </div>
      )}
    </section>
  );
}
