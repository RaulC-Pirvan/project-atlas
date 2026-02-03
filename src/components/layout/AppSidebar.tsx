'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SignOutButton } from '../auth/SignOutButton';

const navItems = [
  { href: '/habits', label: 'Habits', icon: 'habits', desktopOrder: 'md:order-2' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar', desktopOrder: 'md:order-1' },
  { href: '/account', label: 'Account', icon: 'account', desktopOrder: 'md:order-3' },
];

const baseClasses =
  'inline-flex flex-1 items-center justify-center rounded-full border border-black/15 px-3 py-2 text-xs font-medium text-black/70 transition hover:bg-black/5 md:flex-none md:w-full md:rounded-none md:border-0 md:px-4 md:py-3 md:text-sm';
const activeClasses = 'bg-black text-white hover:bg-black';
const inactiveClasses = 'text-black/70 hover:bg-black/5';
const mobileCenterClasses =
  'rounded-2xl border border-black/20 bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]';

function NavIcon({ icon }: { icon: string }) {
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
  desktopOrder,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: string;
  desktopOrder: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${baseClasses} ${desktopOrder} ${
        active ? activeClasses : inactiveClasses
      } ${active && icon === 'calendar' ? mobileCenterClasses : ''} md:justify-start md:gap-2`.trim()}
    >
      <span className="md:hidden">
        <NavIcon icon={icon} />
      </span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white md:fixed md:inset-y-14 md:left-0 md:h-[calc(100vh-56px)] md:w-64 md:border-t-0 md:border-r md:border-black/10">
      <nav className="flex h-full items-center justify-between gap-2 px-3 py-2 md:flex-col md:items-stretch md:gap-0 md:px-0 md:py-0">
        <div className="flex w-full flex-row gap-2 md:flex-1 md:flex-col">
          {navItems.map((item) => (
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
        <div className="hidden md:block">
          <SignOutButton
            variant="ghost"
            size="sm"
            className={`${baseClasses} ${inactiveClasses} h-auto rounded-none`}
          />
        </div>
      </nav>
    </aside>
  );
}
