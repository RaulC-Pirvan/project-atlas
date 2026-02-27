'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'error';

export type ToastItem = {
  id: number;
  tone: ToastTone;
  message: ReactNode;
  state?: 'entering' | 'open' | 'closing';
};

type ToastStackProps = {
  toasts: ToastItem[];
};

const toneClasses: Record<ToastTone, string> = {
  neutral: 'border-[color:var(--color-border-subtle)] text-[color:var(--color-text-secondary)]',
  success:
    'border-[color:var(--color-state-success)] bg-[var(--color-state-success-soft)] text-[color:var(--color-state-success)]',
  warning:
    'border-[color:var(--color-state-warning)] bg-[var(--color-state-warning-soft)] text-[color:var(--color-state-warning)]',
  error:
    'border-[color:var(--color-state-error)] bg-[var(--color-state-error-soft)] text-[color:var(--color-state-error)]',
};

export function ToastStack({ toasts }: ToastStackProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  const content = (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
          className={`pointer-events-auto rounded-2xl border bg-[var(--color-bg-surface-elevated)] px-4 py-3 text-sm shadow-[0_14px_28px_rgba(0,0,0,0.12)] transition-all duration-200 dark:shadow-[0_18px_40px_rgba(0,0,0,0.5)] ${
            toast.state === 'closing'
              ? 'translate-y-2 opacity-0 ease-in'
              : toast.state === 'entering'
                ? 'translate-y-2 opacity-0 ease-out'
                : 'translate-y-0 opacity-100 ease-out'
          } ${toneClasses[toast.tone]}`.trim()}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );

  return createPortal(content, document.body);
}
