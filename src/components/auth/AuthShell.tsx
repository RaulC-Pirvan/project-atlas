import type { ReactNode } from 'react';

import { Card } from '../ui/Card';
import { ThemeToggle } from '../ui/ThemeToggle';

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
        <div className="w-full space-y-8 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-black/60 dark:text-white/60">
                Project Atlas
              </p>
              <ThemeToggle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-black/60 dark:text-white/60">{subtitle}</p>
            ) : null}
          </div>
          <Card>{children}</Card>
          {footer ? <div>{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}
