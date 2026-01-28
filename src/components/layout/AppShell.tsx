import type { ReactNode } from 'react';

import { Card } from '../ui/Card';
import { AppSidebar } from './AppSidebar';

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-black/10 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.4em] text-black/60">
            Project Atlas
          </p>
        </div>
      </header>

      <div className="pt-14">
        <AppSidebar />
        <div className="flex min-h-[calc(100vh-56px)] flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1">
            <main className="flex-1 px-6 py-10 md:pl-72">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                  {subtitle ? <p className="text-sm text-black/60">{subtitle}</p> : null}
                </div>
                <Card>{children}</Card>
              </div>
            </main>
          </div>
          <footer className="border-t border-black/10 px-6 py-6 text-center text-xs uppercase tracking-[0.3em] text-black/40">
            (c) 2026 Project Atlas
          </footer>
        </div>
      </div>
    </div>
  );
}
