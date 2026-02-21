import Link from 'next/link';

import type { ProEntitlementSource } from '../../lib/pro/entitlement';
import { Button } from '../ui/Button';

type ProPlanCardProps = {
  isPro: boolean;
  source?: ProEntitlementSource;
};

const actionLinkClasses =
  'inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

const quickStatClasses =
  'rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-black/50';

function formatSourceLabel(source?: ProEntitlementSource): string {
  if (!source) return 'Unknown';
  if (source === 'ios_iap') return 'iOS in-app purchase';
  if (source === 'android_iap') return 'Android in-app purchase';
  if (source === 'play_store') return 'Google Play';
  if (source === 'app_store') return 'Apple App Store';
  if (source === 'manual') return 'Manual grant';
  if (source === 'promo') return 'Promo grant';
  return 'Stripe checkout';
}

export function ProPlanCard({ isPro, source }: ProPlanCardProps) {
  return (
    <section className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Plan and access
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            One-time Pro purchase. No monthly or yearly subscriptions.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {isPro ? 'Pro active' : 'Preview'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className={quickStatClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Plan
          </p>
          <p className="mt-1 text-base font-semibold text-black dark:text-white">Pro lifetime</p>
        </div>
        <div className={quickStatClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Billing model
          </p>
          <p className="mt-1 text-base font-semibold text-black dark:text-white">One-time</p>
        </div>
        <div className={quickStatClasses}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            Purchase source
          </p>
          <p className="mt-1 text-base font-semibold text-black dark:text-white">
            {isPro ? formatSourceLabel(source) : 'Hosted Stripe checkout'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4 text-sm text-black/70 dark:text-white/70">
        {isPro ? (
          <div className="rounded-xl border border-black/10 px-4 py-3 dark:border-white/10">
            <p className="font-medium text-black dark:text-white">Your Pro access is active.</p>
            <p className="mt-1 text-xs text-black/55 dark:text-white/55">
              Access is managed server-side and stays active unless billing state changes.
            </p>
          </div>
        ) : (
          <>
            <p>
              Pro adds deeper insights and expanded motivation tools while free tracking stays fully
              useful.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/api/billing/stripe/checkout"
                className={`${actionLinkClasses} w-full sm:w-auto`}
              >
                Upgrade to Pro
              </Link>
              <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                Restore purchase
              </Button>
            </div>
            <p className="text-xs text-black/50 dark:text-white/50">
              Restore purchase is prepared for store launch and will be enabled in the mobile app.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
        <Link href="/legal/refunds" className="transition hover:text-black dark:hover:text-white">
          Refund policy
        </Link>
        <Link href="/legal/terms" className="transition hover:text-black dark:hover:text-white">
          Terms
        </Link>
        <Link
          href="/support#contact-form"
          className="transition hover:text-black dark:hover:text-white"
        >
          Contact support
        </Link>
      </div>
    </section>
  );
}
