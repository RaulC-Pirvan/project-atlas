import Link from 'next/link';

type ProManageCardProps = {
  isPro: boolean;
};

const linkClasses =
  'inline-flex min-h-[40px] items-center justify-center rounded-full border border-black/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function ProManageCard({ isPro }: ProManageCardProps) {
  return (
    <section className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
          Manage billing and support
        </p>
        <p className="text-sm text-black/60 dark:text-white/60">
          {isPro
            ? 'Need help with purchase records, policy questions, or store restore flow?'
            : 'Review billing and policy details before purchasing.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/support#contact-form" className={linkClasses}>
          Contact support
        </Link>
        <Link href="/legal/refunds" className={linkClasses}>
          Refund policy
        </Link>
        <Link href="/legal/terms" className={linkClasses}>
          Terms
        </Link>
      </div>

      <div className="mt-4 rounded-xl border border-black/10 px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <p className="font-medium text-black/80 dark:text-white/80">Restore purchase</p>
        <p className="mt-1">
          Web checkout is the launch rail. Store restore flows are documented and will ship with
          mobile billing compliance.
        </p>
      </div>
    </section>
  );
}
