'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SignOutButton } from '../auth/SignOutButton';

const navItems = [
  { href: '/calendar', label: 'Calendar' },
  { href: '/habits', label: 'Habits' },
  { href: '/account', label: 'Account' },
];

const baseClasses =
  'inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium transition';
const activeClasses = 'border-black bg-black text-white';
const inactiveClasses = 'border-black/15 text-black/70 hover:bg-black/5';

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`.trim()}
    >
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-black/10 bg-white md:fixed md:inset-y-14 md:left-0 md:h-[calc(100vh-56px)] md:w-64 md:border-b-0 md:border-r md:border-black/10">
      <nav className="flex h-full flex-col">
        <div className="flex flex-1 flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </div>
        <SignOutButton
          variant="ghost"
          size="sm"
          className={`${baseClasses} ${inactiveClasses} h-auto rounded-none`}
        />
      </nav>
    </aside>
  );
}
