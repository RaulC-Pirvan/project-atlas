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
  neutral: 'border-black/15 text-black/80 dark:border-white/15 dark:text-white/80',
  success:
    'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100',
  warning:
    'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100',
  error:
    'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100',
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
          className={`pointer-events-auto rounded-2xl border bg-white/95 px-4 py-3 text-sm shadow-[0_14px_28px_rgba(0,0,0,0.12)] transition-all duration-200 dark:bg-black/80 dark:shadow-[0_18px_40px_rgba(0,0,0,0.5)] ${
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
