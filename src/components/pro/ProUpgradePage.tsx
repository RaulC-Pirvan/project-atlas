import Link from 'next/link';

import { buildProUpgradeHref } from '../../lib/analytics/proConversion';
import { LegalSupportLinks } from '../legal/LegalSupportLinks';
import { ThemeToggle } from '../ui/ThemeToggle';

type ProUpgradePageProps = {
  isAuthenticated: boolean;
  isPro: boolean;
};

const freeVsProRows = [
  {
    feature: 'Core tracking (habits, schedules, completions, calendar)',
    free: 'Full',
    pro: 'Full',
  },
  {
    feature: 'Streaks and grace window (yesterday until 02:00 local)',
    free: 'Full',
    pro: 'Full',
  },
  {
    feature: 'Advanced insights (trends, consistency, weekday patterns)',
    free: 'Preview',
    pro: 'Full',
  },
  {
    feature: 'Achievements and milestone catalogue',
    free: 'Baseline',
    pro: 'Expanded',
  },
  {
    feature: 'Reminder intelligence and push-ready controls',
    free: 'Preview',
    pro: 'Full',
  },
] as const;

const focusRingClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-black';
const revealBaseClasses =
  'opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards]';

function PrimaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-full border border-black bg-black px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90 ${focusRingClasses}`}
    >
      {label}
    </Link>
  );
}

function SecondaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-full border border-black/20 bg-white px-6 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10 ${focusRingClasses}`}
    >
      {label}
    </Link>
  );
}

export function ProUpgradePage({ isAuthenticated, isPro }: ProUpgradePageProps) {
  const primaryCta = buildProUpgradeHref('hero');
  const comparisonCta = buildProUpgradeHref('comparison');
  const faqCta = buildProUpgradeHref('faq');

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-10">
        <header className={`flex items-center justify-between ${revealBaseClasses}`}>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
              Project Atlas
            </p>
            <span className="hidden h-px w-8 bg-black/20 dark:bg-white/20 sm:inline-block" />
            <p className="hidden text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50 sm:block">
              Atlas Pro
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={isAuthenticated ? '/today' : '/landing'}
              className={`text-xs font-medium uppercase tracking-[0.2em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
            >
              {isAuthenticated ? 'Dashboard' : 'Home'}
            </Link>
            <ThemeToggle className="h-8 w-8" />
          </div>
        </header>

        <section
          aria-labelledby="pro-hero-title"
          data-testid="pro-hero-section"
          className={`mt-12 rounded-3xl border border-black/10 p-8 dark:border-white/10 ${revealBaseClasses} motion-safe:[animation-delay:80ms]`}
        >
          <p className="text-xs uppercase tracking-[0.28em] text-black/60 dark:text-white/60">
            One-time purchase
          </p>
          <h1
            id="pro-hero-title"
            className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Upgrade only when deeper insight will help.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-black/70 dark:text-white/70">
            Atlas Free stays fully useful for daily habit tracking. Atlas Pro adds advanced
            analysis, broader milestones, and expanded reminder tooling for users who want more
            coaching signals from their data.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {isPro ? (
              <>
                <PrimaryAction href="/account#pro" label="Manage Pro in Account" />
                <SecondaryAction href="/insights" label="Open Insights" />
              </>
            ) : (
              <>
                <PrimaryAction
                  href={primaryCta}
                  label={isAuthenticated ? 'Upgrade to Pro' : 'Sign in to Upgrade'}
                />
                <SecondaryAction href={isAuthenticated ? '/today' : '/sign-up'} label="Keep Free" />
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-black/55 dark:text-white/55">
            No subscriptions. No ads. One-time Pro access.
          </p>
        </section>

        <section
          aria-labelledby="pro-outcomes-title"
          className={`mt-12 space-y-6 border-t border-black/10 pt-10 dark:border-white/10 ${revealBaseClasses} motion-safe:[animation-delay:160ms]`}
        >
          <div className="space-y-2">
            <h2 id="pro-outcomes-title" className="text-2xl font-semibold tracking-tight">
              What Pro adds in practice
            </h2>
            <p className="text-sm text-black/65 dark:text-white/65">
              Concrete outcomes, not vague promises.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70 dark:text-white/70">
                Pattern clarity
              </h3>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                See 7/30/90-day trend shifts and weekday consistency so you know where routines are
                improving or slipping.
              </p>
              <p className="mt-2 text-xs text-black/55 dark:text-white/55">
                Example: catch that weekend completion is dropping below weekday baseline, then
                adjust workload and reminder timing before streak quality regresses further.
              </p>
            </article>
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70 dark:text-white/70">
                Longer motivation loop
              </h3>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                Expand beyond baseline achievements with milestone tracks that reward sustained
                consistency over time.
              </p>
              <p className="mt-2 text-xs text-black/55 dark:text-white/55">
                Example: keep a 30-completion milestone visible for one habit while building toward
                a 100-completion long-run marker.
              </p>
            </article>
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70 dark:text-white/70">
                Reminder depth
              </h3>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                Configure daily digest, quiet hours, and per-habit reminder cadence with push-ready
                controls built for store launch.
              </p>
              <p className="mt-2 text-xs text-black/55 dark:text-white/55">
                Example: run reminder at 07:30, stretch reminder at 20:30, with quiet hours from
                22:00-07:00 to avoid overnight noise.
              </p>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="pro-comparison-title"
          className={`mt-12 space-y-6 border-t border-black/10 pt-10 dark:border-white/10 ${revealBaseClasses} motion-safe:[animation-delay:240ms]`}
        >
          <div className="space-y-2">
            <h2 id="pro-comparison-title" className="text-2xl font-semibold tracking-tight">
              Free vs Pro
            </h2>
            <p className="text-sm text-black/65 dark:text-white/65">
              Free remains complete for day-to-day tracking. Pro adds depth for analysis and
              motivation.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
            <table
              aria-label="Free and Pro feature comparison"
              className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm"
            >
              <caption className="sr-only">Free and Pro feature comparison</caption>
              <colgroup>
                <col className="w-[58%]" />
                <col className="w-[21%]" />
                <col className="w-[21%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="px-4 py-3 font-medium text-black/70 dark:text-white/70">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-black/70 dark:text-white/70">
                    Free
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-black/70 dark:text-white/70">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {freeVsProRows.map((row) => (
                  <tr key={row.feature} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-4 py-3 text-black/75 dark:text-white/75">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-20 items-center justify-center rounded-full border border-black/15 px-2 py-1 text-xs text-black/70 dark:border-white/15 dark:text-white/70">
                        {row.free}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-20 items-center justify-center rounded-full border border-black/20 bg-black px-2 py-1 text-xs text-white dark:border-white/20 dark:bg-white dark:text-black">
                        {row.pro}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isPro ? (
            <div className="flex flex-wrap gap-3">
              <PrimaryAction
                href={comparisonCta}
                label={isAuthenticated ? 'Continue to Checkout' : 'Sign in and Continue'}
              />
              <SecondaryAction href="/legal/refunds" label="Review Refund Policy" />
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="pro-faq-title"
          className={`mt-12 space-y-6 border-t border-black/10 pt-10 dark:border-white/10 ${revealBaseClasses} motion-safe:[animation-delay:320ms]`}
        >
          <div className="space-y-2">
            <h2 id="pro-faq-title" className="text-2xl font-semibold tracking-tight">
              FAQ and trust details
            </h2>
            <p className="text-sm text-black/65 dark:text-white/65">
              Refund and support language matches our legal policy.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold">How do refunds work for web checkout?</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                Direct web purchases are eligible for a 14-day goodwill refund window from purchase
                date.
              </p>
            </article>
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold">
                How do refunds work for Apple App Store and Google Play?
              </h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                Apple App Store purchases follow Apple refund processes. Google Play purchases
                follow Google refund processes.
              </p>
            </article>
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold">Do I lose core tracking if I stay on Free?</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                No. Core habit tracking remains complete in Free, including schedules, daily
                completions, calendar, and streaks.
              </p>
            </article>
            <article className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
              <h3 className="text-sm font-semibold">Where do I get billing help?</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                Use Support with your purchase email, platform, and order details so the team can
                triage quickly.
              </p>
            </article>
          </div>
          {!isPro ? (
            <div className="flex flex-wrap gap-3">
              <PrimaryAction
                href={faqCta}
                label={isAuthenticated ? 'Upgrade Now' : 'Sign in to Upgrade'}
              />
              <SecondaryAction href="/support#contact-form" label="Contact Support" />
            </div>
          ) : null}
          <div className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 text-sm text-black/70 dark:border-white/10 dark:text-white/70 md:flex-row md:items-center md:justify-between">
            <p>Need policy details before upgrading?</p>
            <LegalSupportLinks ariaLabel="Pro legal and support links" />
          </div>
        </section>
      </div>
    </main>
  );
}
