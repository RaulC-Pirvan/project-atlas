'use client';

import type { ReactNode } from 'react';
import { useId } from 'react';

import { Card } from './Card';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, title, children, footer }: ModalProps) {
  const titleId = useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 py-8 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md">
        <Card className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-black/60">Account update</p>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
          </div>
          <div className="text-sm text-black/70">{children}</div>
          {footer ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">{footer}</div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
