import type { ReactNode } from 'react';

import { ThemeToggle } from '../ui/ThemeToggle';
import { AdminSidebar } from './AdminSidebar';

type AdminShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/60 dark:text-white/60">
                Project Atlas
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
                Admin Console
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="pt-14">
        <AdminSidebar />
        <div className="flex min-h-[calc(100vh-56px)] flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1">
            <main className="flex-1 px-6 pb-24 pt-10 md:pl-72 md:pb-10">
              <div className="space-y-8 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards]">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                  {subtitle ? (
                    <p className="text-sm text-black/60 dark:text-white/60">{subtitle}</p>
                  ) : null}
                </div>
                {children}
              </div>
            </main>
          </div>
          <footer className="border-t border-black/10 px-6 py-6 text-center text-xs uppercase tracking-[0.3em] text-black/40 dark:border-white/10 dark:text-white/40 mb-[calc(56px+env(safe-area-inset-bottom))] md:mb-0">
            (c) 2026 Project Atlas
          </footer>
        </div>
      </div>
    </div>
  );
}
