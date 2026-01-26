import type { ReactNode } from 'react';

import { Card } from '../ui/Card';

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
        <div className="w-full space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-black/60">Project Atlas</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-black/60">{subtitle}</p> : null}
          </div>
          <Card>{children}</Card>
          {footer ? <div>{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}
