import Link from 'next/link';

type LegalSupportLinksProps = {
  className?: string;
  listClassName?: string;
  linkClassName?: string;
  ariaLabel?: string;
};

const links = [
  { href: '/legal/privacy', label: 'Privacy policy' },
  { href: '/legal/terms', label: 'Terms of service' },
  { href: '/legal/refunds', label: 'Refund policy' },
  { href: '/support', label: 'Support center' },
] as const;

const defaultListClassName = 'flex flex-wrap items-center gap-3';
const defaultLinkClassName =
  'inline-flex min-h-[40px] items-center justify-center rounded-full border border-black/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-black/75 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:text-white/75 dark:hover:bg-white/10 dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-black';

export function LegalSupportLinks({
  className = '',
  listClassName = '',
  linkClassName = '',
  ariaLabel = 'Legal and support links',
}: LegalSupportLinksProps) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      <ul className={`${defaultListClassName} ${listClassName}`.trim()}>
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-label={item.label}
              className={`${defaultLinkClassName} ${linkClassName}`.trim()}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
