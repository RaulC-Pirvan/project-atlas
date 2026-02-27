import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '../ui/Card';
import { ThemeControls } from '../ui/ThemeControls';
import { AppSidebar } from './AppSidebar';

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-[color:var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
              Project Atlas
            </p>
            <ThemeControls />
          </div>
        </div>
      </header>

      <div className="pt-14">
        <AppSidebar />
        <div className="flex min-h-[calc(100vh-56px)] flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1">
            <main className="flex-1 px-6 pb-24 pt-10 md:pl-72 md:pb-10">
              <div className="space-y-8 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards]">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                  {subtitle ? (
                    <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
                  ) : null}
                </div>
                <Card>{children}</Card>
              </div>
            </main>
          </div>
          <footer className="mb-[calc(56px+env(safe-area-inset-bottom))] border-t border-[color:var(--color-border-subtle)] px-6 py-6 text-center text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)] md:mb-0">
            <div className="flex items-center justify-center gap-3">
              <span>(c) 2026 Project Atlas</span>
              <span aria-hidden="true">|</span>
              <Link
                href="/support"
                className="transition hover:text-[color:var(--color-text-primary)]"
              >
                Support
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
