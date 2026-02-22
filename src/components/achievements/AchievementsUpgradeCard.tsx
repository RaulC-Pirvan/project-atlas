import Link from 'next/link';

import { STRIPE_CHECKOUT_ROUTE } from '../../lib/billing/stripe/contracts';

const linkClasses =
  'inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function AchievementsUpgradeCard() {
  return (
    <div
      className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10"
      data-testid="achievements-upgrade-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Atlas Pro Achievements
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Expanded milestones, deeper streaks, and longer-term goals.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          Preview
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={STRIPE_CHECKOUT_ROUTE} className={`${linkClasses} w-full sm:w-auto`}>
          Upgrade to Pro
        </Link>
        <p className="text-xs text-black/50 dark:text-white/50">Baseline achievements stay free.</p>
      </div>
    </div>
  );
}
