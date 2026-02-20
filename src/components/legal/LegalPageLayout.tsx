import Link from 'next/link';
import type { ReactNode } from 'react';

import { LEGAL_ROUTE_LINKS } from '../../lib/legal/policies';
import type { LegalPolicyMetadata } from '../../lib/legal/types';
import { ThemeToggle } from '../ui/ThemeToggle';

type LegalPageLayoutProps = {
  title: string;
  description: string;
  metadata: LegalPolicyMetadata;
  children: ReactNode;
};

const focusRingClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-black';

export function LegalPageLayout({ title, description, metadata, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
        <header className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Project Atlas
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/landing"
              className={`text-xs font-medium uppercase tracking-[0.2em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
            >
              Home
            </Link>
            <Link
              href="/support"
              className={`text-xs font-medium uppercase tracking-[0.2em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
            >
              Support
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="mt-10 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-black/65 dark:text-white/65">
            {description}
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
                Version
              </dt>
              <dd className="text-sm">{metadata.version}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
                Effective date
              </dt>
              <dd className="text-sm">{metadata.effectiveDate}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
                Last updated
              </dt>
              <dd className="text-sm">{metadata.updatedAt}</dd>
            </div>
          </dl>
        </section>

        <article className="mt-8 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
          <div className="space-y-6 text-sm leading-relaxed text-black/80 dark:text-white/80">
            {children}
          </div>
        </article>

        <nav aria-label="Legal navigation" className="mt-8">
          <ul className="flex flex-wrap gap-3">
            {LEGAL_ROUTE_LINKS.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`inline-flex items-center rounded-full border border-black/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black/75 transition hover:bg-black/5 dark:border-white/15 dark:text-white/75 dark:hover:bg-white/10 ${focusRingClasses}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
