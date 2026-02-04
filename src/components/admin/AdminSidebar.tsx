import Link from 'next/link';

import { SignOutButton } from '../auth/SignOutButton';

const navItems = [
  { href: '/admin#health', label: 'Health' },
  { href: '/admin#users', label: 'Users' },
  { href: '/admin#habits', label: 'Habits' },
  { href: '/admin#activity', label: 'Activity' },
  { href: '/admin#export', label: 'Export' },
];

const baseClasses =
  'inline-flex items-center justify-center rounded-full border border-black/15 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-black/70 transition hover:bg-black/5 md:w-full md:rounded-none md:border-0 md:px-4 md:py-3 md:text-xs md:tracking-[0.3em] dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10';

export function AdminSidebar() {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white dark:border-white/10 dark:bg-black md:fixed md:inset-y-14 md:left-0 md:h-[calc(100vh-56px)] md:w-64 md:border-t-0 md:border-r md:border-black/10 md:dark:border-white/10">
      <nav className="flex h-full items-center justify-between gap-2 px-3 py-2 md:flex-col md:items-stretch md:gap-0 md:px-0 md:py-0">
        <div className="flex w-full flex-row flex-wrap justify-center gap-2 md:flex-1 md:flex-col md:justify-start">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={baseClasses}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:block">
          <SignOutButton
            variant="ghost"
            size="sm"
            className={`${baseClasses} h-auto rounded-none`}
          />
        </div>
      </nav>
    </aside>
  );
}
