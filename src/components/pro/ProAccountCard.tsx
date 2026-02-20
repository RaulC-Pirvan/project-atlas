import Link from 'next/link';

import { LegalSupportLinks } from '../legal/LegalSupportLinks';
import { Button } from '../ui/Button';

type ProAccountCardProps = {
  isPro: boolean;
};

const linkClasses =
  'inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function ProAccountCard({ isPro }: ProAccountCardProps) {
  return (
    <div
      id="pro"
      className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10"
      data-testid="pro-account-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Atlas Pro
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Unlock insights, achievements, and smart reminders.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {isPro ? 'Pro active' : 'Preview'}
        </span>
      </div>

      <div className="mt-4 space-y-4 text-sm text-black/70 dark:text-white/70">
        {isPro ? (
          <>
            <p>Thanks for supporting Atlas. Your Pro access is active.</p>
            <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
                Legal and support
              </p>
              <p className="mt-2 text-xs text-black/55 dark:text-white/55">
                Review purchase policy and support options.
              </p>
              <LegalSupportLinks
                ariaLabel="Pro legal and support links"
                className="mt-3"
                linkClassName="w-full sm:w-auto"
              />
            </div>
          </>
        ) : (
          <>
            <p>Pro adds depth and motivation without blocking core habit tracking.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/pro" className={`${linkClasses} w-full sm:w-auto`}>
                Upgrade to Pro
              </Link>
              <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                Restore purchase
              </Button>
            </div>
            <p className="text-xs text-black/50 dark:text-white/50">
              Restore purchase will be available in the mobile app.
            </p>
            <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
                Legal and support
              </p>
              <p className="mt-2 text-xs text-black/55 dark:text-white/55">
                Review purchase policy and support options before upgrading.
              </p>
              <LegalSupportLinks
                ariaLabel="Pro legal and support links"
                className="mt-3"
                linkClassName="w-full sm:w-auto"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
