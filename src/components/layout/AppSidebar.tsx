'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { SignOutButton } from '../auth/SignOutButton';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  desktopOrder?: string;
};

const desktopNavItems: NavItem[] = [
  { href: '/landing', label: 'Home', icon: 'home', desktopOrder: 'md:order-1' },
  { href: '/today', label: 'Today', icon: 'today', desktopOrder: 'md:order-2' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar', desktopOrder: 'md:order-3' },
  { href: '/habits', label: 'Habits', icon: 'habits', desktopOrder: 'md:order-4' },
  { href: '/insights', label: 'Insights', icon: 'insights', desktopOrder: 'md:order-5' },
  {
    href: '/achievements',
    label: 'Achievements',
    icon: 'achievements',
    desktopOrder: 'md:order-6',
  },
  { href: '/account', label: 'Account', icon: 'account', desktopOrder: 'md:order-7' },
];

const mobilePrimaryItems: NavItem[] = [
  { href: '/today', label: 'Today', icon: 'today' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/habits', label: 'Habits', icon: 'habits' },
];

const mobileMoreItems: NavItem[] = [
  { href: '/landing', label: 'Home', icon: 'home' },
  { href: '/insights', label: 'Insights', icon: 'insights' },
  { href: '/achievements', label: 'Achievements', icon: 'achievements' },
  { href: '/account', label: 'Account', icon: 'account' },
];

const desktopBaseClasses =
  'inline-flex items-center justify-center rounded-none border-0 px-4 py-3 text-sm font-medium';
const desktopActiveClasses = 'bg-black text-white dark:bg-white dark:text-black dark:!text-black';
const desktopInactiveClasses = 'text-black/70 dark:text-white/70';

const mobileBaseClasses =
  'inline-flex flex-1 items-center justify-center rounded-full border border-black/15 px-3 py-2 text-xs font-medium text-black/70 dark:border-white/20 dark:text-white/80';
const mobileActiveClasses =
  'rounded-2xl border-black/20 bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] dark:border-white/20 dark:bg-white dark:text-black dark:!text-black dark:shadow-[0_10px_24px_rgba(0,0,0,0.4)]';

function NavIcon({ icon }: { icon: string }) {
  if (icon === 'home') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 10.5L12 3.5l8.5 7" />
        <path d="M6.5 9.5V20h11V9.5" />
      </svg>
    );
  }

  if (icon === 'calendar') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" />
      </svg>
    );
  }

  if (icon === 'today') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2.5M12 19v2.5M4.5 12h2.5M17 12h2.5" />
        <path d="M6.4 6.4l1.8 1.8M15.8 15.8l1.8 1.8M17.6 6.4l-1.8 1.8M8.2 15.8l-1.8 1.8" />
      </svg>
    );
  }

  if (icon === 'habits') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M6.5 6.5h11" />
        <path d="M6.5 12h11" />
        <path d="M6.5 17.5h11" />
        <circle cx="4.25" cy="6.5" r="1" />
        <circle cx="4.25" cy="12" r="1" />
        <circle cx="4.25" cy="17.5" r="1" />
      </svg>
    );
  }

  if (icon === 'insights') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 18h16" />
        <path d="M7 14v-4" />
        <path d="M12 18v-8" />
        <path d="M17 18v-12" />
      </svg>
    );
  }

  if (icon === 'achievements') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 6h10v3c0 3-2.2 5-5 5s-5-2-5-5V6Z" />
        <path d="M9 14v3h6v-3" />
        <path d="M5 6h2v3a4 4 0 0 1-2-1.5V6Z" />
        <path d="M19 6h-2v3a4 4 0 0 0 2-1.5V6Z" />
      </svg>
    );
  }

  if (icon === 'more') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
        <circle cx="6" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="18" cy="12" r="1.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.8-3.6 5-5.5 7.5-5.5S17.2 16.4 19.5 20" />
    </svg>
  );
}

function NavLink({
  href,
  label,
  active,
  icon,
  desktopOrder = '',
  onClick,
  mobile,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: string;
  desktopOrder?: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={`${mobileBaseClasses} ${active ? mobileActiveClasses : ''}`.trim()}
        onClick={onClick}
      >
        <NavIcon icon={icon} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${desktopBaseClasses} ${desktopOrder} ${
        active ? desktopActiveClasses : desktopInactiveClasses
      }`.trim()}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const moreActive = useMemo(
    () =>
      mobileMoreItems.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
      ),
    [pathname],
  );

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white dark:border-white/10 dark:bg-black md:fixed md:inset-y-14 md:left-0 md:h-[calc(100vh-56px)] md:w-64 md:border-t-0 md:border-r md:border-black/10 md:dark:border-white/10">
      <div className="hidden h-full md:flex md:flex-col md:items-stretch md:gap-0 md:px-0 md:py-0">
        <nav className="flex-1">
          <div className="flex w-full flex-col">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                desktopOrder={item.desktopOrder}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              />
            ))}
          </div>
        </nav>
        <div>
          <SignOutButton
            variant="ghost"
            size="sm"
            className={`${desktopBaseClasses} ${desktopInactiveClasses} h-auto w-full justify-center`}
          />
        </div>
      </div>

      <div className="relative px-3 py-2 md:hidden">
        <div
          aria-hidden={!isMoreOpen}
          className={`absolute inset-x-3 bottom-full mb-2 origin-bottom rounded-2xl border border-black/10 bg-white p-2 shadow-[0_16px_34px_rgba(0,0,0,0.16)] transition duration-200 ease-out motion-reduce:transition-none dark:border-white/10 dark:bg-black dark:shadow-[0_16px_34px_rgba(0,0,0,0.5)] ${
            isMoreOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-95 opacity-0'
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            {mobileMoreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-10 items-center justify-center rounded-xl border border-black/15 px-2 text-xs font-medium uppercase tracking-[0.16em] dark:border-white/20 ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-black/75 dark:text-white/75'
                }`}
                onClick={() => setIsMoreOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
            <SignOutButton
              variant="ghost"
              size="sm"
              className="h-10 w-full justify-center rounded-xl border border-black/15 text-xs font-medium uppercase tracking-[0.16em] text-black/75 dark:border-white/20 dark:text-white/75"
            />
          </div>
        </div>

        <nav className="flex items-center justify-between gap-2">
          {mobilePrimaryItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              mobile
            />
          ))}
          <button
            type="button"
            aria-label="More"
            aria-expanded={isMoreOpen}
            onClick={() => setIsMoreOpen((previous) => !previous)}
            className={`${mobileBaseClasses} ${moreActive || isMoreOpen ? mobileActiveClasses : ''}`.trim()}
          >
            <span
              className={`transition-transform duration-200 ease-out motion-reduce:transition-none ${
                isMoreOpen ? 'scale-110' : 'scale-100'
              }`}
            >
              <NavIcon icon="more" />
            </span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
